import { AdminErc20Bridger, ArbitrumNetwork } from "@arbitrum/sdk";
import { DkaSdkError } from "../utils/error";
import { SignerOrProvider, SignerProviderUtils } from "@arbitrum/sdk/dist/lib/dataEntities/signerOrProvider";
import { ERC20__factory } from "@arbitrum/sdk/dist/lib/abi/factories/ERC20__factory";

export class CustomTokenBridge extends AdminErc20Bridger {
    constructor(network: ArbitrumNetwork) {
        super(network);
    
        if (this.nativeTokenIsEth) {
          throw new DkaSdkError(`Dkargo network requires native token address`);
        }
      }

      async allowanceGasTokenToParentERC20(erc20ParentAddress:string, ownerAddress: string, parentProviderOrSigner: SignerOrProvider) {
        return await ERC20__factory.connect(this.childNetwork.nativeToken!, parentProviderOrSigner).allowance(ownerAddress, erc20ParentAddress);
      }

      async allowanceGasTokenToGateway(erc20ParentAddress:string, ownerAddress: string, parentProviderOrSigner: SignerOrProvider) {
        const parentProvider = SignerProviderUtils.getProviderOrThrow(parentProviderOrSigner)
        const gateway = await this.getParentGatewayAddress(erc20ParentAddress, parentProvider);
        return await ERC20__factory.connect(this.nativeToken!, parentProviderOrSigner).allowance(ownerAddress, gateway);
      }
    
      async allowanceTokenToGateway(erc20ParentAddress:string, ownerAddress: string, parentProviderOrSigner: SignerOrProvider) {
        const parentProvider = SignerProviderUtils.getProviderOrThrow(parentProviderOrSigner)
        const gateway = await this.getParentGatewayAddress(erc20ParentAddress, parentProvider);
        return await ERC20__factory.connect(erc20ParentAddress, parentProviderOrSigner).allowance(ownerAddress, gateway);
      }

      async getParentErc20Balance(erc20ParentAddress:string, ownerAddress: string, parentProviderOrSigner:SignerOrProvider)  {
        return await ERC20__factory.connect(erc20ParentAddress,parentProviderOrSigner).balanceOf(ownerAddress)
      }
    
      async getChildErc20Balance(erc20ParentAddress:string, ownerAddress: string, childProviderOrSigner:SignerOrProvider)  {
        return await ERC20__factory.connect(erc20ParentAddress,childProviderOrSigner).balanceOf(ownerAddress)
      }
}