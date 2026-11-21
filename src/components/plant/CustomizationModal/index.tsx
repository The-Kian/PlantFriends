// PlantCustomizationModal.tsx

import { useEffect, useState } from "react";

import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  View,
} from "react-native";
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

  // Back and a tap on the backdrop are easy to do by accident, so once
  // something has been typed they ask before throwing it away.
  const [edited, setEdited] = useState(false);
  const requestClose = () => {
    if (!edited) {
      onClose();
      return;
    }
    Alert.alert("Discard this plant?", "What you've entered won't be saved.", [
      { text: "Keep editing", style: "cancel" },
      { text: "Discard", style: "destructive", onPress: onClose },
    ]);
  };

  // Android doesn't resize a Modal for the keyboard, so Save ended up behind
  // it. Pad the bottom of the form by the keyboard's height while it's open.
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  useEffect(() => {
    if (Platform.OS !== "android") return;
    const show = Keyboard.addListener("keyboardDidShow", (e) =>
      setKeyboardHeight(e.endCoordinates.height)
    );
    const hide = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardHeight(0)
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const handleSave = async (userData: IUserPlant, plantData: IPlant) => {
    await onSave(userData, plantData);
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      onRequestClose={requestClose}
      statusBarTranslucent
    >
      <ThemedView
        style={styles.modalOverlay}
        testID="plant-customization-modal"
      >
        {/* Tapping the dimmed backdrop dismisses the sheet. */}
        <Pressable
          style={{ flex: 1 }}
          onPress={requestClose}
          accessibilityLabel="Dismiss"
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.sheet}
        >
          <View style={styles.handle} />
          <ScrollView
            contentContainerStyle={[
              styles.modal,
              keyboardHeight > 0 && { paddingBottom: keyboardHeight + 24 },
            ]}
            keyboardShouldPersistTaps="handled"
          >
            <PlantForm
              initialPlantData={initialPlantData}
              initialUserPlantData={initialUserPlantData}
              onSave={handleSave}
              displayUserPlantData={displayUserPlantData}
              isAddingNewPlant={isAddingNewPlant} // Pass the new prop
              onEdit={() => setEdited(true)}
            />
            <ThemedButton title="Close" onPress={onClose} variant="ghost" />
          </ScrollView>
        </KeyboardAvoidingView>
      </ThemedView>
    </Modal>
  );
};

export default PlantCustomizationModal;
