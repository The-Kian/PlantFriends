// UserDataSection.tsx


import React from "react";
import { View } from "react-native";

import DatePickerField from "@components/ui/Input/DatePickerField";
import PickerField from "@components/ui/Input/PickerField";
import TextInputField from "@components/ui/Input/TextInputField";

import { IUserPlant } from "@constants/IPlant";


interface UserDataSectionProps {

  userData: IUserPlant;

  onUserDataChange: <K extends keyof IUserPlant>(

    field: K,

    value: IUserPlant[K]

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
        onValueChange={(location) => onUserDataChange("houseLocation", location)}
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
