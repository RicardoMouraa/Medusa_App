export type AppTabParamList = {
  HomeTab: undefined;
  OrdersTab: undefined;
  FinanceTab: undefined;
  SettingsTab: undefined;
};

export type RootStackParamList = {
  App: { screen?: keyof AppTabParamList } | undefined;
  SecretKey: undefined;
  Profile: undefined;
};

export type OrdersStackParamList = {
  OrdersList: undefined;
  OrderDetails: { orderId: string };
};

export type FinanceStackParamList = {
  Finance: undefined;
  WithdrawHistory: undefined;
};

export type SettingsStackParamList = {
  Settings: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};
