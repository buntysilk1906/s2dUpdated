import React, { useState, useEffect } from 'react';
import { useLoan } from '@/hooks/useLoan';
import { useWallet } from '@/context/WalletContext';
import { LOAN_CONTRACT_ADDRESS } from '@/lib/constants';

const DashboardPage: React.FC = () => {
    const { wallet } = useWallet();
    const {
        depositCollateral, borrow, repay, supplyLiquidity, withdrawLiquidity, buyFUsd,
        getUserStats, getHistory, getProtocolStats, loading
    } = useLoan();

    // UI State
    const [stats, setStats] = useState({ collateral: '0', debt: '0', supply: '0' });
    const [protocolStats, setProtocolStats] = useState({ totalMinted: '0', maxCap: '10000' });
    const [history, setHistory] = useState<any[]>([]);

    // Modal State: 'deposit', 'lend', or 'buy'
    const [activeModal, setActiveModal] = useState<'none' | 'deposit' | 'lend' | 'buy'>('none');
    const [subTab, setSubTab] = useState<'action1' | 'action2' | 'action3'>('action1');
    const [amount, setAmount] = useState('');

    // Fetch Data
    useEffect(() => {
        if (wallet?.address) {
            getUserStats(wallet.address).then(setStats);
            getHistory(wallet.address).then(setHistory);
            getProtocolStats().then(setProtocolStats); // Fetches MINT_CAP & s_totalMintedByProtocol
        }
    }, [wallet, loading]);

    // Calculate Graph Percentage
    const mintedVal = parseFloat(protocolStats.totalMinted);
    const capVal = parseFloat(protocolStats.maxCap);
    const percentage = capVal > 0 ? Math.min((mintedVal / capVal) * 100, 100) : 0;

    // Handle Transaction Logic
    const handleTransaction = async () => {
        if (!amount) return;

        if (activeModal === 'buy') {
            await buyFUsd(amount); // Call the new Buy function
        } else if (activeModal === 'deposit') {
            if (subTab === 'action1') await depositCollateral(amount);
            if (subTab === 'action2') await borrow(amount);
            if (subTab === 'action3') await repay(amount);
        } else if (activeModal === 'lend') {
            if (subTab === 'action1') await supplyLiquidity(amount);
            if (subTab === 'action2') await withdrawLiquidity(amount);
        }

        setAmount('');
        // Refresh Data
        if (wallet?.address) {
            getHistory(wallet.address).then(setHistory);
            getProtocolStats().then(setProtocolStats);
        }
    };

    return (
        <div className="min-h-screen bg-[#050511] text-white font-sans relative overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-purple-900/20 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-900/20 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="max-w-7xl mx-auto p-8 relative z-10">
                {/* Header */}
                <header className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                            Your Dashboard
                        </h1>
                        <p className="text-gray-400 text-sm mt-1">Connected: {wallet?.address?.slice(0, 6)}...{wallet?.address?.slice(-4)}</p>
                    </div>
                </header>

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <StatCard label="Collateral Deposit" value={`${parseFloat(stats.collateral).toFixed(2)} ETH`} icon="🟣" trend="+5.2%" />
                    <StatCard label="Borrowed Amount" value={`${parseFloat(stats.debt).toFixed(0)} fUSD`} icon="🔴" trend="-2.1%" />
                    <StatCard label="Supply Balance" value={`${parseFloat(stats.supply).toFixed(0)} fUSD`} icon="🟢" trend="+12.3%" />
                    <StatCard label="Health Factor" value={parseFloat(stats.debt) > 0 ? "1.85" : "∞"} icon="⚡" trend="Safe" />
                </div>

                {/* --- MINTING STATION & QUICK ACTIONS --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">

                    {/* LEFT: Quick Actions */}
                    <div className="lg:col-span-2 space-y-6">
                        <h2 className="text-xl font-semibold">Quick Actions</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                            <ActionCard
                                title="Deposit ETH"
                                desc="Deposit ETH as collateral to borrow fUSD."
                                icon="Ξ"
                                color="blue"
                                onClick={() => { setActiveModal('deposit'); setSubTab('action1'); }}
                            />
                            <ActionCard
                                title="Lend fUSD"
                                desc="Lend your fUSD to earn competitive interest."
                                icon="🐷"
                                color="green"
                                onClick={() => { setActiveModal('lend'); setSubTab('action1'); }}
                            />
                        </div>
                    </div>

                    {/* RIGHT: fUSD Market (Buy + Graph) */}
                    <div className="space-y-6 h-full flex flex-col">
                        <h2 className="text-xl font-semibold">fUSD Market</h2>

                        <div className="bg-[#0f1021] border border-gray-800 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between flex-grow min-h-[320px]">
                            {/* Gradient Background */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/10 rounded-full blur-[50px] pointer-events-none"></div>

                            {/* BUY BUTTON SECTION */}
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-bold text-orange-100">Get fUSD</h3>
                                    <span className="bg-orange-500/20 text-orange-400 text-xs px-2 py-1 rounded border border-orange-500/30">Stable</span>
                                </div>
                                <p className="text-xs text-gray-400 mb-4">Swap ETH directly for fUSD to start lending immediately.</p>
                                <button
                                    className="w-full py-3 rounded-xl font-bold text-white shadow-lg bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 transition-all active:scale-95 flex items-center justify-center gap-2"
                                    onClick={() => setActiveModal('buy')}
                                >
                                    <span>🛒</span> Buy fUSD
                                </button>
                            </div>

                            <div className="h-px bg-gray-800 my-6"></div>

                            {/* CIRCULAR GRAPH SECTION */}
                            <div className="flex items-center gap-4">
                                <div className="relative w-20 h-20 flex-shrink-0">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="40" cy="40" r="36" stroke="#1f2937" strokeWidth="6" fill="transparent" />
                                        <circle
                                            cx="40" cy="40" r="36"
                                            stroke="#f59e0b"
                                            strokeWidth="6"
                                            fill="transparent"
                                            strokeDasharray={2 * Math.PI * 36}
                                            strokeDashoffset={2 * Math.PI * 36 * (1 - percentage / 100)}
                                            strokeLinecap="round"
                                            className="transition-all duration-1000 ease-out"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-orange-400">
                                        {percentage.toFixed(0)}%
                                    </div>
                                </div>

                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-bold">Protocol Limit</p>
                                    <div className="text-lg font-bold text-white mt-1">
                                        {mintedVal.toLocaleString()} <span className="text-gray-500 text-xs">/ {capVal.toLocaleString()}</span>
                                    </div>
                                    <p className="text-[10px] text-orange-400/80 mt-1">Minted vs Cap</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Activity */}
                <h2 className="text-xl font-semibold mb-6">Recent Activity</h2>
                <div className="bg-[#0f1021] border border-gray-800 rounded-2xl p-6 overflow-hidden">
                    {history.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">No recent transactions found.</p>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid grid-cols-4 text-xs text-gray-500 uppercase font-bold px-3 pb-2 border-b border-gray-800">
                                <div>Action</div>
                                <div>Contract / Hash</div>
                                <div className="text-right">Amount</div>
                                <div className="text-right">Token</div>
                            </div>
                            {history.map((tx, i) => (
                                <ActivityRow key={i} action={tx.type} hash={tx.hash} contractAddr={LOAN_CONTRACT_ADDRESS} amount={tx.amount} token={tx.token} />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ================= MODAL ================= */}
            {activeModal !== 'none' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
                    <div className="bg-[#0f1021] w-full max-w-lg p-8 rounded-3xl border border-gray-700 relative shadow-2xl">

                        {/* Close Button */}
                        <button onClick={() => setActiveModal('none')} className="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>

                        {/* Modal Header */}
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold capitalize mb-1">
                                {activeModal === 'buy' ? 'Buy fUSD' : activeModal}
                            </h2>
                            <p className="text-xs text-gray-400">
                                {activeModal === 'buy' ? 'Swap ETH for fUSD directly.' : 'Manage your position.'}
                            </p>
                        </div>

                        {/* Tabs (Only for Deposit/Lend) */}
                        {activeModal !== 'buy' && (
                            <div className="flex bg-[#1a1b3a] p-1 rounded-lg mb-6">
                                {(activeModal === 'deposit' ? ['action1', 'action2', 'action3'] : ['action1', 'action2']).map((tab, idx) => (
                                    <button key={idx} onClick={() => setSubTab(tab as any)}
                                        className={`flex-1 py-2 text-sm font-bold rounded ${subTab === tab ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-white'}`}>
                                        {activeModal === 'deposit'
                                            ? (idx === 0 ? 'Deposit' : idx === 1 ? 'Borrow' : 'Repay')
                                            : (idx === 0 ? 'Lend' : 'Withdraw')}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Input Field */}
                        <div className="mb-6">
                            <label className="text-xs text-gray-400 uppercase font-bold mb-2 block">
                                {activeModal === 'buy' ? 'Pay Amount (ETH)' : 'Amount'}
                            </label>
                            <div className="bg-[#12132b] border border-gray-700 rounded-xl p-4 flex justify-between items-center">
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    className="bg-transparent text-2xl font-bold text-white outline-none w-full"
                                />
                                <span className="font-bold text-gray-500 ml-2">
                                    {activeModal === 'deposit' && subTab === 'action1' ? 'ETH' :
                                        activeModal === 'buy' ? 'ETH' : 'fUSD'}
                                </span>
                            </div>
                        </div>

                        {/* Confirm Button */}
                        <button
                            onClick={handleTransaction}
                            disabled={loading}
                            className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-transform active:scale-95 disabled:opacity-50
                                ${activeModal === 'buy' ? 'bg-gradient-to-r from-orange-600 to-amber-500' : 'bg-blue-600 hover:bg-blue-500'}`}
                        >
                            {loading ? 'Processing...' : 'Confirm Transaction'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Sub Components ---
const StatCard = ({ label, value, icon, trend }: any) => (
    <div className="bg-[#0f1021] p-5 rounded-2xl border border-gray-800 hover:border-gray-700 transition-colors">
        <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-gray-800/50 flex items-center justify-center text-xl">{icon}</div>
            <span className={`text-xs font-bold ${trend === 'Safe' ? 'text-green-400' : trend.includes('+') ? 'text-green-400' : 'text-red-400'}`}>{trend}</span>
        </div>
        <p className="text-gray-400 text-xs uppercase tracking-wider">{label}</p>
        <h3 className="text-xl font-bold text-white mt-1">{value}</h3>
    </div>
);

const ActionCard = ({ title, desc, icon, color, onClick }: any) => (
    <div onClick={onClick} className={`group bg-[#0f1021] border border-gray-800 hover:border-${color}-500/50 p-6 rounded-3xl cursor-pointer transition-all hover:shadow-[0_0_30px_rgba(59,130,246,0.1)] flex flex-col items-center text-center h-full justify-center`}>
        <div className={`w-14 h-14 bg-gradient-to-br ${color === 'blue' ? 'from-blue-600 to-purple-600' : 'from-green-500 to-emerald-700'} rounded-2xl mb-4 flex items-center justify-center text-2xl shadow-lg`}>
            {icon}
        </div>
        <h3 className={`text-xl font-bold text-${color}-100 mb-2`}>{title}</h3>
        <p className="text-gray-400 text-xs">{desc}</p>
        <span className={`mt-4 text-${color}-400 text-sm font-semibold group-hover:underline`}>Get Started →</span>
    </div>
);

const ActivityRow = ({ action, hash, contractAddr, amount, token }: any) => {
    const isPositive = ['Deposit', 'Repay', 'Lend', 'Buy'].includes(action); // 'Buy' is positive
    const color = isPositive ? 'text-green-400' : 'text-blue-400';
    return (
        <div className="grid grid-cols-4 items-center py-3 border-b border-gray-800 last:border-0 hover:bg-gray-800/30 transition-colors px-2 rounded">
            <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${isPositive ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                <span className="text-sm font-medium text-gray-300">{action}</span>
            </div>
            <div className="flex flex-col">
                <span className="text-xs text-gray-500">Contract: {contractAddr?.slice(0, 6)}...</span>
                <a href={`https://sepolia.etherscan.io/tx/${hash}`} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:text-blue-300 underline">
                    Tx: {hash?.slice(0, 8)}...
                </a>
            </div>
            <div className={`text-right text-sm font-bold ${color}`}>{parseFloat(amount).toLocaleString()}</div>
            <div className="text-right text-sm text-gray-400 font-mono">Gwei</div>
        </div>
    );
};

export default DashboardPage;