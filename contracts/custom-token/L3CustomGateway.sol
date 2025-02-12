// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./interfaces/ICustomGateway.sol";
import "./CrosschainMessenger.sol";
import "@arbitrum/token-bridge-contracts/contracts/tokenbridge/arbitrum/IArbToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Example implementation of a custom gateway to be deployed on L3
 * @dev Inheritance of Ownable is optional. In this case we use it to call the function setTokenBridgeInformation
 * and simplify the test
 */
contract ChildChainCustomGateway is IL3CustomGateway, L3CrosschainMessenger, Ownable {
    // Exit number (used for tradeable exits)
    uint256 public exitNum;

    // Token bridge state variables
    address public l2CustomToken;
    address public l3CustomToken;
    address public l2Gateway;
    address public router;

    // Custom functionality
    bool public allowsWithdrawals;

    /**
     * Contract constructor, sets the L3 router to be used in the contract's functions
     * @param router_ L3GatewayRouter address
     */
    constructor(address router_) {
        router = router_;
        allowsWithdrawals = false;
    }

    /**
     * Sets the information needed to use the gateway. To simplify the process of testing, this function can be called once
     * by the owner of the contract to set these addresses.
     * @param l2CustomToken_ address of the custom token on L2
     * @param l3CustomToken_ address of the custom token on L3
     * @param l2Gateway_ address of the counterpart gateway (on L2)
     */
    function setTokenBridgeInformation(
        address l2CustomToken_,
        address l3CustomToken_,
        address l2Gateway_
    ) public onlyOwner {
        require(l2CustomToken == address(0), "Token bridge information already set");
        l2CustomToken = l2CustomToken_;
        l3CustomToken = l3CustomToken_;
        l2Gateway = l2Gateway_;

        // Allows withdrawals after the information has been set
        allowsWithdrawals = true;
    }

    /// @dev See {ICustomGateway-outboundTransfer}
    function outboundTransfer(
        address l2Token,
        address to,
        uint256 amount,
        bytes calldata data
    ) public payable returns (bytes memory) {
        return outboundTransfer(l2Token, to, amount, 0, 0, data);
    }

    /// @dev See {ICustomGateway-outboundTransfer}
    function outboundTransfer(
        address l2Token,
        address to,
        uint256 amount,
        uint256, /* _maxGas */
        uint256, /* _gasPriceBid */
        bytes calldata data
    ) public payable override returns (bytes memory res) {
        // Only execute if deposits are allowed
        require(allowsWithdrawals == true, "Withdrawals are currently disabled");

        // The function is marked as payable to conform to the inheritance setup
        // This particular code path shouldn't have a msg.value > 0
        require(msg.value == 0, "NO_VALUE");
        
        // Only allow the custom token to be bridged through this gateway
        require(l2Token == l2CustomToken, "Token is not allowed through this gateway");

        (address from, bytes memory extraData) = _parseOutboundData(data);

        // The inboundEscrowAndCall functionality has been disabled, so no data is allowed
        require(extraData.length == 0, "EXTRA_DATA_DISABLED");

        // Burns L2 tokens in order to release escrowed L1 tokens
        IArbToken(l3CustomToken).bridgeBurn(from, amount);

        // Current exit number for this operation
        uint256 currExitNum = exitNum++;

        // We override the res field to save on the stack
        res = getOutboundCalldata(l2Token, from, to, amount, extraData);

        // Trigger the crosschain message
        uint256 id = _sendTxToL2(
            from,
            l2Gateway,
            res
        );

        emit WithdrawalInitiated(l2Token, from, to, id, currExitNum, amount);
        return abi.encode(id);
    }

    /// @dev See {ICustomGateway-finalizeInboundTransfer}
    function finalizeInboundTransfer(
        address l2Token,
        address from,
        address to,
        uint256 amount,
        bytes calldata data
    ) public payable override onlyCounterpartGateway(l2Gateway) {
        // Only allow the custom token to be bridged through this gateway
        require(l2Token == l2CustomToken, "Token is not allowed through this gateway");

        // Abi decode may revert, but the encoding is done by L2 gateway, so we trust it
        (, bytes memory callHookData) = abi.decode(data, (bytes, bytes));
        if (callHookData.length != 0) {
            // callHookData should always be 0 since inboundEscrowAndCall is disabled
            callHookData = bytes("");
        }

        // Mints L3 tokens
        IArbToken(l3CustomToken).bridgeMint(to, amount);

        emit DepositFinalized(l2Token, from, to, amount);
    }

    /// @dev See {ICustomGateway-getOutboundCalldata}
    function getOutboundCalldata(
        address l2Token,
        address from,
        address to,
        uint256 amount,
        bytes memory data
    ) public view override returns (bytes memory outboundCalldata) {
        outboundCalldata = abi.encodeWithSelector(
            ICustomGateway.finalizeInboundTransfer.selector,
            l2Token,
            from,
            to,
            amount,
            abi.encode(exitNum, data)
        );

        return outboundCalldata;
    }

    /// @dev See {ICustomGateway-calculateL2TokenAddress}
    function calculateL2TokenAddress(address l2Token) public view override returns (address) {
        if (l2Token == l2CustomToken) {
            return l3CustomToken;
        }
        
        return address(0);
    }

    /// @dev See {ICustomGateway-counterpartGateway}
    function counterpartGateway() public view override returns (address) {
        return l2Gateway;
    }

    /**
     * Parse data received in outboundTransfer
     * @param data encoded data received
     * @return from account that initiated the deposit,
     *         extraData decoded data
     */
    function _parseOutboundData(bytes memory data)
    internal
    view
    returns (
        address from,
        bytes memory extraData
    )
    {
        if (msg.sender == router) {
            // Router encoded
            (from, extraData) = abi.decode(data, (address, bytes));
        } else {
            from = msg.sender;
            extraData = data;
        }
    }

    // --------------------
    // Custom methods
    // --------------------
    /**
     * Disables the ability to deposit funds
     */
    function disableWithdrawals() external onlyOwner {
        allowsWithdrawals = false;
    }

    /**
     * Enables the ability to deposit funds
     */
    function enableWithdrawals() external onlyOwner {
        require(l2CustomToken != address(0), "Token bridge information has not been set yet");
        allowsWithdrawals = true;
    }
}