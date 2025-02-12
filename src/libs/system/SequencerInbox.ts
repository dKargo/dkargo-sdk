import { SequencerInbox__factory } from '@arbitrum/sdk/dist/lib/abi/factories/SequencerInbox__factory';
import { SequencerInbox as ISequencerInbox, ISequencerInbox as SequencerInboxType  } from '@arbitrum/sdk/dist/lib/abi/SequencerInbox';
import { SignerOrProvider } from '@arbitrum/sdk/dist/lib/dataEntities/signerOrProvider';
import { UpgradeExecutor } from './UpgradeExecutor';
import { BigNumberish, Overrides } from 'ethers';

export class SequencerInbox {
  protected SequencerInbox: ISequencerInbox;

  constructor(address: string, provider: SignerOrProvider) {
    this.SequencerInbox = SequencerInbox__factory.connect(address, provider);
  }

  async batchCount() {
    return await this.SequencerInbox.batchCount()
  }
  
  async inboxAccs(index:BigNumberish) {
    return await this.SequencerInbox.inboxAccs(index)
  }

  async totalDelayedMessagesRead() {
    return await this.SequencerInbox.totalDelayedMessagesRead()
  }

  async rollup() {
    return await this.SequencerInbox.rollup()
  }

  async isBatchPoster(address:string) {
    return await this.SequencerInbox.isBatchPoster(address)
  }

  async isSequencer(address:string) {
    return await this.SequencerInbox.isSequencer(address)
  }

  async maxTimeVariation() {
    return await this.SequencerInbox.maxTimeVariation()
  }

  async maxDataSize() {
    return await this.SequencerInbox.maxDataSize()
  }

  async bridge() {
    return await this.SequencerInbox.bridge()
  }
}


export class SequencerInboxExecutor extends SequencerInbox {
    private UpgradeExecutor:UpgradeExecutor

    constructor(SequencerInbox:string, executor:string,provider:SignerOrProvider) {
        super(SequencerInbox,provider)
        this.UpgradeExecutor = new UpgradeExecutor(executor,provider)
        // this.SequencerInbox.setBatchPosterManager ??  이거 어디감
    }

    async #_execute(target: string, calldata: string, overrides?: Overrides) {
        await this.UpgradeExecutor.executeCall(target,calldata,overrides)
    }

    async setValidKeyset(keysetBytes:string,overrides?: Overrides) {
      const calldata = this.SequencerInbox.interface.encodeFunctionData("setValidKeyset",[keysetBytes])
     return await this.#_execute(this.SequencerInbox.address,calldata,overrides)
  }

    async setIsBatchPoster(addr:string,isBatchPoster_:boolean,overrides?: Overrides) {
      const calldata = this.SequencerInbox.interface.encodeFunctionData("setIsBatchPoster",[addr,isBatchPoster_])
     return await this.#_execute(this.SequencerInbox.address,calldata,overrides)
  }

    async setMaxTimeVariation(newTime:SequencerInboxType.MaxTimeVariationStruct,overrides?: Overrides) {
      const calldata = this.SequencerInbox.interface.encodeFunctionData("setMaxTimeVariation",[newTime])
     return await this.#_execute(this.SequencerInbox.address,calldata,overrides)
  }

    async setIsSequencer(addr:string, isSequencer_:boolean,overrides?: Overrides) {
      const calldata = this.SequencerInbox.interface.encodeFunctionData("setIsSequencer",[addr,isSequencer_])
     return await this.#_execute(this.SequencerInbox.address,calldata,overrides)
  }

    async invalidateKeysetHash(ksHash:string,overrides?: Overrides) {
      const calldata = this.SequencerInbox.interface.encodeFunctionData("invalidateKeysetHash",[ksHash])
     return await this.#_execute(this.SequencerInbox.address,calldata,overrides)
  }
}