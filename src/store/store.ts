import { combineReducers, configureStore } from "@reduxjs/toolkit";

import userPlantsReducer from "./userPlantsSlice";

const rootReducer = combineReducers({
  userPlants: userPlantsReducer,
});

export function setupStore(preloadedState?: Partial<RootState>) {
  return configureStore({
    devTools: true,
    reducer: rootReducer,
    preloadedState,
  });
}

export type RootState = ReturnType<typeof rootReducer>;
export type AppStore = ReturnType<typeof setupStore>;
export type AppDispatch = AppStore["dispatch"];
