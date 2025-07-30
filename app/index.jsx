import { useEffect, useState } from 'react';
import { ActivityIndicator, TouchableOpacity, View, Text, StyleSheet, SafeAreaView, TextInput, Button, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import dataService from '../services/firestoreDataService';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '../configs/firebaseConfig'; // Import the auth object
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';

export default function HomePage() {
    // In a real app, you would get the userId from your authentication state
    // (e.g., from Firebase Auth, a context provider, etc.).
    const userId = 'test-user-123';

    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState({});

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [user, setUser] = useState(null); // Track user authentication state
    const [actionLoading, setActionLoading] = useState(false); // Show a loader for sign-in/sign-up actions
    // Listener for authentication state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, []);

    // Handle user sign up
    const handleSignUp = async () => {
        console.log("inside signup", auth, email, password)
        if (!email || !password) {
            Alert.alert("Error", "Please enter both email and password.");
            return;
        }
        setActionLoading(true);
        try {
            // Create user with email and password
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            console.log('User signed up:', userCredential.user.email);

            // Create a document for the user in the 'users' collection
            await setDoc(doc(db, "users", userCredential.user.email), {
                email: userCredential.user.email,
                createdAt: serverTimestamp() // Use server timestamp for creation date
            });
            console.log('User document created in Firestore');

            // The onAuthStateChanged listener will handle setting the user state,
            // so no need to call setUser here.
        } catch (error) {
            Alert.alert("Sign Up Error", error.message);
            console.error('Sign up error:', error.code, error.message);
        } finally {
            setActionLoading(false);
        }
    };

    // Handle user sign in
    const handleSignIn = async () => {
        console.log("entered signin", email, password, auth)
        if (!email || !password) {
            Alert.alert("Error", "Please enter both email and password.");
            return;
        }
        setActionLoading(true);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log('User signed in:', userCredential.user.email);
            // The onAuthStateChanged listener will handle setting the user state
        } catch (error) {
            Alert.alert("Sign In Error", error.message);
            console.error('Sign in error:', error.code, error.message);
        } finally {
            setActionLoading(false);
        }
    };

    // Handle user sign out
    const handleSignOut = async () => {
        try {
            await signOut(auth);
            console.log('User signed out');
        } catch (error) {
            Alert.alert("Sign Out Error", error.message);
            console.error('Sign out error:', error.code, error.message);
        }
    };

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
        <SafeAreaView style={styles.safeArea}>
            {user ? (
                // If user is logged in, show a welcome screen
                <View style={styles.authContainer}>
                    <Text style={styles.title}>Welcome!</Text>
                    <Text style={styles.userEmail}>{user.email}</Text>
                    <View style={styles.buttonContainer}>
                        <Button title="Sign Out" onPress={handleSignOut} color="#dc3545" />
                    </View>
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
                </View>
            ) : (
                // If user is not logged in, show the sign-in/sign-up form
                <View style={styles.authContainer}>
                    <Text style={styles.title}>Firebase Auth</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                    {actionLoading ? (
                        <ActivityIndicator size="large" color="#007bff" style={{ marginVertical: 10 }} />
                    ) : (
                        <>
                            <View style={styles.buttonContainer}>
                                <Button title="Sign In" onPress={handleSignIn} />
                            </View>
                            <View style={styles.buttonContainer}>
                                <Button title="Sign Up" onPress={handleSignUp} color="#28a745" />
                            </View>
                        </>
                    )}
                </View>
            )}
        </SafeAreaView>
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
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    authContainer: {
        width: '100%',
        backgroundColor: '#1C2534',
        maxWidth: 400,
        padding: 25,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#ffffffff',
    },
    userEmail: {
        fontSize: 18,
        marginBottom: 20,
        color: '#6c757d',
    },
    input: {
        width: '100%',
        height: 50,
        backgroundColor: '#f1f3f5',
        borderWidth: 1,
        borderColor: '#dee2e6',
        borderRadius: 8,
        paddingHorizontal: 15,
        marginBottom: 15,
        fontSize: 16,
    },
    buttonContainer: {
        width: '100%',
        marginTop: 10,
        alignItems: 'center',
    },
});