import { Stack } from 'expo-router';
import { useContext } from 'react';
import { AuthContext } from '@/context/auth/AuthProvider';

export default function RootLayout() {
  const { user } = useContext(AuthContext); 

  return (
    <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }}  />
        <Stack.Screen name="(auth)/login" options={{ headerShown: false }}  />
    </Stack>
  );
}
