import React, { PropsWithChildren } from 'react'
import { render } from '@testing-library/react-native'
import type { RenderOptions } from '@testing-library/react-native'
import { configureStore } from '@reduxjs/toolkit'
import { Provider } from 'react-redux';
import { renderHook } from '@testing-library/react-native';
import userPlantsReducer from '@store/userPlantsSlice';

interface ExtendedRenderOptions extends RenderOptions {
  preloadedState?: any;
  store?: ReturnType<typeof configureStore>;
}

export function renderHookWithProviders<
  Result,
  Props>(
    render: (initialProps: Props) => Result,
    {
      preloadedState = {},
      store = configureStore({
          reducer: userPlantsReducer,
          preloadedState
        }),
      ...renderOptions
    }: ExtendedRenderOptions = {}
  ) {
  function Wrapper({ children }: PropsWithChildren<{}>): JSX.Element {
    return <Provider store={store}>{children}</Provider>
  }

  return { store, ...renderHook(render, { wrapper: Wrapper, ...renderOptions }) }
}