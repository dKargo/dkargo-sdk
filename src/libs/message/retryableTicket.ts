import { ArbitrumNetwork, ParentToChildMessageGasEstimator, RetryableMessageParams } from '@arbitrum/sdk';
import { ERC20__factory } from '@arbitrum/sdk/dist/lib/abi/factories/ERC20__factory';
import { BigNumber, BigNumberish, BytesLike, ContractTransaction, ethers, Overrides, Signer } from 'ethers';
import { SignerOrProvider, SignerProviderUtils } from '@arbitrum/sdk/dist/lib/dataEntities/signerOrProvider';
import { ArbSdkError } from '@arbitrum/sdk/dist/lib/dataEntities/errors';
import { MAX_APPROVAL } from '../dataEntities/constants';
import { Inbox__factory } from '@arbitrum/sdk/dist/lib/abi/factories/Inbox__factory';
import { ERC20Inbox__factory } from '@arbitrum/sdk/dist/lib/abi/factories/ERC20Inbox__factory';
import { ParentToChildMessageNoGasParams } from '@arbitrum/sdk/dist/lib/message/ParentToChildMessageCreator';
import { hexDataLength } from 'ethers/lib/utils';
import { string } from 'yargs';

export class RetryableTicket {
  private network: ArbitrumNetwork;

  constructor(_network: ArbitrumNetwork) {
    this.network = _network;
  }

  // https://github.com/OffchainLabs/nitro/blob/65196bb8eea58e737cc5585f0623033818cf559d/arbos/retryables/retryable.go#L365
  static getRetryableEscrowAddress(ticketId: string) {
    const keccakHash = ethers.utils.solidityKeccak256(['string', 'bytes'], ['retryable escrow', ethers.utils.arrayify(ticketId)]);
    return ethers.utils.getAddress(ethers.utils.hexDataSlice(keccakHash, 12));
  }

  #_getNativeToken() {
    if (this.network.nativeToken) {
      return this.network.nativeToken;
    } else {
      return false;
    }
  }

  #_percentIncrease(num: BigNumber, increase: BigNumber): BigNumber {
    return num.add(num.mul(increase).div(100));
  }

  async allowanceGasTokenToInbox(parentSignerOrProvider: SignerOrProvider, owner?: string) {
    const nativeToken = this.#_getNativeToken();
    if (!nativeToken) throw new ArbSdkError('Network No Native Token');

    if (!owner) {
      if (SignerProviderUtils.isSigner(parentSignerOrProvider)) {
        owner = await parentSignerOrProvider.getAddress();
      } else {
        throw new ArbSdkError('Need owner address');
      }
    }

    const erc20 = ERC20__factory.connect(nativeToken, parentSignerOrProvider);
    return await erc20.allowance(owner, this.network.ethBridge.inbox);
  }

  async approveGasTokenToInbox(parentSigner: Signer, amount: BigNumber = MAX_APPROVAL, overrides?: Overrides) {
    const nativeToken = this.#_getNativeToken();
    if (!nativeToken) throw new ArbSdkError('Network No Native Token');
    const erc20 = ERC20__factory.connect(nativeToken, parentSigner);
    return await erc20.approve(this.network.ethBridge.inbox, amount, {...overrides});
  }

  async getCreateRetryableTicketRequest(
    parentSignerOrProvider: SignerOrProvider,
    childSignerOrProvider: SignerOrProvider,
    retryableEstimateParam: ParentToChildMessageNoGasParams,
    percentIncrease?: {
      gasPricePercent?: BigNumber; // gas price + 500%
      submissionPercent?: BigNumber; // submissionFee + 300%
      gasLimitPercent?: BigNumber; // gas limit + 200%
    }
  ): Promise<Omit<RetryableMessageParams, 'l1Value'>> {
    const childProvider = SignerProviderUtils.getProviderOrThrow(childSignerOrProvider);
    const parentProvider = SignerProviderUtils.getProviderOrThrow(parentSignerOrProvider);
    const estimator = new ParentToChildMessageGasEstimator(childProvider);

    const gasPriceBid = await estimator.estimateMaxFeePerGas({ base: undefined, percentIncrease: percentIncrease?.gasPricePercent }); // current gas price + 500%

    const submissionFee = await estimator.estimateSubmissionFee(
      parentProvider,
      gasPriceBid,
      hexDataLength(retryableEstimateParam.data), // calldata length
      { base: undefined, percentIncrease: percentIncrease?.submissionPercent }
    ); // submissionFee + 300%

    const gasLimit = await estimator.estimateRetryableTicketGasLimit(retryableEstimateParam);

    return {
      destAddress: retryableEstimateParam.to,
      l2CallValue: retryableEstimateParam.l2CallValue,
      maxSubmissionFee: submissionFee,
      excessFeeRefundAddress: retryableEstimateParam.excessFeeRefundAddress,
      callValueRefundAddress: retryableEstimateParam.callValueRefundAddress,
      gasLimit: this.#_percentIncrease(gasLimit, percentIncrease?.gasLimitPercent || BigNumber.from(200)),
      maxFeePerGas: gasPriceBid,
      data: retryableEstimateParam.data,
    };
  }

  async createRetryableTicket(
    parentSigner: Signer,
    retryablePayload: Omit<RetryableMessageParams, 'l1Value'>,
    overrides?: Overrides & {
      from?: string | Promise<string>;
    }
  ): Promise<ContractTransaction> {
    const l1CallValue = retryablePayload.maxSubmissionFee
      .add(retryablePayload.maxFeePerGas.mul(retryablePayload.gasLimit))
      .add(retryablePayload.l2CallValue);
    if (this.#_getNativeToken()) {
      const inbox = ERC20Inbox__factory.connect(this.network.ethBridge.inbox, parentSigner);
      return await inbox.createRetryableTicket(
        retryablePayload.destAddress,
        retryablePayload.l2CallValue,
        retryablePayload.maxSubmissionFee,
        retryablePayload.excessFeeRefundAddress,
        retryablePayload.callValueRefundAddress,
        retryablePayload.gasLimit,
        retryablePayload.maxFeePerGas,
        l1CallValue,
        retryablePayload.data,
        {...overrides}
      );
    } else {
      const inbox = Inbox__factory.connect(this.network.ethBridge.inbox, parentSigner);
      return await inbox.createRetryableTicket(
        retryablePayload.destAddress,
        retryablePayload.l2CallValue,
        retryablePayload.maxSubmissionFee,
        retryablePayload.excessFeeRefundAddress,
        retryablePayload.callValueRefundAddress,
        retryablePayload.gasLimit,
        retryablePayload.maxFeePerGas,
        retryablePayload.data,
        { ...overrides, value: l1CallValue }
      );
    }
  }
}
