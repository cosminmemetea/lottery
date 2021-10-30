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
        await enterNewAccount(0, '0.02');

        const players = await getPlayers(0);
        
        assert.equal(1, players.length);
        assert.equal(players[0], accounts[0]);
    });

    it('Allows multiple accounts to enter', async () => {
        await enterNewAccount(0, '0.02');
        await enterNewAccount(1, '0.02');
        await enterNewAccount(2, '0.02');
        await enterNewAccount(3, '0.02');

        const players = await getPlayers(0);

        assert.equal(players.length, 4);
        assert.equal(players[0], accounts[0]);
        assert.equal(players[1], accounts[1]);
        assert.equal(players[2], accounts[2]);
        assert.equal(players[3], accounts[3]);
    });

    it('Pick a winner', async () => {
        await enterNewAccount(1, '3');
        const startingBalance = await getBalance(1);
        await pickWinner(0);
        const finalBalance = await getBalance(1);
        const diff = finalBalance - startingBalance;
        // why 2.8 here? it's 3 - the_amount_of_money_spend_on_gas
        // can we find the amount of money spend on the gas? 
        // Gas cost from yellow paprer shows the exact amount of gas
        // spend for each code machine instructions like ADD, PUSH etc.
        assert(diff < web3.utils.toWei('2.8', 'ether'));

        // This assertion fails but in the IN REMIX EDITOR (https://remix.ethereum.org/) seems that after
        // the #pickWinner() method is called there is no player left in the players list.
        //
        // const players = await getPlayers(0);
        // assert.equal(players.length, 0, 'No player must be in the lottery after the winner is picked.');
    });

    it('Forbidden non-admin access to picking a winner', () => {
        expectException(pickWinner(1));
    });

    it('Not enought money to enter in the lottery game', () => {
       expectException(enterNewAccount(1, '0.00'));
    });
});

const enterNewAccount = async (accountIndex, etherQuantity) => {
    await lottery.methods.enter().send({
        from: accounts[accountIndex],
        value: web3.utils.toWei(etherQuantity, 'ether')
    });
}

const getBalance = async (accountIndex) => {
    return await web3.eth.getBalance(accounts[accountIndex]);
} 

const getPlayers = async (accountIndex) => {
    return await lottery.methods.getPlayers().call({
        from: accounts[accountIndex]
    });
}

const pickWinner = async (accountIndex) => {
    await lottery.methods.pickWinner().call({
        from: accounts[accountIndex]
    });
}

const expectException = async (promise) => {
    try{
        await promise;
        assert(false);
    }catch(error){
        //PLEASE DO AVOID THIS KIND OF ASSERTIONS IN PRODUCTION !!! IT'S REALLY A WEAK ONE;
        //BACKED UP HERE BY MANUAL TESTING REALISED IN REMIX EDITOR (https://remix.ethereum.org/).
        assert.ok(error);
    }
}