import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import Link from 'next/link';
import styles from '../styles/Home.module.css';
import { LOAN_ABI, LOAN_CONTRACT_ADDRESS, TOKEN_ABI, TOKEN_CONTRACT_ADDRESS } from '../utils/abi';

export default function Market() {
  // --- STATE ---
  const [account, setAccount] = useState(null);
  const [loanContract, setLoanContract] = useState(null);
  const [tokenContract, setTokenContract] = useState(null);
  const [loading, setLoading] = useState(false);

  // User Balances
  const [stats, setStats] = useState({
    ethCollateral: '0',
    fUsdBorrowed: '0',
    lendersBalance: '0',
    walletFusd: '0'
  });

  // Form Inputs
  const [inputs, setInputs] = useState({
    buyAmount: '',
    depositAmount: '',
    borrowAmount: '',
    repayAmount: '',
    supplyAmount: '',
    withdrawAmount: '',
    liquidateAddr: ''
  });

  // --- 1. CONNECT WALLET FUNCTION ---
  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        setLoading(true);
        // Request connection
        const provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send("eth_requestAccounts", []); // Force user to connect
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        
        // Setup Contracts
        const loan = new ethers.Contract(LOAN_CONTRACT_ADDRESS, LOAN_ABI, signer);
        const token = new ethers.Contract(TOKEN_CONTRACT_ADDRESS, TOKEN_ABI, signer);

        setAccount(address);
        setLoanContract(loan);
        setTokenContract(token);
        setLoading(false);
      } catch (err) {
        console.error(err);
        alert("Failed to connect wallet: " + err.message);
        setLoading(false);
      }
    } else {
      alert("Please install MetaMask to use this app.");
    }
  };

  // --- 2. FETCH DATA ---
  const fetchStats = async () => {
    if (!loanContract || !account) return;
    try {
      const col = await loanContract.s_ethCollateral(account);
      const debt = await loanContract.s_fUsdBorrowed(account);
      const supply = await loanContract.s_lendersBalance(account);
      const bal = await tokenContract.balanceOf(account);

      setStats({
        ethCollateral: ethers.formatEther(col),
        fUsdBorrowed: ethers.formatEther(debt),
        lendersBalance: ethers.formatEther(supply),
        walletFusd: ethers.formatEther(bal)
      });
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  useEffect(() => {
    if (account) {
      fetchStats();
      // Optional: Auto-refresh every 10 seconds
      const interval = setInterval(fetchStats, 10000);
      return () => clearInterval(interval);
    }
  }, [account, loanContract]);

  // --- 3. GENERIC TRANSACTION HELPER ---
  const executeTx = async (actionName, txFunction) => {
    if (!account) return alert("Please connect wallet first");
    setLoading(true);
    try {
      const tx = await txFunction();
      console.log(`${actionName} TX Sent:`, tx.hash);
      await tx.wait(); // Wait for confirmation
      alert(`${actionName} Successful!`);
      fetchStats();    // Refresh UI
      setInputs({      // Clear inputs
        buyAmount: '', depositAmount: '', borrowAmount: '', 
        repayAmount: '', supplyAmount: '', withdrawAmount: '', liquidateAddr: ''
      }); 
    } catch (err) {
      console.error(err);
      // Try to extract readable error
      const reason = err.reason || err.message;
      alert(`Error in ${actionName}: ${reason}`);
    }
    setLoading(false);
  };

  // --- 4. CONTRACT FUNCTIONS ---

  // A. Buy fUSD (Payable)
  const handleBuy = () => {
    if (!inputs.buyAmount) return;
    executeTx("Buy fUSD", () => 
      loanContract.buyFUsd({ value: ethers.parseEther(inputs.buyAmount) })
    );
  };

  // B. Deposit Collateral (Payable)
  const handleDeposit = () => {
    if (!inputs.depositAmount) return;
    executeTx("Deposit Collateral", () => 
      loanContract.depositCollateral({ value: ethers.parseEther(inputs.depositAmount) })
    );
  };

  // C. Borrow
  const handleBorrow = () => {
    if (!inputs.borrowAmount) return;
    executeTx("Borrow", () => 
      loanContract.borrow(ethers.parseEther(inputs.borrowAmount))
    );
  };

  // D. Repay (Requires Approve)
  const handleRepay = async () => {
    if (!inputs.repayAmount) return;
    setLoading(true);
    try {
      const amt = ethers.parseEther(inputs.repayAmount);
      // 1. Approve
      const approveTx = await tokenContract.approve(LOAN_CONTRACT_ADDRESS, amt);
      await approveTx.wait();
      // 2. Repay
      const tx = await loanContract.repay(amt);
      await tx.wait();
      alert("Repay Successful!");
      fetchStats();
      setInputs(prev => ({ ...prev, repayAmount: '' }));
    } catch(err) {
      alert("Repay Failed: " + (err.reason || err.message));
    }
    setLoading(false);
  };

  // E. Supply (Requires Approve)
  const handleSupply = async () => {
    if (!inputs.supplyAmount) return;
    setLoading(true);
    try {
      const amt = ethers.parseEther(inputs.supplyAmount);
      // 1. Approve
      const approveTx = await tokenContract.approve(LOAN_CONTRACT_ADDRESS, amt);
      await approveTx.wait();
      // 2. Supply
      const tx = await loanContract.supply(amt);
      await tx.wait();
      alert("Supply Successful!");
      fetchStats();
      setInputs(prev => ({ ...prev, supplyAmount: '' }));
    } catch(err) {
      alert("Supply Failed: " + (err.reason || err.message));
    }
    setLoading(false);
  };

  // F. Withdraw Supply
  const handleWithdraw = () => {
    if (!inputs.withdrawAmount) return;
    executeTx("Withdraw Supply", () => 
      loanContract.withdrawSupply(ethers.parseEther(inputs.withdrawAmount))
    );
  };

  // G. Liquidate (Needs Approve for debt amount, hardcoding large approval for demo)
  const handleLiquidate = async () => {
    if (!inputs.liquidateAddr) return;
    setLoading(true);
    try {
      // For demo: Approve a large amount so liquidator can pay off debt
      const largeAmount = ethers.parseEther("100000"); 
      const approveTx = await tokenContract.approve(LOAN_CONTRACT_ADDRESS, largeAmount);
      await approveTx.wait();

      const tx = await loanContract.liquidate(inputs.liquidateAddr);
      await tx.wait();
      alert("Liquidation Successful!");
      fetchStats();
    } catch(err) {
      alert("Liquidation Failed: " + (err.reason || err.message));
    }
    setLoading(false);
  };

  // --- RENDER HELPERS ---
  const handleInput = (field, val) => setInputs(prev => ({ ...prev, [field]: val }));

  // --- VIEW: NOT CONNECTED ---
  if (!account) {
    return (
      <div className={styles.container}>
        <nav className={styles.navbar}>
          <div className={styles.logo}>⚡ FlashLoan Market</div>
          <Link href="/" className={styles.link}>&larr; Home</Link>
        </nav>
        <div className={styles.connectContainer}>
          <div className={styles.connectBox}>
            <h1>Welcome to the Market</h1>
            <p>Connect your wallet to access borrowing, lending, and liquidation tools.</p>
            <button onClick={connectWallet} className={styles.bigConnectBtn}>
              {loading ? "Connecting..." : "Connect Wallet"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- VIEW: CONNECTED ---
  return (
    <div className={styles.container}>
      <nav className={styles.navbar}>
        <div className={styles.logo}>⚡ FlashLoan Market</div>
        <div className={styles.navRight}>
           <span className={styles.address}>{account.slice(0,6)}...{account.slice(-4)}</span>
           <Link href="/" className={styles.link}>Exit</Link>
        </div>
      </nav>

      <main className={styles.main}>
        {loading && <div className={styles.loadingOverlay}>Transaction in progress...</div>}

        {/* 1. STATS ROW */}
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <span>Collateral (ETH)</span>
            <h2>{parseFloat(stats.ethCollateral).toFixed(4)}</h2>
          </div>
          <div className={styles.statCard}>
             <span>Debt (fUSD)</span>
             <h2 style={{color: '#ef4444'}}>{parseFloat(stats.fUsdBorrowed).toFixed(2)}</h2>
          </div>
          <div className={styles.statCard}>
             <span>Supplied (fUSD)</span>
             <h2 style={{color: '#10b981'}}>{parseFloat(stats.lendersBalance).toFixed(2)}</h2>
          </div>
          <div className={styles.statCard}>
             <span>Wallet (fUSD)</span>
             <h2>{parseFloat(stats.walletFusd).toFixed(2)}</h2>
          </div>
        </div>

        <h3 className={styles.sectionTitle}>Protocol Actions</h3>

        {/* 2. ACTIONS GRID */}
        <div className={styles.grid}>
          
          {/* Card 1: Buy fUSD */}
          <div className={styles.card}>
            <h4>1. Buy fUSD</h4>
            <p>Swap ETH directly for fUSD token</p>
            <input 
              type="number" 
              placeholder="ETH Amount" 
              value={inputs.buyAmount}
              onChange={(e) => handleInput('buyAmount', e.target.value)} 
            />
            <button onClick={handleBuy}>Buy</button>
          </div>

          {/* Card 2: Deposit */}
          <div className={styles.card}>
            <h4>2. Deposit Collateral</h4>
            <p>Lock ETH to increase borrowing power</p>
            <input 
              type="number" 
              placeholder="ETH Amount" 
              value={inputs.depositAmount}
              onChange={(e) => handleInput('depositAmount', e.target.value)} 
            />
            <button onClick={handleDeposit}>Deposit</button>
          </div>

          {/* Card 3: Borrow */}
          <div className={styles.card}>
            <h4>3. Borrow fUSD</h4>
            <p>Borrow against your ETH collateral</p>
            <input 
              type="number" 
              placeholder="fUSD Amount" 
              value={inputs.borrowAmount}
              onChange={(e) => handleInput('borrowAmount', e.target.value)} 
            />
            <button onClick={handleBorrow}>Borrow</button>
          </div>

          {/* Card 4: Repay */}
          <div className={styles.card}>
            <h4>4. Repay Debt</h4>
            <p>Pay back fUSD to unlock collateral</p>
            <input 
              type="number" 
              placeholder="fUSD Amount" 
              value={inputs.repayAmount}
              onChange={(e) => handleInput('repayAmount', e.target.value)} 
            />
            <button className={styles.blueBtn} onClick={handleRepay}>Approve & Repay</button>
          </div>

          {/* Card 5: Supply */}
          <div className={styles.card}>
            <h4>5. Supply (Lend)</h4>
            <p>Earn interest by lending fUSD</p>
            <input 
              type="number" 
              placeholder="fUSD Amount" 
              value={inputs.supplyAmount}
              onChange={(e) => handleInput('supplyAmount', e.target.value)} 
            />
            <button className={styles.greenBtn} onClick={handleSupply}>Approve & Supply</button>
          </div>

           {/* Card 6: Withdraw */}
           <div className={styles.card}>
            <h4>6. Withdraw Supply</h4>
            <p>Remove your supplied fUSD + Interest</p>
            <input 
              type="number" 
              placeholder="fUSD Amount" 
              value={inputs.withdrawAmount}
              onChange={(e) => handleInput('withdrawAmount', e.target.value)} 
            />
            <button onClick={handleWithdraw}>Withdraw</button>
          </div>

          {/* Card 7: Liquidate */}
          <div className={`${styles.card} ${styles.redCard}`}>
            <h4>7. Liquidate User</h4>
            <p>Pay bad debt, seize ETH collateral</p>
            <input 
              type="text" 
              placeholder="Target Address (0x...)" 
              value={inputs.liquidateAddr}
              onChange={(e) => handleInput('liquidateAddr', e.target.value)} 
            />
            <button className={styles.redBtn} onClick={handleLiquidate}>Execute Liquidation</button>
          </div>

        </div>
      </main>
    </div>
  );
}