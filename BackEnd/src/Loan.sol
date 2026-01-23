// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import {Token} from "./Token.sol";

contract Loan {
    // --- ERRORS ---
    error DebtLimit();
    error UserIsHealthy();
    error DebtPaymentTooLow();
    error TransferFailed();
    error InsufficientSupply();
    error MintCapReached();

    // --- STATE VARIABLES ---
    AggregatorV3Interface public priceFeed;
    Token public i_fUsd;

    // Interest Rate Constants (Basis Points: 1000 = 10%)
    uint256 public constant BORROW_RATE_BPS = 1000; // 10% APY
    uint256 public constant SUPPLY_RATE_BPS = 800;  // 8% APY
    uint256 public constant SECONDS_PER_YEAR = 31536000;

    // Mappings
    mapping (address => uint256) public s_ethCollateral;
    mapping (address => uint256) public s_fUsdBorrowed;
    mapping (address => uint256) public s_lendersBalance;
    
    // Track timestamps for interest calculations
    mapping (address => uint256) public s_lastBorrowTimestamp;
    mapping (address => uint256) public s_lastSupplyTimestamp;

    uint256 public constant MINT_CAP = 10000 * 1e18; 
    uint256 public s_totalMintedByProtocol = 0;

    // --- EVENTS ---
    event Deposit(address indexed user, uint256 amount);
    event Borrow(address indexed user, uint256 amount);
    event Repay(address indexed user, uint256 amount);
    event Supply(address indexed lender, uint256 amount);
    event WithdrawSupply(address indexed lender, uint256 amount);
    event Liquidated(address indexed user, address indexed liquidator);
    // New Event
    event FUsdBought(address indexed buyer, uint256 ethAmount, uint256 fUsdAmount); 

    constructor(address _priceFeedAddress, address _tokenAddress) {
        priceFeed = AggregatorV3Interface(_priceFeedAddress);
        i_fUsd = Token(_tokenAddress);
    }

    // --- MODIFIERS (Interest Logic) ---

    modifier updateBorrowInterest(address user) {
        uint256 interest = calculateInterest(
            s_fUsdBorrowed[user], 
            BORROW_RATE_BPS, 
            s_lastBorrowTimestamp[user]
        );
        if (interest > 0) {
            s_fUsdBorrowed[user] += interest;
        }
        s_lastBorrowTimestamp[user] = block.timestamp;
        _;
    }

    modifier updateSupplyInterest(address user) {
        uint256 earnings = calculateInterest(
            s_lendersBalance[user], 
            SUPPLY_RATE_BPS, 
            s_lastSupplyTimestamp[user]
        );
        if (earnings > 0) {
            s_lendersBalance[user] += earnings;
        }
        s_lastSupplyTimestamp[user] = block.timestamp;
        _;
    }

    // --- EXTERNAL FUNCTIONS ---

    // === NEW FUNCTION ===
    // Allows anyone to swap ETH for fUSD directly. 
    // This provides the liquidity needed to pay off interest.
    function buyFUsd() public payable {
        require(msg.value > 0, "Must send ETH");

        // 1. Calculate how much fUSD their ETH is worth
        uint256 ethValueInUsd = getEthValue(msg.value);
        
        // 2. Check if minting this amount hits the cap
        if(s_totalMintedByProtocol + ethValueInUsd > MINT_CAP) {
            revert MintCapReached();
        }

        // 3. Update State
        s_totalMintedByProtocol += ethValueInUsd;

        // 4. Mint tokens to buyer
        // The contract keeps the ETH as a reserve (backing the new tokens)
        i_fUsd.mint(msg.sender, ethValueInUsd);

        emit FUsdBought(msg.sender, msg.value, ethValueInUsd);
    }
    // ====================

    function supply(uint256 amount) external updateSupplyInterest(msg.sender) {
        bool success = i_fUsd.transferFrom(msg.sender, address(this), amount);
        if(!success) revert TransferFailed();

        s_lendersBalance[msg.sender] += amount;
        emit Supply(msg.sender, amount);
    }

    function withdrawSupply(uint256 amount) external updateSupplyInterest(msg.sender) {
        require(s_lendersBalance[msg.sender] >= amount, "Insufficient Balance");
        
        uint256 contractBalance = i_fUsd.balanceOf(address(this));
        if(contractBalance < amount) revert InsufficientSupply();

        s_lendersBalance[msg.sender] -= amount;
        
        bool success = i_fUsd.transfer(msg.sender, amount);
        if(!success) revert TransferFailed();

        emit WithdrawSupply(msg.sender, amount);
    }

    function depositCollateral() public payable {
        require(msg.value > 0, "Must deposit ETH");
        s_ethCollateral[msg.sender] += msg.value;
        emit Deposit(msg.sender, msg.value);
    }

    function borrow(uint256 amountToBorrow) public updateBorrowInterest(msg.sender) {
        uint256 collateralValue = getEthValue(s_ethCollateral[msg.sender]);
        uint256 maxBorrow = collateralValue / 2;

        if (s_fUsdBorrowed[msg.sender] + amountToBorrow > maxBorrow) {
            revert DebtLimit();
        }

        uint256 currentLiquidity = i_fUsd.balanceOf(address(this));
        
        if (amountToBorrow > currentLiquidity) {
            uint256 deficit = amountToBorrow - currentLiquidity;
        
            if(s_totalMintedByProtocol + deficit > MINT_CAP) {
                revert MintCapReached();
            }
            i_fUsd.mint(address(this), deficit);
            s_totalMintedByProtocol += deficit;
        }

        s_fUsdBorrowed[msg.sender] += amountToBorrow;
  
        bool success = i_fUsd.transfer(msg.sender, amountToBorrow);
        if(!success) revert TransferFailed();

        emit Borrow(msg.sender, amountToBorrow);
    }

    function repay(uint256 amountToRepay) public updateBorrowInterest(msg.sender) {
        uint256 currentDebt = s_fUsdBorrowed[msg.sender];
        
        if (amountToRepay > currentDebt) {
            amountToRepay = currentDebt; 
        }

        bool success = i_fUsd.transferFrom(msg.sender, address(this), amountToRepay);
        if (!success) revert TransferFailed();

        s_fUsdBorrowed[msg.sender] -= amountToRepay;
        
        emit Repay(msg.sender, amountToRepay);
    }

    function liquidate(address user) external updateBorrowInterest(user) {
        uint256 totalCollateralValueInUsd = getEthValue(s_ethCollateral[user]);
        uint256 userDebt = s_fUsdBorrowed[user];
        uint256 maxBorrow = totalCollateralValueInUsd / 2;

        if (userDebt <= maxBorrow) {
            revert UserIsHealthy();
        }

        bool success = i_fUsd.transferFrom(msg.sender, address(this), userDebt);
        if (!success) revert TransferFailed();

        uint256 collateralToSeize = s_ethCollateral[user];
    
        s_fUsdBorrowed[user] = 0;
        s_ethCollateral[user] = 0;

        (bool sent, ) = payable(msg.sender).call{value: collateralToSeize}("");
        if (!sent) {
            revert TransferFailed();
        }

        emit Liquidated(user, msg.sender);
    }

    // --- HELPER & VIEW FUNCTIONS ---

    function calculateInterest(uint256 principal, uint256 rateBps, uint256 lastTime) public view returns (uint256) {
        if (lastTime == 0 || principal == 0) return 0;
        
        uint256 timeElapsed = block.timestamp - lastTime;
        return (principal * rateBps * timeElapsed) / (SECONDS_PER_YEAR * 10000);
    }

    function getLatestPrice() public view returns (uint256) {
        (, int256 price, , , ) = priceFeed.latestRoundData();
        return uint256(price) * 1e10;
    }

    function getEthValue(uint256 ethAmount) public view returns (uint256) {
        return (ethAmount * getLatestPrice()) / 1e18;
    }
}