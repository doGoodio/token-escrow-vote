pragma solidity ^0.4.15;
/* 1. should release funds to company when yes vote complete
   2. should retain funds when no vote
   3. should refund if 
      a. tokens passed and b. no vote and c. company agrees.
 */

// 
    // allow revoting?
  // should we include self destruct after usefulness of escrow has expired?

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
    uint numRounds;
    uint baseExchange;
    bool arbitratorApproved;

    uint thresholdApprovalNumer;
    uint thresholdApprovalDenom;
    // Fraction ; // this gave an error "UnimplementedFeatureError"
    uint minVotes;
    mapping (address => uint) voteWeight;   // user -> vote-weight

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
  function get_voteWeight(bytes32 id, address user) public constant returns (uint) { return escrows[id].voteWeight[user]; }
  function get_round_funds2beReleased(bytes32 id, uint roundNum) public constant returns (uint) { return escrows[id].round[roundNum].funds2beReleased; }
  function get_round_endTime(bytes32 id, uint roundNum) public constant returns (uint) { return escrows[id].round[roundNum].endTime; }
  function get_round_startTime(bytes32 id, uint roundNum) public constant returns (uint) { return escrows[id].round[roundNum].startTime; }
  function get_round_yesVotes(bytes32 id, uint roundNum) public constant returns (uint) { return escrows[id].round[roundNum].yesVotes; }
  function get_round_noVotes(bytes32 id, uint roundNum) public constant returns (uint) { return escrows[id].round[roundNum].noVotes; }
  function get_round_hasVoted(bytes32 id, uint roundNum, address user) public constant returns (bool) { return escrows[id].round[roundNum].hasVoted[user]; }

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

  function createEscrow(uint numRounds, address arbitrator, address token, address payoutAddress, uint minVotes, uint allocStartTime, uint allocEndTime) {
    address company = msg.sender;
    bytes32 id = sha3(company, arbitrator, token, payoutAddress);

    escrows[id].company = company;
    escrows[id].arbitrator = arbitrator;
    escrows[id].tokenContract = ERC20(token);
    escrows[id].payoutAddress = payoutAddress;
    escrows[id].numRounds = numRounds;
    escrows[id].minVotes = minVotes;
    escrows[id].allocStartTime = allocStartTime;
    escrows[id].allocEndTime = allocEndTime;

    EscrowCreation(company, id);
  }

  // consider privledges. arbitrator?
  function startVoteRound(bytes32 id) public {
    require(msg.sender == escrows[id].arbitrator
         || msg.sender == escrows[id].company); 

    uint startTime = escrows[id].round[roundNum + 1].startTime;
    uint endTime = escrows[id].round[roundNum + 1].endTime;
    uint roundNum = escrows[id].roundNum;

    // make sure in voting window
    require(getBlockTime() >= startTime && getBlockTime() <= endTime); 
    escrows[id].roundNum = escrows[id].roundNum + 1;
  }

  // big thing here, make sure this fn is safe if roundNum changes, or don't let roundNum change
  function thresholdReached(bytes32 id) public constant returns (bool) {
    uint roundNum = escrows[id].roundNum;
    uint yesVotes = escrows[id].round[roundNum].yesVotes;
    uint noVotes = escrows[id].round[roundNum].noVotes;
    uint totalVotes = yesVotes + noVotes;
    uint denom = escrows[id].thresholdApprovalDenom;
    uint numer = escrows[id].thresholdApprovalNumer;

    // this should be related to noVotes too. Or, what if voting is only 10% turnout? this is valid, but might be rejected b/c didn't reach threshold
    return totalVotes > escrows[id].minVotes
        && (yesVotes * denom) > numer;
  }

  // keep track of failures
  function failRound() public {
    // failures[roundNum]++;
  }

  // releases funds to company
  function releaseFunds(bytes32 id) internal {
    require(escrows[id].payoutAddress.send(escrows[id].round[escrows[id].roundNum].funds2beReleased));
  }

  function setRoundWindow(bytes32 id, uint roundNum, uint start, uint end) isCompany(id) public  {
    require(start < end);
    var round = escrows[id].round[roundNum];

    round.startTime = start;
    round.endTime = end;
  }

  // todo. make fallback fail

  // =====
  // USER:
  // =====  
  // note. consider where tokens go. if tokens go to company, then they can cheat system. if tokens go to this contract, then they are stuck here unless we send them back to company

  function allocVotes(bytes32 id) public inAllocVoteTimeFrame(id) {
    // var userVoteWeight = escrows[id].voteWeight[msg.sender];
    uint tokenNum = escrows[id].tokenContract.balanceOf(msg.sender);
    
    escrows[id].voteWeight[msg.sender] = sqrt(tokenNum); 
  }


  // Require approval of entire balanceOf?
  function refund(bytes32 id) public {
    // add this    require(inRefundState);
    
    // Get tokens, then refund remaining ether

    // uint tokenCount = escrows[id].tokenContract.balanceOf(msg.sender);
    // uint refundAmount = tokenCount * getExchangeRate();
    // uint refundAmount = tokenCount * currentExchangeRate;  // Num and denom style is probably better. Probably need be careful in what gets divided and multiplied first.. e.g. (1/4)*8 vs (1*8)/4
    // require(tokenContract.transferFrom(msg.sender, this, tokenCount));  // make sure params are right
    // msg.sender.send(refundAmount);
    // RefundAmount(msg.sender, refundAmount);

  }

  // voting based on balances at certain point in BC? e.g. minime token? consider people not using it
  function singleVote(bytes32 id, bool votedYes) public {
    // Error check
    uint roundNum = escrows[id].roundNum;
    var escrowRound = escrows[id].round[roundNum];

    require(escrowRound.hasVoted[msg.sender] == false);
    require(getBlockTime() >= escrowRound.startTime && getBlockTime() <= escrowRound.endTime); // make sure in voting window

    // State changes
    if (votedYes) { // safe math? 
      escrowRound.yesVotes = escrowRound.yesVotes + escrows[id].voteWeight[msg.sender];
    }
    else {
      escrowRound.noVotes = escrowRound.noVotes + escrows[id].voteWeight[msg.sender];
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
  
  // consider a minimum voting power fn = sqrt(userToken) / SIGMA_u sqrt(u)
  // could be really useful. would have to be calculate offchain
  function minVotingPower(address user) public constant returns (string) {
    // return alloc[user] / maxVoteCount;
    return "1.421%";
  }

  function getExchangeRate() returns (uint){
    // minimi previous balance, oracle token discount, etc
    // minime balanceOfAt(msg.sender,  _blockNumber)
    // baseExchange hardcoded
    // tokeRatio should be between 0 and 2
    uint tokenRatio = 1;
    
    return 1; //return baseExchange * tokenRatio;
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
