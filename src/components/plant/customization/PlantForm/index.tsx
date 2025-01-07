import { useContext, useState } from "react";
import { ScrollView } from "react-native";
import uuid from "react-native-uuid";

import ThemedButton from "@components/ui/Buttons/ThemedButton";
import { ThemedText } from "@components/ui/Text/ThemedText";
import { ThemedView } from "@components/ui/Views/ThemedView";
import { IPlant, IUserPlant } from "@constants/IPlant";
import { AuthContext } from "@context/auth/AuthProvider";
import { useCustomizationStyles } from "src/components/plant/customization/plantCustomization.styles";

import GeneralInfoSection from "./GeneralInfoSection";
import UserDataSection from "./UserDataSection";

interface PlantFormProps {
  initialPlantData?: IPlant;
  initialUserPlantData?: IUserPlant;
  onSave: (userPlant?: IUserPlant, plantData?: IPlant) => Promise<void>;
  displayUserPlantData: boolean;
  isSubmission: boolean
}

const PlantForm = ({
  initialPlantData,
  initialUserPlantData,
  onSave,
  displayUserPlantData,
  isSubmission
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
    if (isSubmission) {
      // Save a new base plant
      const newPlantData: IPlant = {
        ...customizations,
        id: uuid.v4().toString(),
        isVerified: false,
        contributedBy: user?.displayName || user?.email || "Anonymous",
      };
      await onSave(undefined, newPlantData); // No user data needed
    } else {
      // Save customizations for a predefined plant
      const updatedUserPlant: IUserPlant = {
        ...userData,
        custom_attributes: customizations,
        id: userData.id || uuid.v4().toString(),
      };
      await onSave(updatedUserPlant, undefined); // No new base plant
    }
  };

  // FIX DUPLICATE BUTTON
  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <ThemedView style={styles.content}>
        <ThemedText style={styles.title}>Customize Your Plant</ThemedText>
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
        <ThemedButton
          title="Save"
          onPress={handleSave}
          additionalStyle={styles.button}
          variant="accept"
        />
        
        <ThemedButton
          title="Save"
          onPress={handleSave}
          additionalStyle={styles.button}
          variant="accept"
        />
      </ThemedView>
    </ScrollView>
  );
};

export default PlantForm;
