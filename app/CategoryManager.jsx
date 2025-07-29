import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
    Modal, ActivityIndicator, Alert
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import dataService from '../services/firestoreDataService';

const CategoryManager = () => {
    const userId = 'test-user-123'; // Hardcoded for now
    const [categories, setCategories] = useState({});
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalConfig, setModalConfig] = useState({ type: '', data: {} });
    const [inputValue, setInputValue] = useState('');

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setLoading(true);
        const userCategories = await dataService.getCategories(userId);
        setCategories(userCategories);
        setLoading(false);
    };

    const handleOpenModal = (type, data = {}) => {
        setModalConfig({ type, data });
        setInputValue(data.currentName || '');
        setModalVisible(true);
    };

    const handleCloseModal = () => {
        setModalVisible(false);
        setInputValue('');
    };

    const handleSaveChanges = async () => {
        const { type, data } = modalConfig;
        if (!inputValue.trim()) {
            Alert.alert("Validation Error", "Name cannot be empty.");
            return;
        }

        setLoading(true);
        handleCloseModal();

        try {
            switch (type) {
                case 'addCategory':
                    await dataService.addCategory(userId, inputValue);
                    break;
                case 'editCategory':
                    await dataService.updateCategoryName(userId, data.categoryName, inputValue);
                    break;
                case 'addSubcategory':
                    await dataService.addSubcategory(userId, data.categoryName, inputValue);
                    break;
                case 'editSubcategory':
                    await dataService.updateSubcategoryName(userId, data.categoryName, data.subcategoryName, inputValue);
                    break;
                default:
                    break;
            }
        } catch (error) {
            console.error("Failed to save changes:", error);
            Alert.alert("Error", "Could not save changes. Please try again.");
        } finally {
            await fetchCategories(); // Re-fetch to ensure UI is in sync
        }
    };

    const handleDelete = (type, data) => {
        Alert.alert(
            `Confirm Deletion`,
            `Are you sure you want to delete "${data.name}"? This action cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete', style: 'destructive',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            if (type === 'category') {
                                await dataService.removeCategory(userId, data.name);
                            } else {
                                await dataService.removeSubcategory(userId, data.categoryName, data.name);
                            }
                        } catch (error) {
                            console.error("Failed to delete:", error);
                            Alert.alert("Error", "Could not delete item. Please try again.");
                        } finally {
                            await fetchCategories();
                        }
                    }
                }
            ]
        );
    };

    if (loading && !modalVisible) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#00C896" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Manage Categories</Text>
                <TouchableOpacity style={styles.addButton} onPress={() => handleOpenModal('addCategory')}>
                    <Feather name="plus" size={20} color="#fff" />
                    <Text style={styles.addButtonText}>Add Category</Text>
                </TouchableOpacity>
            </View>

            {Object.keys(categories).map(categoryName => (
                <View key={categoryName} style={styles.categoryContainer}>
                    <View style={styles.categoryHeader}>
                        <Text style={styles.categoryName}>{categoryName}</Text>
                        <View style={styles.iconContainer}>
                            <TouchableOpacity onPress={() => handleOpenModal('editCategory', { categoryName, currentName: categoryName })}>
                                <Feather name="edit" size={20} color="#9DB2BF" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleDelete('category', { name: categoryName })}>
                                <Feather name="trash-2" size={20} color="#E57373" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {categories[categoryName].map(subcategoryName => (
                        <View key={subcategoryName} style={styles.subcategoryRow}>
                            <Text style={styles.subcategoryName}>{subcategoryName}</Text>
                            <View style={styles.iconContainer}>
                                <TouchableOpacity onPress={() => handleOpenModal('editSubcategory', { categoryName, subcategoryName, currentName: subcategoryName })}>
                                    <Feather name="edit" size={18} color="#9DB2BF" />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleDelete('subcategory', { categoryName, name: subcategoryName })}>
                                    <Feather name="trash-2" size={18} color="#E57373" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}

                    <TouchableOpacity style={styles.addSubcategoryButton} onPress={() => handleOpenModal('addSubcategory', { categoryName })}>
                        <Feather name="plus-circle" size={18} color="#00C896" />
                        <Text style={styles.addSubcategoryText}>Add Subcategory</Text>
                    </TouchableOpacity>
                </View>
            ))}

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={handleCloseModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{
                            {
                                'addCategory': 'Add New Category',
                                'editCategory': 'Edit Category Name',
                                'addSubcategory': `Add Subcategory to ${modalConfig.data.categoryName}`,
                                'editSubcategory': 'Edit Subcategory Name'
                            }[modalConfig.type]
                        }</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter name..."
                            placeholderTextColor="#888"
                            value={inputValue}
                            onChangeText={setInputValue}
                            autoFocus={true}
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleCloseModal}>
                                <Text style={styles.buttonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSaveChanges}>
                                <Text style={styles.buttonText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#181A20',
        padding: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#181A20',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
    },
    addButton: {
        flexDirection: 'row',
        backgroundColor: '#00C896',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 20,
        alignItems: 'center',
    },
    addButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        marginLeft: 8,
    },
    categoryContainer: {
        backgroundColor: '#23272F',
        borderRadius: 15,
        padding: 15,
        marginBottom: 20,
    },
    categoryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#39424E',
        paddingBottom: 10,
        marginBottom: 10,
    },
    categoryName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    iconContainer: {
        flexDirection: 'row',
        gap: 20,
    },
    subcategoryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        paddingLeft: 10,
    },
    subcategoryName: {
        fontSize: 16,
        color: '#D3D3D3',
    },
    addSubcategoryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        padding: 10,
        borderRadius: 8,
        backgroundColor: 'rgba(0, 200, 150, 0.1)',
        justifyContent: 'center',
    },
    addSubcategoryText: {
        color: '#00C896',
        marginLeft: 8,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    modalContent: {
        width: '90%',
        backgroundColor: '#23272F',
        borderRadius: 15,
        padding: 20,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 20,
    },
    input: {
        width: '100%',
        backgroundColor: '#181A20',
        color: '#fff',
        padding: 15,
        borderRadius: 10,
        fontSize: 16,
        marginBottom: 20,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    button: {
        flex: 1,
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#4A5568',
        marginRight: 10,
    },
    saveButton: {
        backgroundColor: '#00C896',
        marginLeft: 10,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default CategoryManager;
