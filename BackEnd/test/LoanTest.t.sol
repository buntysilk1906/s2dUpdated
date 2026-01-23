
        // Grant Loan contract // SPDX-License-Identifier: MIT
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
    uint256 constant SECONDS_PER_YEAR = 31536000;
    
    // Rates from contract
    uint256 constant BORROW_RATE = 1000; // 10%
    uint256 constant SUPPLY_RATE = 800;  // 8%

    function setUp() public {
        token = new MockToken();
        priceFeed = new MockV3Aggregator(8, ETH_PRICE_USD);
        loan = new Loan(address(priceFeed), address(token));
        
        // Grant Loan contract minting rights
        token.setOwner(address(loan));

        // Fund users
        vm.deal(lender, 100 ether);
        vm.deal(borrower, 100 ether);
        vm.deal(liquidator, 100 ether);
        vm.deal(randomUser, 100 ether);
    }

    // ==========================================
    //           TEST GROUP 1: LENDERS
    // ==========================================

    function test_LenderEarnsCorrectInterest() public {
        // 1. Lender supplies 1000 fUSD
        // (First, we need to mint fUSD to lender to simulate them having it, 
        // or they can buy it. Let's say they buy it via buyFUsd for simplicity)
        
        vm.startPrank(lender);
        // Buy 1000 fUSD (0.5 ETH @ $2000)
        loan.buyFUsd{value: 0.5 ether}(); 
        token.approve(address(loan), 1000 * 1e18);
        loan.supply(1000 * 1e18);
        vm.stopPrank();

        // 2. Warp 1 Year
        vm.warp(block.timestamp + SECONDS_PER_YEAR);

        // 3. Check Balance (Should be +8%)
        // We trigger update by calling a view or state change. 
        // Let's call withdrawSupply(0) to force the modifier update.
        vm.prank(lender);
        loan.withdrawSupply(0); 

        uint256 balance = loan.s_lendersBalance(lender);
        
        // Expected: 1000 + (1000 * 0.08) = 1080
        uint256 expected = 1080 * 1e18;
        
        console.log("Lender Balance Check:");
        console.log("Expected:", expected);
        console.log("Actual:  ", balance);

        assertApproxEqAbs(balance, expected, 1e14); // Allow tiny rounding error
    }

    // ==========================================
    //          TEST GROUP 2: BORROWERS
    // ==========================================

 function test_BorrowerAccruesDebtCorrectly() public {
        vm.startPrank(borrower);
        // Deposit 1 ETH ($2000)
        loan.depositCollateral{value: 1 ether}();
        // Borrow 500 fUSD
        loan.borrow(500 * 1e18);
        vm.stopPrank();

        // Warp 6 Months (Half year)
        // Rate 10% APY. 6 Months = 5%. 
        // Expected Debt: 500 + 25 = 525.
        vm.warp(block.timestamp + (SECONDS_PER_YEAR / 2));

        vm.prank(borrower);
        // FIX: Use borrow(0) instead of depositCollateral.
        // borrow() has the modifier AND allows 0 amount (it just transfers 0 tokens).
        loan.borrow(0); 

        uint256 debt = loan.s_fUsdBorrowed(borrower);
        
        console.log("Borrower Debt Check (6 months):");
        console.log("Expected: 525.0");
        console.log("Actual:  ", debt / 1e18);

        // This assertion will now pass
        assertApproxEqAbs(debt, 525 * 1e18, 1e15);
    }

    function test_RevertIfBorrowingAboveLTV() public {
        vm.startPrank(borrower);
        loan.depositCollateral{value: 1 ether}(); // $2000 value
        
        // Max borrow is 50% = $1000.
        // Try to borrow $1001
        vm.expectRevert(Loan.DebtLimit.selector);
        loan.borrow(1001 * 1e18);
        vm.stopPrank();
    }

    // ==========================================
    //       TEST GROUP 3: BUY fUSD & REPAY
    // ==========================================

    function test_BuyFUsd_UpdatesStateAndRespectsCap() public {
        // 1. Random user buys fUSD
        vm.startPrank(randomUser);
        
        // Buy $2000 worth (1 ETH)
        loan.buyFUsd{value: 1 ether}();
        
        // Check Token Balance
        assertEq(token.balanceOf(randomUser), 2000 * 1e18);
        
        // Check Contract State (Minted Total)
        assertEq(loan.s_totalMintedByProtocol(), 2000 * 1e18);
        
        vm.stopPrank();
    }

    function test_BuyFUsd_RevertsIfCapReached() public {
        vm.startPrank(randomUser);
        
        // Cap is 10,000. Price is $2000/ETH.
        // 6 ETH = $12,000. This should fail.
        
        vm.expectRevert(Loan.MintCapReached.selector);
        loan.buyFUsd{value: 6 ether}();
        
        vm.stopPrank();
    }

    function test_FullCycle_Borrow_Interest_Buy_Repay() public {
        // 1. Borrow
        vm.startPrank(borrower);
        loan.depositCollateral{value: 1 ether}();
        loan.borrow(1000 * 1e18);
        vm.stopPrank();

        // 2. Wait 1 Year (Debt becomes 1100)
        vm.warp(block.timestamp + SECONDS_PER_YEAR);

        // 3. User realizes they need 100 extra fUSD
        vm.startPrank(borrower);
        
        // Current wallet: 1000 fUSD.
        // Buy extra 110 fUSD (just to be safe/cover slippage or fees if any)
        // 110 USD / 2000 = 0.055 ETH
        loan.buyFUsd{value: 0.055 ether}();

        // 4. Repay ALL
        uint256 balance = token.balanceOf(borrower);
        token.approve(address(loan), balance);
        
        loan.repay(balance); // Contract caps repayment to actual debt
        
        // 5. Assertions
        uint256 debtRemaining = loan.s_fUsdBorrowed(borrower);
        assertEq(debtRemaining, 0);
        
        // User should have some tiny dust left (because we bought 110 but owed 100 interest)
        // Owed ~1100. Had 1000 + 110 = 1110.
        // Remaining should be ~10.
        assertTrue(token.balanceOf(borrower) > 0);
        
        console.log("Cycle Complete. Debt cleared.");
        vm.stopPrank();
    }

    // ==========================================
    //       TEST GROUP 4: LIQUIDATION
    // ==========================================

    function test_Liquidate_WorksAfterPriceDrop() public {
        // 1. Setup risky loan
        vm.startPrank(borrower);
        loan.depositCollateral{value: 1 ether}(); // $2000
        loan.borrow(900 * 1e18); // Borrow $900. Health is okay (Max $1000)
        vm.stopPrank();

        // 2. Price crashes to $1500
        priceFeed.updateAnswer(1500 * 1e8);
        // New Max Borrow = $750.
        // Current Debt = $900.
        // Status: LIQUIDATABLE.

        // 3. Liquidator prepares
        vm.startPrank(liquidator);
        loan.buyFUsd{value: 1 ether}(); // Get some fUSD to pay debt
        token.approve(address(loan), 2000 * 1e18);

        // 4. Liquidate
        uint256 liquidatorEthBefore = liquidator.balance;
        loan.liquidate(borrower);
        uint256 liquidatorEthAfter = liquidator.balance;

        // 5. Checks
        // Borrower debt should be 0
        assertEq(loan.s_fUsdBorrowed(borrower), 0);
        
        // Liquidator should have received the 1 ETH collateral
        // (liquidatorEthAfter - liquidatorEthBefore) should equal 1 ether (minus gas if not using forge)
        assertEq(liquidatorEthAfter - liquidatorEthBefore, 1 ether);
        
        console.log("Liquidation executed successfully.");
        vm.stopPrank();
    }

    function test_Liquidate_RevertsIfUserHealthy() public {
        vm.startPrank(borrower);
        loan.depositCollateral{value: 1 ether}(); // $2000
        loan.borrow(500 * 1e18); // $500 debt. Very healthy.
        vm.stopPrank();

        vm.startPrank(liquidator);
        token.approve(address(loan), 1000 * 1e18); // Approve tokens (if they had any)
        
        // Should fail
        vm.expectRevert(Loan.UserIsHealthy.selector);
        loan.liquidate(borrower);
        vm.stopPrank();
    }
}