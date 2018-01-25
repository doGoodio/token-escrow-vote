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

// =================
// Company functions
// =================

var setRound = async(begin, end) => {
  // begin timestamp
  const tx = await escrow.setRoundWindow(roundNum, start, end).send({from: account1})
}

var getEscrowData = () => escrow.escrows

// return escrow id, 24 bytes
var createEscrow = async (callback_fn, numRounds, arbitrator, token, payoutAddr, minVotes, allocStartTime, allocEndTime, web3Params) => {
  const company = web3Params['from'];
  if (simulated) {
    if (Math.random() < failPercentage) reject('Tx failed!');
    return '0xae67984724872020842709842faee8a89a99Ae5d';
  }
  
  const tx = await escrow.createEscrow(numRounds, arbitrator, token, payoutAddr, minVotes, allocStartTime, allocEndTime);
  console.log('Created escrow: ' + numRounds + ' ' + token + ' ' + arbitrator + ' ' + company + ' ' + payoutAddr);    

  escrow.EscrowCreation().watch(function(error, result) {
  if (!error) {
    callback_fn(result.args.id);
    console.log("company created: " + result.args.company + " with id " + result.args.id);
  };
});
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



// module.export.EscrowCon;






/*

// vote yes or no

// notes
// * string vs bignumber return
// * what if oracle fails b/c gas too small? no refund?
// * set account. default to account1? does metamask provide a hook to change it?
var getRefund = async() => {
  let promise = await new Promise((resolve, reject) => {
    if (simulated) resolve('3.0023427');
    if (escrow == undefined) reject('Escrow undefined');
    
    var event = escrow.events.RefundAmount({filter: {user: account1}});
    
    var refundAmount;
    var listener = function(result) {
      resolve(result.returnValues.refundAmount.toNumber(10));
    }
    
    event.once('data', listener);
    event.once('error', e => reject(e));
    
    const tx = await escrow.refund()
          .send({from: account1})
          .catch(e => reject(e));
  });
    
  return promise;
}

// */

/*
// ================ WATCH =============
escrow.EscrowCreation().watch(function(error, result) {
  if (!error) {
    escrowdata.push(result.args);
    console.log("company created: " + result.args.company + " with id " + result.args.id);
  };
});
*/
