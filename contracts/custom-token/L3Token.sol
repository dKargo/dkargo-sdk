// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@arbitrum/token-bridge-contracts/contracts/tokenbridge/arbitrum/IArbToken.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract L3Token is ERC20, IArbToken {
    address public l3Gateway;
    address public override l1Address; /** override by arbitrum */

    modifier onlyL3Gateway() {
        require(msg.sender == l3Gateway, "NOT_GATEWAY");
        _;
    }

    constructor(string memory name_, string memory symbol_,address _l3Gateway, address _l2TokenAddress) ERC20(name_, symbol_) {
        l3Gateway = _l3Gateway;
        l1Address = _l2TokenAddress;
    }

    /**
     * @notice should increase token supply by amount, and should only be callable by the L2Gateway.
     */
    function bridgeMint(address account, uint256 amount) external override onlyL3Gateway {
        _mint(account, amount);
    }

    /**
     * @notice should decrease token supply by amount, and should only be callable by the L2Gateway.
     */
    function bridgeBurn(address account, uint256 amount) external override onlyL3Gateway {
        _burn(account, amount);
    }
}
