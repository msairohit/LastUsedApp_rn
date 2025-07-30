import { Stack } from 'expo-router';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <Stack>
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="TaskList" options={{ headerShown: false }} />
                <Stack.Screen name="CategoryManager" options={{ headerShown: false }} />
            </Stack>
        </GestureHandlerRootView>
    );
}
