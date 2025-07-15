
import { useContext, useEffect, useState } from "react";

import { View, ScrollView } from "react-native";
import uuid from "react-native-uuid";


import { useCustomizationStyles } from "@components/plant/customization/plantCustomization.styles";
import ThemedButton from "@components/ui/Buttons/ThemedButton";
import { ThemedText } from "@components/ui/Text/ThemedText";
import { ThemedView } from "@components/ui/Views/ThemedView";
import { IPlant, IUserPlant } from "@constants/IPlant";
import { AuthContext } from "@context/auth/AuthProvider";


import GeneralInfoSection from "./GeneralInfoSection";
import UserDataSection from "./UserDataSection";

interface PlantFormProps {
  initialPlantData?: IPlant;
  initialUserPlantData?: IUserPlant;
  onSave: (userPlant: IUserPlant, plantData: IPlant) => Promise<void>;
  displayUserPlantData: boolean;
  isAddingNewPlant: boolean;
}

const PlantForm = ({
  initialPlantData,
  initialUserPlantData,
  onSave,
  displayUserPlantData,
  isAddingNewPlant,
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

  useEffect(() => {
    if (initialUserPlantData) {
      setUserData(initialUserPlantData);
    }
  }, [initialUserPlantData]);

  useEffect(() => {
    // Reset form when adding a new plant or selecting a different plant
    if (isAddingNewPlant) {
      setCustomizations({});
      setUserData({
        userId: user?.uid || "",
        plantId: "", // This will be set after the base plant is saved
        id: uuid.v4().toString(),
        custom_attributes: {},
      });
    } else if (initialPlantData) {
      setCustomizations(initialPlantData);
      setUserData(initialUserPlantData || {
        userId: user?.uid || "",
        plantId: initialPlantData.id || "",
        id: uuid.v4().toString(),
        custom_attributes: {},
      });
    }
  }, [isAddingNewPlant, initialPlantData, initialUserPlantData, user]);

  const handlePlantAttributeChange = (key: keyof IPlant, value: any) => {
    setCustomizations((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleUserDataChange = (key: keyof IUserPlant, value: any) => {
    setUserData((prev) => ({
      ...prev,
      [key]: value,
      custom_attributes: {
        ...prev.custom_attributes,
        [key]: value, // Ensure changes are reflected in custom_attributes
      },
    }));
  };

  const handleSave = async () => {
    const finalPlantData = {
      ...customizations,
      // Only generate a new ID if adding a new plant and it doesn't have one
      id: isAddingNewPlant && !customizations.id ? uuid.v4().toString() : customizations.id,
    } as IPlant;

    const finalUserData = {
      ...userData,
      userId: user?.uid || "", // Ensure userId is set
      plantId: finalPlantData.id, // Link user plant to the plant ID
      id: userData.id || uuid.v4().toString(), // Ensure user data has an ID
    } as IUserPlant;

    await onSave(finalUserData, finalPlantData);
  };

  const styles = useCustomizationStyles();

  return (
    <ScrollView>
      <ThemedView style={styles.content}>
        <ThemedText style={styles.title}>
          {isAddingNewPlant ? "Add New Plant" : "Customize Plant"}
        </ThemedText>
        <GeneralInfoSection
          attributes={customizations as IPlant}
          onAttributeChange={handlePlantAttributeChange}
        />
        {displayUserPlantData && (
          <UserDataSection
            userData={userData}
            onUserDataChange={handleUserDataChange}
          />
        )}
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