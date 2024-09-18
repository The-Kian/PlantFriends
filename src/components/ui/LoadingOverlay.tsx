
import { ActivityIndicator, Text, View } from 'react-native';
import { ThemedView } from '@components/ui/ThemedView';
import { ThemedText } from './ThemedText';

function LoadingOverlay(props: { message: string }) {
	return (
		<ThemedView >
			<ThemedText>{props.message}</ThemedText>
			<ActivityIndicator size="large" />
		</ThemedView>
	);
}

export default LoadingOverlay;


