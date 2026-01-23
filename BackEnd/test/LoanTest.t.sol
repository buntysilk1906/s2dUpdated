// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import {Test, console} from "forge-std/Test.sol";
import {Loan} from "../src/Loan.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// ==========================================
//              MOCK CONTRACTS
// ==========================================

contract MockToken is ERC20 {
    address public owner;
    constructor() ERC20("Fake USD", "fUSD") { owner = msg.sender; }
    function mint(address to, uint256 amount) external {
        require(msg.sender == owner, "Only owner");
        _mint(to, amount);
    }
    function setOwner(address newOwner) external { owner = newOwner; }
}

contract MockV3Aggregator {
    int256 public price;
    uint8 public decimals;
    constructor(uint8 _dec, int256 _price) { decimals = _dec; price = _price; }
    function updateAnswer(int256 _price) external { price = _price; }
    function latestRoundData() external view returns (uint80, int256, uint256, uint256, uint80) {
        return (0, price, 0, 0, 0);
    }
}

// ==========================================
//              MAIN TEST SUITE
// ==========================================

contract LoanTest is Test {
    Loan loan;
    MockToken token;
    MockV3Aggregator priceFeed;

    address lender = makeAddr("lender");
    address borrower = makeAddr("borrower");
    address liquidator = makeAddr("liquidator");
    address randomUser = makeAddr("randomUser");

    // Constants
    int256 constant ETH_PRICE_USD = 2000 * 1e8; // 1 ETH = $2000
    
    // --- DEMO MODE CONSTANTS ---
    uint256 constant SECONDS_PER_YEAR = 30; // 30 Seconds = 1 Year
    uint256 constant BORROW_RATE = 1000;    // 10%
    uint256 constant SUPPLY_RATE = 500;     // 5%

    function setUp() public {
        token = new MockToken();
        priceFeed = new MockV3Aggregator(8, ETH_PRICE_USD);
        loan = new Loan(address(priceFeed), address(token));
        
        token.setOwner(address(loan));

        vm.deal(lender, 100 ether);
        vm.deal(borrower, 100 ether);
        vm.deal(liquidator, 100 ether);
        vm.deal(randomUser, 100 ether);
    }

    // ==========================================
    //           TEST GROUP 1: LENDERS
    // ==========================================

    function test_LenderEarnsCorrectInterest() public {
        vm.startPrank(lender);
        loan.buyFUsd{value: 1 ether}(); 
        token.approve(address(loan), 1000 * 1e18);
        loan.supply(1000 * 1e18);
        vm.stopPrank();

        vm.warp(block.timestamp + SECONDS_PER_YEAR);

        vm.startPrank(lender);
        loan.supply(0); 

        uint256 balance = loan.s_lendersBalance(lender);
        
        // Expected: 1000 + 5% = 1050
        uint256 expected = 1050 * 1e18;

        assertApproxEqAbs(balance, expected, 1e14); 
        vm.stopPrank();
    }

    function test_WithdrawSupply_WithInterest() public {
        vm.startPrank(lender);
        loan.buyFUsd{value: 1 ether}();
        token.approve(address(loan), 1000 * 1e18);
        loan.supply(1000 * 1e18);
        vm.stopPrank();

        vm.warp(block.timestamp + SECONDS_PER_YEAR);

        // Inject Profit (50 fUSD)
        vm.startPrank(address(loan));
        token.mint(address(loan), 50 * 1e18);
        vm.stopPrank();

        vm.startPrank(lender);
        loan.withdrawSupply(1050 * 1e18); 
        
        uint256 remaining = loan.s_lendersBalance(lender);
        assertEq(remaining, 0); 
        vm.stopPrank();
    }

    // ==========================================
    //          TEST GROUP 2: BORROWERS
    // ==========================================

    function test_BorrowerAccruesDebtCorrectly() public {
        vm.startPrank(borrower);
        loan.depositCollateral{value: 1 ether}();
        loan.borrow(500 * 1e18);
        vm.stopPrank();

        vm.warp(block.timestamp + (SECONDS_PER_YEAR / 2));

        vm.prank(borrower);
        loan.borrow(0); 

        uint256 debt = loan.s_fUsdBorrowed(borrower);
        // 500 * 1.05 = 525
        assertApproxEqAbs(debt, 525 * 1e18, 1e15);
    }

    function test_Borrow_RespectsLTV() public {
        vm.startPrank(borrower);
        loan.depositCollateral{value: 1 ether}(); 
        vm.expectRevert(Loan.DebtLimit.selector);
        loan.borrow(1001 * 1e18);
        vm.stopPrank();
    }

    // ==========================================
    //       TEST GROUP 3: BUY fUSD & REPAY
    // ==========================================

    function test_BuyFUsd_CapLimit() public {
        vm.startPrank(randomUser);
        vm.expectRevert(Loan.MintCapReached.selector);
        loan.buyFUsd{value: 6 ether}(); // Cap is 10k, this tries 12k
        vm.stopPrank();
    }

    function test_Repay_MoreThanDebt() public {
        vm.startPrank(borrower);
        loan.depositCollateral{value: 1 ether}();
        loan.borrow(100 * 1e18);
        vm.stopPrank();
        
        vm.startPrank(borrower);
        loan.buyFUsd{value: 0.1 ether}(); 
        uint256 balance = token.balanceOf(borrower); 
        
        token.approve(address(loan), balance);
        loan.repay(balance); 
        
        uint256 debt = loan.s_fUsdBorrowed(borrower);
        assertEq(debt, 0);
        assertApproxEqAbs(token.balanceOf(borrower), (balance - 100 * 1e18), 1e15);
        vm.stopPrank();
    }

    // ==========================================
    //       TEST GROUP 4: LIQUIDATION
    // ==========================================

    function test_Liquidate_HealthyUser_Reverts() public {
        vm.startPrank(borrower);
        loan.depositCollateral{value: 1 ether}(); 
        loan.borrow(500 * 1e18);
        vm.stopPrank();

        vm.startPrank(liquidator);
        token.approve(address(loan), 1000 * 1e18); 
        vm.expectRevert(Loan.UserIsHealthy.selector);
        loan.liquidate(borrower);
        vm.stopPrank();
    }

    // === UPDATED TEST FOR PARTIAL LIQUIDATION ===
    function test_Liquidate_UnhealthyUser_Works() public {
        // 1. Borrower setup: 1 ETH Collat, $1000 Debt
        vm.startPrank(borrower);
        loan.depositCollateral{value: 1 ether}(); 
        loan.borrow(1000 * 1e18); 
        vm.stopPrank();

        // 2. Crash price to $1500
        // New Max Borrow = $750. Debt $1000 is unhealthy.
        priceFeed.updateAnswer(1500 * 1e8);

        // 3. Liquidator setup
        vm.startPrank(liquidator);
        loan.buyFUsd{value: 1 ether}(); 
        token.approve(address(loan), 2000 * 1e18);
        
        uint256 startEth = liquidator.balance;
        loan.liquidate(borrower);
        
        // --- ASSERTIONS ---

        // A. Debt should be cleared
        assertEq(loan.s_fUsdBorrowed(borrower), 0);
        
        // B. Calculate Expected ETH Seized
        // Debt Covered: 1000
        // Bonus 10%: 100
        // Total Value: 1100 USD
        // Price: 1500 USD/ETH
        // Formula: (1100 * 1e18) / 1500
        // Cast the numerator to uint256 to force integer division (truncation)
uint256 expectedEthSeized = uint256(1100 * 1e18) / 1500;

        // Check Liquidator received this amount
        assertApproxEqAbs(liquidator.balance - startEth, expectedEthSeized, 1e15);

        // C. Check Borrower Kept the Rest
        // Original: 1 ETH
        // Remaining: 1 ETH - expectedEthSeized
        uint256 remainingCollateral = loan.s_ethCollateral(borrower);
        assertApproxEqAbs(remainingCollateral, 1 ether - expectedEthSeized, 1e15);
        
        vm.stopPrank();
    }

    // ==========================================
    //       TEST GROUP 5: FUZZ TESTS
    // ==========================================

    function testFuzz_BorrowInterest(uint96 amount) public {
        vm.assume(amount > 1e18 && amount < 5000 * 1e18);

        vm.startPrank(borrower);
        loan.depositCollateral{value: 10 ether}();
        loan.borrow(amount);
        vm.stopPrank();

        vm.warp(block.timestamp + SECONDS_PER_YEAR);

        vm.prank(borrower);
        loan.borrow(0); 

        uint256 debt = loan.s_fUsdBorrowed(borrower);
        
        uint256 interest = uint256(amount) * 10 / 100;
        uint256 expected = uint256(amount) + interest;

        assertApproxEqAbs(debt, expected, 1e15);
    }
}