pragma solidity ^0.4.15;
/* 1. should release funds to company when yes vote complete
   2. should retain funds when no vote
   3. should refund if 
      a. tokens passed and b. no vote and c. company agrees.
 */

// safe math? def need it in places
// allow revoting?
// should we include self destruct after usefulness of escrow has expired?
// what to do w/ leftover ether
// arbitrator laws

import "./ERC20.sol";

contract Escrow {

  // ======
  // TYPES:
  // ======

  struct RoundData {
    uint funds2beReleased;
    uint endTime;
    uint startTime;
    uint yesVotes;
    uint noVotes;
    mapping (address => bool) hasVoted; // user -> hasVoted
  }

  struct EscrowData {

    address company;           
    address arbitrator;
    ERC20 tokenContract;
    address payoutAddress;  

    uint allocStartTime;
    uint allocEndTime;
    uint roundNum;
    bool arbitratorApproved;
    bool failed;
    uint totalRefund;
    uint balance;
    uint totalTokenCount;
    uint totalVotePower;

    // Fraction ; // this gave an error "UnimplementedFeatureError"
    //uint abstainNumer; // abstain voting power
    //uint abstainDenom; // abstain voting power

    mapping (address => uint) initialTokenCount;   // user -> vote-weight

    mapping (uint => RoundData) round;
  }

  mapping (bytes32 => EscrowData) public escrows;   // id -> escrow

  event VotingResult(bool indexed releasedFunds);
  event RefundAmount(address indexed user, uint refundAmount);
  event EscrowCreation(address indexed company, bytes32 id);

  function Escrow() { }

  // ========
  // GETTERS:
  // ========

  // is there an easier way?
  function get_initialTokenCount(bytes32 id, address user) external constant returns (uint) { return escrows[id].initialTokenCount[user]; }
  function get_round_funds2beReleased(bytes32 id, uint roundNum) external constant returns (uint) { return escrows[id].round[roundNum].funds2beReleased; }
  function get_round_endTime(bytes32 id, uint roundNum) external constant returns (uint) { return escrows[id].round[roundNum].endTime; }
  function get_round_startTime(bytes32 id, uint roundNum) external constant returns (uint) { return escrows[id].round[roundNum].startTime; }
  function get_round_yesVotes(bytes32 id, uint roundNum) external constant returns (uint) { return escrows[id].round[roundNum].yesVotes; }
  function get_round_noVotes(bytes32 id, uint roundNum) external constant returns (uint) { return escrows[id].round[roundNum].noVotes; }
  function get_round_hasVoted(bytes32 id, uint roundNum, address user) external constant returns (bool) { return escrows[id].round[roundNum].hasVoted[user]; }

  // User calls to know the minimum voting power they have
  function getminVotingPower(bytes32 id, address user) external constant returns (uint num, uint denom) { return (sqrt(escrows[id].initialTokenCount[user]), escrows[id].totalVotePower); }

  // =====================
  // ARBITRATOR & COMPANY:
  // =====================

  // ===========
  // ARBITRATOR:
  // ===========

  function aribtratorApprove(bytes32 id) isArbitrator(id) public { 
    escrows[id].arbitratorApproved = true; 
  }

  // ========
  // COMPANY:
  // ========

  function createEscrow(address arbitrator, address token, address payoutAddress, uint allocStartTime, uint allocEndTime, uint abstainNumer, uint abstainDenom) {
    address company = msg.sender;
    bytes32 id = sha3(company, arbitrator, token, payoutAddress);

    escrows[id].company = company;
    escrows[id].arbitrator = arbitrator;
    escrows[id].tokenContract = ERC20(token);
    escrows[id].payoutAddress = payoutAddress;
    escrows[id].allocStartTime = allocStartTime;
    escrows[id].allocEndTime = allocEndTime;
    //    escrows[id].abstainNumer = abstainNumer;
    //    escrows[id].abstainDenom = abstainDenom;

    EscrowCreation(company, id);
  }

  // big thing here, make sure this fn is safe if roundNum changes, or don't let roundNum change
  function thresholdReached(bytes32 id) public constant returns (bool) {
    uint roundNum = escrows[id].roundNum;
    uint yes      = escrows[id].round[roundNum].yesVotes;
    uint no       = escrows[id].round[roundNum].noVotes;
    // uint abstain  = (escrows[id].totalVotePower - yes - no) * escrows[id].abstainNumer / escrows[id].abstainDenom;
    uint abstain  = (escrows[id].totalVotePower - yes - no) / 10;

    return yes > no + abstain;
  }

  // keep track of failures
  // security note, _all_ round time windows should be set before escrow starts
  function failEscrow(bytes32 id) public {
    var roundData =  escrows[id].round[escrows[id].roundNum];
    
    require(getBlockTime() > roundData.endTime);
    require(thresholdReached(id) == false);

    escrows[id].failed = true;
    escrows[id].totalRefund = escrows[id].balance;
  }

  // releases funds to company
  // increment round number
  function releaseFunds(bytes32 id) public {
    uint funding = escrows[id].round[escrows[id].roundNum].funds2beReleased;
    require(thresholdReached(id));

    // State changes
    require(escrows[id].payoutAddress.send(funding));
    escrows[id].totalRefund = escrows[id].totalRefund - funding;
    escrows[id].roundNum = escrows[id].roundNum + 1;
  }

  function payEscrow(bytes32 id) payable public {
    // end of payment at start of round 1, or only in token/vote alloc window?
    require(getBlockTime() < escrows[id].round[0].startTime);
    escrows[id].balance = escrows[id].balance + msg.value;
  }

  // -----------------
  // Escrow parameters
  // -----------------
  function setRoundWindow(bytes32 id, uint roundNum, uint start, uint end) isCompany(id) public  {
    require(start < end);
    require(start > escrows[id].allocEndTime);

    escrows[id].round[roundNum].startTime = start;
    escrows[id].round[roundNum].endTime   = end;
  }


  // =====
  // USER:
  // =====  
  // note. consider where tokens go. if tokens go to company, then they can cheat system. if tokens go to this contract, then they are stuck here unless we send them back to company

  function allocVotes(bytes32 id) public inAllocVoteTimeFrame(id) {
    var userTokenCount  = escrows[id].initialTokenCount[msg.sender];
    var totalTokenCount = escrows[id].tokenContract.balanceOf(msg.sender);
    var totalVotePower  = escrows[id].totalVotePower;

    // State changes
    userTokenCount = escrows[id].tokenContract.balanceOf(msg.sender);
    totalTokenCount = totalTokenCount + userTokenCount;
    totalVotePower = totalVotePower + sqrt(userTokenCount);
  }

  // Require approval of entire balanceOf?
  function refund(bytes32 id) public {
    var totalRefund = escrows[id].totalRefund;
    var userTokenCount = escrows[id].initialTokenCount[msg.sender];
    var totalTokenCount = escrows[id].totalTokenCount;
    uint refundSize = totalRefund * userTokenCount / totalTokenCount;  // rounding error. overflow error

    require(escrows[id].failed);
    require(msg.sender.send(refundSize));
  }


  // voting based on balances at certain point in BC? e.g. minime token? consider people not using it
  function singleVote(bytes32 id, bool votedYes) public {
    // Error check
    uint roundNum = escrows[id].roundNum;
    var escrowRound = escrows[id].round[roundNum];
    uint userVotePower = sqrt(escrows[id].initialTokenCount[msg.sender]);

    require(escrowRound.hasVoted[msg.sender] == false);
    require(getBlockTime() >= escrowRound.startTime && getBlockTime() <= escrowRound.endTime); // make sure in voting window

    // State changes
    if (votedYes) {
      escrowRound.yesVotes = escrowRound.yesVotes + userVotePower;
    }
    else {
      escrowRound.noVotes = escrowRound.noVotes + userVotePower;
    }
    escrowRound.hasVoted[msg.sender] = true;
  }

  // =====
  // MISC:
  // =====
  // Use these times for testing
  
  // ... timestamp of the current block in seconds since the epoch
  function getBlockTime()   internal constant returns  (uint) { return now; }

  function roundOpen(bytes32 id) returns (bool)  {return true;}

  function sqrt(uint x) constant returns (uint y) {
    uint z = (x + 1) / 2;
    y = x;
    while (z < y) {
        y = z;
        z = (x / z + z) / 2;
    }
  }

  modifier isArbitrator (bytes32 id) { 
    require(msg.sender == escrows[id].arbitrator); 
    _; 
  }

  modifier isCompany (bytes32 id) { 
    require(msg.sender == escrows[id].company); 
    _;
  }

  modifier inAllocVoteTimeFrame(bytes32 id) {
    uint time = getBlockTime();
    require(time > escrows[id].allocStartTime);
    require(time < escrows[id].allocEndTime);
    _;
  }
}
