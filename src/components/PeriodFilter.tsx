import React, { useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';

import { usePreferences } from '@/context/PreferencesContext';
import { PeriodFilter } from '@/types/api';

type FilterOption = {
  label: string;
  value: PeriodFilter;
};

type CustomRange = {
  start: Date;
  end: Date;
};

type PeriodSelectorProps = {
  value: PeriodFilter;
  onChange: (value: PeriodFilter) => void;
  options?: FilterOption[];
  style?: ViewStyle;
  customRange?: CustomRange | null;
  onCustomRangeChange?: (range: CustomRange) => void;
};

const DEFAULT_OPTIONS: FilterOption[] = [
  { label: 'Hoje', value: 'today' },
  { label: '7 dias', value: '7d' },
  { label: '30 dias', value: '30d' },
  { label: 'Últimos 90', value: '90d' },
  { label: '1 ano', value: '1y' },
  { label: 'Personalizado', value: 'custom' }
];

const PeriodSelector: React.FC<PeriodSelectorProps> = ({
  value,
  onChange,
  options = DEFAULT_OPTIONS,
  style,
  customRange,
  onCustomRangeChange
}) => {
  const { theme } = usePreferences();
  const [isModalVisible, setModalVisible] = useState(false);
  const [tempStart, setTempStart] = useState<Date>(customRange?.start ?? new Date());
  const [tempEnd, setTempEnd] = useState<Date>(customRange?.end ?? new Date());
  const [activePicker, setActivePicker] = useState<'start' | 'end' | null>(null);

  const formattedCustomLabel = useMemo(() => {
    if (!customRange) return 'Personalizado';
    const start = format(customRange.start, 'dd/MM');
    const end = format(customRange.end, 'dd/MM');
    return `${start} - ${end}`;
  }, [customRange]);

  const handleOptionPress = (option: FilterOption) => {
    if (option.value === 'custom') {
      setTempStart(customRange?.start ?? new Date());
      setTempEnd(customRange?.end ?? new Date());
      setModalVisible(true);
      return;
    }
    onChange(option.value);
  };

  const handleApplyCustomRange = () => {
    const sanitizedEnd = tempEnd < tempStart ? tempStart : tempEnd;
    const range = { start: tempStart, end: sanitizedEnd };
    onCustomRangeChange?.(range);
    onChange('custom');
    setModalVisible(false);
    setActivePicker(null);
  };

  const handleDateChange = (_: any, date?: Date) => {
    if (!date) {
      if (Platform.OS !== 'ios') {
        setActivePicker(null);
      }
      return;
    }
    if (activePicker === 'start') {
      setTempStart(date);
      if (Platform.OS !== 'ios') setActivePicker(null);
    } else if (activePicker === 'end') {
      const validDate = date < tempStart ? tempStart : date;
      setTempEnd(validDate);
      if (Platform.OS !== 'ios') setActivePicker(null);
    }
  };

  return (
    <>
      <View style={[styles.container, style]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.content}>
          {options.map((option) => {
            const isActive = value === option.value;
            const displayLabel =
              option.value === 'custom' ? formattedCustomLabel : option.label;
            return (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.pill,
                  {
                    backgroundColor: isActive ? theme.colors.primary : theme.colors.surface,
                    borderColor: isActive ? theme.colors.primary : theme.colors.border
                  }
                ]}
                onPress={() => handleOptionPress(option)}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.label,
                    { color: isActive ? theme.colors.headerTint : theme.colors.textSecondary }
                  ]}
                >
                  {displayLabel}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Período personalizado</Text>
            <View style={styles.dateRow}>
              <TouchableOpacity
                style={[styles.dateField, { borderColor: theme.colors.border }]}
                onPress={() => setActivePicker('start')}
              >
                <Ionicons name="calendar-outline" size={16} color={theme.colors.textSecondary} />
                <Text style={[styles.dateFieldText, { color: theme.colors.text }]}>
                  {format(tempStart, 'dd/MM/yyyy')}
                </Text>
                <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>Início</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dateField, { borderColor: theme.colors.border }]}
                onPress={() => setActivePicker('end')}
              >
                <Ionicons name="calendar-outline" size={16} color={theme.colors.textSecondary} />
                <Text style={[styles.dateFieldText, { color: theme.colors.text }]}>
                  {format(tempEnd, 'dd/MM/yyyy')}
                </Text>
                <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>Fim</Text>
              </TouchableOpacity>
            </View>
            {activePicker ? (
              <View style={styles.pickerContainer}>
                <DateTimePicker
                  value={activePicker === 'start' ? tempStart : tempEnd}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'inline' : 'calendar'}
                  onChange={handleDateChange}
                  minimumDate={activePicker === 'end' ? tempStart : undefined}
                  maximumDate={activePicker === 'start' ? tempEnd : undefined}
                />
              </View>
            ) : (
              <Text style={[styles.pickerPlaceholder, { color: theme.colors.textMuted }]}>
                Escolha uma das datas acima para abrir o calendário.
              </Text>
            )}
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalButton}>
                <Text style={[styles.modalButtonText, { color: theme.colors.textSecondary }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleApplyCustomRange}
                style={[styles.modalButton, styles.modalButtonPrimary]}
              >
                <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>Aplicar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4
  },
  content: {
    gap: 12,
    paddingHorizontal: 4
  },
  pill: {
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 10
  },
  label: {
    fontSize: 13,
    fontWeight: '600'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24
  },
  modalCard: {
    width: '100%',
    borderRadius: 20,
    padding: 20,
    gap: 16
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700'
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '600'
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12
  },
  dateField: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    gap: 4
  },
  dateFieldText: {
    fontSize: 15,
    fontWeight: '700'
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600'
  },
  pickerContainer: {
    borderRadius: 16,
    overflow: 'hidden'
  },
  pickerPlaceholder: {
    fontSize: 13,
    textAlign: 'center'
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24
  },
  modalButtonPrimary: {
    backgroundColor: '#05A660'
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '700'
  }
});

export default PeriodSelector;
