import { network } from 'hardhat';
import { execSync } from 'child_process';
import { mapL2NetworkToArbitrumNetwork, registerCustomArbitrumNetwork } from '@arbitrum/sdk';
import { ethers, Wallet } from 'ethers';
import dotenv from 'dotenv';
dotenv.config();

export const timeToWaitMs = 1000 * 60

/**
 * Errors originating in Dkargo SDK Test
 */
export class DkaSdkTestError extends Error {
  constructor(message: string, public readonly inner?: Error) {
    super(message);

    if (inner) {
      this.stack += '\nCaused By: ' + inner.stack;
    }
  }
}

export const resetFork = async (blockNumber: number, jsonRpcUrl: string) => {
  await network.provider.request({
    method: 'hardhat_reset',
    params: [{ forking: { jsonRpcUrl, blockNumber } }],
  });
};

export type IChainName = 'ETH' | 'ARB' | 'DKA';
export const initProviderAndSigner = (chain: IChainName) => {
  const providers = {
    ETH: new ethers.providers.JsonRpcProvider(process.env.ETH_URL),
    ARB: new ethers.providers.JsonRpcProvider(process.env.ARB_URL),
    DKA: new ethers.providers.JsonRpcProvider(process.env.DKA_URL),
  };

  const wallet = process.env.SIGNER_PK_KEY ? new Wallet(process.env.SIGNER_PK_KEY) : Wallet.createRandom();
  const wallets = {
    ETH: wallet.connect(providers['ETH']),
    ARB: wallet.connect(providers['ARB']),
    DKA: wallet.connect(providers['DKA']),
  };

  return {
    provider: providers[chain],
    signer: wallets[chain],
  };
};

/**
 * Register a testnet system contract on the SDK for testing.
 */
export const registerTestNetwork = async () => {
  const l1l2_network = await getLlL2NetworkByDocker();
  const arbNetwork = mapL2NetworkToArbitrumNetwork(l1l2_network.l2Network);  
  registerCustomArbitrumNetwork(arbNetwork);

  const l2l3_network = await getL2L3NetworkByDocker();
  const dkaNetwork = mapL2NetworkToArbitrumNetwork({...l2l3_network.l2Network,nativeToken:l2l3_network.nativeToken});
  registerCustomArbitrumNetwork(dkaNetwork);
};

const getLlL2NetworkByDocker = async () => {
  let l2tokenbridgeVolume = execSync('docker volume ls --filter "name=layer2_l2tokenbridge" --format "{{.Name}}"').toString().trim();

  let deploymentData = JSON.parse(execSync(`docker run --rm -v ${l2tokenbridgeVolume}:/data alpine cat /data/l1l2_network.json`).toString());

  return deploymentData;
};

const getL2L3NetworkByDocker = async () => {
  let l3tokenbridgeVolume = execSync('docker volume ls --filter "name=layer3_l3tokenbridge" --format "{{.Name}}"').toString().trim();

  let deploymentData = JSON.parse(execSync(`docker run --rm -v ${l3tokenbridgeVolume}:/data alpine cat /data/l2l3_network.json `).toString());

  const feeToken = JSON.parse(execSync(`docker run --rm -v ${'layer3_l3config'}:/data alpine cat /data/deployed_l3_chain_info.json `).toString())[0][
    'rollup'
  ]['native-token'];

  if (feeToken == '0x0000000000000000000000000000000000000000' || !feeToken) {
    throw new DkaSdkTestError(`Dkargo L3 Chain network requires fee token`);
  }

  deploymentData['nativeToken'] = feeToken;
  return deploymentData;
};

export function formatTime(date:Date) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}