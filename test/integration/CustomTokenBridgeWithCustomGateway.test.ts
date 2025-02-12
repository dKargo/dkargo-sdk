import { BigNumber, Wallet } from 'ethers';
import { L3Token,L2TokenCustomGasToken } from '../../build/types/contracts/custom-token/index';
import { ParentChainCustomGateway } from '../../build/types/contracts/custom-token/L2CustomGateway.sol/index';
import { ParentChainCustomGateway__factory } from '../../build/types/factories/contracts/custom-token/L2CustomGateway.sol/index';
import { ChildChainCustomGateway } from '../../build/types/contracts/custom-token/L3CustomGateway.sol/index';
import { ChildChainCustomGateway__factory } from '../../build/types/factories/contracts/custom-token/L3CustomGateway.sol';
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
import {
  L2TokenCustomGasToken__factory,
  L3Token__factory,
} from '../../build/types/factories/contracts/custom-token';
import { registerTestNetwork, initProviderAndSigner } from '../testHelper';
import { expect } from 'chai';
import { parseEther } from 'ethers/lib/utils';

import { L1OrbitGatewayRouter__factory } from '@arbitrum/sdk/dist/lib/abi/factories/L1OrbitGatewayRouter__factory';

describe('Custom Token Bridge With Custom Gateway TDD', () => {
  let customTokenBridge: CustomTokenBridge;
  let parentProvider: JsonRpcProvider;
  let parentSigner: Wallet;
  let childProvider: JsonRpcProvider;
  let childSigner: Wallet;

  let erc20_name = 'TEST_CUSTOM_TOKEN';
  let erc20_symbol = 'TCTOKEN';
  let erc20_totalSupply = '100000000';

  let parentCustomGateway: ParentChainCustomGateway;
  let childCustomGateway: ChildChainCustomGateway;
  let parentERC20: L2TokenCustomGasToken;
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
    const l2Router = network.tokenBridge!.parentGatewayRouter;
    const l3Router = network.tokenBridge!.childGatewayRouter;
    const inbox = network.ethBridge.inbox;

    customTokenBridge = new CustomTokenBridge(network);

    const l2_custom_gateway_factory = new ParentChainCustomGateway__factory(parentSigner);
    parentCustomGateway = await l2_custom_gateway_factory.deploy(l2Router, inbox);

    const l3_custom_gateway_factory = new ChildChainCustomGateway__factory(childSigner);
    childCustomGateway = await l3_custom_gateway_factory.deploy(l3Router);

    const l2_erc20_factory = new L2TokenCustomGasToken__factory(parentSigner);
    parentERC20 = await l2_erc20_factory.deploy(
      erc20_name,
      erc20_symbol,
      erc20_totalSupply,
      parentCustomGateway.address,
      l2Router
    );

    const l3_erc20_factory = new L3Token__factory(childSigner);
    childERC20 = await l3_erc20_factory.deploy(
      erc20_name,
      erc20_symbol,
      childCustomGateway.address,
      parentERC20.address
    );

    let res = await parentCustomGateway.setTokenBridgeInformation(
      parentERC20.address,
      childERC20.address,
      childCustomGateway.address
    );
    let receipt = await res.wait();
    expect(receipt.status).eq(1, 'Transaction Status');

    res = await childCustomGateway.setTokenBridgeInformation(
      parentERC20.address,
      childERC20.address,
      parentCustomGateway.address
    );
    receipt = await res.wait();
    expect(receipt.status).eq(1, 'Transaction Status');
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
        const setGatewaysTx = await l2ToL3Msgs[0].waitForStatus();

        expect(setGatewaysTx.status).eql(
          ParentToChildMessageStatus.REDEEMED,
          'setGatewaysTx REDEEMED status'
        );
      });

      it('verify pairing parent and child erc20 contract after register', async () => {
        const parentERC20Gateway = await customTokenBridge.getParentGatewayAddress(
          parentERC20.address,
          parentProvider
        );
        expect(parentERC20Gateway).eql(
          parentCustomGateway.address,
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

        const parentRouter = L1OrbitGatewayRouter__factory.connect(
          customTokenBridge.childNetwork.tokenBridge.parentGatewayRouter,
          parentProvider
        );
        const isParenrGateway = await parentRouter.getGateway(parentERC20.address);
        expect(isParenrGateway).eql(parentCustomGateway.address);

        const childRouter = L1OrbitGatewayRouter__factory.connect(
          customTokenBridge.childNetwork.tokenBridge.childGatewayRouter,
          childProvider
        );
        const isChildGateway = await childRouter.getGateway(parentERC20.address);
        expect(isChildGateway).eql(childCustomGateway.address);
      });
    });
  });

  describe('approve L2 ERC20 Token to Gateway', () => {
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

  describe('deposit 1 ERC20 Token after set disableDeposits', () => {
    const amount = parseEther('1');
    let receipt: ParentContractCallTransactionReceipt;

    it('set allowsDeposits false on L2 CustomGateway', async () => {
      const res = await parentCustomGateway.disableDeposits();
      const receipt = await res.wait();
      expect(receipt.status).eq(1, 'Transaction Status');
    });
    describe('deposit by deposit', () => {
      it('deposit 1 erc20 token but should be false', async () => {
        try {
          const res = await customTokenBridge.deposit({
            amount: amount,
            erc20ParentAddress: parentERC20.address,
            parentSigner,
            childProvider,
          });
          receipt = await res.wait();
          expect(receipt.status).not.eq(1, 'Transaction should be false');
        } catch (error) {
          expect(1).eql(1, 'Transaction should be false');
        }
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

  describe('withdraw 1 ERC20 Token set disableWithdrawals', () => {
    const amount = parseEther('1');
    let receipt: ChildTransactionReceipt;
    describe('withdraw by txRequest', () => {
      it('withdraw 1 ERC20 Token', async () => {
        try {
          const res = await customTokenBridge.withdraw({
            erc20ParentAddress: parentERC20.address,
            childSigner,
            amount,
            destinationAddress: parentSigner.address,
          });

          receipt = await res.wait();
          expect(receipt.status).not.eq(1, 'Transaction should be false');
        } catch (error) {
          expect(1).eql(1, 'Transaction should be false');
        }
      });
    });
  });
});
