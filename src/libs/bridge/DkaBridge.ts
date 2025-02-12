import { SignerOrProvider, } from '@arbitrum/sdk/dist/lib/dataEntities/signerOrProvider';
import { DkaSdkError } from '../utils/error';
import { ERC20__factory } from '@arbitrum/sdk/dist/lib/abi/factories/ERC20__factory';
import { EthBridger, ArbitrumNetwork } from '@arbitrum/sdk';

/**
 * @description Native Bridge for Arbitrum ERC20 DKA bridging to Dkargo Native
 */
export class DkaBridge extends EthBridger {
  constructor(network: ArbitrumNetwork) {
    super(network);

    if (this.nativeTokenIsEth) {
      throw new DkaSdkError(
        `Dkargo network requires native token address`
      );
    }
  }

  async allowanceGasTokenToInbox(ownerAddress: string,parentProviderOrSigner:SignerOrProvider) {
    return await ERC20__factory.connect(this.nativeToken!,parentProviderOrSigner).allowance(ownerAddress,this.childNetwork.ethBridge.inbox)
  }

  async getParentDkaBalance(address: string, parentProviderOrSigner:SignerOrProvider) {
    return await ERC20__factory.connect(this.nativeToken!,parentProviderOrSigner).balanceOf(address)
  }
}