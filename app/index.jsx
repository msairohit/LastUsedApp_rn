import { useEffect, useState } from 'react';
import { ActivityIndicator, TouchableOpacity, View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import dataService from '../services/firestoreDataService';

export default function HomePage() {
    // In a real app, you would get the userId from your authentication state
    // (e.g., from Firebase Auth, a context provider, etc.).
    const userId = 'test-user-123';

    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState({});

    const loadData = async () => {
        console.log("load data is called")
        if (!userId) return; // Don't load data if there's no user
        try {
            // Ensure user data is initialized with defaults if they are a new user
            await dataService.initializeUserData(userId);
            // Fetch the user-specific categories
            const fetchedCategories = await dataService.getCategories(userId);
            setCategories(fetchedCategories);
        } catch (error) {
            console.error("Failed to load data:", error);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        loadData();
    }, [userId]); // Re-run if userId changes

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#00C896" />
            </View>
        );
    }

    return (
        <LinearGradient
            colors={['#1D2E42', '#1C2534']}
            style={styles.container}
        >
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <Feather name="clock" size={64} color="#00C896" />
                    <Text style={styles.title}>LastUsed</Text>
                    <Text style={styles.subtitle}>Never forget when you last did something.</Text>
                </View>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={styles.button} onPress={() => router.push("/CategoryManager")}>
                        <Feather name="settings" size={22} color="#fff" />
                        <Text style={styles.buttonText}>Manage Categories</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={() => {
                        console.log("view list");
                        loadData();
                        router.push({
                            pathname: "/TaskList",
                            params: { categories: JSON.stringify(categories) }
                        })
                    }}>
                        <Feather name="list" size={22} color="#fff" />
                        <Text style={styles.buttonText}>View Your Lists</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#181A20',
    },
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 60,
    },
    title: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 20,
        letterSpacing: 1,
    },
    subtitle: {
        fontSize: 18,
        color: '#a0a0a0',
        marginTop: 10,
        textAlign: 'center',
    },
    buttonContainer: {
        width: '100%',
        alignItems: 'center',
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#00C896',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 30,
        marginBottom: 20,
        width: '80%',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 10,
    },
});