import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESSES } from '../config/contracts';
import gameABI from "../contracts/TotemGame.abi.json";
import nftABI from "../contracts/TotemNFT.abi.json";
import rewardsABI from "../contracts/TotemRewards.abi.json";
import achievementsABI from "../contracts/TotemAchievements.abi.json";
const gameAddress = CONTRACT_ADDRESSES.game;
const nftAddress = CONTRACT_ADDRESSES.nft;
const rewardsAddress = CONTRACT_ADDRESSES.rewards;
const achievementsAddress = CONTRACT_ADDRESSES.achievements;

export function useContractEvents(userAddress: string | null) {
    const [notifications, setNotifications] = useState<{ id: string, message: string }[]>(() => {
        // Load saved notifications from localStorage on startup
        const saved = localStorage.getItem("totem-notifications");
        return saved ? JSON.parse(saved) : [];
    });
    const eventHashes = new Set<string>(notifications.map(n => n.id)); // Hash-based duplicate tracking

    const saveToLocalStorage = (notifications: { id: string, message: string }[]) => {
        localStorage.setItem("totem-notifications", JSON.stringify(notifications));
    };

    const hashMessage = async (message: string): Promise<string> => {
        const encoder = new TextEncoder();
        const data = encoder.encode(message);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        return Array.from(new Uint8Array(hashBuffer))
            .map(byte => byte.toString(16).padStart(2, "0"))
            .join("");
    };

    useEffect(() => {
        if (!window.ethereum) {
            console.error("No Ethereum provider found.");
            return;
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        const gameContract = new ethers.Contract(gameAddress, gameABI, provider);
        const nftContract = new ethers.Contract(nftAddress, nftABI, provider);
        const rewardsContract = new ethers.Contract(rewardsAddress, rewardsABI, provider);
        const achievementsContract = new ethers.Contract(achievementsAddress, achievementsABI, provider);

        // Truncate Ethereum addresses (e.g., 0x1234...abcd)
        const truncateAddress = (address: string) => {
            return address.length > 10 ? `${address.slice(0, 6)}...${address.slice(-4)}` : address;
        };
        
        const addNotification = async (message: string) => {
            const hash = await hashMessage(message);
            if (!eventHashes.has(hash)) {
                eventHashes.add(hash);
                const newNotifications = [...notifications, { id: hash, message }];
                setNotifications(newNotifications);
                saveToLocalStorage(newNotifications);
            }
        };

        // 🌍 Event Listeners
        gameContract.on("UserSignedUp", (user) => {
            addNotification(`New player joined: ${truncateAddress(user)}`);
        });
        gameContract.on("TotemPurchased", (user, tokenId, species) => {
            addNotification(`🛒 ${truncateAddress(user)} purchased Totem ${tokenId.toString()} (Species: ${species})`);
        });

        nftContract.on("TotemEvolved", (tokenId, newStage, species, rarity) => {
            addNotification(`🔥 Totem ${tokenId.toString()} evolved to stage ${newStage+1}!`);
        });

        achievementsContract.on("ProgressUpdated", (id, user, count) => {
            addNotification(`📈 ${truncateAddress(user)} updated progress - Count: ${count.toString()}`);
            console.log(`ProgressUpdated Event: ID ${id}, User: ${user}, Count: ${count}`);
        });
        achievementsContract.on("AchievementUnlocked", (user, achievementId) => {
            addNotification(`🏆 ${truncateAddress(user)} unlocked Achievement ${achievementId.toString()}!`);
        });

        rewardsContract.on("RewardClaimed", (user, rewardAmount) => {
            addNotification(`💰 ${truncateAddress(user)} claimed ${rewardAmount.toString()} rewards!`);
        });

        return () => {
            gameContract.removeAllListeners();
            nftContract.removeAllListeners();
            rewardsContract.removeAllListeners();
            achievementsContract.removeAllListeners();
        };
    }, [userAddress]);

    return { notifications, setNotifications };
}
