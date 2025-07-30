import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
    Modal, ActivityIndicator, Alert, LayoutAnimation, UIManager, Platform, Pressable
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import dataService from '../services/firestoreDataService';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../configs/firebaseConfig';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const CategoryItem = ({ categoryName, subcategories, onOpenModal, onDelete }) => {
    const [expanded, setExpanded] = useState(false);

    const toggleExpand = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded(!expanded);
    }

    return (
        <Animated.View style={styles.categoryContainer} entering={FadeInDown}>
            <TouchableOpacity style={styles.categoryHeader} onPress={toggleExpand} activeOpacity={0.8}>
                <Text style={styles.categoryName}>{categoryName}</Text>
                <View style={styles.iconContainer}>
                    <TouchableOpacity onPress={() => onOpenModal('editCategory', { categoryName, currentName: categoryName })}>
                        <Feather name="edit" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => onDelete('category', { name: categoryName })}>
                        <Feather name="trash-2" size={20} color="#F87171" />
                    </TouchableOpacity>
                    <Feather name={expanded ? "chevron-up" : "chevron-down"} size={24} color="#9CA3AF" />
                </View>
            </TouchableOpacity>

            {expanded && (
                <View>
                    {subcategories.map(subcategoryName => (
                        <View key={subcategoryName} style={styles.subcategoryRow}>
                            <Text style={styles.subcategoryName}>{subcategoryName}</Text>
                            <View style={styles.iconContainer}>
                                <TouchableOpacity onPress={() => onOpenModal('editSubcategory', { categoryName, subcategoryName, currentName: subcategoryName })}>
                                    <Feather name="edit" size={18} color="#9CA3AF" />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => onDelete('subcategory', { categoryName, name: subcategoryName })}>
                                    <Feather name="trash-2" size={18} color="#F87171" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                    <TouchableOpacity style={styles.addSubcategoryButton} onPress={() => onOpenModal('addSubcategory', { categoryName })}>
                        <Feather name="plus" size={18} color="#10B981" />
                        <Text style={styles.addSubcategoryText}>Add Subcategory</Text>
                    </TouchableOpacity>
                </View>
            )}
        </Animated.View>
    );
};


const CategoryManager = () => {
    const [user, setUser] = useState(null);
    const [categories, setCategories] = useState({});
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalConfig, setModalConfig] = useState({ type: '', data: {} });
    const [inputValue, setInputValue] = useState('');

    const fetchCategories = useCallback(async (userId) => {
        if (!userId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const userCategories = await dataService.getCategories(userId);
            setCategories(userCategories);
        } catch (error) {
            console.error("Error fetching categories:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                fetchCategories(currentUser.email);
            } else {
                setCategories({});
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, [fetchCategories]);

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
        if (!user) return;
        const { type, data } = modalConfig;
        if (!inputValue.trim()) return;

        handleCloseModal();
        setLoading(true);
        const userId = user.email;

        try {
            switch (type) {
                case 'addCategory': await dataService.addCategory(userId, inputValue); break;
                case 'editCategory': await dataService.updateCategoryName(userId, data.categoryName, inputValue); break;
                case 'addSubcategory': await dataService.addSubcategory(userId, data.categoryName, inputValue); break;
                case 'editSubcategory': await dataService.updateSubcategoryName(userId, data.categoryName, data.subcategoryName, inputValue); break;
            }
        } catch (error) {
            console.error("Failed to save changes:", error);
        } finally {
            await fetchCategories(userId);
        }
    };

    const handleDelete = (type, data) => {
        if (!user) return;
        Alert.alert(
            `Delete ${type}`,
            `Are you sure you want to delete "${data.name}"? This cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete', style: 'destructive',
                    onPress: async () => {
                        setLoading(true);
                        const userId = user.email;
                        try {
                            if (type === 'category') {
                                await dataService.removeCategory(userId, data.name);
                            } else {
                                await dataService.removeSubcategory(userId, data.categoryName, data.name);
                            }
                        } catch (error) {
                            console.error("Failed to delete:", error);
                        } finally {
                            await fetchCategories(userId);
                        }
                    }
                }
            ]
        );
    };

    if (loading && !modalVisible) {
        return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#10B981" /></View>;
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#111827' }}>
            <ScrollView style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Manage Categories</Text>
                    <TouchableOpacity style={styles.addButton} onPress={() => handleOpenModal('addCategory')}>
                        <Feather name="plus" size={20} color="#fff" />
                        <Text style={styles.addButtonText}>Add</Text>
                    </TouchableOpacity>
                </View>

                {Object.keys(categories).map(categoryName => (
                    <CategoryItem
                        key={categoryName}
                        categoryName={categoryName}
                        subcategories={categories[categoryName]}
                        onOpenModal={handleOpenModal}
                        onDelete={handleDelete}
                    />
                ))}

                <Modal animationType="fade" transparent={true} visible={modalVisible} onRequestClose={handleCloseModal}>
                    <View style={styles.modalOverlay}>
                        <Animated.View style={styles.modalContent} entering={FadeIn.duration(300)} exiting={FadeOut.duration(300)}>
                            <Text style={styles.modalTitle}>{
                                {
                                    'addCategory': 'Add New Category',
                                    'editCategory': 'Edit Category Name',
                                    'addSubcategory': `Add to ${modalConfig.data.categoryName}`,
                                    'editSubcategory': 'Edit Subcategory Name'
                                }[modalConfig.type]
                            }</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter name..."
                                placeholderTextColor="#9CA3AF"
                                value={inputValue}
                                onChangeText={setInputValue}
                                autoFocus={true}
                            />
                            <View style={styles.modalActions}>
                                <Pressable style={[styles.button, styles.cancelButton]} onPress={handleCloseModal}>
                                    <Text style={styles.buttonText}>Cancel</Text>
                                </Pressable>
                                <Pressable style={[styles.button, styles.saveButton]} onPress={handleSaveChanges}>
                                    <Text style={styles.buttonText}>Save</Text>
                                </Pressable>
                            </View>
                        </Animated.View>
                    </View>
                </Modal>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#111827', padding: 20, paddingTop: 60 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111827' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    title: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
    addButton: { flexDirection: 'row', backgroundColor: '#10B981', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 20, alignItems: 'center' },
    addButtonText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 },
    categoryContainer: { backgroundColor: '#1F2937', borderRadius: 15, marginBottom: 16, overflow: 'hidden' },
    categoryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15 },
    categoryName: { fontSize: 20, fontWeight: '600', color: '#fff' },
    iconContainer: { flexDirection: 'row', gap: 16, alignItems: 'center' },
    subcategoryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 15, borderTopWidth: 1, borderTopColor: '#374151' },
    subcategoryName: { fontSize: 16, color: '#D1D5DB' },
    addSubcategoryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderTopWidth: 1, borderTopColor: '#374151' },
    addSubcategoryText: { color: '#10B981', marginLeft: 8, fontWeight: '600' },
    modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.8)' },
    modalContent: { width: '90%', backgroundColor: '#1F2937', borderRadius: 15, padding: 20, alignItems: 'center' },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 20 },
    input: { width: '100%', backgroundColor: '#374151', color: '#fff', padding: 15, borderRadius: 10, fontSize: 16, marginBottom: 20 },
    modalActions: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
    button: { flex: 1, padding: 15, borderRadius: 10, alignItems: 'center' },
    cancelButton: { backgroundColor: '#4B5563', marginRight: 10 },
    saveButton: { backgroundColor: '#10B981', marginLeft: 10 },
    buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});

export default CategoryManager;
