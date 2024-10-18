// PlantCustomizationModal.tsx

import React, { useState } from "react";
import { Modal, View, TextInput, StyleSheet } from "react-native";
import { IPlant } from "@constants/IPlant";
import { ThemedText } from "@components/ui/Text/ThemedText";
import { ThemedView } from "@components/ui/Views/ThemedView";
import ThemedButton from "@components/ui/Buttons/ThemedButton";
import { useTheme } from "@hooks/useTheme";
import { useCustomizationModalStyles } from "./PlantCustomizationModal.styles";

interface PlantCustomizationModalProps {
  plant: IPlant;
  onClose: () => void;
  onSave: (customizedPlant: IPlant) => void;
}

const PlantCustomizationModal = ({
  plant,
  onClose,
  onSave,
}: PlantCustomizationModalProps) => {
  const [customName, setCustomName] = useState(plant.attributes.name);
  const [customWateringSchedule, setCustomWateringSchedule] = useState(plant.attributes.water_requirements);
  const styles = useCustomizationModalStyles();

  const handleSave = () => {
    const customizedPlant = {
      ...plant,
      attributes: { ...plant.attributes, name: customName },
    };
    onSave(customizedPlant);
  };

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose} // For Android back button
    >
      <View style={styles.modalOverlay}>
        <ThemedView style={styles.modalContent}>
          <ThemedText style={styles.title}>Customize Your Plant</ThemedText>
          <TextInput
            value={customName}
            onChangeText={setCustomName}
            style={styles.textInput}
            placeholder="Enter custom name"
            placeholderTextColor={styles.title.color}
          />
          <TextInput
            value={customWateringSchedule}
            onChangeText={setCustomWateringSchedule}
            style={styles.textInput}
            placeholder="Enter custom watering schedule"
            placeholderTextColor={styles.title.color}
          />
          <View style={styles.buttonContainer}>
            <ThemedButton
              title="Save"
              onPress={handleSave}
              additionalStyle={styles.button}
              variant="accept"
            />
            <ThemedButton
              title="Cancel"
              onPress={onClose}
              additionalStyle={styles.button}
              variant="decline"
            />
          </View>
        </ThemedView>
      </View>
    </Modal>
  );
};

export default PlantCustomizationModal;

