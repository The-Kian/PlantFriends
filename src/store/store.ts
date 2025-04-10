import { configureStore } from "@reduxjs/toolkit";
// import devToolsEnhancer from "redux-devtools-expo-dev-plugin";
import userPlantsReducer from "./userPlantsSlice";

export const store = configureStore({
  devTools: false,
  // enhancers: (getDefaultEnhancers) =>
  //   getDefaultEnhancers().concat(devToolsEnhancer()),
  reducer: {
    userPlants: userPlantsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
