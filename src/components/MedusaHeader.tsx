import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { usePreferences } from '@/context/PreferencesContext';

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

const MedusaHeader: React.FC<MedusaHeaderProps> = ({
  title = 'MedusaPay',
  subtitle,
  actions = [],
  children
}) => {
  const { theme } = usePreferences();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { backgroundColor: theme.colors.headerBackground }]}>
      <SafeAreaView edges={['top', 'left', 'right']}>
        <View style={[styles.container, { paddingTop: insets.top ? 8 : 12 }]}>
          <View style={styles.brandRow}>
            <Text style={[styles.title, { color: theme.colors.headerTint }]}>{title}</Text>
            {subtitle ? (
              <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>{subtitle}</Text>
            ) : null}
          </View>
          <View style={styles.actionsRow}>
            {actions.map((action, index) => (
              <TouchableOpacity
                key={`${String(action.icon)}-${index}`}
                style={styles.actionButton}
                onPress={action.onPress}
                accessibilityRole="button"
              >
                <Ionicons
                  name={action.icon}
                  size={22}
                  color={theme.colors.headerTint}
                />
                {action.badgeCount ? (
                  <View style={[styles.badge, { backgroundColor: theme.colors.primary }]}>
                    <Text style={styles.badgeText}>{Math.min(action.badgeCount, 9)}</Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            ))}
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
    paddingBottom: 16,
    paddingTop: 12
  },
  brandRow: {
    flex: 1
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
  children: {
    paddingHorizontal: 20,
    paddingBottom: 18
  }
});

export default MedusaHeader;
