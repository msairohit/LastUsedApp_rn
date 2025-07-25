import { Stack } from 'expo-router';
import React from 'react';

export default function RootLayout() {
    return (
        <Stack>
            <Stack.Screen name="index" options={{ title: 'Home' }} />
            <Stack.Screen name="TaskList" options={{ title: 'Task List' }} />
            <Stack.Screen name="CategoryManager" options={{ title: 'Manage Categories' }} />
        </Stack>
    );
}