import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESSES } from '../config/contracts';
import { Notification } from "../types/types";
import gameABI from "../contracts/TotemGame.abi.json";
import nftABI from "../contracts/TotemNFT.abi.json";
import shopABI from "../contracts/TotemShop.abi.json";
import rewardsABI from "../contracts/TotemRewards.abi.json";
import achievementsABI from "../contracts/TotemAchievements.abi.json";
import { getUserStorage, setUserStorage } from "../utils/localStorage";
import { STORAGE_KEYS } from "../config/constants";

const gameAddress = CONTRACT_ADDRESSES.game;
const nftAddress = CONTRACT_ADDRESSES.nft;
const shopAddress = CONTRACT_ADDRESSES.shop;
const rewardsAddress = CONTRACT_ADDRESSES.rewards;
const achievementsAddress = CONTRACT_ADDRESSES.achievements;

export function useContractEvents(userAddress: string | null) {
    const [notifications, setNotifications] = useState<Notification[]>(() => {
        // Load saved notifications from localStorage on startup
        return getUserStorage<Notification[]>(STORAGE_KEYS.notifications, userAddress, []);
    });
    const eventHashes = new Set<string>(notifications.map(n => n.id)); // Hash-based duplicate tracking

    const saveNotifications = (notifications: Notification[]) => {
        setUserStorage(STORAGE_KEYS.notifications, userAddress, notifications);
    };

    const hashMessage = async (message: string): Promise<string> => {
        const encoder = new TextEncoder();
        const data = encoder.encode(message);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        return Array.from(new Uint8Array(hashBuffer))
            .map(byte => byte.toString(16).padStart(2, "0"))
            .join("");
    };

    const updateNotifications = (newNotifications: Notification[]) => {
        setNotifications(newNotifications);
        saveNotifications(newNotifications);
    };

    // Mark notification as read
    const markAsRead = (id: string) => {
        const updatedNotifications = notifications.map(notification => 
            notification.id === id 
                ? { ...notification, isRead: true } 
                : notification
        );
        updateNotifications(updatedNotifications);
    };

    const removeNotification = (id: string) => {
        const updatedNotifications = notifications.filter(notification => notification.id !== id);
        updateNotifications(updatedNotifications);
    };

    const markAllAsRead = () => {
        const updatedNotifications = notifications.map(notification => ({
            ...notification,
            isRead: true
        }));
        updateNotifications(updatedNotifications);
    };

    useEffect(() => {
        if (!window.ethereum) {
            console.error("No Ethereum provider found.");
            return;
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        const gameContract = new ethers.Contract(gameAddress, gameABI, provider);
        const nftContract = new ethers.Contract(nftAddress, nftABI, provider);
        const shopContract = new ethers.Contract(shopAddress, shopABI, provider);
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
                const newNotification: Notification = { 
                    id: hash, 
                    message, 
                    isRead: false,
                    timestamp: Date.now()
                };
                const newNotifications = [...notifications, newNotification];
                updateNotifications(newNotifications);
            }
        };

        // 🌍 Event Listeners
        gameContract.on("UserSignedUp", (user) => {
            addNotification(`New player joined: ${truncateAddress(user)}`);
        });
        
        shopContract.on("TotemPurchased", (user, tokenId, species) => {
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

    return { 
        notifications, 
        setNotifications: updateNotifications, 
        markAsRead,
        removeNotification,
        markAllAsRead
    };
}
