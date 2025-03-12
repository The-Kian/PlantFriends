import { useFetchPlants } from "@hooks/useFetchPlants";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { mockPlant, mockPlant2 } from "@test-utils/MockPlant";
import { screen, render, fireEvent } from "@testing-library/react-native";

import { Text } from "react-native";

import PlantSearchScreen from "./";

jest.mock("@hooks/useFetchPlants");

describe("PlantSearchScreen", () => {
  const Stack = createStackNavigator();

  const MockScreen = ({ navigation }: any) => (
    <Text onPress={() => navigation.navigate("PlantSearchScreen")}>
      Go To PlantSearchScreen
    </Text>
  );

  const renderWithNavigation = (initialRouteName = "PlantSearchScreen") => {
    return render(
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{ animation: "none" }}
          initialRouteName={initialRouteName}
        >
          <Stack.Screen
            name="PlantSearchScreen"
            component={PlantSearchScreen}
          />
          <Stack.Screen name="SubmitPlant" component={MockScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  };

  it("renders correctly", () => {
    (useFetchPlants as jest.Mock).mockReturnValue({
      plants: [],
      loading: false,
      error: null,
    });
    renderWithNavigation();
    expect(screen.getByText("Search for a plant")).toBeVisible();
  });
  it("Shows loading overlay when loading", () => {
    const searchQuery = "test";

    (useFetchPlants as jest.Mock).mockReturnValue({
      plants: [],
      loading: true,
      error: null,
    });

    renderWithNavigation();

    // Find the input field and set the value
    const searchInput = screen.getByLabelText("Search for a plant input field");
    fireEvent.changeText(searchInput, searchQuery);

    expect(screen.getByText(`Searching for ${searchQuery}`)).toBeVisible();
  });

  it("Shows error message when error", () => {
    (useFetchPlants as jest.Mock).mockReturnValue({
      plants: [],
      loading: false,
      error: "Error fetching plants",
    });

    renderWithNavigation();

    expect(screen.getByText("Error fetching plants")).toBeVisible();
  });

  it("Should navigate to submit plant screen when submit plant button is selected", async () => {
    (useFetchPlants as jest.Mock).mockReturnValue({
      plants: [mockPlant, mockPlant2],
      loading: false,
      error: null,
    });
    renderWithNavigation();

    fireEvent.press(screen.getByText("Submit new plant to database"));
    expect(screen.getByText("Go To PlantSearchScreen")).toBeVisible();
  });

  it("Should navigate back", () => {
    renderWithNavigation("SubmitPlant");
    fireEvent.press(screen.getByText("Go To PlantSearchScreen"));
    expect(screen.getByText("Search for a plant")).toBeVisible();
    fireEvent.press(screen.getByText("Go Back"));
    expect(screen.getByText("Go To PlantSearchScreen")).toBeVisible();
  });
});
