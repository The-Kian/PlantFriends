
/* eslint-disable @typescript-eslint/no-explicit-any */

import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

import { Text } from "react-native";

import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";


import MyPlantsScreen from "./";
import { renderWithProviders } from "@test-utils/renderWithProviders";
import { mockUserPlant } from "@test-utils/MockPlant";

describe("MyPlantsScreen", () => {
  const Stack = createStackNavigator();
  const renderWithNavigation = () => {
    return renderWithProviders(
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{ animation: "none", headerShown: false }}
        >
          <Stack.Screen
            name="MyPlantsScreen"
            component={MyPlantsScreen}
          />
          <Stack.Screen name="PlantSearch" component={MockScreen} />
        </Stack.Navigator>
      </NavigationContainer>, {
      preloadedState: {
        userPlants: [
          { ...mockUserPlant, houseLocation: "Living Room", custom_name: "Living Room Plant" },
          { ...mockUserPlant, houseLocation: "Kitchen", custom_name: "Kitchen Plant" },
        ]
      },
    }
    );
  }

  const MockScreen = ({ navigation }: any) => (
    <Text onPress={() => navigation.navigate("SubmitPlantScreen")}>
      Go To SubmitPlantScreen
    </Text>
  );

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
  })

  it("should render plants by location", () => {
    renderWithNavigation();

    const livingRoomPlants = screen.getByText("Living Room");
    expect(livingRoomPlants).toBeVisible();
    const kitchenPlants = screen.getByText("Kitchen");
    expect(kitchenPlants).toBeVisible();
  });
  
  it("should delete a plant", async () => {
    renderWithNavigation();
  
    // Expand the "Living Room" collapsible
    const livingRoomCollapsible = screen.getByText("Living Room");
    fireEvent.press(livingRoomCollapsible);
  
    // Wait for the plant to appear
    await waitFor(() => {
      expect(screen.getByText("Living Room Plant")).toBeVisible();
    });
  
    // Simulate deleting the plant
    const deleteButton = screen.getByText("Delete");
    fireEvent.press(deleteButton);
  
    // Verify the plant is no longer visible
    await waitFor(() => {
      expect(screen.queryByText("Living Room Plant")).toBeNull();
    });
  });
});