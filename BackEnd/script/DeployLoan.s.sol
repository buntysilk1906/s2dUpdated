// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import {Script} from "forge-std/Script.sol";
import {Loan} from "../src/Loan.sol";
import {Token} from "../src/Token.sol";
import {MockV3Aggregator} from "../test/MockV3Aggregator.sol"; // Ensure path is correct
import {console} from "forge-std/console.sol";

contract DeployLoan is Script {
    function run() external {
        vm.startBroadcast();

        Token borrowToken = new Token();
        MockV3Aggregator mock = new MockV3Aggregator(8, 2000e8);

        Loan loan = new Loan(address(borrowToken));
        borrowToken.transferOwnership(address(loan));
        loan.setPriceFeed(mock);

        vm.stopBroadcast();

        console.log("loan Address : ", address(loan));
        console.log("Mock Address : ", address(mock));
        console.log("token Address : ", address(borrowToken));
    }
}
