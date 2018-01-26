pragma solidity ^0.4.15;

import "./ERC20.sol";

contract Vote {
  function votePower(uint x) public constant returns (uint);
}

contract QuadraticVote is Vote {
  function votePower(uint x) public constant returns (uint) {
    return sqrt(x);
  }

  // y = floor(sqrt(x))
  function sqrt(uint x) internal constant returns (uint) {
    uint z = (x + 1) / 2;
    uint y = x;

    while (z < y) {
        y = z;
        z = (x / z + z) / 2;
    }

    return y;
  }
}

  /*  problem is keeping this contract generic enough for any escrow type

  struct PollData {
    address admin;
    mapping (address => vote) user;
  }

  mapping (bytes32 => PolLData) public poll;

  function getPollId(address contract, bytes32 pollIdWeak) public constant {
    return sha3(contract, pollIdWeak);
  }

  function singleVote(bytes32 pollIdWeak, bool vote) public {
    bytes32 pollId = getVoteId(msg.sender, pollId);
    poll[pollId] 
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
  */

