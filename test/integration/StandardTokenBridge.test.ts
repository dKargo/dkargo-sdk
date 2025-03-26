import { BigNumber, Wallet } from 'ethers';
import {
  ChildToParentMessageStatus,
  ChildTransactionReceipt,
  getArbitrumNetwork,
  L2GatewayToken,
  MAX_APPROVAL,
  ParentContractCallTransactionReceipt,
  ParentToChildMessageStatus,
  TokenBridge,
} from '../../src';
import { JsonRpcProvider } from '../../src/libs/utils/types';
import { registerTestNetwork, initProviderAndSigner } from '../testHelper';
import { ERC20Token__factory } from '../../build/types/factories/contracts/standard-token/Standard.sol/index';
import { ERC20Token } from '../../build/types/contracts/standard-token/Standard.sol/ERC20Token';
import { parseEther } from 'ethers/lib/utils';
import { expect } from 'chai';

describe('L2 <-> L3 ERC20 Token Bridge', () => {
  let tokenBridge: TokenBridge;
  let parentProvider: JsonRpcProvider;
  let parentSigner: Wallet;
  let childProvider: JsonRpcProvider;
  let childSigner: Wallet;

  let erc20_name = 'TEST_TOKEN';
  let erc20_symbol = 'TTOKEN';
  let erc20_totalSupply = '100000000';
  let parentERC20: ERC20Token;
  let childERC20: L2GatewayToken;

  before('register system contract address', async () => {
    await registerTestNetwork();
    const { provider: _parentProvider, signer: _parentSigner } = initProviderAndSigner('ARB');
    const { provider: _childProvider, signer: _childSigner } = initProviderAndSigner('DKA');

    parentProvider = _parentProvider;
    parentSigner = _parentSigner;
    childProvider = _childProvider;
    childSigner = _childSigner;

    const network = await getArbitrumNetwork(childProvider);
    tokenBridge = new TokenBridge(network);

    const erc20_factory = new ERC20Token__factory(_parentSigner);
    parentERC20 = await erc20_factory.deploy(erc20_name, erc20_symbol, erc20_totalSupply);

    const childERC20Address = await tokenBridge.getChildErc20Address(
      parentERC20.address,
      parentProvider
    );
    childERC20 = tokenBridge.getChildTokenContract(childProvider, childERC20Address);
  });

  describe('verify L2 ERC20 Contract', () => {
    it('Verify L2 ERC20 Metadata', async () => {
      const name = await parentERC20.name();
      const symbol = await parentERC20.symbol();
      const total = await parentERC20.totalSupply();
      expect(name).eql(erc20_name, 'Token name');
      expect(symbol).eql(erc20_symbol, 'Token symbol');
      expect(total).eql(parseEther(erc20_totalSupply), 'Token total supply');
    });
  });

  describe('approve L2 ERC20 Token to Gateway', () => {
    it('approve txRequest 1 ether amount to gateway', async () => {
      const amount = parseEther('1');
      const txRequest = await tokenBridge.getApproveTokenRequest({
        erc20ParentAddress: parentERC20.address,
        parentProvider,
        amount,
      });
      const res = await tokenBridge.approveToken({ txRequest, parentSigner });
      const receipt = await res.wait();
      expect(receipt.status).eq(1, 'Transaction Status');

      const allowance = await tokenBridge.allowanceTokenToGateway(
        parentERC20.address,
        parentSigner.address,
        parentProvider
      );
      expect(allowance).eql(amount);
    });

    it('approve txRequest MAX amount to gateway', async () => {
      const txRequest = await tokenBridge.getApproveTokenRequest({
        erc20ParentAddress: parentERC20.address,
        parentProvider,
      });
      const res = await tokenBridge.approveToken({ txRequest, parentSigner });
      const receipt = await res.wait();
      expect(receipt.status).eq(1, 'Transaction Status');

      const allowance = await tokenBridge.allowanceTokenToGateway(
        parentERC20.address,
        parentSigner.address,
        parentProvider
      );
      expect(allowance).eql(MAX_APPROVAL);
    });

    it('approve 1 ether amount to gateway', async () => {
      const amount = parseEther('1');

      const res = await tokenBridge.approveToken({
        erc20ParentAddress: parentERC20.address,
        parentSigner,
        amount,
      });
      const receipt = await res.wait();
      expect(receipt.status).eq(1, 'Transaction Status');

      const allowance = await tokenBridge.allowanceTokenToGateway(
        parentERC20.address,
        parentSigner.address,
        parentProvider
      );
      expect(allowance).eql(amount);
    });

    it('approve MAX ether amount to gateway', async () => {
      const res = await tokenBridge.approveToken({
        erc20ParentAddress: parentERC20.address,
        parentSigner,
      });
      const receipt = await res.wait();
      expect(receipt.status).eq(1, 'Transaction Status');

      const allowance = await tokenBridge.allowanceTokenToGateway(
        parentERC20.address,
        parentSigner.address,
        parentProvider
      );
      expect(allowance).eql(MAX_APPROVAL);
    });
  });

  describe('approve GasToken(L2 ERC20 DKA Token) to Gateway', () => {
    it('approve txRequest 1 ether amount to gateway', async () => {
      const amount = parseEther('1');
      const txRequest = await tokenBridge.getApproveGasTokenRequest({
        erc20ParentAddress: parentERC20.address,
        parentProvider,
        amount,
      });
      const res = await tokenBridge.approveGasToken({ txRequest, parentSigner });
      const receipt = await res.wait();
      expect(receipt.status).eq(1, 'Transaction Status');

      const allowance = await tokenBridge.allowanceGasTokenToGateway(
        parentERC20.address,
        parentSigner.address,
        parentProvider
      );
      expect(allowance).eql(amount);
    });

    it('approve txRequest MAX amount to gateway', async () => {
      const txRequest = await tokenBridge.getApproveGasTokenRequest({
        erc20ParentAddress: parentERC20.address,
        parentProvider,
      });
      const res = await tokenBridge.approveGasToken({ txRequest, parentSigner });
      const receipt = await res.wait();
      expect(receipt.status).eq(1, 'Transaction Status');

      const allowance = await tokenBridge.allowanceGasTokenToGateway(
        parentERC20.address,
        parentSigner.address,
        parentProvider
      );
      expect(allowance).eql(MAX_APPROVAL);
    });

    it('approve 1 ether amount to gateway', async () => {
      const amount = parseEther('1');

      const res = await tokenBridge.approveGasToken({
        erc20ParentAddress: parentERC20.address,
        parentSigner,
        amount,
      });
      const receipt = await res.wait();
      expect(receipt.status).eq(1, 'Transaction Status');

      const allowance = await tokenBridge.allowanceGasTokenToGateway(
        parentERC20.address,
        parentSigner.address,
        parentProvider
      );
      expect(allowance).eql(amount);
    });

    it('approve MAX ether amount to gateway', async () => {
      const res = await tokenBridge.approveGasToken({
        erc20ParentAddress: parentERC20.address,
        parentSigner,
      });
      const receipt = await res.wait();
      expect(receipt.status).eq(1, 'Transaction Status');

      const allowance = await tokenBridge.allowanceGasTokenToGateway(
        parentERC20.address,
        parentSigner.address,
        parentProvider
      );
      expect(allowance).eql(MAX_APPROVAL);
    });
  });

  describe('deposit 1 ERC20 Token', () => {
    const amount = parseEther('1');
    let receipt: ParentContractCallTransactionReceipt;
    let beforeL3ERC20Token: BigNumber;

    describe('verify L3 ERC20 Token contract before deposit', () => {
      it("If it's before the deposit, the child contract should not be deployed.", async () => {
        const code = await childProvider.getCode(childERC20.address);
        expect(code).eql('0x', 'verify child contract code');
      });
    });

    describe('deposit by txRequest', () => {
      it('deposit 1 ERC20 Token', async () => {
        const amount = parseEther('1');
        const txRequest = await tokenBridge.getDepositRequest({
          erc20ParentAddress: parentERC20.address,
          amount,
          from: parentSigner.address,
          parentProvider,
          childProvider,
        });

        const res = await tokenBridge.deposit({
          txRequest: txRequest.txRequest,
          amount: amount,
          erc20ParentAddress: parentERC20.address,
          parentSigner,
          childProvider,
        });
        receipt = await res.wait();
        expect(receipt.status).eq(1, 'Transaction Status');
      });

      it('Wait for the deposit message to be delivered to Layer3.', async () => {
        const isDeposit = await receipt.waitForChildTransactionReceipt(childProvider);
        const status = await isDeposit.message.status();
        expect(status).eql(ParentToChildMessageStatus.REDEEMED);
      });

      it('compare balances after deposit', async () => {
        const afterL3DKA = await childERC20.balanceOf(childSigner.address);
        expect(afterL3DKA).eql(amount);
      });
    });

    describe('deposit by deposit', () => {
      it('deposit 1 DKA', async () => {
        beforeL3ERC20Token = await childERC20.balanceOf(childSigner.address);

        const res = await tokenBridge.deposit({
          amount: amount,
          erc20ParentAddress: parentERC20.address,
          parentSigner,
          childProvider,
        });
        receipt = await res.wait();
        expect(receipt.status).eq(1, 'Transaction Status');
      });
      it('Wait for the deposit message to be delivered to Layer3.', async () => {
        const isDeposit = await receipt.waitForChildTransactionReceipt(childProvider);

        const depositTx = await receipt.getParentToChildMessages(childProvider)
        console.log(depositTx[0].retryableCreationId);
        
        const status = await isDeposit.message.status();
        expect(status).eql(ParentToChildMessageStatus.REDEEMED);
      });

      it('compare balances after deposit', async () => {
        const afterL3DKA = await childERC20.balanceOf(childSigner.address);
        expect(afterL3DKA).eql(beforeL3ERC20Token.add(amount));
      });
    });
  });

  describe('verify L3 ERC20 Contract', () => {
    it('Verify L3 ERC20 Metadata', async () => {
      const name = await childERC20.name();
      const symbol = await childERC20.symbol();
      const total = await childERC20.totalSupply();
      expect(name).eql(erc20_name, 'Token name');
      expect(symbol).eql(erc20_symbol, 'Token symbol');
    });
  });

  describe('withdraw 1 ERC20 Token', () => {
    const amount = parseEther('1');
    let receipt: ChildTransactionReceipt;
    let beforeL2ERC20: BigNumber;
    before('record L2 ERC20 balance', async () => {
      beforeL2ERC20 = await tokenBridge.getParentErc20Balance(
        parentERC20.address,
        parentSigner.address,
        parentProvider
      );
    });

    describe('withdraw by txRequest', () => {
      it('withdraw 1 ERC20 Token', async () => {
        const txRequest = await tokenBridge.getWithdrawalRequest({
          erc20ParentAddress: parentERC20.address,
          amount,
          destinationAddress: parentSigner.address,
          from: childSigner.address,
        });

        const res = await tokenBridge.withdraw({
          erc20ParentAddress: parentERC20.address,
          childSigner,
          txRequest: txRequest.txRequest,
          amount,
          destinationAddress: parentSigner.address,
        });

        receipt = await res.wait();
        expect(receipt.status).eq(1, 'Transaction Status');
      });

      it('wait for the withdraw message to be delivered to Layer2.', async () => {
        const message = await receipt.getChildToParentMessages(parentProvider);
        const status = await message[0].waitUntilReadyToExecute(childProvider);
        expect(status).eql(ChildToParentMessageStatus.CONFIRMED);
      });

      it('execute outbox for claim ', async () => {
        const message = await receipt.getChildToParentMessages(parentSigner);
        const res = await message[0].execute(childProvider);
        const executeReceipt = await res.wait();
        expect(executeReceipt.status).eq(1, 'Transaction Status');
      });

      it('compare balances after withdraw', async () => {
        const afterL2DKA = await tokenBridge.getParentErc20Balance(
          parentERC20.address,
          parentSigner.address,
          parentProvider
        );
        expect(afterL2DKA).eql(beforeL2ERC20.add(amount));
      });
    });
  });
});
