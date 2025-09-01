export const DKARGO_TESTNET_NETWORK = {
  "l1Network": {
    "blockTime": 10,
    "chainID": 421614,
    "explorerUrl": "",
    "isCustom": true,
    "name": "dKargo-warehouse",
    "partnerChainIDs": [
      61022448
    ],
    "isArbitrum": false
  },
  "l2Network": {
    "chainID": 61022448,
    "confirmPeriodBlocks": 45818,
    "ethBridge": {
      "bridge": "0xC7e932238A2d9fccFa33FF5e8Deed966F0460Ea7",
      "inbox": "0xaecdEd066B62712Ad6Ce7F65E00571F8991b8642",
      "outbox": "0x149607bCbcCDBB39f76e19943a6d150E2a2f66a2",
      "rollup": "0xe66eBA4f90911fd14B2183b1EF0e9636Bbda1e0e",
      "sequencerInbox": "0xCEcDd6E3ff446BB9D0bef548B1F481bc09202885"
    },
    "explorerUrl": "",
    "isArbitrum": true,
    "isTestnet": true,
    "isCustom": true,
    "name": "warehouse",
    "partnerChainID": 421614,
    "retryableLifetimeSeconds": 604800,
    "nitroGenesisBlock": 0,
    "nitroGenesisL1Block": 0,
    "depositTimeout": 900000,
    "tokenBridge": {
      "l1CustomGateway": "0x203F2BA85b3ea74d68642D89143174D3dFbEf971",
      "l1ERC20Gateway": "0x95F29bAE1Fb7e9FB5F85C22666550c541F426dA7",
      "l1GatewayRouter": "0x97EA4122cf29525bD0cF7B49700478fE4A914249",
      "l1MultiCall": "0xce1CAd780c529e66e3aa6D952a1ED9A6447791c1",
      "l1ProxyAdmin": "0x66adb680E5a4f1a83796044490342D9832b43228",
      "l1Weth": "0x0000000000000000000000000000000000000000",
      "l1WethGateway": "0x0000000000000000000000000000000000000000",
      "l2CustomGateway": "0x57afe9E80bb837D91C7E871bF68e68142A4Ea0d2",
      "l2ERC20Gateway": "0xD9B2b6A1D61140A24b6E9a1dA9B836A8B73e4cE8",
      "l2GatewayRouter": "0xaaa492673Ea2E1A881Edd34446de425ffe6B23BF",
      "l2Multicall": "0xb5138E24231Bd50367Ef37a476630c42550e9E37",
      "l2ProxyAdmin": "0xF78D7032E6e24B54159Ea3365e82B0abe399567d",
      "l2Weth": "0x0000000000000000000000000000000000000000",
      "l2WethGateway": "0x0000000000000000000000000000000000000000"
    },
  },
  "nativeToken":"0x6d9c6F7445C4D3a8fa3fC269f020e12eBF3ACD66",
}

export const DKARGO_MAINNET_NETWORK = {
  "l1Network": {
    "blockTime": 10,
    "chainID": 42161,
    "explorerUrl": "",
    "isCustom": true,
    "name": "dKargo",
    "partnerChainIDs": [
      61022894
    ],
    "isArbitrum": true
  },
  "l2Network": {
    "chainID": 61022894,
    "confirmPeriodBlocks": 50400,
    "ethBridge": {
      "bridge": "0x42C4b496edA79215872De91f71D77F434098e162",
      "inbox": "0xB17a5495FA25FBcA887083b7048Bc60A796A201B",
      "outbox": "0x947fe294C167A6e9b7bc5c328AeF0aCe9ac83584",
      "rollup": "0x11e3D0e9604a0AD8a8B32068B95e83d7C63b3af7",
      "sequencerInbox": "0x48781bAec9B5f9eBCf6fd96134f24231c6987Aa0"
    },
    "explorerUrl": "",
    "isArbitrum": true,
    "isTestnet": false,
    "isCustom": true,
    "name": "dKargo",
    "partnerChainID": 421614,
    "retryableLifetimeSeconds": 604800,
    "nitroGenesisBlock": 0,
    "nitroGenesisL1Block": 0,
    "depositTimeout": 900000,
    "tokenBridge": {
      "l1CustomGateway": "0x03141af6d5ca65E8D3Ee5CbC17f9ff26D81D47E3",
      "l1ERC20Gateway": "0x306485BFA7c6c0b533A9Bd3C3B363bE848c7A289",
      "l1GatewayRouter": "0xcF6298ca74B278e5CB02B75f100D766BDfAC11A2",
      "l1MultiCall": "0x90B02D9F861017844F30dFbdF725b6aa84E63822",
      "l1ProxyAdmin": "0x2582E771BC50f6273b17349780d3f8eB98A2b143",
      "l1Weth": "0x0000000000000000000000000000000000000000",
      "l1WethGateway": "0x0000000000000000000000000000000000000000",
      "l2CustomGateway": "0xd8a9B86bBcd534C69CE1DcdeC7B463BfE0378526",
      "l2ERC20Gateway": "0xE400CAeDEf6F46E6C9aF10324F2C308363A1e246",
      "l2GatewayRouter": "0x8e7f3c9a7743a673C2395eD58bcb5b57168291e4",
      "l2Multicall": "0xb5138E24231Bd50367Ef37a476630c42550e9E37",
      "l2ProxyAdmin": "0xE5183093695E95368902DD7c018F4ae910d79AAD",
      "l2Weth": "0x0000000000000000000000000000000000000000",
      "l2WethGateway": "0x0000000000000000000000000000000000000000"
    },
  },
  "nativeToken":"0x1E2C41d3fF045488D0921591e6B5532583e54F1C",
}
