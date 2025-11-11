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



import { useFocusEffect } from '@react-navigation/native';



import EmptyState from '@/components/EmptyState';

import PrimaryButton from '@/components/PrimaryButton';

import WithdrawHistoryListItem from '@/components/WithdrawHistoryItem';

import { useAuth } from '@/context/AuthContext';

import { usePreferences } from '@/context/PreferencesContext';

import { useApiRequest } from '@/hooks/useApiRequest';

import { useToast } from '@/hooks/useToast';

import { getTransfers } from '@/services/medusaApi';

import { WithdrawHistoryItem } from '@/types/api';



type WithdrawHistoryScreenProps = {

  navigation: any;

};



const WithdrawHistoryScreen: React.FC<WithdrawHistoryScreenProps> = ({ navigation }) => {

  const { theme } = usePreferences();

  const { profile } = useAuth();

  const { showToast } = useToast();

  const secretKey = profile?.secretKey;



  const fetchHistory = useCallback(

    () => (secretKey ? getTransfers(secretKey) : Promise.reject(new Error('Secret Key nao configurada.'))),

    [secretKey]

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

      text1: 'Erro ao carregar histórico',

      text2: error.message

    });

  }, [error, showToast]);



  return (

    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>

      <View style={styles.header}>

        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>

          <Ionicons name="chevron-back" size={24} color={theme.colors.text} />

        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Histórico de saques</Text>

        <View style={styles.backButton} />

      </View>

      <FlatList

        data={data ?? []}

        keyExtractor={(item) => item.id}

        contentContainerStyle={styles.listContent}

        refreshControl={

          <RefreshControl refreshing={isLoading} onRefresh={() => void refetch()} />

        }

        renderItem={({ item }) => <WithdrawHistoryListItem item={item} />}

        ListEmptyComponent={

          isLoading ? (

            <View style={styles.loading}>

              <ActivityIndicator size="large" color={theme.colors.primary} />

              <Text style={[styles.loadingText, { color: theme.colors.textMuted }]}>

                Buscando histórico...

              </Text>

            </View>

          ) : (

            <EmptyState

              title="Nenhum saque encontrado"

              subtitle="Solicite um saque para que ele apareça aqui."

              icon="cash-outline"

            />

          )

        }

        ListFooterComponent={

          <PrimaryButton

            label="Atualizar histórico"

            variant="outline"

            onPress={() => void refetch()}

            style={styles.footerButton}

          />

        }

      />

    </View>

  );

};



const styles = StyleSheet.create({

  container: {

    flex: 1

  },

  header: {

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    paddingHorizontal: 16,

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

    padding: 20,

    paddingBottom: 120

  },

  loading: {

    paddingVertical: 80,

    alignItems: 'center',

    gap: 12

  },

  loadingText: {

    fontSize: 14

  },

  footerButton: {

    marginHorizontal: 16,

    marginTop: 12

  }

});



export default WithdrawHistoryScreen;

