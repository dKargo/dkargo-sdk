import { ERC20Inbox__factory } from '@arbitrum/sdk/dist/lib/abi/factories/ERC20Inbox__factory';
import { ERC20Inbox as IERC20Inbox } from '@arbitrum/sdk/dist/lib/abi/ERC20Inbox';
import { Bridge__factory } from '@arbitrum/sdk/dist/lib/abi/factories/Bridge__factory';
import { Bridge as IBridge } from '@arbitrum/sdk/dist/lib/abi/Bridge';
import { SignerOrProvider } from '@arbitrum/sdk/dist/lib/dataEntities/signerOrProvider';

class Inbox {
    protected bridge: IBridge;

    constructor(address: string, provider: SignerOrProvider) {
        this.bridge = Bridge__factory.connect(address,provider)
    }
}

export class ERC20Inbox {
    protected erc20Inbox: IERC20Inbox;

    constructor(address: string, provider: SignerOrProvider) {
        this.erc20Inbox = ERC20Inbox__factory.connect(address,provider)
    }

    async getSequencerInboxAddress() {
        return await this.erc20Inbox.sequencerInbox()
    }

}