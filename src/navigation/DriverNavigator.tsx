import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createStackNavigator} from '@react-navigation/stack';
import DriverRideBoardScreen from '../screens/driver/DriverRideBoardScreen';
import DriverTripsScreen from '../screens/driver/DriverTripsScreen';
import TripExecutionScreen from '../screens/driver/TripExecutionScreen';
import RideDetailsScreen from '../screens/driver/RideDetailsScreen';
import BidFormScreen from '../screens/driver/BidFormScreen';
import DriverProfileScreen from '../screens/driver/DriverProfileScreen';
import SettingsNavigator from '../screens/settings/SettingsNavigator';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function RideBoardStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="RideBoardList"
        component={DriverRideBoardScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="RideDetails"
        component={RideDetailsScreen}
        options={{title: 'Ride Details'}}
      />
      <Stack.Screen
        name="BidForm"
        component={BidFormScreen}
        options={{title: 'Submit Bid'}}
      />
    </Stack.Navigator>
  );
}

function MyTripsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="MyTripsList"
        component={DriverTripsScreen}
        options={{title: 'My Trips'}}
      />
      <Stack.Screen
        name="TripExecution"
        component={TripExecutionScreen}
        options={{title: 'Trip Execution'}}
      />
    </Stack.Navigator>
  );
}

const DriverNavigator = () => {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="RideBoard"
        component={RideBoardStack}
        options={{title: 'Available Rides', headerShown: false}}
      />
      <Tab.Screen
        name="MyTrips"
        component={MyTripsStack}
        options={{title: 'My Trips', headerShown: false}}
      />
      <Tab.Screen
        name="Profile"
        component={DriverProfileScreen}
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

export default DriverNavigator;
