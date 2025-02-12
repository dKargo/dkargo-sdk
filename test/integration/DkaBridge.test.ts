import { expect } from 'chai';
import {
  initProviderAndSigner,
  registerTestNetwork,
  timeToWaitMs,
} from '../testHelper';
import {
  DkaBridge,
  MAX_APPROVAL,
  getArbitrumNetwork,
  ParentEthDepositTransactionReceipt,
  EthDepositMessageStatus,
  ParentContractCallTransactionReceipt,
  ParentToChildMessageStatus,
  ChildTransactionReceipt,
  ChildToParentMessageStatus,
} from '../../src';
import { JsonRpcProvider } from '../../src/libs/utils/types';
import { BigNumber, Wallet } from 'ethers';
import { parseEther } from 'ethers/lib/utils';

describe('L2 <-> L3 DKA Bridge', () => {
  let dkaBridge: DkaBridge;
  let parentProvider: JsonRpcProvider;
  let parentSigner: Wallet;
  let childProvider: JsonRpcProvider;
  let childSigner: Wallet;

  before('register system contract address', async () => {
    await registerTestNetwork();
    const { provider: _parentProvider, signer: _parentSigner } = initProviderAndSigner('ARB');
    const { provider: _childProvider, signer: _childSigner } = initProviderAndSigner('DKA');

    parentProvider = _parentProvider;
    parentSigner = _parentSigner;
    childProvider = _childProvider;
    childSigner = _childSigner;

    const network = await getArbitrumNetwork(childProvider);
    dkaBridge = new DkaBridge(network);
  });

  describe('approve L2 ERC20 DKA', () => {
    it('approve txRequest MAX amount to inbox', async () => {
      const txRequest = dkaBridge.getApproveGasTokenRequest();
      const res = await dkaBridge.approveGasToken({ txRequest, parentSigner });
      const receipt = await res.wait();
      expect(receipt.status).eq(1, 'Transaction Status');

      const allowance = await dkaBridge.allowanceGasTokenToInbox(
        parentSigner.address,
        parentProvider
      );
      expect(allowance).eql(MAX_APPROVAL);
    });

    it('approve 1 ether amount to inbox for deposit', async () => {
      const amount = parseEther('1');
      const res = await dkaBridge.approveGasToken({
        parentSigner,
        amount,
      });
      const receipt = await res.wait();
      expect(receipt.status).eq(1, 'Transaction Status');

      const allowance = await dkaBridge.allowanceGasTokenToInbox(
        parentSigner.address,
        parentProvider
      );
      expect(allowance).eql(amount);
    });

    it('approve MAX amount to inbox for deposit', async () => {
      const res = await dkaBridge.approveGasToken({
        parentSigner,
      });
      const receipt = await res.wait();
      expect(receipt.status).eq(1, 'Transaction Status');

      const allowance = await dkaBridge.allowanceGasTokenToInbox(
        parentSigner.address,
        parentProvider
      );
      expect(allowance).eql(MAX_APPROVAL);
    });
  });

  describe('deposit 1 DKA', () => {
    const amount = parseEther('1');
    let receipt: ParentEthDepositTransactionReceipt;
    let beforeL3DKA: BigNumber;
    describe('deposit by txRequest', () => {
      it('deposit 1 DKA', async () => {
        beforeL3DKA = await childSigner.getBalance();

        const txRequest = await dkaBridge.getDepositRequest({
          amount,
          from: parentSigner.address,
        });

        const res = await dkaBridge.deposit({
          parentSigner,
          txRequest: txRequest.txRequest,
          amount: amount,
        });
        receipt = await res.wait();
        expect(receipt.status).eq(1, 'Transaction Status');
      });

      it('Wait for the deposit message to be delivered to Layer3.', async () => {
        const isDeposit = await receipt.waitForChildTransactionReceipt(childProvider);
        const status = await isDeposit.message.status();
        expect(status).eql(EthDepositMessageStatus.DEPOSITED);
      });

      it('compare balances after deposit', async () => {
        const afterL3DKA = await childSigner.getBalance();
        expect(afterL3DKA).eql(beforeL3DKA.add(amount));
      });
    });

    describe('deposit by deposit', () => {
      it('deposit 1 DKA', async () => {
        beforeL3DKA = await childSigner.getBalance();
        const res = await dkaBridge.deposit({
          parentSigner,
          amount: amount,
        });
        receipt = await res.wait();
        expect(receipt.status).eq(1, 'Transaction Status');
      });
      it('Wait for the deposit message to be delivered to Layer3.', async () => {
        const isDeposit = await receipt.waitForChildTransactionReceipt(childProvider);
        const status = await isDeposit.message.status();
        expect(status).eql(EthDepositMessageStatus.DEPOSITED);
      });

      it('compare balances after deposit', async () => {
        const afterL3DKA = await childSigner.getBalance();
        expect(afterL3DKA).eql(beforeL3DKA.add(amount));
      });
    });
  });

  describe('depositTo 1 DKA to random address', () => {
    const amount = parseEther('1');
    const destination = Wallet.createRandom();
    let receipt: ParentContractCallTransactionReceipt;
    let beforeL3DKA: BigNumber;

    describe('depositTo by txRequest', () => {
      it('depositTo 1 DKA', async () => {
        beforeL3DKA = await childProvider.getBalance(destination.address);

        const txRequest = await dkaBridge.getDepositToRequest({
          amount,
          destinationAddress: destination.address,
          from: parentSigner.address,
          parentProvider,
          childProvider,
        });

        const res = await dkaBridge.depositTo({
          parentSigner,
          childProvider,
          destinationAddress: destination.address,
          txRequest: txRequest.txRequest,
          amount: amount,
        });
        receipt = await res.wait();

        expect(receipt.status).eq(1, 'Transaction Status');
      });

      it('Wait for the depositTo message to be delivered to Layer3.', async () => {
        const isDeposit = await receipt.waitForChildTransactionReceipt(childProvider);
        const status = await isDeposit.message.status();
        expect(status).eql(ParentToChildMessageStatus.REDEEMED);
      });

      it('compare balances after depositTo', async () => {
        const afterL3DKA = await childProvider.getBalance(destination.address);
        expect(afterL3DKA).eql(beforeL3DKA.add(amount));
      });
    });

    describe('depositTo by depositTo', () => {
      it('depositTo 1 DKA', async () => {
        beforeL3DKA = await childProvider.getBalance(destination.address);

        const res = await dkaBridge.depositTo({
          parentSigner,
          childProvider,
          destinationAddress: destination.address,
          amount: amount,
        });
        receipt = await res.wait();
        expect(receipt.status).eq(1, 'Transaction Status');
      });

      it('Wait for the depositTo message to be delivered to Layer3.', async () => {
        const isDeposit = await receipt.waitForChildTransactionReceipt(childProvider);
        const status = await isDeposit.message.status();
        expect(status).eql(ParentToChildMessageStatus.REDEEMED);
      });

      it('compare balances after depositTo', async () => {
        const afterL3DKA = await childProvider.getBalance(destination.address);
        expect(afterL3DKA).eql(beforeL3DKA.add(amount));
      });
    });
  });

  describe('withdraw 1 DKA', () => {
    const amount = parseEther('1');
    let receipt: ChildTransactionReceipt;
    let beforeL2DKA: BigNumber;

    describe('withdraw by txRequest', () => {
      it('withdraw 1 DKA', async () => {
        beforeL2DKA = await dkaBridge.getParentDkaBalance(parentSigner.address, parentProvider);

        const txRequest = await dkaBridge.getWithdrawalRequest({
          amount,
          destinationAddress: parentSigner.address,
          from: childSigner.address,
        });

        const res = await dkaBridge.withdraw({
          childSigner,
          txRequest: txRequest.txRequest,
          amount,
          destinationAddress: parentSigner.address,
          from: childSigner.address,
        });

        receipt = await res.wait();
        expect(receipt.status).eq(1, 'Transaction Status');
      });

      it('wait for the withdraw message to be delivered to Layer2.', async () => {
        const message = await receipt.getChildToParentMessages(parentProvider);
        const status = await message[0].waitUntilReadyToExecute(childProvider, timeToWaitMs);
        expect(status).eql(ChildToParentMessageStatus.CONFIRMED);
      });

      it('execute outbox for claim ', async () => {
        const message = await receipt.getChildToParentMessages(parentSigner);
        const res = await message[0].execute(childProvider);
        const executeReceipt = await res.wait();
        expect(executeReceipt.status).eq(1, 'Transaction Status');
      });

      it('compare balances after withdraw', async () => {
        const afterL2DKA = await dkaBridge.getParentDkaBalance(
          parentSigner.address,
          parentProvider
        );
        expect(afterL2DKA).eql(beforeL2DKA.add(amount));
      });
    });

    describe('withdraw by withdraw', () => {
      it('withdraw 1 DKA', async () => {
        beforeL2DKA = await dkaBridge.getParentDkaBalance(parentSigner.address, parentProvider);
        const res = await dkaBridge.withdraw({
          childSigner,
          amount,
          destinationAddress: parentSigner.address,
          from: childSigner.address,
        });

        receipt = await res.wait();
        expect(receipt.status).eq(1, 'Transaction Status');
      });

      it('wait for the withdraw message to be delivered to Layer2.', async () => {
        const message = await receipt.getChildToParentMessages(parentProvider);
        const status = await message[0].waitUntilReadyToExecute(childProvider, timeToWaitMs);
        expect(status).eql(ChildToParentMessageStatus.CONFIRMED);
      });

      it('execute outbox for claim ', async () => {
        const message = await receipt.getChildToParentMessages(parentSigner);
        const res = await message[0].execute(childProvider);
        const executeReceipt = await res.wait();
        expect(executeReceipt.status).eq(1, 'Transaction Status');
      });

      it('compare balances after withdraw', async () => {
        const afterL2DKA = await dkaBridge.getParentDkaBalance(
          parentSigner.address,
          parentProvider
        );
        expect(afterL2DKA).eql(beforeL2DKA.add(amount));
      });
    });
  });
});
