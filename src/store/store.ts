import { combineReducers, configureStore } from "@reduxjs/toolkit";

// import devToolsEnhancer from "redux-devtools-expo-dev-plugin";
import userPlantsReducer from "./userPlantsSlice";

const rootReducer = combineReducers({
  userPlants: userPlantsReducer,
});

export function setupStore(preloadedState?: Partial<RootState>) {
  return configureStore({
    devTools: true,
    // enhancers: (getDefaultEnhancers) =>
    //   getDefaultEnhancers().concat(devToolsEnhancer()),
    reducer: rootReducer,
    preloadedState,
  });
}

export type RootState = ReturnType<typeof rootReducer>;
export type AppStore = ReturnType<typeof setupStore>;
export type AppDispatch = AppStore["dispatch"];
