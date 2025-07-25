import { db } from '../configs/firebaseConfig'; // Import the Firestore instance
import { doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

const defaultCategories = {
    "Personal Care": [
        "Haircut", "Beard Trim", "Nail Clipping", "Skincare Routine", "Dental Cleaning",
        "Eyebrow Threading", "Hair Coloring", "Shaving", "Hair Oiling", "Pedicure"
    ],
    "Home Maintenance": [
        "AC Filter Cleaned", "Battery Replaced (Remote)", "Refrigerator Defrosted",
        "Water Filter Changed", "Washing Machine Cleaned", "Lights Replaced",
        "Gas Cylinder Refilled", "Generator Oil Changed", "Fire Alarm Tested", "Roof/Gutter Cleaned"
    ],
    "Digital_Bills": [
        "Mobile Recharged", "Internet Bill Paid", "Electricity Bill Paid",
        "Netflix Subscription Renewed", "Phone Storage Cleared", "Password Changed",
        "Data Backup Done", "Antivirus Updated", "VPN Subscription Paid", "Credit Card Bill Paid"
    ]
};

const initializeUserData = async (userId) => {
    if (!userId) {
        console.error("User ID is required to initialize user data.");
        return;
    }
    const userDocRef = doc(db, 'users', userId);
    try {
        const docSnapshot = await getDoc(userDocRef);
        if (!docSnapshot.exists()) {
            // If the user document does not exist, create it with default categories and empty timestamps.
            await setDoc(userDocRef, { categories: defaultCategories, timestamps: {} });
            console.log(`Default categories and timestamps stored for user ${userId}`);
        } else {
            // Check if timestamps field exists, if not, add it.
            const data = docSnapshot.data();
            if (data.timestamps === undefined) {
                await updateDoc(userDocRef, { timestamps: {} });
                console.log(`Added timestamps field for user ${userId}`);
            } else {
                console.log(`User ${userId} already has data. Skipping initialization.`);
            }
        }
    } catch (e) {
        console.error(`Failed to initialize data for user ${userId}:`, e);
    }
};

const getCategories = async (userId) => {
    if (!userId) {
        console.error("User ID is required to get categories.");
        return defaultCategories; // Fallback to default for safety
    }
    const userDocRef = doc(db, 'users', userId);
    try {
        const docSnapshot = await getDoc(userDocRef);
        if (docSnapshot.exists()) {
            return docSnapshot.data().categories;
        }
        // If the user has no data, return the default set.
        // The app should call initializeUserData on login/signup to prevent this.
        console.log(`No categories found for user ${userId}, returning default set.`);
        return defaultCategories;
    } catch (e) {
        console.error(`Failed to get categories for user ${userId}:`, e);
        return defaultCategories; // Fallback on error
    }
};

const getTimestamps = async (userId) => {
    if (!userId) {
        console.error("User ID is required to get timestamps.");
        return {};
    }
    const userDocRef = doc(db, 'users', userId);
    try {
        const docSnapshot = await getDoc(userDocRef);
        if (docSnapshot.exists() && docSnapshot.data().timestamps) {
            return docSnapshot.data().timestamps;
        }
        return {};
    } catch (e) {
        console.error(`Failed to get timestamps for user ${userId}:`, e);
        return {};
    }
};

const addItem = async (userId, category, newItem) => {
    if (!userId) {
        console.error("User ID is required to add an item.");
        return;
    }
    const userDocRef = doc(db, 'users', userId);
    try {
        // Use dot notation to update a field in a map.
        await updateDoc(userDocRef, {
            [`categories.${category}`]: arrayUnion(newItem)
        });
        console.log(`'${newItem}' added to '${category}' for user ${userId}`);
    } catch (e) {
        console.error(`Failed to add item for user ${userId}:`, e);
    }
};

const removeItem = async (userId, category, itemToRemove) => {
    if (!userId) {
        console.error("User ID is required to remove an item.");
        return;
    }
    const userDocRef = doc(db, 'users', userId);
    try {
        await updateDoc(userDocRef, {
            [`categories.${category}`]: arrayRemove(itemToRemove)
        });
        console.log(`'${itemToRemove}' removed from '${category}' for user ${userId}`);
    } catch (e) {
        console.error(`Failed to remove item for user ${userId}:`, e);
    }
};

const addTimestamp = async (userId, category, subcategory, timestamp) => {
    if (!userId) {
        console.error("User ID is required to add a timestamp.");
        return;
    }
    const userDocRef = doc(db, 'users', userId);
    const fieldPath = `timestamps.${category}.${subcategory}`;
    try {
        await updateDoc(userDocRef, {
            [fieldPath]: arrayUnion(timestamp)
        });
        console.log(`Timestamp added to '${category}.${subcategory}' for user ${userId}`);
    } catch (e) {
        console.error(`Failed to add timestamp for user ${userId}:`, e);
    }
};

const removeTimestamp = async (userId, category, subcategory, timestamp) => {
    if (!userId) {
        console.error("User ID is required to remove a timestamp.");
        return;
    }
    const userDocRef = doc(db, 'users', userId);
    const fieldPath = `timestamps.${category}.${subcategory}`;
    try {
        await updateDoc(userDocRef, {
            [fieldPath]: arrayRemove(timestamp)
        });
        console.log(`Timestamp removed from '${category}.${subcategory}' for user ${userId}`);
    } catch (e) {
        console.error(`Failed to remove timestamp for user ${userId}:`, e);
    }
};

export default {
    initializeUserData,
    getCategories,
    getTimestamps,
    addItem,
    removeItem,
    addTimestamp,
    removeTimestamp
};