const { compiledContract } = require('../compile');
const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');

const web3 = new Web3(ganache.provider()); // ganache.provider() is a web3 provider
const clearTextPassword = "superSecretPassword";

let accounts;
let deployedBodyMapContract;

beforeEach(async () => {
    // Add assertions to check if compiledContract and its abi property are present
    assert.ok(compiledContract, 'Compiled contract is missing or undefined.');
    assert.ok(compiledContract.abi, 'Contract ABI is missing or undefined.');

    accounts = await web3.eth.getAccounts();
    deployedBodyMapContract = await new web3.eth.Contract(compiledContract.abi)
        .deploy({ data: compiledContract.evm.bytecode.object, arguments: [clearTextPassword] })
        .send({ from: accounts[0], gas: '1000000' });
});

describe('BodyMap', () => {
    it('deploys a contract', () => {
        assert.ok(deployedBodyMapContract.options.address);
        console.log(deployedBodyMapContract.options.address);
    });

    it("changes the bodymaps", async () => {
        await deployedBodyMapContract.methods
            .setBodyMaps(clearTextPassword, "New basic body map", "New tailor body map")
            .send({ from: accounts[0], gas: '5000000' });
        const updatedBasicBodyMap = await deployedBodyMapContract.methods.basicBodyMap().call();
        const updatedTailorBodyMap = await deployedBodyMapContract.methods.tailorBodyMap().call();
        assert.equal(updatedBasicBodyMap, "New basic body map");
        assert.equal(updatedTailorBodyMap, "New tailor body map");
    });

    it("can't change the bodymaps with wrong password", async () => {
        try {
            await deployedBodyMapContract.methods
                .setBodyMaps("wrong password", "New basic body map", "New tailor body map")
                .send({ from: accounts[0], gas: '5000000' });
            assert(false);
        } catch (err) {
            assert(err);
        }
    });


});