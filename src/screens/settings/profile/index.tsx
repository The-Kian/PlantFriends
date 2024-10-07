import { ThemedText } from '@components/ui/Text/ThemedText';
import { ThemedView } from '@components/ui/Views/ThemedView';
import React, { useContext } from 'react';
import {StyleSheet, TouchableOpacity, Text } from 'react-native';
import styles from 'src/common/defaultStyles';
import ThemedButton from '@components/ui/Buttons/ThemedButton';
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
            <ThemedButton onPress={() => {navigation.goBack()}} title='Go back'/>
            <ThemedButton onPress={handleLogout} title='Logout'/>
        </ThemedView>
    );
};


export default ProfileSettingsScreen;

function useAuth(A: any): { logout: any; } {
    throw new Error('Function not implemented.');
}
