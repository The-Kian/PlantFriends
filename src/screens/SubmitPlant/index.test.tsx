
import PlantForm from "@components/plant/customization/PlantForm";
import { AuthContext } from "@context/auth/AuthProvider";
import saveBasePlantToFirebase from "@helpers/saveToFirebase/saveBasePlantToFirebase";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import mockAuthContextValue from "@test-utils/MockAuthContextValue";
import mockUser from "@test-utils/MockFirebaseUser";
import { mockPlant } from "@test-utils/MockPlant";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";

import { Text } from "react-native";
import { Alert } from "react-native";

import SubmitPlantScreen from "./";


jest.mock("@helpers/saveToFirebase/saveBasePlantToFirebase", () => jest.fn());
jest.mock("@components/plant/customization/PlantForm", () => jest.fn());

(PlantForm as jest.Mock).mockImplementation(({ onSave, initialPlantData }) => {
  return (
    <>
      <Text testID="plant-form">Plant Form Component</Text>
      <Text
        testID="save-button"
        onPress={() => onSave(initialPlantData || mockPlant)}
      >
        Save
      </Text>
    </>
  );
});

describe("SubmitPlantScreen", () => {
  const Stack = createStackNavigator();

  const MockScreen = ({ navigation }: any) => (
    <Text onPress={() => navigation.navigate("SubmitPlantScreen")}>
      Go To SubmitPlantScreen
    </Text>
  );

  const renderWithFullContext = (initialRouteName = "SubmitPlantScreen") => {
    return render(
      <NavigationContainer>
        <AuthContext.Provider value={mockAuthContextValue}>
          <Stack.Navigator
            screenOptions={{ animation: "none", headerShown: false }}
            initialRouteName={initialRouteName}
          >
            <Stack.Screen
              name="SubmitPlantScreen"
              component={SubmitPlantScreen}
            />
            <Stack.Screen name="MockScreen" component={MockScreen} />
          </Stack.Navigator>
        </AuthContext.Provider>
      </NavigationContainer>
    );
  };

  it("renders SubmitPlantScreen correctly", async () => {
    renderWithFullContext();
    expect(screen.getByText("Submit Plant for review!")).toBeOnTheScreen();
  });

  it("saves plant data and navigates back when user is logged in", async () => {
    renderWithFullContext("MockScreen");
    fireEvent.press(screen.getByText("Go To SubmitPlantScreen"));
    const saveButton = await screen.findByText("Save");
    fireEvent.press(saveButton);
    await waitFor(() => {
      expect(saveBasePlantToFirebase).toHaveBeenCalledWith(mockPlant, mockUser);
    });
  });

  it("shows alert when trying to submit without being logged in", async () => {
    const mockAlert = jest.spyOn(Alert, "alert");

    render(
      <NavigationContainer>
        <AuthContext.Provider value={{ ...mockAuthContextValue, user: null }}>
          <SubmitPlantScreen />
        </AuthContext.Provider>
      </NavigationContainer>
    );

    fireEvent.press(screen.getByText("Save"));
    expect(mockAlert).toHaveBeenCalledWith(
      "You must be logged in to submit a plant"
    );
  });
});
