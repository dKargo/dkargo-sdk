export const DKARGO_MINIMAL_NETWORK = {
  "l1Network": {
    "blockTime": 10,
    "chainID": 421614,
    "explorerUrl": "",
    "isCustom": true,
    "name": "EthLocal",
    "partnerChainIDs": [
      61022448
    ],
    "isArbitrum": false
  },
  "l2Network": {
    "chainID": 61022448,
    "confirmPeriodBlocks": 45818,
    "ethBridge": {
      "bridge": "0x68Cdd5F1D270C2Ea2F309E310E52aC2Ad1e4e780",
      "inbox": "0x1665B82bd0Ac4c7d7e775C97AB87CC6114f823F6",
      "outbox": "0x9123483986DAe5B0C990bb71049342208a616506",
      "rollup": "0xB41a76fc71f83F1dD21c21133c3E55d3fb0E9065",
      "sequencerInbox": "0xd7690cF49bCb1fd321DFB2E056E2C6711eA0995c"
    },
    "explorerUrl": "",
    "isArbitrum": true,
    "isTestnet": true,
    "isCustom": true,
    "name": "ArbLocal",
    "partnerChainID": 421614,
    "retryableLifetimeSeconds": 604800,
    "nitroGenesisBlock": 0,
    "nitroGenesisL1Block": 0,
    "depositTimeout": 900000,
    "tokenBridge": {
      "l1CustomGateway": "0x3861a1352925ba5FEf8fb6fe1770BE744DA44CDB",
      "l1ERC20Gateway": "0x01af335fA63C5647F3A16430c254702c6B1b914C",
      "l1GatewayRouter": "0x6d5452fa328c4640590a5C6351e2D073b5212754",
      "l1MultiCall": "0x47B70A275fE28115e43C67f0dD3681BCCe35b5Bf",
      "l1ProxyAdmin": "0xC98F9D83Ecdaa419a34904F5DB7666a9087f255A",
      "l1Weth": "0x0000000000000000000000000000000000000000",
      "l1WethGateway": "0x0000000000000000000000000000000000000000",
      "l2CustomGateway": "0x9ABB690758c5a9949C7BE0eE0bbb0E1bC3DC1e05",
      "l2ERC20Gateway": "0xE997d8A615E5cCb20dB149ca12773b92776bAD55",
      "l2GatewayRouter": "0xdef00B233e2DEf4C0d8037FdF16ae34fbc6a0Fa6",
      "l2Multicall": "0x484522a06cf68e60b8750272582E0AD70e7DF1b6",
      "l2ProxyAdmin": "0xfA6b06E1879AEcAA6bBF1cE2901a036801d2Df61",
      "l2Weth": "0x0000000000000000000000000000000000000000",
      "l2WethGateway": "0x0000000000000000000000000000000000000000"
    }
  },
  "l1TokenBridgeCreator": "0x553938ab4a8b9A90378aEF80D2D035a69947f3b5",
  "retryableSender": "0x0fE3B8330f253890848764B893530c21E768A798",
  "nativeToken":"0x0fE3B8330f253890848764B893530c21E768A798"
}
