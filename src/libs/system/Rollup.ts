import { RollupCore__factory } from '@arbitrum/sdk/dist/lib/abi/factories/RollupCore__factory';
import { RollupCore as IRollupCore } from '@arbitrum/sdk/dist/lib/abi/RollupCore';
import { RollupAdminLogic__factory } from '@arbitrum/sdk/dist/lib/abi/factories/RollupAdminLogic__factory';
import { RollupAdminLogic as IRollupAdminLogic } from '@arbitrum/sdk/dist/lib/abi/RollupAdminLogic';
import { RollupUserLogic__factory } from '@arbitrum/sdk/dist/lib/abi/factories/RollupUserLogic__factory';
import { RollupUserLogic as IRollupUserLogic } from '@arbitrum/sdk/dist/lib/abi/RollupUserLogic';

import { SignerOrProvider } from '@arbitrum/sdk/dist/lib/dataEntities/signerOrProvider';
import { BigNumber, Overrides } from 'ethers';
import { UpgradeExecutor } from './UpgradeExecutor';
import { ValidatorWallet } from './ValidatorWallet';

class RollupCore {
  protected RollupCore: IRollupCore;

  constructor(address: string, provider: SignerOrProvider) {
    this.RollupCore = RollupCore__factory.connect(address, provider);

    //@TODO List
    // this.RollupAdminLogic.forceConfirmNode
    // this.RollupAdminLogic.forceCreateNode
    // this.RollupAdminLogic.forceRefundStaker
    // this.RollupAdminLogic.forceResolveChallenge

  }

  async getSequencerInboxAddress() {
    return await this.RollupCore.sequencerInbox();
  }

  async baseStake() {
    return await this.RollupCore.baseStake();
  }

  async wasmModuleRoot() {
    return await this.RollupCore.wasmModuleRoot();
  }

  async confirmPeriodBlocks() {
    return await this.RollupCore.confirmPeriodBlocks();
  }

  async extraChallengeTimeBlocks() {
    return await this.RollupCore.extraChallengeTimeBlocks();
  }

  async loserStakeEscrow() {
    return await this.RollupCore.loserStakeEscrow();
  }

  async minimumAssertionPeriod() {
    return await this.RollupCore.minimumAssertionPeriod();
  }

  async stakeToken() {
    return await this.RollupCore.stakeToken();
  }

  async isValidator(_validator: string) {
    return await this.RollupCore.isValidator(_validator);
  }

  async validatorWhitelistDisabled() {
    return await this.RollupCore.validatorWhitelistDisabled();
  }
}

export class RollupUserLogic extends RollupCore {
  protected RollupUserLogic: IRollupUserLogic;

  constructor(address: string, provider: SignerOrProvider) {
    super(address, provider);
    this.RollupUserLogic = RollupUserLogic__factory.connect(address, provider);
  }

  async owner() {
    return await this.RollupUserLogic.owner();
  }

  async currentRequiredStake() {
      return await this.RollupUserLogic.currentRequiredStake();
  }
  
  async requireUnresolvedExists() {
    return await this.RollupUserLogic.requireUnresolvedExists();
}

  async withdrawStakerFunds() {
    return await this.RollupUserLogic.withdrawStakerFunds();
  }
}

export class RollupAdminLogic extends RollupCore {
  protected RollupAdminLogic: IRollupAdminLogic;

  constructor(address: string, provider: SignerOrProvider) {
    super(address, provider);
    this.RollupAdminLogic = RollupAdminLogic__factory.connect(address, provider);
  }
  
  async amountStaked(_staker: string) {
    return await this.RollupAdminLogic.amountStaked(_staker);
  }

  async bridge() {
    return await this.RollupAdminLogic.bridge();
  }

  async challengeManager() {
    return await this.RollupAdminLogic.challengeManager();
  }

  async currentChallenge(_staker: string) {
    return await this.RollupAdminLogic.currentChallenge(_staker);
  }

  async firstUnresolvedNode() {
    return await this.RollupAdminLogic.firstUnresolvedNode();
  }

  async getNode(nodeNum: BigNumber) {
    return await this.RollupAdminLogic.getNode(nodeNum);
  }

  async getNodeCreationBlockForLogLookup(nodeNum: BigNumber) {
    return await this.RollupAdminLogic.getNodeCreationBlockForLogLookup(nodeNum);
  }

  async getStaker(_staker: string) {
    return await this.RollupAdminLogic.getStaker(_staker);
  }

  async getStakerAddress(stakerNum: BigNumber) {
    return await this.RollupAdminLogic.getStakerAddress(stakerNum);
  }

  async inbox() {
    return await this.RollupAdminLogic.inbox();
  }

  async isStaked(_staker: string) {
    return await this.RollupAdminLogic.isStaked(_staker);
  }

  async isStakedOnLatestConfirmed(_staker: string) {
    return await this.RollupAdminLogic.isStakedOnLatestConfirmed(_staker);
  }

  async isZombie(_staker: string) {
    return await this.RollupAdminLogic.isZombie(_staker);
  }

  async lastStakeBlock() {
    return await this.RollupAdminLogic.lastStakeBlock();
  }

  async latestConfirmed() {
    return await this.RollupAdminLogic.latestConfirmed();
  }

  async latestStakedNode(_staker: string) {
    return await this.RollupAdminLogic.latestStakedNode(_staker);
  }

  async nodeHasStaker(nodeNum: BigNumber, _staker: string) {
    return await this.RollupAdminLogic.nodeHasStaker(nodeNum, _staker);
  }

  async stakerCount() {
    return await this.RollupAdminLogic.stakerCount();
  }
}

export class RollupAdminLogicExecutor extends RollupAdminLogic {
  private UpgradeExecutor: UpgradeExecutor;

  constructor(RollupAdminLogic: string, executor: string, provider: SignerOrProvider) {
    super(RollupAdminLogic, provider);
    this.UpgradeExecutor = new UpgradeExecutor(executor, provider);
  }

  async #_execute(target: string, calldata: string, overrides?: Overrides) {
    return await this.UpgradeExecutor.executeCall(target, calldata, overrides);
  }

  async setBaseStake(newBaseStake: BigNumber, overrides?: Overrides) {
    const calldata = this.RollupAdminLogic.interface.encodeFunctionData('setBaseStake', [newBaseStake]);
    return await this.#_execute(this.RollupAdminLogic.address, calldata, overrides);
  }

  async setWasmModuleRoot(newWasmModuleRoot: string, overrides?: Overrides) {
    const calldata = this.RollupAdminLogic.interface.encodeFunctionData('setWasmModuleRoot', [newWasmModuleRoot]);
    return await this.#_execute(this.RollupAdminLogic.address, calldata, overrides);
  }

  async setConfirmPeriodBlocks(newConfirmPeriod: BigNumber, overrides?: Overrides) {
    const calldata = this.RollupAdminLogic.interface.encodeFunctionData('setConfirmPeriodBlocks', [newConfirmPeriod]);
    return await this.#_execute(this.RollupAdminLogic.address, calldata, overrides);
  }

  async setExtraChallengeTimeBlocks(newExtraTimeBlocks: BigNumber, overrides?: Overrides) {
    const calldata = this.RollupAdminLogic.interface.encodeFunctionData('setExtraChallengeTimeBlocks', [newExtraTimeBlocks]);
    return await this.#_execute(this.RollupAdminLogic.address, calldata, overrides);
  }

  async setLoserStakeEscrow(newLoserStakerEscrow: string, overrides?: Overrides) {
    const calldata = this.RollupAdminLogic.interface.encodeFunctionData('setLoserStakeEscrow', [newLoserStakerEscrow]);
    return await this.#_execute(this.RollupAdminLogic.address, calldata, overrides);
  }

  async setMinimumAssertionPeriod(newPeriod: BigNumber, overrides?: Overrides) {
    const calldata = this.RollupAdminLogic.interface.encodeFunctionData('setMinimumAssertionPeriod', [newPeriod]);
    return await this.#_execute(this.RollupAdminLogic.address, calldata, overrides);
  }

  async setStakeToken(newStakeToken: string, overrides?: Overrides) {
    const calldata = this.RollupAdminLogic.interface.encodeFunctionData('setStakeToken', [newStakeToken]);
    return await this.#_execute(this.RollupAdminLogic.address, calldata, overrides);
  }

  async setValidator(_validator: string[], _val: boolean[], overrides?: Overrides) {
    const calldata = this.RollupAdminLogic.interface.encodeFunctionData('setValidator', [_validator, _val]);
    return await this.#_execute(this.RollupAdminLogic.address, calldata, overrides);
  }

  async setValidatorWhitelistDisabled(_validatorWhitelistDisabled: boolean, overrides?: Overrides) {
    const calldata = this.RollupAdminLogic.interface.encodeFunctionData('setValidatorWhitelistDisabled', [_validatorWhitelistDisabled]);
    return await this.#_execute(this.RollupAdminLogic.address, calldata, overrides);
  }

  // async setOwner(newOwner:string,overrides?: Overrides) {
  //     const calldata = this.RollupAdminLogic.interface.encodeFunctionData("setOwner",[newOwner])
  //     return await this.#_execute(this.RollupAdminLogic.address,calldata,overrides)
  // }

  // async setDelayedInbox(_inbox:string, _enabled:boolean,overrides?: Overrides) {
  //     const calldata = this.RollupAdminLogic.interface.encodeFunctionData("setDelayedInbox",[_inbox,_enabled])
  //     return await this.#_execute(this.RollupAdminLogic.address,calldata,overrides)
  // }

  // async setInbox() {
  //     const calldata = this.RollupAdminLogic.interface.encodeFunctionData("setInbox",[newBaseStake])
  //     return await this.#_execute(this.RollupAdminLogic.address,calldata,overrides)
  // }

  // async setOutbox() {
  //     const calldata = this.RollupAdminLogic.interface.encodeFunctionData("setOutbox",[newBaseStake])
  //     return await this.#_execute(this.RollupAdminLogic.address,calldata,overrides)
  // }

  // async setSequencerInbox() {
  //     const calldata = this.RollupAdminLogic.interface.encodeFunctionData("setSequencerInbox",[newBaseStake])
  //     return await this.#_execute(this.RollupAdminLogic.address,calldata,overrides)
  // }
}


export class RollupUserLogicWallet extends RollupUserLogic {
  private ValidatorWallet: ValidatorWallet;

  constructor(RollupUserLogic: string, wallet: string, provider: SignerOrProvider) {
    super(RollupUserLogic, provider);
    this.ValidatorWallet = new ValidatorWallet(wallet, provider);
  }

  async #_executeTransaction(target: string, calldata: string, amount: string, overrides?: Overrides) {
    return await this.ValidatorWallet.executeTransaction(calldata, target, amount, overrides);
  }

  async returnOldDeposit(stakerAddress: string, overrides?: Overrides) {
    const calldata = this.RollupUserLogic.interface.encodeFunctionData('returnOldDeposit', [stakerAddress]);
    return await this.#_executeTransaction(this.RollupUserLogic.address, calldata, '0', overrides);
  }

  async withdrawStakerFunds(overrides?: Overrides) {
    const calldata = this.RollupUserLogic.interface.encodeFunctionData('withdrawStakerFunds');
    return await this.#_executeTransaction(this.RollupUserLogic.address, calldata, '0', overrides);
  }
}
