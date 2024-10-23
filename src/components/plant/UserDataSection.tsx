// UserDataSection.tsx

import React from "react";
import { View } from "react-native";
import TextInputField from "@components/ui/Input/TextInputField";
import DatePickerField from "@components/ui/Input/DatePickerField";
import { IPlant } from "@constants/IPlant";
import PickerField from "@components/ui/Input/PickerField";

type UserData = NonNullable<IPlant["user_data"]>;

interface UserDataSectionProps {
  userData: UserData;
  onUserDataChange: <K extends keyof UserData>(
    field: K,
    value: UserData[K]
  ) => void;
}

const UserDataSection = ({
  userData,
  onUserDataChange,
}: UserDataSectionProps) => {
  return (
    <View>
      <TextInputField
        label="Custom Name"
        value={userData?.custom_name || ""}
        onChangeText={(text) => onUserDataChange("custom_name", text)}
      />
      <DatePickerField
        label="Date Added"
        date={userData?.date_added || new Date()}
        onDateChange={(date) => onUserDataChange("date_added", date)}
      />
      <PickerField
        label="Location"
        selectedValue={userData?.houseLocation || ""}
        onValueChange={(location) => onUserDataChange("location", location)}
        options={[
          "Kitchen",
          "Living Room",
          "Bedroom",
          "Bathroom",
          "Office",
          "Balcony",
          "Garden",
        ]}
      />
    </View>
  );
};

export default UserDataSection;
