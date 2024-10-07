import React from 'react';
import { TouchableOpacity, Text, StyleSheet, useColorScheme } from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from './types';
import { Colors } from 'src/theme/Colors';

const ProfileButton = () => {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const colorScheme = useColorScheme();

    const handlePress = () => {
        navigation.navigate('Profile');
        
    };

    return (
        <TouchableOpacity onPress={handlePress} style={styles.button}>
            <Ionicons name="person-circle-outline" size={24} color={Colors[colorScheme ?? 'light'].icon} />
        </TouchableOpacity>
    );
};


const styles = StyleSheet.create({
    button: {
        padding: 5,
    },
});

export default ProfileButton;