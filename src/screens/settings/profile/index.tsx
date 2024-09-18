import { ThemedText } from '@components/ui/ThemedText';
import { ThemedView } from '@components/ui/ThemedView';
import React, { useContext } from 'react';
import {StyleSheet, TouchableOpacity, Text } from 'react-native';
import styles from '@styles/index';
import ThemedButton from '@components/ui/ThemedButton';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '@components/navigation/types';
import { AuthContext, AuthProvider } from '@context/auth/AuthProvider';

const ProfileSettingsScreen = () => {
    const {logout} = useContext(AuthContext);
    const handleLogout = () => {
        logout();
    };

    const navigation = useNavigation<NavigationProp<RootStackParamList>>();


    return (
        <ThemedView style={styles.container}>
            <ThemedText type={'title'}>Settings</ThemedText>
            <ThemedButton onPress={() => {navigation.goBack()}}>
                Back
            </ThemedButton>
            <ThemedButton onPress={handleLogout}>
                Logout
            </ThemedButton>
        </ThemedView>
    );
};


export default ProfileSettingsScreen;

function useAuth(A: any): { logout: any; } {
    throw new Error('Function not implemented.');
}
