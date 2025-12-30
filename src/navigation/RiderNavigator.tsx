import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createStackNavigator} from '@react-navigation/stack';
import RiderRideBoardScreen from '../screens/rider/RiderRideBoardScreen';
import PostRideScreen from '../screens/rider/PostRideScreen';
import ViewBidsScreen from '../screens/rider/ViewBidsScreen';
import AcceptedRideScreen from '../screens/rider/AcceptedRideScreen';
import RiderProfileScreen from '../screens/rider/RiderProfileScreen';
import SettingsNavigator from '../screens/settings/SettingsNavigator';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function RideBoardStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="RideBoardList"
        component={RiderRideBoardScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="PostRide"
        component={PostRideScreen}
        options={{title: 'Post a Ride'}}
      />
      <Stack.Screen
        name="ViewBids"
        component={ViewBidsScreen}
        options={{title: 'View Bids'}}
      />
      <Stack.Screen
        name="AcceptedRide"
        component={AcceptedRideScreen}
        options={{title: 'Ride Details'}}
      />
    </Stack.Navigator>
  );
}

const RiderNavigator = () => {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="RideBoard"
        component={RideBoardStack}
        options={{title: 'My Rides', headerShown: false}}
      />
      <Tab.Screen
        name="Profile"
        component={RiderProfileScreen}
        options={{title: 'Profile'}}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsNavigator}
        options={{title: 'Settings'}}
      />
    </Tab.Navigator>
  );
};

export default RiderNavigator;
