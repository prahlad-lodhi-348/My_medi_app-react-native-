import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import Home from '../../screens/tabs/Home';
import Profile from '../../screens/tabs/Profile';
import Schedule from '../../screens/tabs/Schedule';
import StockAlerts from '../../screens/tabs/StockAlerts';
import MyMediAiScreen from '../../screens/tabs/MyMediAi';

export type ProtectedTabParamList = {
  Home: undefined;
  Profile: undefined;
  Schedule: undefined;
  StockAlerts: undefined;
};

const Tab = createBottomTabNavigator<ProtectedTabParamList>();

export const ProtectedTabs: React.FC = () => {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={Home} />
      <Tab.Screen name ="MyMediAi" component={MyMediAi}/>
      <Tab.Screen name="Schedule" component={Schedule} />
      <Tab.Screen name="StockAlerts" component={StockAlerts} />
      <Tab.Screen name="Profile" component={Profile} />
    </Tab.Navigator>
  );
};

