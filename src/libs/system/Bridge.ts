import { ERC20Bridge__factory } from '@arbitrum/sdk/dist/lib/abi/factories/ERC20Bridge__factory';
import { ERC20Bridge as IERC20Bridge } from '@arbitrum/sdk/dist/lib/abi/ERC20Bridge';
import { Bridge__factory } from '@arbitrum/sdk/dist/lib/abi/factories/Bridge__factory';
import { Bridge as IBridge } from '@arbitrum/sdk/dist/lib/abi/Bridge';
import { SignerOrProvider } from '@arbitrum/sdk/dist/lib/dataEntities/signerOrProvider';

class Bridge {
    protected bridge: IBridge;

    constructor(address: string, provider: SignerOrProvider) {
        this.bridge = Bridge__factory.connect(address,provider)
    }
}

export class ERC20Bridge {
    protected erc20Bridge: IERC20Bridge;

    constructor(address: string, provider: SignerOrProvider) {
        this.erc20Bridge = ERC20Bridge__factory.connect(address,provider)
    }

    async getNativeTokenAddress() {
        return await this.erc20Bridge.nativeToken()
    }

    async getSequencerInboxAddress() {
        return await this.erc20Bridge.sequencerInbox()
    }

}