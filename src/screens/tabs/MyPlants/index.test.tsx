
/* eslint-disable @typescript-eslint/no-explicit-any */import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

import { Text } from "react-native";

import { fireEvent, render, screen } from "@testing-library/react-native";


import MyPlantsScreen from "./";

describe("MyPlantsScreen", () => {
    const Stack = createStackNavigator();
    const renderWithNavigaton = () => {
        render(
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
            </NavigationContainer>
        )
    }

      const MockScreen = ({ navigation }: any) => (
        <Text onPress={() => navigation.navigate("SubmitPlantScreen")}>
          Go To SubmitPlantScreen
        </Text>
      );

    it("Should render correctly", () => {
        renderWithNavigaton();
        const title = screen.getByText("Manage Your Plants");
        const navigationButton = screen.getByText("Add plant");
        const livingRoomCollapsible = screen.getByText("Living Room");
        const kitchenCollapsible = screen.getByText("Kitchen");

        expect(title).toBeVisible();
        expect(navigationButton).toBeVisible();
        expect(livingRoomCollapsible).toBeVisible();
        expect(kitchenCollapsible).toBeVisible();
    });

    it("Should navigate to PlantSearch", async() => {
        renderWithNavigaton();
        const navigationButton = screen.getByText("Add plant");

        fireEvent.press(navigationButton);

        const mockScreen = await screen.findByText("Go To SubmitPlantScreen");
        expect(mockScreen).toBeVisible();


    })
});