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
import { mockHousehold } from "@/test-utils/MockHousehold";
import { mockPlant, mockUserPlant } from "@/test-utils/MockPlant";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

import PlantSearchScreen from "./";

jest.mock("@/helpers/notifications/registerWithExplanation", () => ({
  registerWithExplanation: jest.fn(async () => null),
}));
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
  const MockDetailsScreen = ({ route }: any) => (
    <Text>{`Details for ${route.params.plantId}`}</Text>
  );
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
            <Stack.Screen
              name="PlantDetails"
              component={MockDetailsScreen}
            />
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

  it("hints at what to search for before anything is typed", () => {
    renderComponent();
    expect(screen.getByText(/Search by common or Latin name/)).toBeTruthy();
    expect(screen.queryByText(/No plants match/)).toBeNull();
  });

  it("asks for a second letter before searching", () => {
    renderComponent();
    fireEvent.changeText(screen.getByLabelText("Search for a plant input field"), "m");
    expect(screen.getByText(/at least 2 letters/)).toBeTruthy();
  });

  it("says nothing matched, and offers to add it by hand", async () => {
    (useCombinedPlantSearch as jest.Mock).mockReturnValue({
      plants: [],
      loading: false,
      error: null,
      searched: true,
    });
    renderComponent();
    fireEvent.changeText(
      screen.getByLabelText("Search for a plant input field"),
      "zzzz",
    );

    expect(await screen.findByText('No plants match "zzzz"')).toBeTruthy();
    fireEvent.press(screen.getByText("Add it yourself"));
    await waitFor(() => {
      expect(screen.getByText("Mock Customization Modal")).toBeVisible();
    });
  });

  it("doesn't say nothing matched while still searching", () => {
    (useCombinedPlantSearch as jest.Mock).mockReturnValue({
      plants: [],
      loading: true,
      error: null,
      searched: false,
    });
    renderComponent();
    fireEvent.changeText(
      screen.getByLabelText("Search for a plant input field"),
      "zzzz",
    );
    expect(screen.queryByText(/No plants match/)).toBeNull();
  });

  it("says so when the phone is offline, and still offers to add by hand", async () => {
    (useCombinedPlantSearch as jest.Mock).mockReturnValue({
      plants: [],
      loading: false,
      error: { code: "functions/unavailable" },
    });
    renderComponent();

    expect(
      await screen.findByText("You're offline. Searching needs a connection."),
    ).toBeTruthy();
    expect(
      screen.getByText("Add a new plant (not in search results)"),
    ).toBeTruthy();
  });

  it("explains partial results when the plant library can't be reached", async () => {
    (useCombinedPlantSearch as jest.Mock).mockReturnValue({
      plants: [mockPlant],
      loading: false,
      error: new Error("internal"),
    });
    renderComponent();

    expect(
      await screen.findByText(/plants other people have added/),
    ).toBeTruthy();
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

  it("opens the plant's details after saving a selected plant", async () => {
    (savePlantToFirebase as jest.Mock).mockResolvedValueOnce({ id: "saved" });
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
        mockHousehold,
      );
    });
    expect(screen.getByText("Details for mock-uuid-123")).toBeVisible();
  });

  it("opens the plant's details after saving a new plant", async () => {
    (savePlantToFirebase as jest.Mock).mockResolvedValueOnce({ id: "saved" });
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
        mockHousehold,
      );
    });
    expect(screen.getByText(`Details for ${mockUserPlant.id}`)).toBeVisible();
  });

  it("keeps the form open when the save fails", async () => {
    (savePlantToFirebase as jest.Mock).mockResolvedValueOnce(null);
    renderComponent();

    fireEvent.press(
      screen.getByText("Add a new plant (not in search results)"),
    );
    await screen.findByText("Mock Customization Modal");
    fireEvent.press(screen.getByTestId("save-button"));

    await waitFor(() => expect(savePlantToFirebase).toHaveBeenCalled());
    expect(screen.getByText("Mock Customization Modal")).toBeVisible();
    expect(screen.queryByText("You are on the Tab screen")).toBeNull();
  });

  it("navigates back when the header back button is pressed", async () => {
    renderComponent("Initial");

    fireEvent.press(screen.getByText("Go to Search"));
    await screen.findByTestId("screen-header-back");

    fireEvent.press(screen.getByTestId("screen-header-back"));

    await waitFor(() => {
      expect(screen.getByText("Go to Search")).toBeVisible();
    });
  });
});
