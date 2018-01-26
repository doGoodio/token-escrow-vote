var MockEscrow = artifacts.require('../../../test/mocks/MockEscrow.sol');
var Escrow = artifacts.require('../../../build/contracts/Escrow.sol');
var escrow = undefined;

var simulated = false;
var testrpc = true;
var failPercentage = 0.01;
var escrowdata = [];

// =============
// Init function
// =============
var init = async (web3Params) => {
  if (testrpc)
    escrow = await MockEscrow.new(web3Params);
  else
    escrow = await Escrow.Deployed();
}


/*
// ================ WATCH =============
/*
*/

var setBlockTime = async(t, web3Params) => {
  // begin timestamp
  const tx = await escrow.setBlockTime(t, web3Params);
}


// ========
// Getters:
// ========

// Contract variable getters
var get_initialTokenCount = (id, user) => escrow.get_initialTokenCount(id,user);
var get_round_funds2beReleased = (id, uint) => escrow.get_round_funds2beReleased(id,user); 
var get_round_endTime = (id, roundNum) => escrow.get_round_endTime(id,user);
var get_round_startTime = (id, roundNum) => escrow.get_round_startTime(id,user);
var get_round_yesVotes = (id, roundNum) => escrow.get_round_yesVotes(id,user);
var get_round_noVotes = (id, roundNum) => escrow.get_round_noVotes(id,user);
var get_round_hasVoted = (id, roundNum, user) => escrow.get_round_hasVoted(id,user);

exports.get_initialTokenCount;      
exports.get_round_funds2beReleased; 
exports.get_round_endTime;          
exports.get_round_startTime;        
exports.get_round_yesVotes;         
exports.get_round_noVotes;          
exports.get_round_hasVoted;         

/*
exports.getUserVotePercentage = async(id, user) => {
  const tc = await get_initialTokenCount(id, user);
  const round = await escrow()()()()()();
  const yes = await get_round_yesVotes(id, round)
  const no = await get_round_noVotes(id, round)

  const num = await escrow.sqrt(tc);
  const denom = yes + no;

  return [num, denom];
}


export.getUserMinVotePercentage = async(id, user) => {

  return [num, denom]
}
*/

exports.getUserVotePower = async(id, user) => {
  const tc = await get_initialTokenCount(id, user);
  return escrow.sqrt(tc);
}

// =================
// Company functions
// =================

var setRound = async(begin, end) => {
  // begin timestamp
  const tx = await escrow.setRoundWindow(roundNum, start, end).send({from: account1})
}

var getEscrowData = () => escrow.escrows;

// return escrow id, 24 bytes
var createEscrow = async (arbitrator, token, payoutAddr, allocStartTime, allocEndTime, abstainNumer, abstainDenom, web3Params) => {
  const company = web3Params['from'];
  if (simulated) {
    if (Math.random() < failPercentage) reject('Tx failed!');
    return '0xae67984724872020842709842faee8a89a99Ae5d';
  } else {
    console.log('Creating escrow:' + '\narb -> ' + arbitrator + '\ntoken -> ' + token + '\npayout -> ' + payoutAddr + '\nallocStart -> ' + allocStartTime + '\nallocEnd -> ' + allocEndTime);
    const result = await escrow.createEscrow(arbitrator, token, payoutAddr, allocStartTime, allocEndTime, abstainNumer, abstainDenom, web3Params);

    for (var i = 0; i < result.logs.length; i++) {
      var log = result.logs[i];
      
      if (log.event == "EscrowCreation") {
        // We found the event!
        console.log("Escrow created with id: " + log.args.id);
        return log.args.id;
      }
    }
  };
}
// ==============
// User functions
// ==============

// run this during token sale
var allocVotes = async(id, web3Params) => {
  // If simulated allocate fake votes
  if (simulated) return;

  // For all other cases, testrpc, testnet, mainnet
  if (escrow == undefined) throw('Escrow undefined');

  const tx = await escrow.allocVotes(id, web3Params); 

  const txFailed = false; // todo check if transaction failed
  if(txFailed) 
    throw('Escrow undefined');
}

function userRefund(id) {
    if (simulated && Math.random() < failPercentage) throw('Tx failed!');
}
function singleVote(voteYesTrue) {
    if (simulated && Math.random() < failPercentage) throw('Tx failed!');
}

// =================
//       API
// =================

// init
exports.init = init;

// Other
exports.getEscrowData = getEscrowData;

// User
exports.allocVotes = allocVotes;
//exports.getRefund = getRefund;
//exports allocVotes = allocVotes;

// Company
exports.createEscrow = createEscrow;
//exports.singleVote = singleVote;
//exports.setRoundWindow = setRoundWindow;

// Testing 
exports.setBlockTime = setBlockTime;

