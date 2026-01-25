import { useState } from 'react';
import { ethers, BrowserProvider, Contract } from 'ethers';
import { useWallet } from '@/context/WalletContext'; 
import { LOAN_CONTRACT_ADDRESS, LOAN_CONTRACT_ABI } from '@/lib/constants';

export const useLoan = () => {
    const { wallet } = useWallet(); 
    const [loading, setLoading] = useState(false);

    
    const getContract = async (withSigner = false) => {
        if (!window.ethereum) throw new Error("No crypto wallet found");
        const provider = new BrowserProvider(window.ethereum);
        if (withSigner) {
            const signer = await provider.getSigner();
            return new Contract(LOAN_CONTRACT_ADDRESS, LOAN_CONTRACT_ABI, signer);
        }
        return new Contract(LOAN_CONTRACT_ADDRESS, LOAN_CONTRACT_ABI, provider);
    };

    
    const depositCollateral = async (amount: string) => {
        setLoading(true);
        try {
            const contract = await getContract(true);
            const tx = await contract.depositCollateral({ value: ethers.parseEther(amount) });
            await tx.wait();
            alert("Deposit Successful!");
        } catch (err) { console.error(err); alert("Deposit Failed"); } 
        finally { setLoading(false); }
    };

    const buyFUsd = async (ethAmount: string) => {
        setLoading(true);
        try {
            const contract = await getContract(true);
            // calculated fUSD amount is handled by contract logic, we just send ETH
            const tx = await contract.buyFUsd({ value: ethers.parseEther(ethAmount) });
            await tx.wait();
            alert("fUSD Bought Successfully!");
        } catch (err) { console.error(err); alert("Buy Failed"); } 
        finally { setLoading(false); }
    };

    const borrow = async (amount: string) => {
        setLoading(true);
        try {
            const contract = await getContract(true);
            const tx = await contract.borrow(ethers.parseEther(amount));
            await tx.wait();
            alert("Borrow Successful!");
        } catch (err) { console.error(err); alert("Borrow Failed"); } 
        finally { setLoading(false); }
    };

    const repay = async (amount: string) => {
        setLoading(true);
        try {
            const contract = await getContract(true);
            const tx = await contract.repay(ethers.parseEther(amount));
            await tx.wait();
            alert("Repay Successful!");
        } catch (err) { console.error(err); alert("Repay Failed"); } 
        finally { setLoading(false); }
    };

    const supplyLiquidity = async (amount: string) => {
        setLoading(true);
        try {
            const contract = await getContract(true);
            const tx = await contract.supply(ethers.parseEther(amount));
            await tx.wait();
            alert("Supply Successful!");
        } catch (err) { console.error(err); alert("Supply Failed"); } 
        finally { setLoading(false); }
    };

    const withdrawLiquidity = async (amount: string) => {
        setLoading(true);
        try {
            const contract = await getContract(true);
            const tx = await contract.withdrawSupply(ethers.parseEther(amount));
            await tx.wait();
            alert("Withdraw Successful!");
        } catch (err) { console.error(err); alert("Withdraw Failed"); } 
        finally { setLoading(false); }
    };

    
    const getProtocolStats = async () => {
        try {
            const contract = await getContract(false);
            // Fetch total minted and mint cap from contract
            const [minted, cap] = await Promise.all([
                contract.s_totalMintedByProtocol(),
                contract.MINT_CAP()
            ]);
            
            return {
                totalMinted: ethers.formatEther(minted), 
                maxCap: ethers.formatEther(cap)
            };
        } catch (error) {
            console.error("Protocol Stats Error:", error);
            // Fallback values if read fails
            return { totalMinted: "0", maxCap: "10000" }; 
        }
    };

    const getUserStats = async (userAddress: string) => {
        try {
            const contract = await getContract(false);
            const [col, debt, supplyBal] = await Promise.all([
                contract.s_ethCollateral(userAddress),
                contract.s_fUsdBorrowed(userAddress),
                contract.s_lendersBalance(userAddress)
            ]);
            return {
                collateral: ethers.formatEther(col),
                debt: ethers.formatEther(debt),
                supply: ethers.formatEther(supplyBal)
            };
        } catch (error) {
            console.error("Stats Error:", error);
            return { collateral: "0", debt: "0", supply: "0" };
        }
    };

    // --- HISTORY FUNCTION ---
    const getHistory = async (userAddress: string) => {
        try {
            const contract = await getContract(false);
            
            const depositFilter = contract.filters.Deposit(userAddress);
            const borrowFilter = contract.filters.Borrow(userAddress);
            const repayFilter = contract.filters.Repay(userAddress);
            const supplyFilter = contract.filters.Supply(userAddress);
            
            const [deposits, borrows, repays, supplies] = await Promise.all([
                contract.queryFilter(depositFilter, -10000), 
                contract.queryFilter(borrowFilter, -10000),
                contract.queryFilter(repayFilter, -10000),
                contract.queryFilter(supplyFilter, -10000)
            ]);

            const formatLog = (logs: any[], type: string, token: string) => 
                logs.map(log => ({
                    type,
                    amount: ethers.formatEther(log.args[1]),
                    token,
                    hash: log.transactionHash,
                    block: log.blockNumber
                }));

            const allEvents = [
                ...formatLog(deposits, "Deposit", "ETH"),
                ...formatLog(borrows, "Borrow", "fUSD"),
                ...formatLog(repays, "Repay", "fUSD"),
                ...formatLog(supplies, "Lend", "fUSD")
            ];

            return allEvents.sort((a, b) => b.block - a.block);

        } catch (error) {
            console.error("History Error:", error);
            return [];
        }
    };

    return { 
        depositCollateral, 
        borrow, 
        repay, 
        supplyLiquidity, 
        withdrawLiquidity,
        buyFUsd,           
        getUserStats, 
        getHistory, 
        getProtocolStats,  
        loading 
    };
};