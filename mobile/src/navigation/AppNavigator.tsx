import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createStackNavigator } from '@react-navigation/stack'
import { Ionicons } from '@expo/vector-icons'

import HomeScreen from '../screens/HomeScreen'
import SearchScreen from '../screens/SearchScreen'
import FavoritesScreen from '../screens/FavoritesScreen'
import ProfileScreen from '../screens/ProfileScreen'
import SuburbDetailScreen from '../screens/SuburbDetailScreen'

export type RootStackParamList = {
  MainTabs: undefined
  SuburbDetail: { suburbId: string }
}

export type BottomTabParamList = {
  Home: undefined
  Search: undefined
  Favorites: undefined
  Profile: undefined
}

const Stack = createStackNavigator<RootStackParamList>()
const Tab = createBottomTabNavigator<BottomTabParamList>()

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline'
              break
            case 'Search':
              iconName = focused ? 'search' : 'search-outline'
              break
            case 'Favorites':
              iconName = focused ? 'heart' : 'heart-outline'
              break
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline'
              break
            default:
              iconName = 'help-outline'
          }

          return <Ionicons name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  )
}

export default function AppNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SuburbDetail"
        component={SuburbDetailScreen}
        options={{
          title: 'Suburb Details',
          headerStyle: { backgroundColor: '#3b82f6' },
          headerTintColor: 'white',
        }}
      />
    </Stack.Navigator>
  )
}