import { Stack } from 'expo-router';
import React from 'react';

export default function RootLayout() {
    return (
        <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="TaskList" options={{ headerShown: false }} />
            <Stack.Screen name="CategoryManager" options={{ headerShown: false }} />
        </Stack>
    );
}