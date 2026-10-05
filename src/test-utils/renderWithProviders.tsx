import React, { PropsWithChildren } from "react";
import { Provider } from "react-redux";

import { render, RenderOptions } from "@testing-library/react-native";

import {
  HouseholdContext,
  HouseholdContextType,
} from "@/context/household/HouseholdProvider";
import { setupStore, type AppStore, type RootState } from "@/store/store";
import { mockHouseholdContext } from "@/test-utils/MockHousehold";

interface ExtendedRenderOptions extends Omit<RenderOptions, "queries"> {
  preloadedState?: Partial<RootState>;
  store?: AppStore;
  /** Defaults to a loaded two-person household (see MockHousehold). */
  household?: HouseholdContextType;
}

export function renderWithProviders(
  ui: React.ReactElement,
  extendedRenderOptions: ExtendedRenderOptions = {},
) {
  const {
    preloadedState = {},
    store = setupStore(preloadedState),
    household = mockHouseholdContext(),
    ...renderOptions
  } = extendedRenderOptions;

  const Wrapper = ({ children }: PropsWithChildren<object>) => (
    <Provider store={store}>
      <HouseholdContext.Provider value={household}>
        {children}
      </HouseholdContext.Provider>
    </Provider>
  );

  return {
    store,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}
