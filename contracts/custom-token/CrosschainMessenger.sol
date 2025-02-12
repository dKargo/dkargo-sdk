// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@arbitrum/nitro-contracts/src/precompiles/ArbSys.sol";
import "@arbitrum/nitro-contracts/src/libraries/AddressAliasHelper.sol";
import {IERC20Inbox} from "@arbitrum/nitro-contracts/src/bridge/IERC20Inbox.sol";
import {IBridge} from "@arbitrum/nitro-contracts/src/bridge/IBridge.sol";



/**
 * @title Interface needed to call function `l2ToL1Sender` of the Outbox
 */
interface IOutbox {
    function l2ToL1Sender() external view returns (address);
}

/**
 * @title Minimum expected implementation of a crosschain messenger contract to be deployed on L1
 */
abstract contract L2CrosschainMessenger {
    IERC20Inbox public immutable inbox;

    constructor(address inbox_) {
        inbox = IERC20Inbox(inbox_);
    }

    modifier onlyCounterpartGateway(address l3Counterpart) {
        // A message coming from the counterpart gateway was executed by the bridge
        IBridge bridge = inbox.bridge();
        require(msg.sender == address(bridge), "NOT_FROM_BRIDGE");

        // And the outbox reports that the L2 address of the sender is the counterpart gateway
        address l2ToL1Sender = IOutbox(bridge.activeOutbox()).l2ToL1Sender();
        require(l2ToL1Sender == l3Counterpart, "ONLY_COUNTERPART_GATEWAY");

        _;
    }
}

/**
 * @title Minimum expected implementation of a crosschain messenger contract to be deployed on L3
 */
abstract contract L3CrosschainMessenger {
    address internal constant ARB_SYS_ADDRESS = address(100);

    /**
     * Emitted when calling sendTxToL1
     * @param from account that submits the L3-to-L2 message
     * @param to account recipient of the L3-to-L2 message
     * @param id id for the L3-to-L2 message
     * @param data data of the L3-to-L2 message
     */
    event TxToL1(
        address indexed from,
        address indexed to,
        uint256 indexed id,
        bytes data
    );

    modifier onlyCounterpartGateway(address l2Counterpart) {
        require(
            msg.sender == AddressAliasHelper.applyL1ToL2Alias(l2Counterpart),
            "ONLY_COUNTERPART_GATEWAY"
        );

        _;
    }

    /**
     * Creates an L3-to-L2 message to send over to L2 through ArbSys
     * @param from account that is sending funds from L3
     * @param to account to be credited with the tokens in the destination layer
     * @param data encoded data for the L3-to-L2 message
     * @return id id for the L3-to-L2 message
     */
    function _sendTxToL2(
        address from,
        address to,
        bytes memory data
    ) internal returns (uint256) {
        uint256 id = ArbSys(ARB_SYS_ADDRESS).sendTxToL1(to, data);

        emit TxToL1(from, to, id, data);
        return id;
    }
}