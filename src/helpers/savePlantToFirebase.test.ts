
import { Alert } from 'react-native';

import { IUserPlant, IPlant } from '@constants/IPlant';
import mockUser from '@test-utils/MockFirebaseUser';


import savePlantToFirebase from './savePlantToFirebase';
import saveBasePlantToFirebase from './saveToFirebase/saveBasePlantToFirebase';
import saveUserPlantToFirebase from './saveToFirebase/saveUserPlantToFirebase';

// Mock dependencies
jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
  },
}));

jest.mock('./saveToFirebase/saveBasePlantToFirebase', () => jest.fn());
jest.mock('./saveToFirebase/saveUserPlantToFirebase', () => jest.fn());

describe('savePlantToFirebase', () => {
  // Spy on console.error
  const consoleErrorSpy = jest.spyOn(console, 'error');

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should show alert and return early if user is null', async () => {
    const mockUserPlant = {} as IUserPlant;
    const mockPlantData = {} as IPlant;
    const mockUser = null;

    console.error = jest.fn();

    await savePlantToFirebase(mockUserPlant, mockPlantData, mockUser);

    expect(Alert.alert).toHaveBeenCalledWith('Error', 'User is not authenticated.');
    expect(saveBasePlantToFirebase).not.toHaveBeenCalled();
    expect(saveUserPlantToFirebase).not.toHaveBeenCalled();
  });

  it('should return early if base plant saving fails', async () => {
    const mockUserPlant = {} as IUserPlant;
    const mockPlantData = {} as IPlant;

    console.error = jest.fn();

    (saveBasePlantToFirebase as jest.Mock).mockResolvedValueOnce(false);

    await savePlantToFirebase(mockUserPlant, mockPlantData, mockUser);

    expect(saveBasePlantToFirebase).toHaveBeenCalledWith(mockPlantData, mockUser);
    expect(saveUserPlantToFirebase).not.toHaveBeenCalled();
  });

  it('should log error if user plant saving fails', async () => {
    const mockUserPlant = {} as IUserPlant;
    const mockPlantData = {} as IPlant;

    (saveBasePlantToFirebase as jest.Mock).mockResolvedValueOnce(true);
    (saveUserPlantToFirebase as jest.Mock).mockResolvedValueOnce(false);

    await savePlantToFirebase(mockUserPlant, mockPlantData, mockUser);

    expect(saveBasePlantToFirebase).toHaveBeenCalledWith(mockPlantData, mockUser);
    expect(saveUserPlantToFirebase).toHaveBeenCalledWith(mockUserPlant, mockUser);
  });

  it('should save both plants successfully', async () => {
    const mockUserPlant = {} as IUserPlant;
    const mockPlantData = {} as IPlant;

    (saveBasePlantToFirebase as jest.Mock).mockResolvedValueOnce(true);
    (saveUserPlantToFirebase as jest.Mock).mockResolvedValueOnce(true);

    await savePlantToFirebase(mockUserPlant, mockPlantData, mockUser);

    expect(saveBasePlantToFirebase).toHaveBeenCalledWith(mockPlantData, mockUser);
    expect(saveUserPlantToFirebase).toHaveBeenCalledWith(mockUserPlant, mockUser);
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});