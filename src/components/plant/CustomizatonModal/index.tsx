// PlantCustomizationModal.tsx


import { useContext, useEffect, useState } from "react";

import { Modal, View, ScrollView } from "react-native";
import uuid from "react-native-uuid";


import GeneralInfoSection from "@components/plant/customization/PlantForm/GeneralInfoSection";
import UserDataSection from "@components/plant/customization/PlantForm/UserDataSection";
import ThemedButton from "@components/ui/Buttons/ThemedButton";
import { ThemedText } from "@components/ui/Text/ThemedText";
import { IPlant, IUserPlant } from "@constants/IPlant";
import { AuthContext } from "@context/auth/AuthProvider";
import { ThemedView } from "@components/ui/Views/ThemedView";
import { useCustomizationStyles } from "@components/plant/customization/plantCustomization.styles";
import PlantForm from "@components/plant/customization/PlantForm"




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
  const [isVisible, setIsVisible] = useState(false);

  const styles = useCustomizationStyles();
  // Use initial values from props or create new ones if adding a new plant
  const initialPlantData = isAddingNewPlant ? { id: uuid.v4().toString() } : plant;
  const initialUserPlantData = isAddingNewPlant
    ? { userId: "", plantId: "", id: uuid.v4().toString(), custom_attributes: {} } // Create a new temporary ID for new user plants
    : userPlant;

  useEffect(() => {
    if (plant || isAddingNewPlant) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [plant, isAddingNewPlant]);

  const handleSave = async (userData: IUserPlant, plantData: IPlant) => {
    console.log("handleSave called", userData, plantData);
    await onSave(userData, plantData);
    onClose();
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <ThemedView style={styles.modalOverlay}>
        <ScrollView contentContainerStyle={styles.modal}>
          <PlantForm
            initialPlantData={initialPlantData}
            initialUserPlantData={initialUserPlantData}
            onSave={handleSave}
            displayUserPlantData={displayUserPlantData}
            isAddingNewPlant={isAddingNewPlant} // Pass the new prop
          />
          <ThemedButton title="Close" onPress={onClose} />
        </ScrollView>
      </ThemedView>
    </Modal>
  );
};

export default PlantCustomizationModal;