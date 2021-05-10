const { assert } = require("chai");

const ShitToken = artifacts.require('ShitToken');

contract('ShitToken', ([alice, bob, carol, dev, minter]) => {
    beforeEach(async () => {
        this.Shit = await ShitToken.new(dev, { from: minter });
    });

    it('mints 2500 tokens to the treasury on creation', async () => {
        assert.equal((await this.Shit.balanceOf(dev)).toString(), '2500000000000000000000');
    })

    it('mint', async () => {
        await this.Shit.mint(alice, 1000, { from: minter });
        assert.equal((await this.Shit.balanceOf(alice)).toString(), '1000');
    })
});
