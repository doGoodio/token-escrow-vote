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

//  var escrow;
  var controller = account1;
  var token;

  describe('test 1', async () => {

    beforeEach(async () => {

      const tokenSupply = new BigNumber(1000);
      const tokenName = 'Test token'
      const tokenSymbol = 'test'
      const tokenDecimals = new BigNumber(18);

      token = await ERC20.new(tokenSupply, tokenName, tokenDecimals, tokenSymbol, {from: account1});
      await EscrowInterface.init({from: account1});

      // var numRounds  = new BigNumber(3);
      // var tx = await escrowFactory.createEscrow(numRounds, controller, minimetoken.address, {from: account1});
    });

    it('1', async () => {
      const numRounds = new BigNumber(3);
      const minVotes = new BigNumber(30);
      const allocStartTime = new BigNumber(10);
      const allocEndTime = new BigNumber(100);
      var id;
      function setId(_id) { id = _id; }

      await EscrowInterface.createEscrow(setId, numRounds, arbitrator, token.address, payoutAddress, minVotes, allocStartTime, allocEndTime, {from: account1});
      // need blocking, since rely on id
      await EscrowInterface.setBlockTime(new BigNumber(50), {from: account1});

      // need to consider decimals for voting. e.g. 10**18 tokens -> 10**9 votesAllocated.. how many vote decimals are there?
      await token.transfer(account2, 10 * 10, {from: account1});
      await token.transfer(account3, 8, {from: account1});
      await token.transfer(account4, 12, {from: account1});

      await EscrowInterface.allocVotes(0, {from: account2});
      await EscrowInterface.allocVotes(0, {from: account3});

      var data = await EscrowInterface.getEscrowData()(id);
      const vw = await EscrowInterface.get_voteWeight(id, account2);
      const bal = await token.balanceOf(account2);
      
      // log data
      console.log('acutal vote weight = ' + vw);
      console.log('expected voted weight = 10');
      console.log('token bal = ' + bal);
      for (var i in data) console.log('Escrow data key ' + i + ' -> ' + data[i]);
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
