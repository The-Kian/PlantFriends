// PlantCustomizationModal.tsx


import React from "react";

import { Modal, View } from "react-native";

import { useCustomizationStyles } from "@components/plant/customization/plantCustomization.styles";
import PlantForm from "@components/plant/customization/PlantForm";
import { IPlant, IUserPlant } from "@constants/IPlant";



interface PlantCustomizationModalProps {
  plant: IPlant;
  userPlant?: IUserPlant;
  onClose: () => void;
  onSave: (userPlant: IUserPlant, plantData: IPlant) => void;
}

const PlantCustomizationModal = ({
  plant,
  userPlant,
  onClose,
  onSave,
}: PlantCustomizationModalProps) => {
  const styles = useCustomizationStyles();
  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modal}>
          <PlantForm
            initialPlantData={plant}
            initialUserPlantData={userPlant}
            onSave={async (userPlantData, plantData) => {
              await onSave(userPlantData, plantData);
              onClose();
            }}
            displayUserPlantData={true}
          />
        </View>
      </View>
    </Modal>
  );
};

export default PlantCustomizationModal;
