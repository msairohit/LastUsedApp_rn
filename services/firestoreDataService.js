import { db } from '../configs/firebaseConfig'; // Import the Firestore instance
import { doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

// Export defaultCategories to be used as a single source of truth
export const defaultCategories = {
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
    console.log("Initializing for user", userId)
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
            console.log("data: ", data)
            if (data.timestamps === undefined) {
                await updateDoc(userDocRef, { timestamps: {} });
                console.log(`Added timestamps field for user ${userId}`);
            }
            // Also check for categories, in case an old user document exists without it
            if (data.categories === undefined) {
                await updateDoc(userDocRef, { categories: defaultCategories });
                console.log(`Added categories field for user ${userId}`);
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
            // Ensure categories field exists, otherwise return default
            return docSnapshot.data().categories || defaultCategories;
        }
        // If the user has no data, return the default set.
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

const addCategory = async (userId, categoryName) => {
    if (!userId || !categoryName) {
        console.error("User ID and category name are required.");
        return;
    }
    const userDocRef = doc(db, 'users', userId);
    try {
        await updateDoc(userDocRef, {
            [`categories.${categoryName}`]: []
        });
        console.log(`Category '${categoryName}' added for user ${userId}`);
    } catch (e) {
        console.error(`Failed to add category for user ${userId}:`, e);
    }
};

const removeCategory = async (userId, categoryName) => {
    if (!userId || !categoryName) {
        console.error("User ID and category name are required.");
        return;
    }
    const userDocRef = doc(db, 'users', userId);
    try {
        // Atomically remove the category and its timestamps
        const userDoc = await getDoc(userDocRef);
        const userData = userDoc.data();
        const currentCategories = userData.categories;
        const currentTimestamps = userData.timestamps;

        delete currentCategories[categoryName];
        if (currentTimestamps && currentTimestamps[categoryName]) {
            delete currentTimestamps[categoryName];
        }

        await setDoc(userDocRef, { ...userData, categories: currentCategories, timestamps: currentTimestamps });
        console.log(`Category '${categoryName}' and its timestamps removed for user ${userId}`);
    } catch (e) {
        console.error(`Failed to remove category for user ${userId}:`, e);
    }
};

const updateCategoryName = async (userId, oldName, newName) => {
    if (!userId || !oldName || !newName) {
        console.error("User ID, old name, and new name are required.");
        return;
    }
    const userDocRef = doc(db, 'users', userId);
    try {
        const userDoc = await getDoc(userDocRef);
        const userData = userDoc.data();
        const currentCategories = userData.categories;
        const currentTimestamps = userData.timestamps;

        if (currentCategories[oldName]) {
            // Copy subcategories and timestamps to the new category name
            currentCategories[newName] = currentCategories[oldName];
            delete currentCategories[oldName];

            if (currentTimestamps && currentTimestamps[oldName]) {
                currentTimestamps[newName] = currentTimestamps[oldName];
                delete currentTimestamps[oldName];
            }

            await setDoc(userDocRef, { ...userData, categories: currentCategories, timestamps: currentTimestamps });
            console.log(`Category '${oldName}' renamed to '${newName}' for user ${userId}`);
        }
    } catch (e) {
        console.error(`Failed to update category name for user ${userId}:`, e);
    }
};

const addSubcategory = async (userId, category, subcategory) => {
    if (!userId || !category || !subcategory) {
        console.error("User ID, category, and subcategory are required.");
        return;
    }
    const userDocRef = doc(db, 'users', userId);
    try {
        await updateDoc(userDocRef, {
            [`categories.${category}`]: arrayUnion(subcategory)
        });
        console.log(`'${subcategory}' added to '${category}' for user ${userId}`);
    } catch (e) {
        console.error(`Failed to add subcategory for user ${userId}:`, e);
    }
};

const removeSubcategory = async (userId, category, subcategory) => {
    if (!userId || !category || !subcategory) {
        console.error("User ID, category, and subcategory are required.");
        return;
    }
    const userDocRef = doc(db, 'users', userId);
    try {
        // Atomically remove the subcategory and its timestamps
        const userDoc = await getDoc(userDocRef);
        const userData = userDoc.data();
        const currentCategories = userData.categories;
        const currentTimestamps = userData.timestamps;

        // Remove subcategory from the category list
        if (currentCategories[category]) {
            currentCategories[category] = currentCategories[category].filter(item => item !== subcategory);
        }

        // Remove timestamps for the subcategory
        if (currentTimestamps && currentTimestamps[category] && currentTimestamps[category][subcategory]) {
            delete currentTimestamps[category][subcategory];
        }

        await setDoc(userDocRef, { ...userData, categories: currentCategories, timestamps: currentTimestamps });
        console.log(`'${subcategory}' and its timestamps removed from '${category}' for user ${userId}`);
    } catch (e) {
        console.error(`Failed to remove subcategory for user ${userId}:`, e);
    }
};

const updateSubcategoryName = async (userId, category, oldName, newName) => {
    if (!userId || !category || !oldName || !newName) {
        console.error("User ID, category, old name, and new name are required.");
        return;
    }
    const userDocRef = doc(db, 'users', userId);
    try {
        const userDoc = await getDoc(userDocRef);
        const userData = userDoc.data();
        const currentCategories = userData.categories;
        const currentTimestamps = userData.timestamps;

        // Update subcategory name in the category list
        if (currentCategories[category]) {
            const index = currentCategories[category].indexOf(oldName);
            if (index > -1) {
                currentCategories[category][index] = newName;
            }
        }

        // Move timestamps to the new subcategory name
        if (currentTimestamps && currentTimestamps[category] && currentTimestamps[category][oldName]) {
            currentTimestamps[category][newName] = currentTimestamps[category][oldName];
            delete currentTimestamps[category][oldName];
        }

        await setDoc(userDocRef, { ...userData, categories: currentCategories, timestamps: currentTimestamps });
        console.log(`Subcategory '${oldName}' in '${category}' renamed to '${newName}' for user ${userId}`);
    } catch (e) {
        console.error(`Failed to update subcategory name for user ${userId}:`, e);
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
    addCategory,
    removeCategory,
    updateCategoryName,
    addSubcategory,
    removeSubcategory,
    updateSubcategoryName,
    addTimestamp,
    removeTimestamp
};
