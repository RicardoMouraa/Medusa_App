import React, { useCallback, useMemo, useState } from 'react';
import {
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import { useDashboard } from '@/hooks/useDashboard';
import { useToast } from '@/hooks/useToast';
import { useNotificationCenter } from '@/context/NotificationCenterContext';
import { formatCurrencyBRL, formatDayAndTime } from '@/utils/format';

type HeaderAction = {
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  badgeCount?: number;
};

type MedusaHeaderProps = {
  title?: string;
  subtitle?: string;
  actions?: HeaderAction[];
  children?: React.ReactNode;
};

const logoSource = require('../../assets/logo-horizontal-branca.png');

const MedusaHeader: React.FC<MedusaHeaderProps> = ({
  title,
  subtitle,
  actions = [],
  children
}) => {
  const { theme } = usePreferences();
  const { profile, requestPasswordReset, signOut } = useAuth();
  const { secretKey: activeSecretKey } = useDashboard();
  const navigation = useNavigation<any>();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const [menuVisible, setMenuVisible] = useState(false);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const { notifications, unreadCount, markNotificationAsRead, markAllAsRead } = useNotificationCenter();

  const navigateToRoot = useCallback(
    (route: string, params?: Record<string, unknown>) => {
      const parent = navigation.getParent?.();
      if (parent) {
        parent.navigate(route as never, params as never);
      } else {
        navigation.navigate(route as never, params as never);
      }
    },
    [navigation]
  );

  const latestNotifications = notifications.slice(0, 5);
  const notificationBadge = unreadCount;

  const initials = useMemo(() => {
    if (!profile?.name) return (profile?.email?.[0] ?? '?').toUpperCase();
    return profile.name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((chunk) => chunk[0]?.toUpperCase() ?? '')
      .join('');
  }, [profile]);

  const handleMenuAction = async (action: string) => {
    setMenuVisible(false);
    try {
      switch (action) {
        case 'profile':
          navigateToRoot('Profile');
          break;
        case 'settings':
          navigation.navigate('SettingsTab' as never);
          showToast({
            type: 'info',
            text1: 'Abra Configuracoes',
            text2: 'Ajuste seu nome e email nas preferencias.'
          });
          break;
        case 'password':
          if (!profile?.email) {
            showToast({
              type: 'info',
              text1: 'Informe um email',
              text2: 'Cadastre um email antes de trocar a senha.'
            });
            return;
          }
          await requestPasswordReset(profile.email);
          showToast({
            type: 'success',
            text1: 'Link enviado',
            text2: 'Veja sua caixa de entrada para redefinir a senha.'
          });
          break;
        case 'logout':
          await signOut();
          showToast({
            type: 'success',
            text1: 'Voce saiu da conta'
          });
          break;
        default:
          break;
      }
    } catch (error) {
      showToast({
        type: 'error',
        text1: 'Acao nao concluida',
        text2: error instanceof Error ? error.message : undefined
      });
    }
  };

  const handleNotificationsPress = useCallback(() => {
    if (!activeSecretKey) {
      showToast({
        type: 'info',
        text1: 'Configurar Passkey',
        text2: 'Informe a chave do dashboard selecionado para receber alertas.'
      });
      return;
    }
    setNotificationsVisible(true);
  }, [activeSecretKey, showToast]);

  const menuItems = [
    {
      key: 'profile',
      label: 'Meu perfil',
      icon: 'person-circle-outline' as const
    },
    {
      key: 'settings',
      label: 'Preferencias',
      icon: 'settings-outline' as const
    },
    {
      key: 'password',
      label: 'Trocar senha',
      icon: 'key-outline' as const
    },
    {
      key: 'logout',
      label: 'Sair da conta',
      icon: 'log-out-outline' as const,
      destructive: true
    }
  ];

  return (
    <View style={[styles.wrapper, { backgroundColor: theme.colors.headerBackground }]}>
      <SafeAreaView edges={['top', 'left', 'right']}>
        <View style={[styles.container, { paddingTop: insets.top ? 18 : 24 }]}>
          <View style={styles.brandRow}>
            {title ? (
              <>
                <Text style={[styles.title, { color: theme.colors.headerTint }]}>{title}</Text>
                {subtitle ? (
                  <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>{subtitle}</Text>
                ) : null}
              </>
            ) : (
              <Image source={logoSource} style={styles.logo} resizeMode="contain" />
            )}
          </View>
          <View style={styles.actionsRow}>
            {actions.map((action, index) => (
              <TouchableOpacity
                key={`${String(action.icon)}-${index}`}
                style={styles.actionButton}
                onPress={action.onPress}
                accessibilityRole="button"
              >
                <Ionicons name={action.icon} size={22} color={theme.colors.headerTint} />
                {action.badgeCount ? (
                  <View style={[styles.badge, { backgroundColor: theme.colors.primary }]}>
                    <Text style={styles.badgeText}>{Math.min(action.badgeCount, 9)}</Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            ))}
            {profile ? (
              <>
                <TouchableOpacity
                  style={[styles.notificationButton, { borderColor: theme.colors.border }]}
                  onPress={handleNotificationsPress}
                  accessibilityRole="button"
                >
                  <Ionicons name="notifications-outline" size={20} color={theme.colors.headerTint} />
                  {notificationBadge ? (
                    <View style={[styles.badge, styles.notificationBadge, { backgroundColor: theme.colors.primary }]}>
                      <Text style={styles.badgeText}>{Math.min(notificationBadge, 9)}</Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.profileButton, { borderColor: theme.colors.border }]}
                  onPress={() => setMenuVisible((current) => !current)}
                  accessibilityRole="button"
                >
                  <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
                    <Text style={styles.avatarInitials}>{initials}</Text>
                  </View>
                  <Ionicons
                    name={menuVisible ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={theme.colors.textSecondary}
                  />
                </TouchableOpacity>
                <Modal visible={menuVisible} transparent animationType="fade">
                  <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
                    <View style={styles.menuOverlay} />
                  </TouchableWithoutFeedback>
                  <View style={[styles.menuContainer, { paddingTop: insets.top + 70 }]}>
                    <View style={[styles.menuCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                      <View style={styles.menuHeader}>
                        <Text style={[styles.menuTitle, { color: theme.colors.text }]}>Ola, {profile.name}</Text>
                        <Text style={[styles.menuSubtitle, { color: theme.colors.textSecondary }]}>{profile.email}</Text>
                      </View>
                      {menuItems.map((item) => (
                        <TouchableOpacity
                          key={item.key}
                          style={styles.menuItem}
                          onPress={() => handleMenuAction(item.key)}
                        >
                          <Ionicons
                            name={item.icon}
                            size={20}
                            color={item.destructive ? theme.colors.danger : theme.colors.text}
                          />
                          <Text
                            style={[
                              styles.menuItemLabel,
                              {
                                color: item.destructive ? theme.colors.danger : theme.colors.text
                              }
                            ]}
                          >
                            {item.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </Modal>
                <Modal
                  visible={notificationsVisible}
                  transparent
                  animationType="fade"
                  onRequestClose={() => setNotificationsVisible(false)}
                >
                  <TouchableWithoutFeedback onPress={() => setNotificationsVisible(false)}>
                    <View style={styles.menuOverlay} />
                  </TouchableWithoutFeedback>
                  <View style={[styles.notificationsContainer, { paddingTop: insets.top + 70 }]}>
                    <View style={[styles.notificationsCard, { backgroundColor: theme.colors.surface }]}>
                      <View style={styles.notificationsHeader}>
                        <Text style={[styles.menuTitle, { color: theme.colors.text }]}>Central de notificacoes</Text>
                        {notifications.length ? (
                          <TouchableOpacity onPress={markAllAsRead}>
                            <Text style={[styles.markAllButton, { color: theme.colors.primary }]}>
                              Marcar todas como lidas
                            </Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                      {latestNotifications.length === 0 ? (
                        <Text style={[styles.menuSubtitle, { color: theme.colors.textSecondary }]}>
                          Nenhuma venda recente encontrada.
                        </Text>
                      ) : (
                        latestNotifications.map((notification) => (
                          <View
                            key={notification.id}
                            style={[
                              styles.notificationItem,
                              notification.isRead && { opacity: 0.6 }
                            ]}
                          >
                            <View style={[styles.notificationIcon, { backgroundColor: `${theme.colors.primary}1A` }]}>
                              <Ionicons name="trending-up" size={16} color={theme.colors.primary} />
                            </View>
                            <View style={styles.notificationContent}>
                              <Text style={[styles.notificationTitle, { color: theme.colors.text }]}>
                                Voce vendeu {formatCurrencyBRL(notification.amount)} via{' '}
                                {notification.paymentMethod ?? 'Medusa Pay'}
                              </Text>
                              <Text style={[styles.notificationSubtitle, { color: theme.colors.textSecondary }]}>
                                {formatDayAndTime(notification.createdAt)}
                              </Text>
                            </View>
                            {!notification.isRead ? (
                              <TouchableOpacity onPress={() => markNotificationAsRead(notification.id)}>
                                <Text style={[styles.markAsRead, { color: theme.colors.primary }]}>Marcar como lida</Text>
                              </TouchableOpacity>
                            ) : null}
                          </View>
                        ))
                      )}
                    </View>
                  </View>
                </Modal>
              </>
            ) : null}
          </View>
        </View>
        {children ? <View style={styles.children}>{children}</View> : null}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 22,
    paddingTop: 20
  },
  brandRow: {
    flex: 1
  },
  logo: {
    width: 240,
    height: 60,
    maxWidth: '90%',
    alignSelf: 'flex-start'
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '500'
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 12
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center'
  },
  notificationButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1,
    gap: 6
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarInitials: {
    color: '#fff',
    fontWeight: '700'
  },
  notificationBadge: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    position: 'absolute',
    top: -4,
    right: -4
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 3,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center'
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700'
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'flex-start'
  },
  menuContainer: {
    position: 'absolute',
    right: 16,
    left: 16,
    alignItems: 'flex-end'
  },
  menuCard: {
    borderRadius: 20,
    padding: 16,
    gap: 12,
    borderWidth: 0,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 }
  },
  menuHeader: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 10,
    marginBottom: 4,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '700'
  },
  menuSubtitle: {
    fontSize: 13,
    marginTop: 2
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8
  },
  menuItemLabel: {
    fontSize: 14,
    fontWeight: '600'
  },
  notificationsContainer: {
    position: 'absolute',
    right: 16,
    left: 16,
    alignItems: 'flex-end'
  },
  notificationsCard: {
    borderRadius: 20,
    padding: 16,
    gap: 12,
    borderWidth: 0,
    width: 320,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 }
  },
  notificationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8
  },
  notificationIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  notificationContent: {
    flex: 1
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600'
  },
  notificationSubtitle: {
    fontSize: 12,
    marginTop: 2
  },
  markAsRead: {
    fontSize: 12,
    fontWeight: '700'
  },
  markAllButton: {
    fontSize: 12,
    fontWeight: '700'
  },
  children: {
    paddingHorizontal: 20,
    paddingBottom: 18
  }
});

export default MedusaHeader;
