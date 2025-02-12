import { HardhatUserConfig } from 'hardhat/config';
import "@nomiclabs/hardhat-ethers"
import "@nomicfoundation/hardhat-network-helpers"
import '@typechain/hardhat'

// import { TEST1_PK, TEST2_PK } from './test/testHelper';
// import dotenv from 'dotenv'
// dotenv.config()

const config: HardhatUserConfig = {
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {
      forking: {
        url: "http://localhost:8547",
      },
      accounts: [
        {
          privateKey: '0xd1999b5fe2010a237b344441460124a327ed27829353909008f95378035c37bc',
          balance: '1000000000000000000000',
        },
        {
          privateKey: '0xde65fa681f9ddb72e378efb20df17081d2ff44831bd65d09bd4a03745b964434',
          balance: '1000000000000000000000',
        },
      ],
    },
  },
  paths: {
    artifacts: 'build/contracts',
  },
  solidity: {
    compilers: [
      {
        version: '0.8.20',
        settings: {},
      },
      {
        version: '0.8.16',
        settings: {},
      },
      {
        version: '0.8.9',
        settings: {},
      },
      {
        version: '0.7.2',
        settings: {},
      },
      {
        version: '0.6.12',
        settings: {},
      },
      {
        version: '0.6.11',
        settings: {},
      },
      {
        version: '0.4.22',
        settings: {},
      },
    ],
  },
  typechain: {
    outDir: 'build/types',
    target: 'ethers-v5',
  },
};

export default config;
