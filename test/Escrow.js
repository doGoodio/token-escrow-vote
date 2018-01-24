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

      await EscrowInterface.createEscrow(numRounds, arbitrator, token.address, payoutAddress, minVotes, {from: account1});
      const id = 0;
      await token.transfer(account2, 5);
      await token.transfer(account3, 8);
      await token.transfer(account4, 12);
      EscrowInterface.allocVotes(0, {from: account2});
      EscrowInterface.allocVotes(0, {from: account3});
      
    });

  });
});
