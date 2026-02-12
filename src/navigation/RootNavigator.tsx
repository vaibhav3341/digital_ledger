import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import useSession from '../hooks/useSession';
import { RecipientTransactionType, SharedTransactionType, ValidatedAccessCode } from '../models/types';
import LoadingScreen from '../screens/LoadingScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import RegisterAccessCodeScreen from '../screens/RegisterAccessCodeScreen';
import RegisterProfileScreen from '../screens/RegisterProfileScreen';
import AdminHomeScreen from '../screens/AdminHomeScreen';
import RecipientLedgerScreen from '../screens/RecipientLedgerScreen';
import CoworkerHomeScreen from '../screens/CoworkerHomeScreen';
import AddTransactionScreen from '../screens/AddTransactionScreen';

export type RootStackParamList = {
  Welcome: undefined;
  RegisterAccessCode: undefined;
  RegisterProfile: { validatedCode?: ValidatedAccessCode } | undefined;
  AdminHome: undefined;
  RecipientsList: undefined;
  RecipientLedger: {
    recipientId: string;
    recipientName: string;
    isReadOnly: boolean;
  };
  AddSharedTransaction: {
    initialType: SharedTransactionType;
  };
  AddRecipientTransaction: {
    recipientId: string;
    recipientName: string;
    initialType: RecipientTransactionType;
  };
  AddTransaction: {
    recipientId?: string;
    recipientName?: string;
    initialDirection?: 'SENT' | 'RECEIVED';
  };
  CoworkerHome: undefined;
  Auth: undefined;
  RoleSelect: undefined;
  JoinInvite: { name: string; phone?: string } | undefined;
  OwnerHome: undefined;
  CoworkerDetail: { coworkerId: string; name: string };
  AddEditTransaction: { coworkerId: string; txnId?: string };
  InviteCoworker: undefined;
  CoworkerLedger: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { session, loading } = useSession();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!session) {
    return (
      <Stack.Navigator>
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen
          name="RegisterAccessCode"
          component={RegisterAccessCodeScreen}
          options={{ title: 'Access Code' }}
        />
        <Stack.Screen
          name="RegisterProfile"
          component={RegisterProfileScreen}
          options={{ title: 'Profile' }}
        />
      </Stack.Navigator>
    );
  }

  if (session.role === 'ADMIN') {
    return (
      <Stack.Navigator>
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
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator>
      <Stack.Screen
        name="CoworkerHome"
        component={CoworkerHomeScreen}
        options={{ title: 'My Ledger' }}
      />
    </Stack.Navigator>
  );
}
