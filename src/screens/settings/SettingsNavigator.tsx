import React from 'react';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import AppSettingsScreen from './AppSettingsScreen';
import UserSettingsScreen from './UserSettingsScreen';

const Tab = createMaterialTopTabNavigator();

const SettingsNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#666',
        tabBarLabelStyle: {fontSize: 14, fontWeight: '600'},
        tabBarStyle: {backgroundColor: '#fff'},
        tabBarIndicatorStyle: {backgroundColor: '#007AFF'},
      }}>
      <Tab.Screen
        name="UserSettings"
        component={UserSettingsScreen}
        options={{title: 'User Settings'}}
      />
      <Tab.Screen
        name="AppSettings"
        component={AppSettingsScreen}
        options={{title: 'App Settings'}}
      />
    </Tab.Navigator>
  );
};

export default SettingsNavigator;
