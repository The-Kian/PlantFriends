// PlantCustomizationModal.tsx


import React, { useContext, useState } from "react";

import { Modal, View, ScrollView } from "react-native";
import uuid from "react-native-uuid";


import { useCustomizationStyles } from "@components/plant/customization/plantCustomization.styles";
import GeneralInfoSection from "@components/plant/customization/PlantForm/GeneralInfoSection";
import UserDataSection from "@components/plant/customization/PlantForm/UserDataSection";
import ThemedButton from "@components/ui/Buttons/ThemedButton";
import { ThemedText } from "@components/ui/Text/ThemedText";
import { IPlant, IUserPlant } from "@constants/IPlant";
import { AuthContext } from "@context/auth/AuthProvider";



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
  const { user } = useContext(AuthContext);

  const [customizations, setCustomizations] = useState<Partial<IPlant>>(
    userPlant?.custom_attributes || {}
  );

  const [userData, setUserData] = useState<IUserPlant>(() => {
    if (userPlant) {
      return { ...userPlant, userId: user?.uid || "", plantId: plant.id };
    }

    return {
      userId: user?.uid || "",
      plantId: plant.id,
      id: uuid.v4().toString(),
      custom_attributes: {},
    };
  });

  const styles = useCustomizationStyles();

  const handlePlantAttributeChange = <K extends keyof IPlant>(
    field: K,
    value: IPlant[K]
  ) => {
    setCustomizations((prevPlant) => ({
      ...prevPlant,
      [field]: value,
    }));
  };

  const handleUserDataChange = <K extends keyof IUserPlant>(
    field: K,
    value: IUserPlant[K]
  ) => {
    setUserData((prevUserData) => ({
      ...prevUserData,
      [field]: value,
    }));
  };

  const prepareUserPlantData = (): IUserPlant => ({
    ...userData,
    custom_attributes: customizations,
    id: userData.id || uuid.v4().toString(),
  });

  const handleSave = () => {
    const updatedUserPlant = prepareUserPlantData();
    onSave(updatedUserPlant, plant);
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
        <View style={styles.modal}>
          <ScrollView>
            <ThemedText style={styles.title}>Customize Your Plant</ThemedText>
            <UserDataSection
              userData={userData}
              onUserDataChange={handleUserDataChange}
            />
            <GeneralInfoSection
              attributes={{ ...plant, ...customizations }}
              onAttributeChange={handlePlantAttributeChange}
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
