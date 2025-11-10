import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { usePreferences } from '@/context/PreferencesContext';
import { useAuth } from '@/context/AuthContext';
import HomeScreen from '@/screens/home/HomeScreen';
import OrdersScreen from '@/screens/orders/OrdersScreen';
import OrderDetailsScreen from '@/screens/orders/OrderDetailsScreen';
import FinanceScreen from '@/screens/finance/FinanceScreen';
import WithdrawHistoryScreen from '@/screens/finance/WithdrawHistoryScreen';
import SettingsScreen from '@/screens/settings/SettingsScreen';
import LoginScreen from '@/screens/auth/LoginScreen';
import RegisterScreen from '@/screens/auth/RegisterScreen';
import ForgotPasswordScreen from '@/screens/auth/ForgotPasswordScreen';
import SecretKeyScreen from '@/screens/auth/SecretKeyScreen';
import {
  AppTabParamList,
  AuthStackParamList,
  FinanceStackParamList,
  OrdersStackParamList,
  RootStackParamList
} from '@/navigation/types';
import { MedusaTheme } from '@/theme';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AppTabs = createBottomTabNavigator<AppTabParamList>();
const OrdersStack = createNativeStackNavigator<OrdersStackParamList>();
const FinanceStack = createNativeStackNavigator<FinanceStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();

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

const AuthNavigator = () => {
  const { theme } = usePreferences();
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: theme.colors.background
        }
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
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
  const { isInitializing, user, profile } = useAuth();

  if (isInitializing) {
    return (
      <View style={[styles.loaderContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loaderText, { color: theme.colors.textSecondary }]}>Preparando app...</Text>
      </View>
    );
  }

  if (!user) {
    return <AuthNavigator />;
  }

  if (!profile?.secretKey) {
    return (
      <RootStack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: theme.colors.background
          }
        }}
      >
        <RootStack.Screen name="SecretKey" component={SecretKeyScreen} />
      </RootStack.Navigator>
    );
  }

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

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12
  },
  loaderText: {
    fontSize: 14
  }
});

export default RootNavigator;
