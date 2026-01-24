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

    // --- DEMO CONFIGURATION ---
    uint256 public constant BORROW_RATE_BPS = 1000; // 10% APY
    uint256 public constant SUPPLY_RATE_BPS = 500;  // 5% APY
    
    // DEMO TIME: 30 Seconds = 1 Year
    uint256 public constant SECONDS_PER_YEAR = 30; 

    // LIQUIDATION BONUS: 10%
    // This dictates how much extra collateral the liquidator gets
    uint256 public constant LIQUIDATION_BONUS = 10; 

    // Mappings
    mapping (address => uint256) public s_ethCollateral;
    mapping (address => uint256) public s_fUsdBorrowed;
    mapping (address => uint256) public s_lendersBalance;
    
    // Track timestamps
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
    event FUsdBought(address indexed buyer, uint256 ethAmount, uint256 fUsdAmount); 

    constructor(address _priceFeedAddress, address _tokenAddress) {
        priceFeed = AggregatorV3Interface(_priceFeedAddress);
        i_fUsd = Token(_tokenAddress);
    }

    // --- MODIFIERS ---

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

    function buyFUsd() public payable {
        require(msg.value > 0, "Must send ETH");
        uint256 ethValueInUsd = getEthValue(msg.value);
        
        if(s_totalMintedByProtocol + ethValueInUsd > MINT_CAP) {
            revert MintCapReached();
        }

        s_totalMintedByProtocol += ethValueInUsd;
        i_fUsd.mint(msg.sender, ethValueInUsd);
        emit FUsdBought(msg.sender, msg.value, ethValueInUsd);
    }

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

    // === UPDATED LIQUIDATION LOGIC ===
    function liquidate(address user) external updateBorrowInterest(user) {
        uint256 totalCollateralValueInUsd = getEthValue(s_ethCollateral[user]);
        uint256 userDebt = s_fUsdBorrowed[user];
        uint256 maxBorrow = totalCollateralValueInUsd / 2;

        if (userDebt <= maxBorrow) {
            revert UserIsHealthy();
        }

        // 1. Calculate Debt + Bonus
        uint256 tokenAmountToCover = userDebt;
        uint256 bonusAmount = (tokenAmountToCover * LIQUIDATION_BONUS) / 100;
        uint256 totalValueToSeizeInUsd = tokenAmountToCover + bonusAmount;

        // 2. Convert to ETH
        // Formula: (USD * 1e18) / Price
        uint256 currentPrice = getLatestPrice(); 
        uint256 ethToSeize = (totalValueToSeizeInUsd * 1e18) / currentPrice;

        // Safety: Cannot seize more than they have
        if(ethToSeize > s_ethCollateral[user]) {
            ethToSeize = s_ethCollateral[user];
        }

        // 3. Take Payment from Liquidator
        bool success = i_fUsd.transferFrom(msg.sender, address(this), userDebt);
        if (!success) revert TransferFailed();

        // 4. Update Balances
        s_fUsdBorrowed[user] = 0;
        s_ethCollateral[user] -= ethToSeize; // User keeps the remainder!

        // 5. Send Reward to Liquidator
        (bool sent, ) = payable(msg.sender).call{value: ethToSeize}("");
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

    function getSecondsElapsed(address user) public view returns (uint256) {
        if (s_lastBorrowTimestamp[user] == 0) return 0;
        return block.timestamp - s_lastBorrowTimestamp[user];
    }

    function withdrawCollateral(uint256 amount) external {
        // 1. Check if user has enough collateral
        require(s_ethCollateral[msg.sender] >= amount, "Insufficient Collateral");

        // 2. Check if withdrawing this amount would make them unhealthy (undercollateralized)
        //    (Only necessary if they still have some debt remaining)
        uint256 collateralRemaining = s_ethCollateral[msg.sender] - amount;
        uint256 collateralValueInUsd = getEthValue(collateralRemaining);
        uint256 maxBorrow = collateralValueInUsd / 2;
        
        if (s_fUsdBorrowed[msg.sender] > maxBorrow) {
            revert DebtLimit(); // Cannot withdraw if it makes you unhealthy
        }

        // 3. Update state
        s_ethCollateral[msg.sender] -= amount;

        // 4. Send ETH back to user
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) revert TransferFailed();

        emit Deposit(msg.sender, amount); // You might want to create a new "WithdrawCollateral" event
    }
}