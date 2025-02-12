import { SignerOrProvider } from '@arbitrum/sdk/dist/lib/dataEntities/signerOrProvider';
import { abi } from '@offchainlabs/upgrade-executor/build/contracts/src/UpgradeExecutor.sol/UpgradeExecutor.json';
import { Contract, ethers, Overrides } from 'ethers';

export class UpgradeExecutor {
  private UpgradeExecutor: Contract;
  constructor(address: string, provider: SignerOrProvider) {
    this.UpgradeExecutor = new ethers.Contract(address, abi, provider);
  }

  async execute(target: string, calldata: string, overrides?: Overrides) {
    return await this.UpgradeExecutor.execute(target, calldata, { ...overrides })  as ethers.providers.TransactionResponse;
  }

  async executeCall(target: string, calldata: string, overrides?: Overrides) {
    return await this.UpgradeExecutor.executeCall(target, calldata, { ...overrides })  as ethers.providers.TransactionResponse;
  }

  async getRoleAdmin() {}
}
