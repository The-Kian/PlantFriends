/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-var-requires */

import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import React from "react";

import { Text, Button } from "react-native";

import { screen, waitFor, fireEvent } from "@testing-library/react-native";

import { RootStackParamList } from "@/components/navigation/types";
import { AuthContext } from "@/context/auth/AuthProvider";
import savePlantToFirebase from "@/helpers/firebase/savePlantToFirebase";
import { useCombinedPlantSearch } from "@/hooks/search/useCombinedPlantSearch";
import mockAuthContextValue from "@/test-utils/MockAuthContextValue";
import mockUser from "@/test-utils/MockFirebaseUser";
import { mockPlant, mockUserPlant } from "@/test-utils/MockPlant";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

import PlantSearchScreen from "./";

jest.mock("./Results", () => {
  const MockResults = (props: {
    plants: any[];
    onSelectPlant: (plant: any) => void;
  }) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { View, Button } = require("react-native");
    return (
      <View>
        {props.plants.map((plant) => (
          <Button
            key={plant.id}
            title={plant.name}
            onPress={() => props.onSelectPlant(plant)}
            testID={`select-${plant.name}`}
          />
        ))}
      </View>
    );
  };
  MockResults.displayName = "MockResults";
  return MockResults;
});

jest.mock("@/components/plant/CustomizationModal", () => {
  const MockCustomizationModal = (props: {
    plant?: any;
    userPlant?: any;
    onSave: (u: any, p: any) => void;
    onClose: () => void;
    isAddingNewPlant: boolean;
  }) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { View, Button, Text } = require("react-native");
    const handleSave = () => {
      // This mock behaves differently depending on if we are adding or editing
      if (props.isAddingNewPlant) {
        // Use imported mocks to simulate saving a new plant
        props.onSave(mockUserPlant, mockPlant);
      } else {
        // Use the data passed via props when editing an existing plant
        props.onSave(props.userPlant, props.plant);
      }
    };
    return (
      <View>
        <Text>Mock Customization Modal</Text>
        <Button title="Save" onPress={handleSave} testID="save-button" />
        <Button title="Close" onPress={props.onClose} testID="close-button" />
      </View>
    );
  };
  MockCustomizationModal.displayName = "MockCustomizationModal";
  return MockCustomizationModal;
});

// Mock helper functions and hooks
jest.mock("@/hooks/search/useCombinedPlantSearch");
jest.mock("@/helpers/firebase/savePlantToFirebase");
jest.mock("react-native-uuid", () => ({ v4: () => "mock-uuid-123" }));

// --- Test Suite ---
describe("PlantSearchScreen", () => {
  const Stack = createStackNavigator<RootStackParamList>();

  // Mock screens to test navigation TO and FROM
  const MockTabScreen = () => <Text>You are on the Tab screen</Text>;
  const InitialTestScreen = ({ navigation }: any) => (
    <Button
      title="Go to Search"
      onPress={() => navigation.navigate("PlantSearch")}
    />
  );

  // A custom render function that provides a real navigator and all necessary contexts
  const renderComponent = (
    initialRoute: keyof RootStackParamList = "PlantSearch",
  ) => {
    return renderWithProviders(
      <AuthContext.Provider value={mockAuthContextValue}>
        <NavigationContainer>
          <Stack.Navigator initialRouteName={initialRoute}>
            <Stack.Screen name="Initial" component={InitialTestScreen} />
            <Stack.Screen name="PlantSearch" component={PlantSearchScreen} />
            <Stack.Screen name="Tab" component={MockTabScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </AuthContext.Provider>,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useCombinedPlantSearch as jest.Mock).mockReturnValue({
      plants: [],
      loading: false,
      error: null,
    });
  });

  it("opens modal with user data when a plant is selected", async () => {
    (useCombinedPlantSearch as jest.Mock).mockReturnValue({
      plants: [mockPlant],
    });
    renderComponent();
    fireEvent.press(screen.getByTestId(`select-${mockPlant.name}`));
    await waitFor(() => {
      expect(screen.getByText("Mock Customization Modal")).toBeVisible();
    });
  });

  it("opens modal in 'add new' mode when button is pressed", async () => {
    renderComponent();
    fireEvent.press(
      screen.getByText("Add a new plant (not in search results)"),
    );
    await waitFor(() => {
      expect(screen.getByText("Mock Customization Modal")).toBeVisible();
    });
  });

  it("closes the modal when the close action is triggered", async () => {
    (useCombinedPlantSearch as jest.Mock).mockReturnValue({
      plants: [mockPlant],
    });
    renderComponent();

    fireEvent.press(screen.getByTestId(`select-${mockPlant.name}`));
    await screen.findByText("Mock Customization Modal");
    fireEvent.press(screen.getByTestId("close-button"));
    await waitFor(() => {
      expect(screen.queryByText("Mock Customization Modal")).toBeNull();
    });
  });

  it("navigates to Tab screen after saving a selected plant", async () => {
    (useCombinedPlantSearch as jest.Mock).mockReturnValue({
      plants: [mockPlant],
    });
    renderComponent();

    fireEvent.press(screen.getByTestId(`select-${mockPlant.name}`));
    await screen.findByText("Mock Customization Modal");
    fireEvent.press(screen.getByTestId("save-button"));

    await waitFor(() => {
      expect(savePlantToFirebase).toHaveBeenCalledWith(
        expect.objectContaining({ plantId: mockPlant.id, id: "mock-uuid-123" }),
        mockPlant,
        mockUser,
      );
    });
    expect(screen.getByText("You are on the Tab screen")).toBeVisible();
  });

  it("navigates to Tab screen after saving a new plant", async () => {
    renderComponent();

    fireEvent.press(
      screen.getByText("Add a new plant (not in search results)"),
    );
    await screen.findByText("Mock Customization Modal");
    fireEvent.press(screen.getByTestId("save-button"));

    await waitFor(() => {
      expect(savePlantToFirebase).toHaveBeenCalledWith(
        expect.objectContaining({ plantId: mockPlant.id }),
        mockPlant,
        mockUser,
      );
    });
    expect(screen.getByText("You are on the Tab screen")).toBeVisible();
  });

  it("navigates back when 'Go Back' is pressed", async () => {
    renderComponent("Initial");

    fireEvent.press(screen.getByText("Go to Search"));
    await screen.findByText("Go Back");

    fireEvent.press(screen.getByText("Go Back"));

    await waitFor(() => {
      expect(screen.getByText("Go to Search")).toBeVisible();
    });
  });
});
