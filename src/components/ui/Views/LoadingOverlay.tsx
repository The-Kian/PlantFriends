
import { ActivityIndicator} from 'react-native';

import { ThemedView } from '@components/ui/Views/ThemedView';

import { ThemedText } from '@components/ui/Text/ThemedText';

function LoadingOverlay(props: { message: string }) {
	return (
		<ThemedView >
			<ThemedText>{props.message}</ThemedText>
			<ActivityIndicator size="large" testID='activity-indicator'/>
		</ThemedView>
	);
}

export default LoadingOverlay;


