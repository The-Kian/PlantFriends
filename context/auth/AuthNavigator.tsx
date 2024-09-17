import React, { useContext, useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { AuthContext } from './AuthProvider';
import TabLayout from '@/app/(tabs)/_layout';
import AuthStack from './AuthStack';
import LoadingOverlay from '@/components/ui/LoadingOverlay';


function AuthNavigator() {
  const { user, initializing } = useContext(AuthContext);



  if (initializing) return <LoadingOverlay message="Loading"></LoadingOverlay>;

  return user ? <TabLayout /> : <AuthStack />;
}

export default AuthNavigator;