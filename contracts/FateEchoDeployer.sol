// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./FateEcho.sol";

/**
 * @title FateEcho Deployment Helper
 * @notice Helper contract for deploying FateEcho with correct VRF parameters
 */
contract FateEchoDeployer {
    // Sepolia Testnet VRF Configuration
    address constant VRF_COORDINATOR = 0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625;
    bytes32 constant KEY_HASH = 0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c;
    uint64 constant SUBSCRIPTION_ID = 1234; // Replace with your actual subscription ID
    uint32 constant CALLBACK_GAS_LIMIT = 500000;

    function deployFateEcho() external returns (address) {
        FateEcho fateEcho = new FateEcho(
            VRF_COORDINATOR,
            SUBSCRIPTION_ID,
            KEY_HASH,
            CALLBACK_GAS_LIMIT
        );

        return address(fateEcho);
    }
}