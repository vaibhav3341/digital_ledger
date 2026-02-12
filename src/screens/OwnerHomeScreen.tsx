import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import Button from '../components/Button';
import CoworkerCard from '../components/CoworkerCard';
import EmptyState from '../components/EmptyState';
import useCoworkers from '../hooks/useCoworkers';
import useOwnerBalances from '../hooks/useOwnerBalances';
import { RootStackParamList } from '../navigation/RootNavigator';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

export default function OwnerHomeScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const ownerId = auth().currentUser?.uid;
  const { coworkers } = useCoworkers(ownerId);
  const { balances } = useOwnerBalances(ownerId);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Coworkers</Text>
        <Button
          label="Add"
          onPress={() => navigation.navigate('InviteCoworker')}
          variant="secondary"
        />
      </View>

      <FlatList
        data={coworkers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CoworkerCard
            name={item.name}
            balance={balances[item.id]?.balance ?? 0}
            lastActivity={balances[item.id]?.lastActivity}
            onPress={() =>
              navigation.navigate('CoworkerDetail', {
                coworkerId: item.id,
                name: item.name,
              })
            }
          />
        )}
        contentContainerStyle={
          coworkers.length === 0 ? styles.emptyContainer : styles.listContainer
        }
        ListEmptyComponent={
          <EmptyState
            title="No coworkers yet"
            subtitle="Add a coworker to start tracking payments"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  listContainer: {
    paddingBottom: spacing.xl,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
});
