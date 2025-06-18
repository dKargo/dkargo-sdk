import { L2Network, getArbitrumNetwork, mapL2NetworkToArbitrumNetwork, registerCustomArbitrumNetwork } from '@arbitrum/sdk';
import { DkargoNetworks, Provider } from '../utils/types';
import { ArbSdkError } from '@arbitrum/sdk/dist/lib/dataEntities/errors';
import {  DKARGO_ANYTRUST_NETWORK } from './networkInfo';

/**
* Storage for all Arbitrum networks, either L2 or L3.
*/
const dkargoToken: {
 [id: string]: string
} = {
  11155111:"0xB55F1261a635919fEEba99e4142608D589d72842",
  1:"0x5dc60C4D5e75D22588FA17fFEB90A63E535efCE0"
}

export const registerSepoliaDkargoNetwork = () => {
  const _network = DKARGO_ANYTRUST_NETWORK

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


export const getDkargoNetwork = async (provider: Provider):Promise<DkargoNetworks> => {
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