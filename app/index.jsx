import React, { useEffect } from 'react';
import { ActivityIndicator, View, Text, StyleSheet, SafeAreaView, TextInput, Alert, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import dataService, { defaultCategories } from '../services/firestoreDataService';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '../configs/firebaseConfig';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, FadeInUp, FadeInDown } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function HomePage() {
    const router = useRouter();
    const [loading, setLoading] = React.useState(true);
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [user, setUser] = React.useState(null);
    const [actionLoading, setActionLoading] = React.useState(false);

    const formOpacity = useSharedValue(0);
    const logoScale = useSharedValue(0.5);

    const formAnimatedStyle = useAnimatedStyle(() => {
        return {
            opacity: formOpacity.value,
        };
    });

    const logoAnimatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: logoScale.value }],
        };
    });

    useEffect(() => {
        logoScale.value = withSpring(1, { damping: 12 });
        formOpacity.value = withTiming(1, { duration: 800 });
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleSignUp = async () => {
        if (!email || !password) {
            Alert.alert("Error", "Please enter both email and password.");
            return;
        }
        setActionLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await setDoc(doc(db, "users", userCredential.user.email), {
                email: userCredential.user.email,
                createdAt: serverTimestamp(),
                categories: defaultCategories,
                timestamps: {}
            });
        } catch (error) {
            Alert.alert("Sign Up Error", error.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleSignIn = async () => {
        if (!email || !password) {
            Alert.alert("Error", "Please enter both email and password.");
            return;
        }
        setActionLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            Alert.alert("Sign In Error", error.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            Alert.alert("Sign Out Error", error.message);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#10B981" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            {user ? (
                <Animated.View style={styles.container} entering={FadeInUp.duration(500)}>
                    <View style={styles.welcomeHeader}>
                        <Text style={styles.welcomeTitle}>Welcome Back!</Text>
                        <Text style={styles.userEmail}>{user.email}</Text>
                    </View>

                    <Animated.View style={logoAnimatedStyle}>
                        <Feather name="clock" size={80} color="#10B981" />
                    </Animated.View>

                    <View style={styles.mainContent}>
                        <Text style={styles.title}>LastUsed</Text>
                        <Text style={styles.subtitle}>Never forget when you last did something.</Text>
                    </View>

                    <View style={styles.buttonGroup}>
                        <AnimatedPressable style={styles.button} onPress={() => router.push("/TaskList")} entering={FadeInDown.duration(500).delay(200)}>
                            <Feather name="list" size={22} color="#fff" />
                            <Text style={styles.buttonText}>View Your Lists</Text>
                        </AnimatedPressable>
                        <AnimatedPressable style={styles.button} onPress={() => router.push("/CategoryManager")} entering={FadeInDown.duration(500).delay(400)}>
                            <Feather name="settings" size={22} color="#fff" />
                            <Text style={styles.buttonText}>Manage Categories</Text>
                        </AnimatedPressable>
                        <AnimatedPressable style={[styles.button, styles.signOutButton]} onPress={handleSignOut} entering={FadeInDown.duration(500).delay(600)}>
                            <Feather name="log-out" size={22} color="#fff" />
                            <Text style={styles.buttonText}>Sign Out</Text>
                        </AnimatedPressable>
                    </View>
                </Animated.View>
            ) : (
                <Animated.View style={[styles.authContainer, formAnimatedStyle]}>
                    <Animated.View style={logoAnimatedStyle} entering={FadeInUp.duration(500)}>
                        <Feather name="clock" size={64} color="#10B981" />
                    </Animated.View>
                    <Text style={styles.authTitle}>Get Started</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        placeholderTextColor="#9CA3AF"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        placeholderTextColor="#9CA3AF"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                    {actionLoading ? (
                        <ActivityIndicator size="large" color="#10B981" style={{ marginVertical: 20 }} />
                    ) : (
                        <View style={styles.authButtonGroup}>
                            <Pressable style={styles.authButton} onPress={handleSignIn}>
                                <Text style={styles.authButtonText}>Sign In</Text>
                            </Pressable>
                            <Pressable style={[styles.authButton, styles.signUpButton]} onPress={handleSignUp}>
                                <Text style={styles.authButtonText}>Sign Up</Text>
                            </Pressable>
                        </View>
                    )}
                </Animated.View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#111827',
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#111827',
    },
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: 20,
    },
    welcomeHeader: {
        alignItems: 'center',
    },
    welcomeTitle: {
        fontSize: 24,
        fontWeight: '600',
        color: '#F9FAFB',
    },
    userEmail: {
        fontSize: 16,
        color: '#9CA3AF',
        marginTop: 4,
    },
    mainContent: {
        alignItems: 'center',
    },
    title: {
        fontSize: 52,
        fontWeight: 'bold',
        color: '#fff',
        letterSpacing: 1,
    },
    subtitle: {
        fontSize: 18,
        color: '#9CA3AF',
        marginTop: 10,
        textAlign: 'center',
    },
    buttonGroup: {
        width: '100%',
        alignItems: 'center',
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#10B981',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 30,
        marginBottom: 16,
        width: '90%',
        shadowColor: '#059669',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 12,
    },
    signOutButton: {
        backgroundColor: '#EF4444',
        shadowColor: '#DC2626',
    },
    // Auth Screen Styles
    authContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    authTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#F9FAFB',
        marginBottom: 30,
        marginTop: 20,
    },
    input: {
        width: '100%',
        height: 50,
        backgroundColor: '#1F2937',
        color: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#374151',
        borderRadius: 12,
        paddingHorizontal: 15,
        marginBottom: 15,
        fontSize: 16,
    },
    authButtonGroup: {
        width: '100%',
        marginTop: 20,
    },
    authButton: {
        backgroundColor: '#10B981',
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 12,
    },
    signUpButton: {
        backgroundColor: '#374151',
    },
    authButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
