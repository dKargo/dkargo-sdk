import { L2Network, getArbitrumNetwork, mapL2NetworkToArbitrumNetwork, registerCustomArbitrumNetwork } from '@arbitrum/sdk';
import { DkargoNetworks, Provider } from '../utils/types';
import { ArbSdkError } from '@arbitrum/sdk/dist/lib/dataEntities/errors';
import {  DKARGO_MINIMAL_NETWORK } from './networkInfo';

/**
* Storage for all Arbitrum networks, either L2 or L3.
*/
const dkargoToken: {
 [id: string]: string
} = {
  11155111:"0x3fc9db68F6c09089C25E2482A924c9B5C5996C46",
  1:"0x5dc60C4D5e75D22588FA17fFEB90A63E535efCE0"
}

export const registerSepoliaDkargoNetwork = () => {
  const _network = DKARGO_MINIMAL_NETWORK

  const dkargoNetwork = mapL2NetworkToArbitrumNetwork({
    ..._network.l2Network,
    nativeToken: _network.nativeToken,
  }); // map v3 -> v4

  return registerCustomArbitrumNetwork(dkargoNetwork) as DkargoNetworks;
};


export const registerEthDakERC20 = (chainId:number|string,tokenAddress:string) => {
  dkargoToken[chainId]=tokenAddress
}

export const registerDkargoNetworkInfo = (network: DkargoNetworks) => {
  return registerCustomArbitrumNetwork(network) as DkargoNetworks;
};


export const getDkargoNetworkInfo = async (provider: Provider):Promise<DkargoNetworks> => {
  const network = await getArbitrumNetwork(provider);
  if(!network.nativeToken) {
    throw new ArbSdkError("Not Dkargo Network")
  }
  return network as DkargoNetworks
};

export const getEthDkaERC20 = async (provider: Provider) => {
  const { chainId } = await provider.getNetwork()
  const registerdChainId = Object.keys(dkargoToken).find(n => n === chainId.toString(10))

  if (!registerdChainId) {
    throw new ArbSdkError(`Unrecognized ethDka ERC20 ${chainId}.`)
  }
  
  return dkargoToken[registerdChainId]
}


/**
 * Init Load
 */
registerSepoliaDkargoNetwork()