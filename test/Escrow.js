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
  });

  describe('escrow scenario tests', async () => {
    //const numRounds = new BigNumber(3);
    const abstainNum = new BigNumber(1);
    const abstainDenom = new BigNumber(10);
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
    const vp1E = bal1.sqrt().floor();  // 9204
    const vp2E = bal2.sqrt().floor();  // 1545 
    const vp3E = bal3.sqrt().floor();  // 9913
    const vp4E = bal4.sqrt().floor();  // 121
    const vp5E = bal5.sqrt().floor();  // 545
    const vp6E = bal6.sqrt().floor();  // 29869
    
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
      const vp1A = await EscrowInterface.getUserVotePower(id, account1);
      assert.equal(vp1A.toNumber(), (new BigNumber(0)).toNumber());

      // Test: in window
      await EscrowInterface.setBlockTime(new BigNumber(50), {from: company});
      await EscrowInterface.allocVotes(id, {from: account2});
      const vp2A = await EscrowInterface.getUserVotePower(id, account2);
      assert.equal(vp2A.toNumber(), vp2E.toNumber());

      // Test: after window
      await EscrowInterface.setBlockTime(new BigNumber(150), {from: company});
      await EscrowInterface.allocVotes(id, {from: account3});
      const vp3 = await EscrowInterface.getUserVotePower(id, account3);
      assert.equal(vp3.toNumber(), (new BigNumber(0)).toNumber());
    });


    it('does meet threshold', async () => {
      const r1Start = allocEndTime + 10;
      const r1End   = r1Start + 10;

      // Alloc votes
      await EscrowInterface.setBlockTime(new BigNumber(50), {from: company});
      await EscrowInterface.allocVotes(id, {from: account1});
      await EscrowInterface.allocVotes(id, {from: account3});

      // Set round 1 times
      await EscrowInterface.setRoundWindow(id, 1, r1Start, r1End, {from: company});

      // Vote in round 1
      await EscrowInterface.setBlockTime(r1Start + 5, {from: company});
      await EscrowInterface.singleVote(id, false, {from: account1});    // yes
      await EscrowInterface.singleVote(id, true, {from: account3});   // no

      // Test threshold
      const outcome = await EscrowInterface.thresholdReached(id);
      assert.equal(outcome, true);
    });

    it('does not meet threshold', async () => {
      const r1Start = allocEndTime + 10;
      const r1End   = r1Start + 10;

      // Alloc votes
      await EscrowInterface.setBlockTime(new BigNumber(50), {from: company});
      await EscrowInterface.allocVotes(id, {from: account1});
      await EscrowInterface.allocVotes(id, {from: account3});

      // Set round 1 times
      await EscrowInterface.setRoundWindow(id, 1, r1Start, r1End, {from: company});

      // Vote in round 1
      await EscrowInterface.setBlockTime(r1Start + 5, {from: company});
      await EscrowInterface.singleVote(id, true, {from: account1});    // yes
      await EscrowInterface.singleVote(id, false, {from: account3});   // no

      // Test threshold
      const outcome = await EscrowInterface.thresholdReached(id);
      assert.equal(outcome, false);
    });

  });
});
