import { BigNumber, Wallet } from 'ethers';
import {
  ChildToParentMessageStatus,
  ChildTransactionReceipt,
  CustomTokenBridge,
  getArbitrumNetwork,
  MAX_APPROVAL,
  ParentContractCallTransactionReceipt,
  ParentToChildMessageStatus,
  ParentTransactionReceipt,
} from '../../src';
import { JsonRpcProvider } from '../../src/libs/utils/types';
import { registerTestNetwork, initProviderAndSigner } from '../testHelper';
import {
  L2TokenCustomGas__factory,
  L3Token__factory,
} from '../../build/types/factories/contracts/generic-custom-token/index';
import { L2TokenCustomGas, L3Token } from '../../build/types/contracts/generic-custom-token/index';
import { expect } from 'chai';
import { parseEther } from 'ethers/lib/utils';

describe('Custom Token Bridge TDD', () => {
  let customTokenBridge: CustomTokenBridge;
  let parentProvider: JsonRpcProvider;
  let parentSigner: Wallet;
  let childProvider: JsonRpcProvider;
  let childSigner: Wallet;

  let erc20_name = 'TEST_CUSTOM_TOKEN';
  let erc20_symbol = 'TCTOKEN';
  let erc20_totalSupply = '100000000';

  let parentERC20: L2TokenCustomGas;
  let childERC20: L3Token;
  before('register system contract address', async () => {
    await registerTestNetwork();
    const { provider: _parentProvider, signer: _parentSigner } = initProviderAndSigner('ARB');
    const { provider: _childProvider, signer: _childSigner } = initProviderAndSigner('DKA');

    parentProvider = _parentProvider;
    parentSigner = _parentSigner;
    childProvider = _childProvider;
    childSigner = _childSigner;

    const network = await getArbitrumNetwork(childProvider);
    const l2Gateway = network.tokenBridge!.parentCustomGateway;
    const l3Gateway = network.tokenBridge!.childCustomGateway;
    const l2Router = network.tokenBridge!.parentGatewayRouter;

    customTokenBridge = new CustomTokenBridge(network);

    const l2_erc20_factory = new L2TokenCustomGas__factory(parentSigner);
    parentERC20 = await l2_erc20_factory.deploy(
      erc20_name,
      erc20_symbol,
      erc20_totalSupply,
      l2Gateway,
      l2Router
    );

    const l3_erc20_factory = new L3Token__factory(childSigner);
    childERC20 = await l3_erc20_factory.deploy(
      erc20_name,
      erc20_symbol,
      l3Gateway,
      parentERC20.address
    );
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
    it('Verify L3 ERC20 Metadata', async () => {
      const name = await childERC20.name();
      const symbol = await childERC20.symbol();
      const total = await childERC20.totalSupply();
      expect(name).eql(erc20_name, 'Token name');
      expect(symbol).eql(erc20_symbol, 'Token symbol');
      expect(total).eql(parseEther('0'), 'Token total supply');
    });
  });

  describe('register erc20 contract', () => {
    describe('approve gas token for register', async () => {
      it('approve Gas Token txRequest 1 ether amount to parent erc20 token contract ', async () => {
        const amount = parseEther('1');
        const txRequest = customTokenBridge.getApproveGasTokenForCustomTokenRegistrationRequest({
          erc20ParentAddress: parentERC20.address,
          parentProvider,
          amount,
        });
        const res = await customTokenBridge.approveGasTokenForCustomTokenRegistration({
          txRequest,
          parentSigner,
          amount,
        });
        const receipt = await res.wait();
        expect(receipt.status).eq(1, 'Transaction Status');
        const allowance = await customTokenBridge.allowanceGasTokenToParentERC20(
          parentERC20.address,
          parentSigner.address,
          parentProvider
        );
        expect(allowance).eql(amount);
      });

      it('approve Gas Token txRequest MAX amount to parent erc20 token contract ', async () => {
        const txRequest = customTokenBridge.getApproveGasTokenForCustomTokenRegistrationRequest({
          erc20ParentAddress: parentERC20.address,
          parentProvider,
        });
        const res = await customTokenBridge.approveGasTokenForCustomTokenRegistration({
          txRequest,
          parentSigner,
        });
        const receipt = await res.wait();
        expect(receipt.status).eq(1, 'Transaction Status');
        const allowance = await customTokenBridge.allowanceGasTokenToParentERC20(
          parentERC20.address,
          parentSigner.address,
          parentProvider
        );
        expect(allowance).eql(MAX_APPROVAL);
      });

      it('approve Gas Token 1 ether amount to parent erc20 token contract ', async () => {
        const amount = parseEther('1');
        const res = await customTokenBridge.approveGasTokenForCustomTokenRegistration({
          erc20ParentAddress: parentERC20.address,
          parentSigner,
          amount,
        });
        const receipt = await res.wait();
        expect(receipt.status).eq(1, 'Transaction Status');
        const allowance = await customTokenBridge.allowanceGasTokenToParentERC20(
          parentERC20.address,
          parentSigner.address,
          parentProvider
        );
        expect(allowance).eql(amount);
      });

      it('approve Gas Token MAX amount to parent erc20 token contract ', async () => {
        const res = await customTokenBridge.approveGasTokenForCustomTokenRegistration({
          erc20ParentAddress: parentERC20.address,
          parentSigner,
        });

        const receipt = await res.wait();
        expect(receipt.status).eq(1, 'Transaction Status');
        const allowance = await customTokenBridge.allowanceGasTokenToParentERC20(
          parentERC20.address,
          parentSigner.address,
          parentProvider
        );
        expect(allowance).eql(MAX_APPROVAL);
      });
    });

    describe('Registering custom token on L2', () => {
      let receipt: ParentTransactionReceipt;
      it('verify pairing parent and child erc20 contract before register', async () => {
        const standardGateway = customTokenBridge.childNetwork.tokenBridge.parentErc20Gateway;
        const parentERC20Gateway = await customTokenBridge.getParentGatewayAddress(
          parentERC20.address,
          parentProvider
        );
        expect(parentERC20Gateway).eql(standardGateway, 'default gateway is StandardGateway');

        const childErc20Address = await customTokenBridge.getChildErc20Address(
          parentERC20.address,
          parentProvider
        );
        expect(childErc20Address).not.eql(
          childERC20.address,
          'default childERC20 is deterministic-CREATE2'
        );
      });

      it('registering custom token', async () => {
        const res = await customTokenBridge.registerCustomToken(
          parentERC20.address,
          childERC20.address,
          parentSigner,
          childProvider
        );
        receipt = await res.wait();
        expect(receipt.status).eq(1, 'Transaction Status');
      });

      it('wait for the register message to be delivered to Layer3.', async () => {
        const l2ToL3Msgs = await receipt.getParentToChildMessages(childProvider);
        const setTokenTx = await l2ToL3Msgs[0].waitForStatus();
        const setGatewaysTx = await l2ToL3Msgs[1].waitForStatus();
        expect(setTokenTx.status).eql(
          ParentToChildMessageStatus.REDEEMED,
          'setTokenTx REDEEMED status'
        );
        expect(setGatewaysTx.status).eql(
          ParentToChildMessageStatus.REDEEMED,
          'setGatewaysTx REDEEMED status'
        );
      });

      it('verify pairing parent and child erc20 contract after register', async () => {
        const parentCustomGateway = customTokenBridge.childNetwork.tokenBridge.parentCustomGateway;
        const parentERC20Gateway = await customTokenBridge.getParentGatewayAddress(
          parentERC20.address,
          parentProvider
        );
        expect(parentERC20Gateway).eql(
          parentCustomGateway,
          'after register gateway is CustomGateway'
        );

        const childErc20Address = await customTokenBridge.getChildErc20Address(
          parentERC20.address,
          parentProvider
        );
        expect(childErc20Address).eql(
          childERC20.address,
          'after reguster childERC20 is you registered'
        );
      });
    });
  });

  describe('approve L2 ERC20 Token to Gateway', () => {
    it('approve txRequest 1 ether amount to gateway', async () => {
      const amount = parseEther('1');
      const txRequest = await customTokenBridge.getApproveTokenRequest({
        erc20ParentAddress: parentERC20.address,
        parentProvider,
        amount,
      });
      const res = await customTokenBridge.approveToken({ txRequest, parentSigner });
      const receipt = await res.wait();
      expect(receipt.status).eq(1, 'Transaction Status');

      const allowance = await customTokenBridge.allowanceTokenToGateway(
        parentERC20.address,
        parentSigner.address,
        parentProvider
      );
      expect(allowance).eql(amount);
    });

    it('approve txRequest MAX amount to gateway', async () => {
      const txRequest = await customTokenBridge.getApproveTokenRequest({
        erc20ParentAddress: parentERC20.address,
        parentProvider,
      });
      const res = await customTokenBridge.approveToken({ txRequest, parentSigner });
      const receipt = await res.wait();
      expect(receipt.status).eq(1, 'Transaction Status');

      const allowance = await customTokenBridge.allowanceTokenToGateway(
        parentERC20.address,
        parentSigner.address,
        parentProvider
      );
      expect(allowance).eql(MAX_APPROVAL);
    });

    it('approve 1 ether amount to gateway', async () => {
      const amount = parseEther('1');

      const res = await customTokenBridge.approveToken({
        erc20ParentAddress: parentERC20.address,
        parentSigner,
        amount,
      });
      const receipt = await res.wait();
      expect(receipt.status).eq(1, 'Transaction Status');

      const allowance = await customTokenBridge.allowanceTokenToGateway(
        parentERC20.address,
        parentSigner.address,
        parentProvider
      );
      expect(allowance).eql(amount);
    });

    it('approve MAX ether amount to gateway', async () => {
      const res = await customTokenBridge.approveToken({
        erc20ParentAddress: parentERC20.address,
        parentSigner,
      });
      const receipt = await res.wait();
      expect(receipt.status).eq(1, 'Transaction Status');

      const allowance = await customTokenBridge.allowanceTokenToGateway(
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
      const txRequest = await customTokenBridge.getApproveGasTokenRequest({
        erc20ParentAddress: parentERC20.address,
        parentProvider,
        amount,
      });
      const res = await customTokenBridge.approveGasToken({ txRequest, parentSigner });
      const receipt = await res.wait();
      expect(receipt.status).eq(1, 'Transaction Status');

      const allowance = await customTokenBridge.allowanceGasTokenToGateway(
        parentERC20.address,
        parentSigner.address,
        parentProvider
      );
      expect(allowance).eql(amount);
    });

    it('approve txRequest MAX amount to gateway', async () => {
      const txRequest = await customTokenBridge.getApproveGasTokenRequest({
        erc20ParentAddress: parentERC20.address,
        parentProvider,
      });
      const res = await customTokenBridge.approveGasToken({ txRequest, parentSigner });
      const receipt = await res.wait();
      expect(receipt.status).eq(1, 'Transaction Status');

      const allowance = await customTokenBridge.allowanceGasTokenToGateway(
        parentERC20.address,
        parentSigner.address,
        parentProvider
      );
      expect(allowance).eql(MAX_APPROVAL);
    });

    it('approve 1 ether amount to gateway', async () => {
      const amount = parseEther('1');

      const res = await customTokenBridge.approveGasToken({
        erc20ParentAddress: parentERC20.address,
        parentSigner,
        amount,
      });
      const receipt = await res.wait();
      expect(receipt.status).eq(1, 'Transaction Status');

      const allowance = await customTokenBridge.allowanceGasTokenToGateway(
        parentERC20.address,
        parentSigner.address,
        parentProvider
      );
      expect(allowance).eql(amount);
    });

    it('approve MAX ether amount to gateway', async () => {
      const res = await customTokenBridge.approveGasToken({
        erc20ParentAddress: parentERC20.address,
        parentSigner,
      });
      const receipt = await res.wait();
      expect(receipt.status).eq(1, 'Transaction Status');

      const allowance = await customTokenBridge.allowanceGasTokenToGateway(
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

    describe('deposit by txRequest', () => {
      it('deposit 1 ERC20 Token', async () => {
        const amount = parseEther('1');
        const txRequest = await customTokenBridge.getDepositRequest({
          erc20ParentAddress: parentERC20.address,
          amount,
          from: parentSigner.address,
          parentProvider,
          childProvider,
        });

        const res = await customTokenBridge.deposit({
          txRequest: txRequest.txRequest,
          amount,
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

        const res = await customTokenBridge.deposit({
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
        expect(afterL3DKA).eql(beforeL3ERC20Token.add(amount));
      });
    });
  });

  describe('withdraw 1 ERC20 Token', () => {
    const amount = parseEther('1');
    let receipt: ChildTransactionReceipt;
    let beforeL2ERC20: BigNumber;
    before('record L2 ERC20 balance', async () => {
      beforeL2ERC20 = await customTokenBridge.getParentErc20Balance(
        parentERC20.address,
        parentSigner.address,
        parentProvider
      );
    });

    describe('withdraw by txRequest', () => {
      it('withdraw 1 ERC20 Token', async () => {
        const txRequest = await customTokenBridge.getWithdrawalRequest({
          erc20ParentAddress: parentERC20.address,
          amount,
          destinationAddress: parentSigner.address,
          from: childSigner.address,
        });

        const res = await customTokenBridge.withdraw({
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
        const afterL2DKA = await customTokenBridge.getParentErc20Balance(
          parentERC20.address,
          parentSigner.address,
          parentProvider
        );
        expect(afterL2DKA).eql(beforeL2ERC20.add(amount));
      });
    });
  });
});
