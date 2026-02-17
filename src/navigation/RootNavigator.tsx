import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import useSession from '../hooks/useSession';
import LoadingScreen from '../screens/LoadingScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import AdminHomeScreen from '../screens/AdminHomeScreen';
import RecipientLedgerScreen from '../screens/RecipientLedgerScreen';
import CoworkerHomeScreen from '../screens/CoworkerHomeScreen';
import AddTransactionScreen from '../screens/AddTransactionScreen';
import AddRecipientScreen from '../screens/AddRecipientScreen';
import GetStatementScreen from '../screens/GetStatementScreen';
import { colors } from '../theme/colors';

export type RootStackParamList = {
  Welcome: undefined;
  AdminHome: undefined;
  RecipientLedger: {
    recipientId: string;
    recipientName: string;
    isReadOnly: boolean;
  };
  AddTransaction: {
    recipientId?: string;
    recipientName?: string;
    initialDirection?: 'SENT' | 'RECEIVED';
  };
  AddRecipient: undefined;
  GetStatement: undefined;
  CoworkerHome: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const commonScreenOptions = {
  headerStyle: {
    backgroundColor: colors.card,
  },
  headerTintColor: colors.text,
  headerShadowVisible: false,
  contentStyle: {
    backgroundColor: colors.background,
  },
};

export default function RootNavigator() {
  const { session, loading } = useSession();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!session) {
    return (
      <Stack.Navigator screenOptions={commonScreenOptions}>
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
      </Stack.Navigator>
    );
  }

  if (session.role === 'ADMIN') {
    return (
      <Stack.Navigator screenOptions={commonScreenOptions}>
        <Stack.Screen
          name="AdminHome"
          component={AdminHomeScreen}
          options={{ title: 'Admin Home' }}
        />
        <Stack.Screen
          name="RecipientLedger"
          component={RecipientLedgerScreen}
          options={({ route }) => ({ title: route.params.recipientName })}
        />
        <Stack.Screen
          name="AddTransaction"
          component={AddTransactionScreen}
          options={{ title: 'Add Transaction' }}
        />
        <Stack.Screen
          name="AddRecipient"
          component={AddRecipientScreen}
          options={{ title: 'Add Recipient' }}
        />
        <Stack.Screen
          name="GetStatement"
          component={GetStatementScreen}
          options={{ title: 'Get Statement' }}
        />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator screenOptions={commonScreenOptions}>
      <Stack.Screen
        name="CoworkerHome"
        component={CoworkerHomeScreen}
        options={{ title: 'My Ledger' }}
      />
    </Stack.Navigator>
  );
}
