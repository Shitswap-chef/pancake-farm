const { expectRevert, time } = require('@openzeppelin/test-helpers');
const ShitToken = artifacts.require('ShitToken');
const MasterChef = artifacts.require('MasterChef');
const FoamBar = artifacts.require('FoamBar');
const SousChef = artifacts.require('SousChef');
const MockBEP20 = artifacts.require('libs/MockBEP20');

contract('SousChef', ([alice, bob, carol, dev, minter]) => {
  beforeEach(async () => {
    this.foam = await MockBEP20.new('LPToken', 'LP1', '1000000', {
      from: minter,
    });
    this.chef = await SousChef.new(this.foam.address, '40', '815', '915', {
      from: minter,
    });
  });

  it('sous chef now', async () => {
    await this.foam.transfer(bob, '1000', { from: minter });
    await this.foam.transfer(carol, '1000', { from: minter });
    await this.foam.transfer(alice, '1000', { from: minter });
    assert.equal((await this.foam.balanceOf(bob)).toString(), '1000');

    await this.foam.approve(this.chef.address, '1000', { from: bob });
    await this.foam.approve(this.chef.address, '1000', { from: alice });
    await this.foam.approve(this.chef.address, '1000', { from: carol });

    await this.chef.deposit('10', { from: bob });
    assert.equal(
      (await this.foam.balanceOf(this.chef.address)).toString(),
      '10'
    );

    await time.advanceBlockTo('815');

    await this.chef.deposit('30', { from: alice });
    assert.equal(
      (await this.foam.balanceOf(this.chef.address)).toString(),
      '40'
    );
    assert.equal(
      (await this.chef.pendingReward(bob, { from: bob })).toString(),
      '40'
    );

    await time.advanceBlockTo('817');
    assert.equal(
      (await this.chef.pendingReward(bob, { from: bob })).toString(),
      '50'
    );
    assert.equal(
      (await this.chef.pendingReward(alice, { from: alice })).toString(),
      '30'
    );

    await this.chef.deposit('40', { from: carol });
    assert.equal(
      (await this.foam.balanceOf(this.chef.address)).toString(),
      '80'
    );
    await time.advanceBlockTo('819');
    //  bob 10, alice 30, carol 40
    assert.equal(
      (await this.chef.pendingReward(bob, { from: bob })).toString(),
      '65'
    );
    assert.equal(
      (await this.chef.pendingReward(alice, { from: alice })).toString(),
      '75'
    );
    assert.equal(
      (await this.chef.pendingReward(carol, { from: carol })).toString(),
      '20'
    );

    await this.chef.deposit('20', { from: alice }); // 305 bob 10, alice 50, carol 40
    await this.chef.deposit('30', { from: bob }); // 306  bob 40, alice 50, carol 40

    assert.equal(
      (await this.chef.pendingReward(bob, { from: bob })).toString(),
      '74'
    );
    assert.equal(
      (await this.chef.pendingReward(alice, { from: alice })).toString(),
      '110'
    );

    await time.advanceBlockTo('822');
    assert.equal(
      (await this.chef.pendingReward(bob, { from: bob })).toString(),
      '86'
    );
    assert.equal(
      (await this.chef.pendingReward(alice, { from: alice })).toString(),
      '125'
    );

    await this.chef.withdraw('20', { from: alice }); // 308 bob 40, alice 30, carol 40
    await this.chef.withdraw('30', { from: bob }); // 309  bob 10, alice 30, carol 40

    await time.advanceBlockTo('825');
    assert.equal(
      (await this.chef.pendingReward(bob, { from: bob })).toString(),
      '118'
    );
    assert.equal(
      (await this.chef.pendingReward(alice, { from: alice })).toString(),
      '166'
    );
    assert.equal(
      (await this.foam.balanceOf(this.chef.address)).toString(),
      '80'
    );

    await time.advanceBlockTo('915');
    assert.equal(
      (await this.chef.pendingReward(bob, { from: bob })).toString(),
      '568'
    );
    assert.equal(
      (await this.chef.pendingReward(alice, { from: alice })).toString(),
      '1516'
    );
    assert.equal(
      (await this.chef.pendingReward(carol, { from: alice })).toString(),
      '1915'
    );

    await time.advanceBlockTo('920');
    assert.equal(
      (await this.chef.pendingReward(bob, { from: bob })).toString(),
      '568'
    );
    assert.equal(
      (await this.chef.pendingReward(alice, { from: alice })).toString(),
      '1516'
    );
    assert.equal(
      (await this.chef.pendingReward(carol, { from: alice })).toString(),
      '1915'
    );

    await this.chef.withdraw('10', { from: bob });
    await this.chef.withdraw('30', { from: alice });
    await expectRevert(this.chef.withdraw('50', { from: carol }), 'not enough');
    await this.chef.deposit('30', { from: carol });
    await time.advanceBlockTo('950');
    assert.equal(
      (await this.chef.pendingReward(bob, { from: bob })).toString(),
      '568'
    );
    assert.equal(
      (await this.chef.pendingReward(alice, { from: alice })).toString(),
      '1516'
    );
    assert.equal(
      (await this.chef.pendingReward(carol, { from: alice })).toString(),
      '1915'
    );
    await this.chef.withdraw('70', { from: carol });
    assert.equal((await this.chef.addressLength()).toString(), '3');
  });

  it('try foam', async () => {
    this.Shit = await ShitToken.new(dev, { from: minter });
    this.foam = await FoamBar.new(this.Shit.address, { from: minter });
    this.lp1 = await MockBEP20.new('LPToken', 'LP1', '1000000', {
      from: minter,
    });
    this.chef = await MasterChef.new(
      this.Shit.address,
      this.foam.address,
      dev,
      '1000',
      '300',
      '1',
      { from: minter }
    );
    await this.Shit.transferOwnership(this.chef.address, { from: minter });
    await this.foam.transferOwnership(this.chef.address, { from: minter });
    await this.lp1.transfer(bob, '2000', { from: minter });
    await this.lp1.transfer(alice, '2000', { from: minter });

    await this.lp1.approve(this.chef.address, '1000', { from: alice });
    await this.Shit.approve(this.chef.address, '1000', { from: alice });

    await this.chef.add('1000', this.lp1.address, true, { from: minter });
    await this.chef.deposit(1, '20', { from: alice });
    await time.advanceBlockTo('1000');
    await this.chef.deposit(1, '0', { from: alice });
    await this.chef.add('1000', this.lp1.address, true, { from: minter });

    await this.chef.enterStaking('10', { from: alice });
    await time.advanceBlockTo('1010');
    await this.chef.enterStaking('10', { from: alice });

    this.chef2 = await SousChef.new(this.foam.address, '40', '1100', '1300', {
      from: minter,
    });
    await this.foam.approve(this.chef2.address, '10', { from: alice });
    await time.advanceBlockTo('1090');
    this.chef2.deposit('10', { from: alice }); //520
    await time.advanceBlockTo('1110');
    assert.equal(
      (await this.foam.balanceOf(this.chef2.address)).toString(),
      '10'
    );
    assert.equal(
      (await this.chef2.pendingReward(alice, { from: alice })).toString(),
      '400'
    );
  });

  it('emergencyWithdraw', async () => {
    await this.foam.transfer(alice, '1000', { from: minter });
    assert.equal((await this.foam.balanceOf(alice)).toString(), '1000');

    await this.foam.approve(this.chef.address, '1000', { from: alice });
    await this.chef.deposit('10', { from: alice });
    assert.equal((await this.foam.balanceOf(alice)).toString(), '990');
    await this.chef.emergencyWithdraw({ from: alice });
    assert.equal((await this.foam.balanceOf(alice)).toString(), '1000');
    assert.equal(
      (await this.chef.pendingReward(alice, { from: alice })).toString(),
      '0'
    );
  });
});
