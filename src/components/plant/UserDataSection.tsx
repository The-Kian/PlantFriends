// UserDataSection.tsx

import React from 'react';
import { View } from 'react-native';
import TextInputField from '@components/ui/Input/TextInputField';
import DatePickerField from '@components/ui/Input/DatePickerField';
import { IPlant } from '@constants/IPlant';

type UserData = NonNullable<IPlant['user_data']>;

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
        value={userData?.custom_name || ''}
        onChangeText={(text) => onUserDataChange('custom_name', text)}
      />
      <DatePickerField
        label="Date Added"
        date={userData?.date_added || new Date()}
        onDateChange={(date) => onUserDataChange('date_added', date)}
      />
      {/* Add more user data fields as needed */}
    </View>
  );
};

export default UserDataSection;