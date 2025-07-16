/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-var-requires */

import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

import { Text } from "react-native";

import { screen, waitFor, fireEvent } from "@testing-library/react-native";

import { useCombinedPlantSearch } from "@hooks/search/useCombinedPlantSearch";
import { mockPlant, mockPlant2, mockUserPlant } from "@test-utils/MockPlant";
import { renderWithProviders } from "@test-utils/renderWithProviders";

import PlantSearchScreen from "./";
import { usePlantManagement } from "@hooks/user/usePlantManagement";


jest.mock("@hooks/search/useCombinedPlantSearch");

jest.mock("@hooks/user/usePlantManagement", () => ({
  usePlantManagement: jest.fn(() => ({
    selectedPlant: null,
    userPlant: null,
    customizations: {},
    handleSelectPlant: jest.fn(),
    handlePlantAttributeChange: jest.fn(),
    handleUserDataChange: jest.fn(),
    handleSavePlant: jest.fn(),
    handleDeletePlant: jest.fn(),
    handleUpdatePlant: jest.fn(),
  })),
}));

describe("PlantSearchScreen", () => {
  const Stack = createStackNavigator();

  const MockScreen = ({ navigation }: any) => (
    <Text onPress={() => navigation.navigate("PlantSearchScreen")}>
      Go To PlantSearchScreen
    </Text>
  );

  const renderWithNavigation = (initialRouteName = "PlantSearchScreen") => {
    return renderWithProviders(
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

  const mockHandleSaveToFirebase = jest.fn().mockResolvedValueOnce(true);
  const mockCloseModal = jest.fn();
  beforeEach(() => {
    (usePlantManagement as jest.Mock).mockReturnValue({
      selectedPlant: mockPlant,
      userPlant: mockUserPlant, // Explicitly set userId here
      handleSelectPlant: jest.fn(),
      handleSaveToFirebase: mockHandleSaveToFirebase,
      closeModal: mockCloseModal,
    });
  });


  it("renders correctly", () => {
    (useCombinedPlantSearch as jest.Mock).mockReturnValue({
      plants: [],
      loading: false,
      error: null,
    });
    renderWithNavigation();
    expect(screen.getByText("Search for a plant")).toBeVisible();
  });
  it("Shows loading overlay when loading", () => {
    const searchQuery = "test";

    (useCombinedPlantSearch as jest.Mock).mockReturnValue({
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
    (useCombinedPlantSearch as jest.Mock).mockReturnValue({
      plants: [],
      loading: false,
      error: "Error fetching plants",
    });

    renderWithNavigation();

    expect(screen.getByText("Error fetching plants")).toBeVisible();
  });

  it("Should navigate back", () => {
    renderWithNavigation("SubmitPlant");
    fireEvent.press(screen.getByText("Go To PlantSearchScreen"));
    expect(screen.getByText("Search for a plant")).toBeVisible();
    fireEvent.press(screen.getByText("Go Back"));
    expect(screen.getByText("Go To PlantSearchScreen")).toBeVisible();
  });

});
