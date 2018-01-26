// var events = require('./../app/javascripts/events');
// var util = require('./../app/javascripts/util');

import * as EscrowInterface from '../app/javascripts/lib/EscrowInt';

var ERC20 = artifacts.require('ERC20.sol');

var chai = require('chai')
const assert = require("chai").use(require("chai-as-promised")).assert;
const BigNumber = web3.BigNumber;

//************************************************
// Tests
contract('Escrow', function (accounts) {

  const account1 = accounts[0];
  const account2 = accounts[1];
  const account3 = accounts[2];
  const account4 = accounts[3];
  const account5 = accounts[4];
  const account6 = accounts[5];
  const doGood   = accounts[6];
  const company  = accounts[7];
  const payoutAddress = accounts[8];
  const arbitrator = accounts[9];

  describe('escrow init tests', async () => {

    beforeEach(async () => {
      const tokenSupply = new BigNumber(1000000000);
      const tokenName = 'Test token'
      const tokenSymbol = 'test'
      const tokenDecimals = new BigNumber(18);

      token = await ERC20.new(tokenSupply, tokenName, tokenDecimals, tokenSymbol, {from: account1});
      await EscrowInterface.init({from: account1});
    });

    /*
    it('1', async () => {
      const numRounds = new BigNumber(3);
      const minVotes = new BigNumber(30);
      const allocStartTime = new BigNumber(10);
      const allocEndTime = new BigNumber(100);
      var id;
      function setId(_id) { id = _id; }
      const testBal = new BigNumber(84729832);

      await EscrowInterface.createEscrow(setId, numRounds, arbitrator, token.address, payoutAddress, minVotes, allocStartTime, allocEndTime, {from: account1});
      // need blocking, since rely on id
      await EscrowInterface.setBlockTime(new BigNumber(50), {from: account1});

      // need to consider decimals for voting. e.g. 10**18 tokens -> 10**9 votesAllocated.. how many vote decimals are there?
      await token.transfer(account2, testBal, {from: account1});
      await token.transfer(account3, 8, {from: account1});
      await token.transfer(account4, 12, {from: account1});

      await EscrowInterface.allocVotes(id, {from: account2});
      await EscrowInterface.allocVotes(id, {from: account3});

      var data = await EscrowInterface.getEscrowData()(id);
      const vw = await EscrowInterface.get_voteWeight(id, account2);
      const bal = await token.balanceOf(account2);
      
      // log data
      assert.equal(ownerBalance.toNumber(), aixInExchanger.toNumber());

      console.log('acutal vote weight = ' + vw.toString(10));
      console.log('expected voted weight = ' + testBal.sqrt().floor().toString(10));
      console.log('token bal = ' + bal.toString(10));
      for (var i in data) console.log('Escrow data key ' + i + ' -> ' + data[i]);
    });
    */
  });

  describe('escrow scenario tests', async () => {
    //const numRounds = new BigNumber(3);
    const abstainNum = new BigNumber(1);
    const abstainDenom = new BigNumber(6);
    const allocStartTime = new BigNumber(10);
    const allocEndTime = new BigNumber(100);
    var id;
    var token;
    const bal1 = new BigNumber(84729832);
    const bal2 = new BigNumber(2389138);
    const bal3 = new BigNumber(98284982);
    const bal4 = new BigNumber(14832);
    const bal5 = new BigNumber(297525);
    const bal6 = new BigNumber(892193113);

    
    beforeEach(async () => {
      const tokenSupply = new BigNumber(1000000000000);
      const tokenName = 'Test token'
      const tokenSymbol = 'test'
      const tokenDecimals = new BigNumber(18);

      token = await ERC20.new(tokenSupply, tokenName, tokenDecimals, tokenSymbol, {from: company});
      await EscrowInterface.init({from: doGood});
      id = await EscrowInterface.createEscrow(arbitrator, token.address, payoutAddress, allocStartTime, allocEndTime, abstainNum, abstainDenom, {from: company});

      // Alloc token balances and double check
      await token.transfer(account1, bal1, {from: company});
      await token.transfer(account2, bal2, {from: company});
      await token.transfer(account3, bal3, {from: company});
      await token.transfer(account4, bal4, {from: company});
      await token.transfer(account5, bal5, {from: company});
      await token.transfer(account6, bal6, {from: company});

      // Sanity check, make sure a token balance looks right
      var b2Actual = await token.balanceOf(account2);
      assert.equal(bal2.toNumber(), b2Actual.toNumber());
    });

    // need to consider decimals for voting. e.g. 10**18 tokens -> 10**9 votesAllocated.. how many vote decimals are there?
    it('allocates voting in time window', async () => {

      // Test: before window
      await EscrowInterface.setBlockTime(new BigNumber(0), {from: company});
      await EscrowInterface.allocVotes(id, {from: account1});
      const vp1 = await EscrowInterface.getUserVotePower(id, account1);
      assert.equal(vp1.toNumber(), (new BigNumber(0)).toNumber());

      // Test: in window
      await EscrowInterface.setBlockTime(new BigNumber(50), {from: company});
      await EscrowInterface.allocVotes(id, {from: account2});
      const vp2 = await EscrowInterface.getUserVotePower(id, account2);
      assert.equal(vp2.toNumber(), bal2.sqrt().floor().toNumber());

      // Test: after window
      await EscrowInterface.setBlockTime(new BigNumber(150), {from: company});
      await EscrowInterface.allocVotes(id, {from: account3});
      const vp3 = await EscrowInterface.getUserVotePower(id, account3);
      assert.equal(vp3.toNumber(), (new BigNumber(0)).toNumber());
    });

    it('meets threshold', async () => {
      const r1Start = allocEndTime + 10;
      const r1End   = r1Start + 10;

      // Alloc votes
      await EscrowInterface.setBlockTime(new BigNumber(50), {from: company});
      await EscrowInterface.allocVotes(id, {from: account1});
      await EscrowInterface.allocVotes(id, {from: account2});
      await EscrowInterface.allocVotes(id, {from: account3});
      await EscrowInterface.allocVotes(id, {from: account4});
      await EscrowInterface.allocVotes(id, {from: account5});

      // Set round 1 times
      await EscrowInterface.setRoundWindow(id, 1, r1Start, r1End, {from: company});

      // Vote in round 1
      await EscrowInterface.setBlockTime(r1Start + 5, {from: company});
      await EscrowInterface.singleVote(id, true, {from: account1});
      await EscrowInterface.singleVote(id, true, {from: account2});
      await EscrowInterface.singleVote(id, true, {from: account3});
      await EscrowInterface.singleVote(id, true, {from: account4});
      await EscrowInterface.singleVote(id, true, {from: account5});
      await EscrowInterface.singleVote(id, true, {from: account6});

      // Test threshold
      const outcome = await EscrowInterface.thresholdReached(id);
      assert.equal(outcome, true);
    });

    it('can\'t hack rounds', async () => {
    });

    it('can\'t double vote', async () => {
    });

  });
});

/*
Voters are polled and can vote on a Yes/No escrow release
  voting decision during a given time period.	
 -- x    - there should be a set vote window. a set of time voters are notified before the vote starts
A simple majority is required to win the vote.
 -- done - 
  wallet that is designated by the project
 -- done - 
*/


// uint tokenCount = escrows[id].tokenContract.balanceOf(msg.sender);
// uint refundAmount = tokenCount * getExchangeRate();
// uint refundAmount = tokenCount * currentExchangeRate;  // Num and denom style is probably better. Probably need be careful in what gets divided and multiplied first.. e.g. (1/4)*8 vs (1*8)/4
// require(tokenContract.transferFrom(msg.sender, this, tokenCount));  // make sure params are right
// msg.sender.send(refundAmount);
// RefundAmount(msg.sender, refundAmount);

/*
  // consider privledges. arbitrator?
  function startVoteRound(bytes32 id) public {
    require(msg.sender == escrows[id].arbitrator
         || msg.sender == escrows[id].company); 

    uint startTime = escrows[id].round[roundNum + 1].startTime;
    uint endTime = escrows[id].round[roundNum + 1].endTime;
    uint roundNum = escrows[id].roundNum;

    // make sure in voting window
    require(getBlockTime() >= startTime && getBlockTime() <= endTime); 
  }
*/
