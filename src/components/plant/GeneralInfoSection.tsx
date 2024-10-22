// GeneralInfoSection.tsx

import React from 'react';
import { View } from 'react-native';
import TextInputField from '@components/ui/Input/TextInputField';
import NumericInputField from '@components/ui/Input/NumbericInputField';
import PickerField from '@components/ui/Input/PickerField';
import { generalInfoFields } from '@components/ui/Input/fieldsConfig';
import { IPlant } from '@constants/IPlant';

interface GeneralInfoSectionProps {
  attributes: IPlant['attributes'];
  onAttributeChange: <K extends keyof IPlant['attributes']>(
    field: K,
    value: IPlant['attributes'][K]
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
                    itemValue as IPlant['attributes'][typeof fieldConfig.field]
                  )
                }
                options={fieldConfig.options || []}
              />
            );
          default:
            return null;
        }
      })}
    </View>
  );
};

export default GeneralInfoSection;
