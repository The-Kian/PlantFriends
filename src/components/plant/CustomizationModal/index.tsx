// PlantCustomizationModal.tsx

import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from "react-native";
import uuid from "react-native-uuid";

import { useCustomizationStyles } from "@/components/plant/customization/plantCustomization.styles";
import PlantForm from "@/components/plant/customization/PlantForm";
import ThemedButton from "@/components/ui/Buttons/ThemedButton";
import { ThemedView } from "@/components/ui/Views/ThemedView";
import { IPlant, IUserPlant } from "@/constants/IPlant";

interface PlantCustomizationModalProps {
  plant?: IPlant;
  userPlant?: IUserPlant;
  onClose: () => void;
  onSave: (userPlant: IUserPlant, plantData: IPlant) => void;
  displayUserPlantData: boolean;
  isAddingNewPlant: boolean;
}

const PlantCustomizationModal = ({
  plant,
  userPlant,
  onClose,
  onSave,
  displayUserPlantData,
  isAddingNewPlant, // New prop to indicate if adding a new plant
}: PlantCustomizationModalProps) => {
  const styles = useCustomizationStyles();
  // Use initial values from props or create new ones if adding a new plant
  const initialPlantData = isAddingNewPlant
    ? { id: uuid.v4().toString() }
    : plant;
  const initialUserPlantData = isAddingNewPlant
    ? {
        userId: "",
        plantId: "",
        id: uuid.v4().toString(),
        custom_attributes: {},
      } // Create a new temporary ID for new user plants
    : userPlant;

  const handleSave = async (userData: IUserPlant, plantData: IPlant) => {
    await onSave(userData, plantData);
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <ThemedView
        style={styles.modalOverlay}
        testID="plant-customization-modal"
      >
        {/* Tapping the dimmed backdrop dismisses the sheet. */}
        <Pressable
          style={{ flex: 1 }}
          onPress={onClose}
          accessibilityLabel="Dismiss"
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.sheet}
        >
          <View style={styles.handle} />
          <ScrollView
            contentContainerStyle={styles.modal}
            keyboardShouldPersistTaps="handled"
          >
            <PlantForm
              initialPlantData={initialPlantData}
              initialUserPlantData={initialUserPlantData}
              onSave={handleSave}
              displayUserPlantData={displayUserPlantData}
              isAddingNewPlant={isAddingNewPlant} // Pass the new prop
            />
            <ThemedButton title="Close" onPress={onClose} variant="ghost" />
          </ScrollView>
        </KeyboardAvoidingView>
      </ThemedView>
    </Modal>
  );
};

export default PlantCustomizationModal;
