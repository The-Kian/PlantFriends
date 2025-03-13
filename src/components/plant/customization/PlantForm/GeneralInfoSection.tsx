// GeneralInfoSection.tsx


import React from 'react';

import { View } from 'react-native';

import NumericInputField from '@components/ui/Input/NumericInputField';
import PickerField from '@components/ui/Input/PickerField';
import TextInputField from '@components/ui/Input/TextInputField';
import { IPlant } from '@constants/IPlant';


import { generalInfoFields } from './GeneralInfoFields';

interface GeneralInfoSectionProps {
  attributes: IPlant;

    /**
   * Callback function to handle changes to any attribute field.
   * @param field - The name of the attribute field that changed.
   * @param value - The new value for the attribute field.
   */

  onAttributeChange: <K extends keyof IPlant>(
    field: K,
    value: IPlant[K]
  ) => void;
}

const GeneralInfoSection = ({
  attributes,
  onAttributeChange,
}: GeneralInfoSectionProps) => {
  return (
    <View>
      {generalInfoFields.map((fieldConfig) => {
        const value = attributes[fieldConfig.field];

        switch (fieldConfig.type) {
          case 'text':
            return (
              <TextInputField
                key={fieldConfig.field}
                label={fieldConfig.label}
                value={(value as string) || ''}
                onChangeText={(text) =>
                  onAttributeChange(fieldConfig.field, text)
                }
              />
            );
          case 'number':
            return (
              <NumericInputField
                key={fieldConfig.field}
                label={fieldConfig.label}
                value={value ? value.toString() : ''}
                onChangeText={(text) =>
                  onAttributeChange(
                    fieldConfig.field,
                    text ? Number(text) : undefined
                  )
                }
              />
            );
          case 'picker':
            return (
              <PickerField
                key={fieldConfig.field}
                label={fieldConfig.label}
                selectedValue={(value as string) || ''}
                onValueChange={(itemValue) =>
                  onAttributeChange(
                    fieldConfig.field,
                    itemValue as IPlant[typeof fieldConfig.field]
                  )
                }
                options={fieldConfig.options || []}
              />
            );
        }
      })}
    </View>
  );
};

export default GeneralInfoSection;
