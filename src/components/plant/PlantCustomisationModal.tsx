import React, { useState } from "react";
import { Modal, View, Text, Button, TextInput, StyleSheet} from "react-native";
import { IPlant } from "@constants/IPlant";
import { ThemedText } from "@components/ui/ThemedText";
import { ThemedView } from "@components/ui/ThemedView";
import ThemedButton from "@components/ui/ThemedButton";

interface PlantCustomizationModalProps {
  plant: IPlant;
  onClose: () => void;
  onSave: (customizedPlant: IPlant) => void;
}

const PlantCustomizationModal = ({ plant, onClose, onSave }: PlantCustomizationModalProps) => {
  const [customName, setCustomName] = useState(plant.attributes.name);

  const handleSave = () => {
    const customizedPlant = { ...plant, attributes: { ...plant.attributes, name: customName } };
    onSave(customizedPlant);
  };

  return (
     <Modal visible={true} transparent={true} animationType="slide">
      <ThemedView>
        <ThemedText>Customize your plant</ThemedText>
        <TextInput value={customName} onChangeText={setCustomName} />
        <View style={styles.buttonContainer}>
        <ThemedButton title="Save" onPress={handleSave} additionalStyle={styles.button} />
        <ThemedButton title="Cancel" onPress={onClose} additionalStyle={styles.button} />
        </View>
      </ThemedView>
     </Modal>
  );
};

export default PlantCustomizationModal;

const styles = StyleSheet.create({
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
  },
})