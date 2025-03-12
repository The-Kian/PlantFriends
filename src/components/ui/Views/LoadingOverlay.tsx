

import { ThemedText } from '@components/ui/Text/ThemedText';
import { ThemedView } from '@components/ui/Views/ThemedView';

import { ActivityIndicator} from 'react-native';


function LoadingOverlay(props: { message: string }) {
	return (
		<ThemedView >
			<ThemedText>{props.message}</ThemedText>
			<ActivityIndicator size="large" testID='activity-indicator'/>
		</ThemedView>
	);
}

export default LoadingOverlay;


