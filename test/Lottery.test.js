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
    it('Deploys the contract', () =>{
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
        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei('0.02', 'ether')
        });
        await lottery.methods.enter().send({
            from: accounts[1],
            value: web3.utils.toWei('0.02', 'ether')
        });
        await lottery.methods.enter().send({
            from: accounts[2],
            value: web3.utils.toWei('0.02', 'ether')
        });

        const players = await lottery.methods.getPlayers().call({
            from: accounts[0]
        });

        assert.equal(3, players.length);
        assert.equal(players[0], accounts[0]);
        assert.equal(players[1], accounts[1]);
        assert.equal(players[2], accounts[2]);
    });

    it('Pick a winner', async () => {
        await lottery.methods.enter().send({
            from: accounts[1],
            value: web3.utils.toWei('3', 'ether')
        });
        const startingBalance = await web3.eth.getBalance(accounts[1]);
        await lottery.methods.pickWinner().call({
            from: accounts[0]
        });
        const finalBalance = await web3.eth.getBalance(accounts[1]);
        const diff = finalBalance - startingBalance;
        // why 2.8 here? it's 3 - the_amount_of_money_spend_on_gas
        // can we find the amount of money spend on the gas? 
        // Gas cost from yellow paprer shows the exact amount of gas
        // spend for each code machine instructions like ADD, PUSH etc.
        assert(diff < web3.utils.toWei('2.8', 'ether'));
        const players = await lottery.methods.getPlayers().call({
            from: accounts[0]
        });
        assert.equal(0, players.length);
    });

    it('Forbidden non-admin access to picking a winner', async () =>{
        try{
            await lottery.methods.pickWinner().send({
                from: accounts[1]
            });
            assert(false);
        }catch(error){
            assert.ok(error);
        }
 
    });

    it('Not enought money to enter in the lottery game', async () => {
        try{
            await lottery.methods.enter().send({
                from: accounts[1],
                value: web3.utils.toWei('0.00', 'ether')
            });
            assert(false);
        }catch(error){
            assert.ok(error);
        }
    });
});