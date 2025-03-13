import { StyleSheet } from 'react-native';

import { Colors } from '@theme/Colors';



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