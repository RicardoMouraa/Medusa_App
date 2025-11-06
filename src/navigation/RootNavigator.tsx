import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { usePreferences } from '@/context/PreferencesContext';
import HomeScreen from '@/screens/home/HomeScreen';
import OrdersScreen from '@/screens/orders/OrdersScreen';
import OrderDetailsScreen from '@/screens/orders/OrderDetailsScreen';
import FinanceScreen from '@/screens/finance/FinanceScreen';
import WithdrawHistoryScreen from '@/screens/finance/WithdrawHistoryScreen';
import SettingsScreen from '@/screens/settings/SettingsScreen';
import {
  AppTabParamList,
  FinanceStackParamList,
  OrdersStackParamList,
  RootStackParamList
} from '@/navigation/types';
import { MedusaTheme } from '@/theme';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AppTabs = createBottomTabNavigator<AppTabParamList>();
const OrdersStack = createNativeStackNavigator<OrdersStackParamList>();
const FinanceStack = createNativeStackNavigator<FinanceStackParamList>();

const renderTabIcon = (
  route: keyof AppTabParamList,
  focused: boolean,
  color: string,
  theme: MedusaTheme
) => {
  const size = focused ? 26 : 24;
  switch (route) {
    case 'HomeTab':
      return <Ionicons name={focused ? 'speedometer' : 'speedometer-outline'} size={size} color={color} />;
    case 'OrdersTab':
      return (
        <MaterialCommunityIcons
          name={focused ? 'file-document' : 'file-document-outline'}
          size={size}
          color={color}
        />
      );
    case 'FinanceTab':
      return (
        <Ionicons
          name={focused ? 'wallet' : 'wallet-outline'}
          size={size}
          color={color}
        />
      );
    case 'SettingsTab':
      return (
        <Ionicons
          name={focused ? 'settings' : 'settings-outline'}
          size={size}
          color={color}
        />
      );
    default:
      return (
        <Ionicons
          name="ellipse-outline"
          size={size}
          color={color}
        />
      );
  }
};

const OrdersNavigator = () => {
  const { theme } = usePreferences();
  return (
    <OrdersStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: theme.colors.background
        }
      }}
    >
      <OrdersStack.Screen name="OrdersList" component={OrdersScreen} />
      <OrdersStack.Screen name="OrderDetails" component={OrderDetailsScreen} />
    </OrdersStack.Navigator>
  );
};

const FinanceNavigator = () => {
  const { theme } = usePreferences();
  return (
    <FinanceStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: theme.colors.background
        }
      }}
    >
      <FinanceStack.Screen name="Finance" component={FinanceScreen} />
      <FinanceStack.Screen name="WithdrawHistory" component={WithdrawHistoryScreen} />
    </FinanceStack.Navigator>
  );
};

const AppTabsNavigator = () => {
  const { theme } = usePreferences();
  return (
    <AppTabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.tabBarBackground,
          borderTopColor: theme.colors.border,
          paddingTop: 4,
          paddingBottom: 10,
          height: 70
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600'
        },
        tabBarActiveTintColor: theme.colors.tabBarActive,
        tabBarInactiveTintColor: theme.colors.tabBarInactive,
        tabBarIcon: ({ focused, color }) => renderTabIcon(route.name, focused, color, theme)
      })}
    >
      <AppTabs.Screen name="HomeTab" component={HomeScreen} options={{ title: 'Home' }} />
      <AppTabs.Screen name="OrdersTab" component={OrdersNavigator} options={{ title: 'Pedidos' }} />
      <AppTabs.Screen name="FinanceTab" component={FinanceNavigator} options={{ title: 'Financeiro' }} />
      <AppTabs.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{ title: 'Configurações' }}
      />
    </AppTabs.Navigator>
  );
};

const RootNavigator = () => {
  const { theme } = usePreferences();

  return (
    <RootStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: theme.colors.background
        }
      }}
    >
      <RootStack.Screen name="App" component={AppTabsNavigator} />
    </RootStack.Navigator>
  );
};

export default RootNavigator;
