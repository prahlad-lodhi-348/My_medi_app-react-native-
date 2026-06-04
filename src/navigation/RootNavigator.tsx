import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '../context/AuthContext';
import { AuthStack } from './stacks/AuthStack';
import { ProtectedTabs } from './tabs/ProtectedTabs';

export type RootStackParamList = {
  Auth: undefined;
  App: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { status } = useAuth();

  return (
    <NavigationContainer>
      {status.state === 'signed_in' ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="App" component={ProtectedTabs} />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Auth" component={AuthStack} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
};

