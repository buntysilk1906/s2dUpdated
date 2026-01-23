// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// This acts like the Chainlink Aggregator
contract MockV3Aggregator {
    int256 public currentPrice;
    uint8 public decimals;

    constructor(uint8 _decimals, int256 _initialPrice) {
        decimals = _decimals;
        currentPrice = _initialPrice;
    }

    // HELPER: You call this during the demo to crash the price
    function updateAnswer(int256 _answer) external {
        currentPrice = _answer;
    }
    
    // The protocol calls this to get the price
    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        return (0, currentPrice, 0, 0, 0);
    }
}