//SPDX-License-Identifier:MIT
pragma solidity ^0.8.18;

import {Token} from "./Token.sol";
import {MockV3Aggregator} from "../test/MockV3Aggregator.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Loan is Ownable {
    error DebtLimit();
    error UserIsHealthy();
    error DebtPaymentTooLow();
    error TransferFailed();
    error InsufficientSupply();
    error MintCapReached();

    MockV3Aggregator public priceFeed;
    Token public i_fUsd;

    uint256 public constant BORROW_RATE_BPS = 1000;
    uint256 public constant SUPPLY_RATE_BPS = 500;

    uint256 public constant SECONDS_PER_YEAR = 3600;

    uint256 public constant LIQUIDATION_BONUS = 10;

    mapping(address => uint256) public s_ethCollateral;
    mapping(address => uint256) public s_fUsdBorrowed;
    mapping(address => uint256) public s_lendersBalance;

    mapping(address => uint256) public s_lastBorrowTimestamp;
    mapping(address => uint256) public s_lastSupplyTimestamp;

    uint256 public constant MINT_CAP = 10000 * 1e18;
    uint256 public s_totalMintedByProtocol = 0;

    event Deposit(address indexed user, uint256 amount);
    event Borrow(address indexed user, uint256 amount);
    event Repay(address indexed user, uint256 amount);
    event Supply(address indexed lender, uint256 amount);
    event WithdrawSupply(address indexed lender, uint256 amount);
    event Liquidated(address indexed user, address indexed liquidator);
    event FUsdBought(
        address indexed buyer,
        uint256 ethAmount,
        uint256 fUsdAmount
    );
    event withdrawCollateral_money(address indexed user, uint256 amount);

    constructor(address _tokenAddress) Ownable(msg.sender) {
        i_fUsd = Token(_tokenAddress);
    }

    function setPriceFeed(MockV3Aggregator _pricefeed) external onlyOwner {
        priceFeed = _pricefeed;
    }

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

    function buyFUsd() public payable {
        require(msg.value > 0, "Must send ETH");
        uint256 ethValueInUsd = getEthValue(msg.value);

        if (s_totalMintedByProtocol + ethValueInUsd > MINT_CAP) {
            revert MintCapReached();
        }

        s_totalMintedByProtocol += ethValueInUsd;
        i_fUsd.mint(msg.sender, ethValueInUsd);
        s_lendersBalance[msg.sender] += ethValueInUsd;

        emit FUsdBought(msg.sender, msg.value, ethValueInUsd);
    }

    function supply(uint256 amount) external updateSupplyInterest(msg.sender) {
        bool success = i_fUsd.transferFrom(msg.sender, address(this), amount);
        if (!success) revert TransferFailed();

        s_lendersBalance[msg.sender] += amount;
        emit Supply(msg.sender, amount);
    }

    function withdrawSupply(
        uint256 amount
    ) external updateSupplyInterest(msg.sender) {
        require(s_lendersBalance[msg.sender] >= amount, "Insufficient Balance");

        uint256 contractBalance = i_fUsd.balanceOf(address(this));
        if (contractBalance < amount) revert InsufficientSupply();

        s_lendersBalance[msg.sender] -= amount;
        bool success = i_fUsd.transfer(msg.sender, amount);
        if (!success) revert TransferFailed();

        emit WithdrawSupply(msg.sender, amount);
    }

    function depositCollateral() public payable {
        require(msg.value > 0, "Must deposit ETH");
        s_ethCollateral[msg.sender] += msg.value;
        emit Deposit(msg.sender, msg.value);
    }

    function borrow(
        uint256 amountToBorrow
    ) public updateBorrowInterest(msg.sender) {
        uint256 collateralValue = getEthValue(s_ethCollateral[msg.sender]);
        uint256 maxBorrow = collateralValue / 2;

        if (s_fUsdBorrowed[msg.sender] + amountToBorrow > maxBorrow) {
            revert DebtLimit();
        }

        uint256 currentLiquidity = i_fUsd.balanceOf(address(this));
        if (amountToBorrow > currentLiquidity) {
            uint256 deficit = amountToBorrow - currentLiquidity;
            if (s_totalMintedByProtocol + deficit > MINT_CAP) {
                revert MintCapReached();
            }
            i_fUsd.mint(address(this), deficit);
            s_totalMintedByProtocol += deficit;
        }

        s_fUsdBorrowed[msg.sender] += amountToBorrow;
        bool success = i_fUsd.transfer(msg.sender, amountToBorrow);
        if (!success) revert TransferFailed();

        emit Borrow(msg.sender, amountToBorrow);
    }

    function repay(
        uint256 amountToRepay
    ) public updateBorrowInterest(msg.sender) {
        uint256 currentDebt = s_fUsdBorrowed[msg.sender];
        if (amountToRepay > currentDebt) {
            amountToRepay = currentDebt;
        }

        bool success = i_fUsd.transferFrom(
            msg.sender,
            address(this),
            amountToRepay
        );
        if (!success) revert TransferFailed();

        s_fUsdBorrowed[msg.sender] -= amountToRepay;
        emit Repay(msg.sender, amountToRepay);
    }

    function liquidate(address user) external updateBorrowInterest(user) {
        uint256 collateralUsd = getEthValue(s_ethCollateral[user]);
        uint256 debt = s_fUsdBorrowed[user];
        uint256 maxBorrow = collateralUsd / 2;

        if (debt <= maxBorrow) {
            revert UserIsHealthy();
        }

        // Liquidator repays full debt
        bool success = i_fUsd.transferFrom(
            msg.sender,
            address(this),
            debt - (collateralUsd / 2)
        );
        if (!success) revert TransferFailed();

        // Apply liquidation bonus
        uint256 bonus = ((debt - (collateralUsd / 2)) * LIQUIDATION_BONUS) /
            100;
        uint256 usdToSeize = debt - (collateralUsd / 2) + bonus;

        // Convert USD → ETH
        uint256 ethToSeize = (usdToSeize * 1e18) / getLatestPrice();

        // Cap seizure to user's collateral
        if (ethToSeize > s_ethCollateral[user]) {
            ethToSeize = s_ethCollateral[user];
        }

        // Update state
        s_fUsdBorrowed[user] -= debt - (collateralUsd / 2);
        s_ethCollateral[user] -= ethToSeize;

        // Pay liquidator
        (bool sent, ) = payable(msg.sender).call{value: ethToSeize}("");
        if (!sent) revert TransferFailed();

        emit Liquidated(user, msg.sender);
    }

    function calculateInterest(
        uint256 principal,
        uint256 rateBps,
        uint256 lastTime
    ) public view returns (uint256) {
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
        require(
            s_ethCollateral[msg.sender] >= amount,
            "Insufficient Collateral"
        );

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
        emit withdrawCollateral_money(msg.sender, amount);
    }
}
