// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./interfaces/ICustomGateway.sol";
import "./CrosschainMessenger.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import {L1ArbitrumMessenger} from "@arbitrum/token-bridge-contracts/contracts/tokenbridge/ethereum/L1ArbitrumMessenger.sol";
import {GatewayMessageHandler} from "@arbitrum/token-bridge-contracts/contracts/tokenbridge/libraries/gateway/GatewayMessageHandler.sol";
import {IERC20Inbox} from "@arbitrum/nitro-contracts/src/bridge/IERC20Inbox.sol";
import {IERC20Bridge} from "@arbitrum/nitro-contracts/src/bridge/IERC20Bridge.sol";

/**
 * @title Example implementation of a custom gateway to be deployed on L2
 * @dev Inheritance of Ownable is optional. In this case we use it to call the function setTokenBridgeInformation
 * and simplify the test
 */
contract ParentChainCustomGateway is L1ArbitrumMessenger, IL2CustomGateway, L2CrosschainMessenger, Ownable {
    using Address for address;
    using SafeERC20 for IERC20;

    // Token bridge state variables
    address public l2CustomToken;
    address public l3CustomToken;
    address public l3Gateway;
    address public router;

    // Custom functionality
    bool public allowsDeposits;

    /**
     * Contract constructor, sets the L2 router to be used in the contract's functions and calls L1CrosschainMessenger's constructor
     * @param router_ l3GatewayRouter address
     * @param inbox_ Inbox address
     */
    constructor(
        address router_,
        address inbox_
    ) L2CrosschainMessenger(inbox_) {
        router = router_;
        allowsDeposits = false;
    }

    /**
     * Sets the information needed to use the gateway. To simplify the process of testing, this function can be called once
     * by the owner of the contract to set these addresses.
     * @param l2CustomToken_ address of the custom token on L2
     * @param l3CustomToken_ address of the custom token on L3
     * @param l3Gateway_ address of the counterpart gateway (on L3)
     */
    function setTokenBridgeInformation(
        address l2CustomToken_,
        address l3CustomToken_,
        address l3Gateway_
    ) public onlyOwner {
        require(l2CustomToken == address(0), "Token bridge information already set");
        l2CustomToken = l2CustomToken_;
        l3CustomToken = l3CustomToken_;
        l3Gateway = l3Gateway_;

        // Allows deposits after the information has been set
        allowsDeposits = true;
    }

    /// @dev See {ICustomGateway-outboundTransfer}
    function outboundTransfer(
        address l2Token,
        address to,
        uint256 amount,
        uint256 maxGas,
        uint256 gasPriceBid,
        bytes calldata data
    ) public payable override returns (bytes memory) {
        return outboundTransferCustomRefund(l2Token, to, to, amount, maxGas, gasPriceBid, data);
    }

    function outboundTransferCustomRefund(
        address _l2Token,
        address _refundTo,
        address _to,
        uint256 _amount,
        uint256 _maxGas,
        uint256 _gasPriceBid,
        bytes calldata _data
    ) public payable virtual override returns (bytes memory res) {
        // Only execute if deposits are allowed
        require(allowsDeposits == true, "Deposits are currently disabled");

        // Only allow calls from the router
        require(msg.sender == router, "Call not received from router");

        // Only allow the custom token to be bridged through this gateway
        require(_l2Token == l2CustomToken, "Token is not allowed through this gateway");

        // This function is set as public and virtual so that subclasses can override
        // it and add custom validation for callers (ie only whitelisted users)
        address _from;
        uint256 seqNum;
        bytes memory extraData;
        {
            // unpack user encoded data
            uint256 maxSubmissionCost;
            uint256 tokenTotalFeeAmount;
            if (isRouter(msg.sender)) {
                // router encoded
                (_from, extraData) = GatewayMessageHandler.parseFromRouterToGateway(_data);
            } else {
                _from = msg.sender;
                extraData = _data;
            }
            (maxSubmissionCost, extraData, tokenTotalFeeAmount) = _parseUserEncodedData(extraData);

            // the inboundEscrowAndCall functionality has been disabled, so no data is allowed
            require(extraData.length == 0, "EXTRA_DATA_DISABLED");

            require(_l2Token.isContract(), "L1_NOT_CONTRACT");
            address l2Token = calculateL2TokenAddress(_l2Token);
            require(l2Token != address(0), "NO_L2_TOKEN_SET");

            _amount = outboundEscrowTransfer(_l2Token, _from, _amount);

            // we override the res field to save on the stack
            res = getOutboundCalldata(_l2Token, _from, _to, _amount, extraData);

            seqNum = _initiateDeposit(
                _refundTo,
                _from,
                _amount,
                _maxGas,
                _gasPriceBid,
                maxSubmissionCost,
                tokenTotalFeeAmount,
                res
            );
        }
        emit DepositInitiated(_l2Token, _from, _to, seqNum, _amount);
        return abi.encode(seqNum);
    }

    /// @dev See {ICustomGateway-finalizeInboundTransfer}
    function finalizeInboundTransfer(
        address l2Token,
        address from,
        address to,
        uint256 amount,
        bytes calldata data
    ) public payable override onlyCounterpartGateway(l3Gateway) {
        // Only allow the custom token to be bridged through this gateway
        require(l2Token == l2CustomToken, "Token is not allowed through this gateway");

        // Decoding exitNum
        (uint256 exitNum, ) = abi.decode(data, (uint256, bytes));

        // Releasing the tokens in the gateway
        IERC20(l2Token).transfer(to, amount);

        emit WithdrawalFinalized(l2Token, from, to, exitNum, amount);
    }

    /// @dev See {ICustomGateway-getOutboundCalldata}
    function getOutboundCalldata(
        address l2Token,
        address from,
        address to,
        uint256 amount,
        bytes memory data
    ) public pure override returns (bytes memory outboundCalldata) {
        bytes memory emptyBytes = "";

        outboundCalldata = abi.encodeWithSelector(
            ICustomGateway.finalizeInboundTransfer.selector,
            l2Token,
            from,
            to,
            amount,
            abi.encode(emptyBytes, data)
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
        return l3Gateway;
    }


    function _parseUserEncodedData(bytes memory data)
        internal
        pure
        returns (
            uint256 maxSubmissionCost,
            bytes memory callHookData,
            uint256 tokenTotalFeeAmount
        )
    {
        (maxSubmissionCost, callHookData, tokenTotalFeeAmount) = abi.decode(
            data,
            (uint256, bytes, uint256)
        );
    }

    function outboundEscrowTransfer(
        address _l2Token,
        address _from,
        uint256 _amount
    ) internal virtual returns (uint256 amountReceived) {
        // this method is virtual since different subclasses can handle escrow differently
        // user funds are escrowed on the gateway using this function
        uint256 prevBalance = IERC20(_l2Token).balanceOf(address(this));
        IERC20(_l2Token).safeTransferFrom(_from, address(this), _amount);
        uint256 postBalance = IERC20(_l2Token).balanceOf(address(this));
        return postBalance - prevBalance;
    }
    function _initiateDeposit(
        address _refundTo,
        address _from,
        uint256, // _amount, this info is already contained in _data
        uint256 _maxGas,
        uint256 _gasPriceBid,
        uint256 _maxSubmissionCost,
        uint256 tokenTotalFeeAmount,
        bytes memory _data
    ) internal returns (uint256) {
        return
        sendTxToL2CustomRefund(
                address(inbox),
                counterpartGateway(),
                _refundTo,
                _from,
                tokenTotalFeeAmount,
                0,
                L2GasParams({
                    _maxSubmissionCost: _maxSubmissionCost,
                    _maxGas: _maxGas,
                    _gasPriceBid: _gasPriceBid
                }),
                _data
            );
    }

    function _createRetryable(
        address _inbox,
        address _to,
        address _refundTo,
        address _user,
        uint256 _totalFeeAmount,
        uint256 _l2CallValue,
        uint256 _maxSubmissionCost,
        uint256 _maxGas,
        uint256 _gasPriceBid,
        bytes memory _data
    ) internal override returns (uint256) {
        {
            // Transfer native token amount needed to pay for retryable fees to the inbox.
            // Fee tokens will be transferred from user who initiated the action - that's `_user` account in
            // case call was routed by router, or msg.sender in case gateway's entrypoint was called directly.
            address nativeFeeToken = IERC20Bridge(address(getBridge(_inbox))).nativeToken();
            uint256 inboxNativeTokenBalance = IERC20(nativeFeeToken).balanceOf(_inbox);
            if (inboxNativeTokenBalance < _totalFeeAmount) {
                address transferFrom = isRouter(msg.sender) ? _user : msg.sender;
                IERC20(nativeFeeToken).safeTransferFrom(
                    transferFrom,
                    _inbox,
                    _totalFeeAmount - inboxNativeTokenBalance
                );
            }
        }

        return
            IERC20Inbox(_inbox).createRetryableTicket(
                _to,
                _l2CallValue,
                _maxSubmissionCost,
                _refundTo,
                _user,
                _maxGas,
                _gasPriceBid,
                _totalFeeAmount,
                _data
            );
    }

    function isRouter(address _target) internal view returns (bool isTargetRouter) {
        return _target == router;
    }

    // --------------------
    // Custom methods
    // --------------------
    /**
     * Disables the ability to deposit funds
     */
    function disableDeposits() external onlyOwner {
        allowsDeposits = false;
    }

    /**
     * Enables the ability to deposit funds
     */
    function enableDeposits() external onlyOwner {
        require(l2CustomToken != address(0), "Token bridge information has not been set yet");
        allowsDeposits = true;
    }
}