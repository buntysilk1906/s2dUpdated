// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import {Script} from "forge-std/Script.sol";
import {Loan} from "../src/Loan.sol"; 
import {Token} from "../src/Token.sol";
import {MockV3Aggregator} from "../test/MockV3Aggregator.sol"; // Ensure path is correct

contract DeployLoan is Script {
    function run() external {
        vm.startBroadcast();
  
        MockV3Aggregator mock = new MockV3Aggregator(8, 2000e8); 
        Token token = new Token();

        Loan loan = new Loan(address(mock), address(token));
        
    
        token.transferOwnership(address(loan));

        vm.stopBroadcast();
    }
}