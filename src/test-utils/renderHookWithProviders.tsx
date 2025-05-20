/* eslint-disable  @typescript-eslint/no-explicit-any */

import { configureStore } from '@reduxjs/toolkit'
import React, { PropsWithChildren } from 'react'
import { Provider } from 'react-redux';

import type { RenderOptions } from '@testing-library/react-native'
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
  function Wrapper({ children }: PropsWithChildren<object>): JSX.Element {
    return <Provider store={store}>{children}</Provider>
  }

  return { store, ...renderHook(render, { wrapper: Wrapper, ...renderOptions }) }
}