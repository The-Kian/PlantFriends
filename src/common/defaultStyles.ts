import { Colors } from '@theme/Colors';

import { StyleSheet } from 'react-native';


const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.light.background,
    },
    text: {
        fontSize: 16,
        color: Colors.light.background,
    },
});

export default styles;