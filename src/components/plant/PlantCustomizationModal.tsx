// PlantCustomizationModal.tsx

import React, { useState } from "react";
import { Modal, View, ScrollView } from "react-native";
import { IPlant } from "@constants/IPlant";
import { ThemedText } from "@components/ui/Text/ThemedText";
import ThemedButton from "@components/ui/Buttons/ThemedButton";
import { useCustomizationModalStyles } from "./PlantCustomizationModal.styles";
import GeneralInfoSection from "./GeneralInfoSection";
import UserDataSection from "./UserDataSection";

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
  const [customPlant, setCustomPlant] = useState<IPlant>({
    ...plant,
    attributes: { ...plant.attributes },
    user_data: plant.user_data ? { ...plant.user_data } : {},
  });

  const styles = useCustomizationModalStyles();

  const handleAttributeChange = <K extends keyof IPlant["attributes"]>(
    field: K,
    value: IPlant["attributes"][K]
  ) => {
    setCustomPlant((prevPlant) => ({
      ...prevPlant,
      attributes: {
        ...prevPlant.attributes,
        [field]: value,
      },
    }));
  };


  type UserData = NonNullable<IPlant['user_data']>;

  const handleUserDataChange = <K extends keyof UserData>(
    field: K,
    value: UserData[K]
  ) => {
    setCustomPlant((prevPlant) => ({
      ...prevPlant,
      user_data: {
        ...prevPlant.user_data,
        [field]: value,
      },
    }));
  };
  

  const handleSave = () => {
    onSave(customPlant);
    onClose();
  };

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView>
            <ThemedText style={styles.title}>Customize Your Plant</ThemedText>
            <GeneralInfoSection
              attributes={customPlant.attributes}
              onAttributeChange={handleAttributeChange}
            />
            <UserDataSection
              userData={customPlant.user_data ?? {}}
              onUserDataChange={handleUserDataChange}
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
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default PlantCustomizationModal;
