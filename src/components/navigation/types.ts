// navigation/types.ts
export type RootStackParamList = {
  Login: undefined;
  SignUp: undefined;
  Profile: undefined;
  PlantSearch: undefined;
  PlantDetails: { plantId: string };
  SubmitPlant: undefined;
  Tab: undefined;
  Initial: undefined;
};
