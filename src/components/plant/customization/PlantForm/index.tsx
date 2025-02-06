import { useContext, useState } from "react";
import { View, ScrollView } from "react-native";
import uuid from "react-native-uuid";

import ThemedButton from "@components/ui/Buttons/ThemedButton";
import { ThemedText } from "@components/ui/Text/ThemedText";
import { ThemedView } from "@components/ui/Views/ThemedView";
import { IPlant, IUserPlant } from "@constants/IPlant";
import { AuthContext } from "@context/auth/AuthProvider";
import { useCustomizationStyles } from "@components/plant/customization/plantCustomization.styles";

import GeneralInfoSection from "./GeneralInfoSection";
import UserDataSection from "./UserDataSection";

interface PlantFormProps {
  initialPlantData?: IPlant;
  initialUserPlantData?: IUserPlant;
  onSave: (userPlant: IUserPlant, plantData: IPlant) => Promise<void>;
  displayUserPlantData: boolean;
}

const PlantForm = ({
  initialPlantData,
  initialUserPlantData,
  onSave,
  displayUserPlantData,
}: PlantFormProps) => {
  const { user } = useContext(AuthContext);

  const [customizations, setCustomizations] = useState<Partial<IPlant>>(
    initialPlantData || {}
  );

  const [userData, setUserData] = useState<IUserPlant>(
    initialUserPlantData || {
      userId: user?.uid || "",
      plantId: "",
      id: uuid.v4().toString(),
      custom_attributes: {},
    }
  );

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

  const handleSave = async () => {
    // Generate a new plant ID if it doesn't exist
    const plantId = customizations.id || uuid.v4().toString();

    const newPlantData: IPlant = {
      ...customizations,
      id: plantId,
      isVerified: customizations.isVerified ?? false,
      contributedBy: user?.displayName ?? user?.email ?? "Anonymous",
    };

    const newUserPlantData: IUserPlant = {
      ...userData,
      userId: user?.uid || "",
      plantId: plantId,
      id: userData.id || uuid.v4().toString(),
      custom_attributes: customizations,
    };

    await onSave(newUserPlantData, newPlantData);
  };
  return (
    <ScrollView>
      <ThemedView style={styles.content}>
        <ThemedText style={styles.title}>Plant Form</ThemedText>
        {displayUserPlantData && (
          <UserDataSection
            userData={userData}
            onUserDataChange={handleUserDataChange}
          />
        )}
        <GeneralInfoSection
          attributes={customizations as IPlant}
          onAttributeChange={handlePlantAttributeChange}
        />
        <View style={styles.buttonContainer}>
          <ThemedButton
            title="Save"
            onPress={handleSave}
            additionalStyle={styles.button}
            variant="accept"
          />
        </View>
      </ThemedView>
    </ScrollView>
  );
};

export default PlantForm;
