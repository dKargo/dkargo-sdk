# Dkargo SDK

![npm version](https://img.shields.io/badge/version-1.1.0-green)
![npm](https://img.shields.io/badge/@arbitrum/sdk-4.0.2-blue)
![npm](https://img.shields.io/badge/ethers-5.7.2-black)


A TypeScript library for client-side interactions with Dkargo. The Dkargo SDK provides essential helper functionality and direct access to underlying smart contract interfaces, enabling developers to build powerful applications on the Dkargo network.

> [!IMPORTANT]
> **@dKargo/sdk** is designed to be highly similar to the [@arbitrum/sdk](https://github.com/OffchainLabs/arbitrum-sdk), with most of its functions and structures extending from the @arbitrum/sdk. This ensures that existing @arbitrum/sdk users can easily understand and utilize the @dKargo/sdk. 
> However, unlike Arbitrum, which uses ETH for transaction fees, DKargo leverages ERC20 DKA tokens from the Arbitrum network by converting them for use as transaction fees on the DKargo chain. As a result, dedicated functions optimized for the DKargo chain environment have been added.

> [!IMPORTANT]
> DKargo SDK functions take the Provider and Signer classes from ethers.js v5 as input parameters, so make sure to use the correct version.

## Installtion
```bash
npm install @dkargo/sdk
```

## Key Features
### Bridging Assets
Dkargo SDK facilitates the bridging of assets between an Arbitrum chain and its parent chain. Currently supported asset bridgers:
- `DkaBridge`: For bridging DKA to and from an Dkargo chain (L2 or L3)
- `TokenBridge`: For bridging ERC-20 tokens to and from an Dkargo chain (L2 or L3)
- `CustomTokenBridge`: For bridging ERC-20 tokens to and from an Dkargo chain (L2 or L3) and register Custom Gateway

### Cross-Chain Messages
Cross-chain communication is handled through `ParentToChildMessage` and `ChildToParentMessage` classes. These encapsulate the lifecycle of messages sent between chains, typically created from transaction receipts that initiate cross-chain messages.

### Network Configuration
The SDK comes preconfigured for Dkargo and warehouse Sepolia. Custom Arbitrum networks can be registered using `registerCustomArbitrumNetwork`, which is required before utilizing other SDK features.

## Usage
Here's a basic example of using the SDK to bridge DKA:

1. approve L2 ERC20 DKA to inbox contract
    ```ts
    const parentProvider = new ethers.providers.JsonRpcProvider("- arbitrum provider url -")
    const childProvider = new ethers.providers.JsonRpcProvider("- dkargo provider url -")

    const network = await getArbitrumNetwork(childProvider);
    const dkaBridge = new DkaBridge(network);

    const res = await dkaBridge.approveGasToken({
        parentSigner,
    });
    const receipt = await res.wait();
    console.log(`approve L2 DKA token: ${txReceipt.transactionHash}`)
    ```
</br>

2. deposit initiated to inbox contract
    ```ts
    const deposit = await ethBridger.deposit({
        amount: ethers.utils.parseEther('0.1'),
        parentSigner,
    })

    const txReceipt = await deposit.wait()
    console.log(`Deposit initiated: ${txReceipt.transactionHash}`)
    ```
For more detailed usage examples and API references, please refer to the [dkargo-tutorials](https://github.com/dKargo/dkargo-tutorials).


## Running Integration Tests
1. Set up a Dkargo local test-node by following the instructions [here](https://github.com/OffchainLabs/nitro-testnode).
2. Copy `.env.example` to `.env` and update relevant environment variables.
3. Execute the intrgration test:
    ```sh
    npm run test:integration
    ```
4. **[Optional]** Continuously generate transactions on an L2 blockchain for testing and benchmarking purposes.
    ```sh
    npm run stress -- --delay 1000
    ```
