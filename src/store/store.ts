import { configureStore } from "@reduxjs/toolkit";
import userPlantsReducer from "./userPlantsSlice";

export const store = configureStore({
    reducer: {
        userPlants: userPlantsReducer,
    },
})

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;