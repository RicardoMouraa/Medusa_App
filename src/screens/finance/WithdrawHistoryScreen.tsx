import React, { useCallback, useEffect } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import EmptyState from '@/components/EmptyState';
import PrimaryButton from '@/components/PrimaryButton';
import WithdrawHistoryListItem from '@/components/WithdrawHistoryItem';
import { usePreferences } from '@/context/PreferencesContext';
import { useApiRequest } from '@/hooks/useApiRequest';
import { useToast } from '@/hooks/useToast';
import { getTransfers } from '@/services/medusaApi';
import { WithdrawHistoryItem } from '@/types/api';
import { useDashboard } from '@/hooks/useDashboard';

type WithdrawHistoryScreenProps = {
  navigation: any;
};

const WithdrawHistoryScreen: React.FC<WithdrawHistoryScreenProps> = ({ navigation }) => {
  const { theme } = usePreferences();
  const { definition, secretKey, apiOptions, displayLabel } = useDashboard();
  const { showToast } = useToast();

  const fetchHistory = useCallback(
    () =>
      secretKey
        ? getTransfers(secretKey, apiOptions)
        : Promise.reject(
            new Error(`Informe ${definition.passkeyLabel} para ver o historico do ${displayLabel}.`)
          ),
    [apiOptions, definition.passkeyLabel, displayLabel, secretKey]
  );

  const { data, isLoading, error, refetch } = useApiRequest<WithdrawHistoryItem[]>(fetchHistory, [fetchHistory], {
    refreshInterval: 30000
  });

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch])
  );

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  useEffect(() => {
    if (!error) return;
    showToast({
      type: 'error',
      text1: 'Erro ao carregar historico',
      text2: error.message
    });
  }, [error, showToast]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Historico de saques</Text>
          <View style={styles.backButton} />
        </View>

        <FlatList
          data={data ?? []}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => void refetch()} />}
          renderItem={({ item }) => <WithdrawHistoryListItem item={item} />}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            isLoading ? (
              <View style={styles.loading}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={[styles.loadingText, { color: theme.colors.textMuted }]}>
                  Carregando historico...
                </Text>
              </View>
            ) : (
              <EmptyState
                title="Nenhum saque encontrado"
                subtitle="Solicite um saque para que ele apareca aqui."
                icon="cash-outline"
              />
            )
          }
          ListFooterComponentStyle={styles.listFooter}
          ListFooterComponent={
            <PrimaryButton label="Atualizar historico" variant="outline" onPress={() => void refetch()} />
          }
        />
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  safeArea: {
    flex: 1
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700'
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    paddingTop: 10,
    gap: 12
  },
  separator: {
    height: 12
  },
  loading: {
    paddingVertical: 80,
    alignItems: 'center',
    gap: 12
  },
  loadingText: {
    fontSize: 14
  },
  listFooter: {
    marginTop: 16
  }
});

export default WithdrawHistoryScreen;
