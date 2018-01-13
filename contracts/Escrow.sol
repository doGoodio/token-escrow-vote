pragma solidity ^0.4
/* 1. should release funds to company when yes vote complete
   2. should retain funds when no vote
   3. should refund if 
      a. tokens passed and b. no vote and c. company agrees.
 */

contract Escrow {
  uint public numVotes; //this can be a functions.. yesVotes+noVotes
  uint public yesVotes;
  uint public noVotes;
  uint public roundNum;
  uint public numRounds;
  address public company;

  // threshold approval
  uint public threshNum;
  uint public threshDen;
  uint public minVotes;
    
  mapping (uint => bool) public roundOpen;

  event VotingResult(bool indexed releasedFunds);
  
  function Escrow(uint _numRounds) {
    numRounds = _numRounds;
  }

  
  function singleVote(bool votedYes) public {
    require(hasVoted[msg.sender] == false);  // do token holders vote? should it be weighted by token count?
    require(now >= window[roundNum].start && now <= window[roundNum].end); // make sure in voting window
    if (votedYes) yesVotes++;
    else noVotes++;
    numVotes++;
   }

  // ======
  // ADMIN:
  // ======
  
  

  // ========
  // COMPANY:
  // ========

  // open voting round
  function openVote(uint round) public {
    // need time window here. if we help out ico's, then probably good to remodify this if they want
  }

  // close voting round
  function closeVote() public {
    if (thresholdReached()) releaseFunds();
    else failRound(roundNum);
  }

  function thresholdReached() public constant returns (bool) {
    return numVotes > minVotes
        && (yesVotes * threshDen) > threshNum;
  }

  // keep track of failures
  function failRound() public {
    failures[roundNum]++;
  }

  // releases funds to company
  function releaseFunds() internal {
    // company.send(funds2be..)
    require(msg.send(company, funds2beReleased[roundNum]));
    // require so it doesn't eat gas
  }

  // =====
  // USER:
  // =====  
  // note. consider where tokens go. if tokens go to company, then they can cheat system. if tokens go to this contract, then they are stuck here unless we send them back to company

  // Require approval of entire balanceOf?
  function refund() public {
    require(inRefundState);

    // Get tokens, then refund remaining ether
    uint tokenCount = token.balanceOf(msg.sender);
    uint refundAmount = tokenCount * currentExchangeRate;  // Num and denom style is probably better. Probably need be careful in what gets divided and multiplied first.. e.g. (1/4)*8 vs (1*8)/4
    require(token.transferFrom(msg.sender, this, tokenCount));  // make sure params are right
    msg.sender.send(refundAmount);
  }

  function singleVote(bool votedYes) public {
    // do token holders vote? should it be weighted by token count?
    // need to reset this for every round, or have hasVoted[round][msg.sender]
    // voting based on balances at certain point in BC? e.g. minime token? consider people not using it
    require(hasVoted[msg.sender] == false);  
    require(getBlockNumber() >= window[roundNum].start && getBlockNumber() <= window[roundNum].end); // make sure in voting window
    if (votedYes) yesVotes++;
    else noVotes++;
    numVotes++;
   }

  // =====
  // MISC:
  // =====
  modifier isCompany() {
    require(msg.sender == company);
    _;
  }

  modifier isAdmin() {  // should this be a controlled contract? isController might be same
    require(msg.sender == company);
    _;
  }

  // Use these times for testing
  function getBlockTime()   public constant returns (uint) { return block.timestamp; }
  function getBlockNumber() public constant returns (uint) { return block.number;    }
}
