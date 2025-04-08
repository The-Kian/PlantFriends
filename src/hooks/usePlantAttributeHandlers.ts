
import { useState } from 'react';

import uuid from 'react-native-uuid';

import { IPlant, IUserPlant } from '@constants/IPlant';
import { useDispatch } from 'react-redux';
import { updatePlant } from '@store/userPlantsSlice';


export const usePlantAttributeHandlers = (initialPlant: IPlant, initialUserData: IUserPlant) => {
  const [customizations, setCustomizations] = useState({});
  const [userData, setUserData] = useState({
    ...initialUserData,
    plantId: initialPlant.id,
    id: initialUserData.id || uuid.v4().toString(),
    custom_attributes: {},
  });

  const dispatch = useDispatch();

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

  const handleSave = (onSave: (userPlant: IUserPlant, plant: IPlant) => void, onClose: () => void, plant: IPlant) => {
    const updatedUserPlant: IUserPlant = {
      ...userData,
      custom_attributes: customizations,
      id: userData.id || uuid.v4().toString(),
    };

    onSave(updatedUserPlant, plant);
    dispatch(updatePlant(updatedUserPlant));
    onClose();
  };

  return {
    customizations,
    userData,
    handlePlantAttributeChange,
    handleUserDataChange,
    handleSave,
  };
};