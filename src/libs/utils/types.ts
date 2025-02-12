import { ArbitrumNetwork } from "@arbitrum/sdk";
import { SignerOrProvider } from "@arbitrum/sdk/dist/lib/dataEntities/signerOrProvider";
import { BigNumber, ethers } from "ethers";


export type NetworkProviders = {
    dkargoProvider:ethers.providers.JsonRpcProvider | string,
    arbitrumProvider:ethers.providers.JsonRpcProvider | string,
}


export type DkargoNetworks = Omit<ArbitrumNetwork, 'nativeToken'> & {
    nativeToken: string;
};

// TODO `undefind`는 Mainnet 또는 특정 네트워크 Sys Contract 주소 설정
export type NetworkInfoType = DkargoNetworks | 'private'

export type JsonRpcProvider = ethers.providers.JsonRpcProvider
export type Provider = ethers.providers.Provider

export type WithdrawParams = {
    amount: BigNumber;
    destinationAddress: string;
  }
  