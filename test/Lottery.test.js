const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());
const { abi, evm } = require('../compile');
let accounts;
let lottery;

beforeEach(async() => {
    accounts = await web3.eth.getAccounts();
    lottery = await new web3.eth.Contract(abi).deploy({data: evm.bytecode.object}).send({from: accounts[0], gas: '1000000'});
});

describe('Lottery Tests', ()=>{
    it('Deployes the contract', () =>{
        assert.ok(lottery.options.address);
    });

    it('Allows one account to enter', async () => {
        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei('0.02', 'ether')
        });

        const players = await lottery.methods.getPlayers().call({
            from: accounts[0]
        });

        assert.equal(1, players.length);
        assert.equal(players[0], accounts[0]);

    });

    it('Allows multiple accounts to enter', async () => {

    });

    it('Pick a winner', async () => {

    });

    it('Forbidden non-admin access to picking a winner', async () =>{

    });

    it('Not enought money to enter in the game', async () => {

    });
});