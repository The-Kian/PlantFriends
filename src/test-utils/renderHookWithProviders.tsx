import React, { PropsWithChildren } from "react";
import { Provider } from "react-redux";

import { renderHook, RenderHookOptions } from "@testing-library/react-native";

import {
  HouseholdContext,
  HouseholdContextType,
} from "@/context/household/HouseholdProvider";
import { setupStore, type AppStore, type RootState } from "@/store/store";
import { mockHouseholdContext } from "@/test-utils/MockHousehold";

interface ExtendedRenderHookOptions<Props> extends RenderHookOptions<Props> {
  preloadedState?: Partial<RootState>;
  store?: AppStore;
  /** Defaults to a loaded two-person household (see MockHousehold). */
  household?: HouseholdContextType;
}

export function renderHookWithProviders<Result, Props>(
  renderCallback: (initialProps: Props) => Result,
  {
    preloadedState = {},
    store = setupStore(preloadedState),
    household = mockHouseholdContext(),
    ...renderOptions
  }: ExtendedRenderHookOptions<Props> = {},
) {
  function Wrapper({
    children,
  }: PropsWithChildren<Props>): React.ReactElement {
    return (
      <Provider store={store}>
        <HouseholdContext.Provider value={household}>
          {children}
        </HouseholdContext.Provider>
      </Provider>
    );
  }

  return {
    store,
    ...renderHook(renderCallback, { wrapper: Wrapper, ...renderOptions }),
  };
}