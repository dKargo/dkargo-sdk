// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

/**
 * @title Minimum expected interface for a custom gateway
 */
interface ICustomGateway {
    function outboundTransfer(
        address l1Token,
        address to,
        uint256 amount,
        uint256 maxGas,
        uint256 gasPriceBid,
        bytes calldata data
    ) external payable returns (bytes memory);

    function finalizeInboundTransfer(
        address l1Token,
        address from,
        address to,
        uint256 amount,
        bytes calldata data
    ) external payable;

    function getOutboundCalldata(
        address l1Token,
        address from,
        address to,
        uint256 amount,
        bytes memory data
    ) external view returns (bytes memory);

    function calculateL2TokenAddress(address l1Token) external view returns (address);

    function counterpartGateway() external view returns (address);
}

/**
 * @title Minimum expected interface for a custom gateway to be deployed on L1
 */
interface IL2CustomGateway is ICustomGateway {
    event DepositInitiated(
        address l1Token,
        address indexed from,
        address indexed to,
        uint256 indexed sequenceNumber,
        uint256 amount
    );

    event WithdrawalFinalized(
        address l1Token,
        address indexed from,
        address indexed to,
        uint256 indexed exitNum,
        uint256 amount
    );

    function outboundTransferCustomRefund(
        address l1Token,
        address refundTo,
        address to,
        uint256 amount,
        uint256 maxGas,
        uint256 gasPriceBid,
        bytes calldata data
    ) external payable returns (bytes memory);
}

/**
 * @title Minimum expected interface for a custom gateway to be deployed on L2
 */
interface IL3CustomGateway is ICustomGateway {
    event WithdrawalInitiated(
        address l1Token,
        address indexed from,
        address indexed to,
        uint256 indexed l2ToL1Id,
        uint256 exitNum,
        uint256 amount
    );

    event DepositFinalized(
        address indexed l1Token,
        address indexed from,
        address indexed to,
        uint256 amount
    );
}