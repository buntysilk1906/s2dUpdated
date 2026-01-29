import { BrowserProvider, Contract } from "ethers";
import { MOCK_ADDRESS, MOCK_ABI } from "@/lib/constants";

export const useOracle = () => {
    const crashPrice = async (newPriceUsd: string) => {
        if (!window.ethereum) throw new Error("No wallet");

        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();

        const oracle = new Contract(
            MOCK_ADDRESS,
            MOCK_ABI,
            signer
        );

        // Chainlink prices are 8 decimals
        const priceWithDecimals = BigInt(Math.floor(Number(newPriceUsd) * 1e8));

        const tx = await oracle.updateAnswer(priceWithDecimals);
        await tx.wait();
    };

    return { crashPrice };
};
