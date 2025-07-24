import AsyncStorage from '@react-native-async-storage/async-storage';

const categories = {
    "Personal Care": [
        "Haircut", "Beard Trim", "Nail Clipping", "Skincare Routine", "Dental Cleaning",
        "Eyebrow Threading", "Hair Coloring", "Shaving", "Hair Oiling", "Pedicure"
    ],
    "Home Maintenance": [
        "AC Filter Cleaned", "Battery Replaced (Remote)", "Refrigerator Defrosted",
        "Water Filter Changed", "Washing Machine Cleaned", "Lights Replaced",
        "Gas Cylinder Refilled", "Generator Oil Changed", "Fire Alarm Tested", "Roof/Gutter Cleaned"
    ],
    "Digital/Bills": [
        "Mobile Recharged", "Internet Bill Paid", "Electricity Bill Paid",
        "Netflix Subscription Renewed", "Phone Storage Cleared", "Password Changed",
        "Data Backup Done", "Antivirus Updated", "VPN Subscription Paid", "Credit Card Bill Paid"
    ]
};

const initializeData = async () => {
    try {
        console.log("loading data")
        // Loop through each category and store them as separate lists only if they don't exist
        for (const [key, value] of Object.entries(categories)) {
            const existingItems = await AsyncStorage.getItem(`categories_${key}`);
            if (!existingItems) {
                // If the category does not exist, store it
                await AsyncStorage.setItem(`categories_${key}`, JSON.stringify(value));
                console.log(`${key} stored successfully!`);
            } else {
                console.log(`${key} already exists. Skipping storage.`);
            }
        }
    } catch (e) {
        // Handle error
        console.error('Failed to save categories:', e);
    }
    console.log("completed")
};
const getCategories = async () => {
    const allKeys = await AsyncStorage.getAllKeys();
    const categoryKeys = allKeys.filter(key => key.startsWith('categories_'));
    const categoryValues = await AsyncStorage.multiGet(categoryKeys);

    const retrievedCategories = {};
    categoryValues.forEach(([key, value]) => {
        if (value) {
            retrievedCategories[key.replace('categories_', '')] = JSON.parse(value);
        }
    });
    return retrievedCategories; // Return the retrieved categories
};

const addItem = async (category, newItem) => {
    try {
        const existingItems = await AsyncStorage.getItem(`categories_${category}`);
        const itemsArray = existingItems ? JSON.parse(existingItems) : [];
        if (!itemsArray.includes(newItem)) { // Check if the item already exists
            itemsArray.push(newItem); // Add new item
            await AsyncStorage.setItem(`categories_${category}`, JSON.stringify(itemsArray));
            console.log(`${newItem} added to ${category}`);
        } else {
            console.log(`${newItem} already exists in ${category}.`);
        }
    } catch (e) {
        console.error('Failed to add item:', e);
    }
};

const removeItem = async (category, itemToRemove) => {
    try {
        const existingItems = await AsyncStorage.getItem(`categories_${category}`);
        const itemsArray = existingItems ? JSON.parse(existingItems) : [];
        const updatedArray = itemsArray.filter(item => item !== itemToRemove); // Remove item
        await AsyncStorage.setItem(`categories_${category}`, JSON.stringify(updatedArray));
        console.log(`${itemToRemove} removed from ${category}`);
    } catch (e) {
        console.error('Failed to remove item:', e);
    }
};
// Exporting all functions as part of a single object directly
export default {
    initializeData,
    getCategories,
    addItem,
    removeItem
};