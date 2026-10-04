import { Ionicons } from "@expo/vector-icons";

import { Image, Pressable, View } from "react-native";

import { ThemedText } from "@/components/ui/Text/ThemedText";
import { IPlant } from "@/constants/IPlant";
import { useTheme } from "@/hooks/utils/useTheme";

import { searchResultStyle as styles } from "./SearchResult.styles";

interface SearchResultComponentProps {
  plant: IPlant;
  onSelect: () => void;
}

const SearchResultComponent = ({
  plant,
  onSelect,
}: SearchResultComponentProps) => {
  const { colors, radius } = useTheme();
  const imageUri = plant.images?.[0];
  const scientificName = plant.scientific_name?.[0];

  return (
    <Pressable
      onPress={onSelect}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radius.medium,
        },
        pressed && styles.pressed,
      ]}
    >
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={[styles.thumb, { borderRadius: radius.small }]}
        />
      ) : (
        <View
          style={[
            styles.thumb,
            styles.thumbPlaceholder,
            { backgroundColor: colors.primaryMuted, borderRadius: radius.small },
          ]}
        >
          <Ionicons name="leaf" size={18} color={colors.primary} />
        </View>
      )}
      <View style={styles.text}>
        <ThemedText style={styles.name} numberOfLines={1}>
          {plant.name}
        </ThemedText>
        {scientificName && scientificName !== plant.name ? (
          <ThemedText
            style={[styles.scientific, { color: colors.textMuted }]}
            numberOfLines={1}
          >
            {scientificName}
          </ThemedText>
        ) : null}
      </View>
      <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
    </Pressable>
  );
};

export default SearchResultComponent;
