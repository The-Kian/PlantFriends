import React from 'react';
import { View, Text, Button } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from './store'; // Adjust the import path as necessary
import { addPlant } from './userPlantsSlice';
import { IUserPlant } from '@constants/IPlant';

const TestComponent = () => {
  const userPlants = useSelector((state: RootState) => state.userPlants);
  const dispatch = useDispatch<AppDispatch>();

  const handleAddPlant = () => {
    const newPlant: IUserPlant = {
      id: Math.random().toString(), // Generate a random ID for testing
      plantId: "testplantID",
      userId: "testuserID",
    };
    dispatch(addPlant(newPlant));
  };
  
  return (
    <View>
      <Text>"Redux Test Component"</Text>
      <Button title="Add Plant" onPress={handleAddPlant} />
      
      {/* Display plants (optional) */}
      {userPlants.map((plant) => (
        <Text key={plant.id}>Plant ID: {plant.plantId}</Text>
      ))}
    </View>
  );
}

export default TestComponent;