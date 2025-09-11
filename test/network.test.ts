import { ethers } from 'ethers';
import { getArbitrumNetwork } from '../src';
import { expect } from 'chai';

describe('Get Network Info', () => {
  it('get warehouse(testnet) network info', async () => {
    const parentProvider = new ethers.providers.JsonRpcProvider('https://rpc.warehouse.dkargo.io');
    const network = await getArbitrumNetwork(parentProvider);

    expect(network.chainId).eql(61022448);
  });
  it('get dKargo(mainnet) network info', async () => {
    const parentProvider = new ethers.providers.JsonRpcProvider('https://mainnet-rpc.dkargo.io');
    const network = await getArbitrumNetwork(parentProvider);    
    expect(network.chainId).eql(61022894);
  });
});
