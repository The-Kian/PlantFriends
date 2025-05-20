import {createSlice, PayloadAction} from '@reduxjs/toolkit';

import { IUserPlant } from '@constants/IPlant';

const initialState: IUserPlant[] = [];
/**
 * @slice
 * This slice manages the user's plants in the Redux store.
 * It includes actions to set, add, update, and delete plants.
 * 
 * @state
 * The state is an array of IUserPlant objects.
 * 
 */
const userPlantsSlice = createSlice({
    name: 'userPlants',
    initialState,
    reducers: {
        /**
         * @reducer
         * takes an array of IUserPlant objects and replaces the entire state with it. 
         * This is used when initially loading plants from Firebase.
         */
        setUserPlants: (state, action: PayloadAction<IUserPlant[]>) => {
            return action.payload;
        },
        /**
         * @reducer
         * takes an IUserPlant object and adds it to the state. 
         * This is used when a new plant is added.
         */
        addPlant: (state, action: PayloadAction<IUserPlant>) => {
            state.push(action.payload);
        },
        /**
         * @reducer
         * takes an IUserPlant object and updates the existing plant in the state. 
         * This is used when a plant is updated.
         */

        updatePlant: (state, action: PayloadAction<IUserPlant>) => {
            const index = state.findIndex(plant => plant.id === action.payload.id);
            if (index !== -1) {
                state[index] = action.payload;
            }
        },
        /**
         * @reducer
         * takes a plant ID and removes the corresponding plant from the state. 
         * This is used when a plant is deleted.
         */
        deletePlant: (state, action: PayloadAction<string>) => {
            return state.filter(plant => plant.id !== action.payload);
        },
    }
});

export const { setUserPlants, addPlant, updatePlant, deletePlant } = userPlantsSlice.actions;
export default userPlantsSlice.reducer