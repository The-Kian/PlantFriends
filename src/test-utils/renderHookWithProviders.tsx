import React, { PropsWithChildren } from "react";
import { Provider } from "react-redux";

import { renderHook, RenderHookOptions } from "@testing-library/react-native";

import { setupStore, type AppStore, type RootState } from "@/store/store";

interface ExtendedRenderHookOptions<Props> extends RenderHookOptions<Props> {
  preloadedState?: Partial<RootState>;
  store?: AppStore;
}

export function renderHookWithProviders<Result, Props>(
  renderCallback: (initialProps: Props) => Result,
  {
    preloadedState = {},
    store = setupStore(preloadedState),
    ...renderOptions
  }: ExtendedRenderHookOptions<Props> = {},
) {
  function Wrapper({
    children,
  }: PropsWithChildren<Props>): React.ReactElement {
    return <Provider store={store}>{children}</Provider>;
  }

  return {
    store,
    ...renderHook(renderCallback, { wrapper: Wrapper, ...renderOptions }),
  };
}