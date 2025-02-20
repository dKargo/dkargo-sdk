import { ArbitrumNetwork, ChildToParentMessageStatus, Erc20Bridger, getArbitrumNetwork , ParentToChildMessageStatus} from '@arbitrum/sdk';
import { JsonRpcProvider } from './utils/types';
import { ERC20Bridge } from './system/Bridge';

export class DkargoHelper {
  static async getParentErc20Address(erc20Address: string, childProvider: JsonRpcProvider) {
    const network = await getArbitrumNetwork(childProvider);
    const arbitrumErc20Bridge = new Erc20Bridger(network);
    return await arbitrumErc20Bridge.getParentErc20Address(erc20Address, childProvider);
  }

  static async getNativeTokenAddress(network:ArbitrumNetwork, parentProvider: JsonRpcProvider) {
    try {
      const native = new ERC20Bridge(network.ethBridge.bridge, parentProvider);
      return await native.getNativeTokenAddress();
    } catch (error) {
      return ""
    }
  }
}

export const ChildToParentMessageStatusString = (status: ChildToParentMessageStatus) => {
  switch (status) {
    case ChildToParentMessageStatus.CONFIRMED:
      return 'CONFIRMED';
    case ChildToParentMessageStatus.EXECUTED:
      return 'EXECUTED';
    case ChildToParentMessageStatus.UNCONFIRMED:
      return 'UNCONFIRMED';
  }
};

export const ParentToChildMessageStatusString = (status: ParentToChildMessageStatus) => {
  switch (status) {
    case ParentToChildMessageStatus.NOT_YET_CREATED:
      return 'NOT_YET_CREATED';
    case ParentToChildMessageStatus.CREATION_FAILED:
      return 'CREATION_FAILED';
    case ParentToChildMessageStatus.FUNDS_DEPOSITED_ON_CHILD:
      return 'FUNDS_DEPOSITED_ON_CHILD';
    case ParentToChildMessageStatus.REDEEMED:
      return 'REDEEMED';
    case ParentToChildMessageStatus.EXPIRED:
      return 'EXPIRED';
  }
};
