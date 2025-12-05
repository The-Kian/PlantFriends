/* eslint-disable @typescript-eslint/no-explicit-any */

import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

import { Text } from "react-native";

import { fireEvent, screen, waitFor } from "@testing-library/react-native";

import { mockUserPlant } from "@/test-utils/MockPlant";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

import MyPlantsScreen from "./";

describe("MyPlantsScreen", () => {
  const Stack = createStackNavigator();

  const renderWithNavigation = () => {
    return renderWithProviders(
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{ animation: "none", headerShown: false }}
        >
          <Stack.Screen name="MyPlantsScreen" component={MyPlantsScreen} />
          <Stack.Screen name="PlantSearch" component={MockScreen} />
        </Stack.Navigator>
      </NavigationContainer>,
      {
        preloadedState: {
          userPlants: [
            {
              ...mockUserPlant,
              houseLocation: "Living Room",
              custom_name: "Living Room Plant",
            },
            {
              ...mockUserPlant,
              houseLocation: "Kitchen",
              custom_name: "Kitchen Plant",
            },
          ],
        },
      },
    );
  };

  const MockScreen = ({ navigation }: any) => (
    <Text onPress={() => navigation.navigate("SubmitPlantScreen")}>
      Go To SubmitPlantScreen
    </Text>
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Should render correctly", () => {
    renderWithNavigation();
    const title = screen.getByText("Manage Your Plants");
    const navigationButton = screen.getByText("Add plant");
    const livingRoomCollapsible = screen.getByText("Living Room");
    const kitchenCollapsible = screen.getByText("Kitchen");

    expect(title).toBeVisible();
    expect(navigationButton).toBeVisible();
    expect(livingRoomCollapsible).toBeVisible();
    expect(kitchenCollapsible).toBeVisible();
  });

  it("Should navigate to PlantSearch", async () => {
    renderWithNavigation();
    const navigationButton = screen.getByText("Add plant");

    fireEvent.press(navigationButton);

    const mockScreen = await screen.findByText("Go To SubmitPlantScreen");
    expect(mockScreen).toBeVisible();
  });

  it("should delete a plant", async () => {
    renderWithNavigation();

    fireEvent.press(screen.getByText("Living Room"));
    expect(await screen.findByText("Living Room Plant")).toBeVisible();

    // Simulate deleting the plant
    const deleteButton = screen.getByText("Delete");
    fireEvent.press(deleteButton);

    // Verify the plant is no longer visible
    await waitFor(() => {
      expect(screen.queryByText("Living Room Plant")).toBeNull();
    });
  });
});
