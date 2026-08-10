import React from "react";

import { View } from "react-native";

import DatePickerField from "@/components/ui/Input/DatePickerField";
import PickerField from "@/components/ui/Input/PickerField";
import TextInputField from "@/components/ui/Input/TextInputField";
import { IUserPlant } from "@/constants/IPlant";

interface UserDataSectionProps {
  userData: IUserPlant;
  onUserDataChange: <K extends keyof IUserPlant>(
    field: K,
    value: IUserPlant[K],
  ) => void;
}

const UserDataSection = ({
  userData,
  onUserDataChange,
}: UserDataSectionProps) => {
  // Map human-readable schedule labels to numeric days (or null for as-needed)
  const scheduleOptions: { label: string; days: number | null }[] = [
    { label: "Daily", days: 1 },
    { label: "Every 3 days", days: 3 },
    { label: "Weekly", days: 7 },
    { label: "Bi-weekly", days: 14 },
    { label: "Monthly", days: 30 },
    { label: "As needed (check soil)", days: null },
  ];

  const scheduleLabels = scheduleOptions.map((o) => o.label);

  const selectedScheduleLabel = (() => {
    const current = userData?.custom_watering_schedule;
    if (current == null) return ""; // no custom schedule selected
    const match = scheduleOptions.find((o) => o.days === current);
    return match ? match.label : "";
  })();

  return (
    <View>
      <TextInputField
        label="Custom Name"
        value={userData?.custom_name || ""}
        onChangeText={(text) => onUserDataChange("custom_name", text)}
      />
      <DatePickerField
        label="Date Added"
        date={userData?.date_added ? new Date(userData.date_added) : new Date()}
        onDateChange={(date) => onUserDataChange("date_added", date.getTime())}
      />
      <PickerField
        label="Location"
        value={userData?.houseLocation || ""}
        onValueChange={(location) =>
          onUserDataChange("houseLocation", location)
        }
        options={[
          "Kitchen",
          "Living Room",
          "Bedroom",
          "Bathroom",
          "Office",
          "Balcony",
          "Garden",
        ]}
        placeholder="Select a location"
      />
      <PickerField
        label="Watering Schedule"
        value={selectedScheduleLabel}
        onValueChange={(label) => {
          const found = scheduleOptions.find((o) => o.label === label);
          onUserDataChange(
            "custom_watering_schedule",
            found ? (found.days as number | null) : null,
          );
        }}
        options={scheduleLabels}
        placeholder="Select a watering schedule"
      />
    </View>
  );
};

export default UserDataSection;
