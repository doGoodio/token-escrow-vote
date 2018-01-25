// var events = require('./../app/javascripts/events');
// var util = require('./../app/javascripts/util');

import * as EscrowInterface from '../app/javascripts/lib/Escrow';

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
  const payoutAddress = accounts[4];
  const arbitrator = accounts[5];

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
    const numRounds = new BigNumber(3);
    const minVotes = new BigNumber(30);
    const allocStartTime = new BigNumber(10);
    const allocEndTime = new BigNumber(100);
    var id;
    var token;
    
    beforeEach(async () => {
      function setId(_id) { id = _id; }
      const tokenSupply = new BigNumber(1000000000);
      const tokenName = 'Test token'
      const tokenSymbol = 'test'
      const tokenDecimals = new BigNumber(18);

      token = await ERC20.new(tokenSupply, tokenName, tokenDecimals, tokenSymbol, {from: account1});
      await EscrowInterface.init({from: account1});
      await EscrowInterface.createEscrow(setId, numRounds, arbitrator, token.address, payoutAddress, minVotes, allocStartTime, allocEndTime, {from: account1});
    });


    // need to consider decimals for voting. e.g. 10**18 tokens -> 10**9 votesAllocated.. how many vote decimals are there?
    it('allocates voting', async () => {
      // vars
      const bal2 = new BigNumber(84729832);
      const bal3 = new BigNumber(238913);
      const bal4 = new BigNumber(98284982);
      var b2,b3,b4;

      // set block time
      await EscrowInterface.setBlockTime(new BigNumber(50), {from: account1});
      
      // Alloc token balances and double check
      await token.transfer(account2, bal2, {from: account1});
      await token.transfer(account3, bal3, {from: account1});
      await token.transfer(account4, bal4, {from: account1});
      b2 = await token.balanceOf(account2);
      b3 = await token.balanceOf(account3);
      b4 = await token.balanceOf(account3);
      assert.equal(bal2.toNumber(), b2.toNumber());
      assert.equal(bal3.toNumber(), b3.toNumber());
      assert.equal(bal3.toNumber(), b4.toNumber());


      // alloc votes and get vote weight
      await EscrowInterface.allocVotes(id, {from: account2});
      await EscrowInterface.allocVotes(id, {from: account3});
      await EscrowInterface.allocVotes(id, {from: account4});
      const vw2 = await EscrowInterface.get_voteWeight(id, account2);
      const vw3 = await EscrowInterface.get_voteWeight(id, account3);
      const vw4 = await EscrowInterface.get_voteWeight(id, account4);
      
      // tests
      assert.equal(vw2.toNumber(), bal2.sqrt().floor().toNumber());
      assert.equal(vw3.toNumber(), bal3.sqrt().floor().toNumber());
      assert.equal(vw4.toNumber(), bal4.sqrt().floor().toNumber());
    });
  });
});

/*
Votes are allocated voting power for a given project based on
  the number of tokens they purchased at that company's presale/ICO.	
 -- done - we have token allocation window
Voters are polled and can vote on a Yes/No escrow release
  voting decision during a given time period.	
 -- x    - there should be a set vote window. a set of time voters are notified before the vote starts
Votes are counted using quadratic voting.
 -- done -
A simple majority is required to win the vote.
 -- done - 
Funds are released and transfered to an Ethereum
  wallet that is designated by the project
 -- done - 
*/
