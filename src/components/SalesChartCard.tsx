import React, { useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import Card from '@/components/Card';
import { formatCurrencyBRL } from '@/utils/format';

type SalesChartPoint = {
  label: string;
  value: number;
};

type SalesChartCardProps = {
  data: SalesChartPoint[];
  currency?: string;
  tickCount?: number;
};

const GRAPH_HEIGHT = 160;

const SalesChartCard: React.FC<SalesChartCardProps> = ({ data, currency = 'BRL', tickCount = 5 }) => {
  const [chartWidth, setChartWidth] = useState(0);

  const maxValue = useMemo(() => Math.max(...data.map((item) => item.value), 0), [data]);

  const points = useMemo(() => {
    if (!chartWidth || data.length === 0) return [];
    const safeMax = Math.max(maxValue, 1);
    const step = data.length === 1 ? 0 : chartWidth / (data.length - 1);

    return data.map((point, index) => {
      const x = data.length === 1 ? chartWidth / 2 : step * index;
      const ratio = point.value / safeMax;
      const y = GRAPH_HEIGHT - ratio * GRAPH_HEIGHT;
      return { x, y };
    });
  }, [chartWidth, data, maxValue]);

  const strokePath = useMemo(() => {
    if (!points.length) return '';
    return points
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ');
  }, [points]);

  const areaPath = useMemo(() => {
    if (!points.length) return '';
    const first = points[0];
    const last = points[points.length - 1];
    const middle = points.map((point) => `L ${point.x} ${point.y}`).join(' ');
    return `M ${first.x} ${GRAPH_HEIGHT} L ${first.x} ${first.y} ${middle} L ${last.x} ${GRAPH_HEIGHT} Z`;
  }, [points]);

  const ticks = useMemo(() => {
    const count = Math.max(2, tickCount);
    const top = maxValue === 0 ? 1 : maxValue;
    const step = top / (count - 1);
    return Array.from({ length: count }, (_, index) => {
      const value = top - step * index;
      return value < 0 ? 0 : value;
    });
  }, [maxValue, tickCount]);

  const handleLayout = (event: LayoutChangeEvent) => {
    setChartWidth(event.nativeEvent.layout.width);
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Vendas por dia</Text>
          <Text style={styles.subtitle}>Acompanhe o volume diário da sua empresa.</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{currency}</Text>
        </View>
      </View>

      {data.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Ainda não há transações pagas neste período.</Text>
        </View>
      ) : (
        <>
          <View style={styles.graphRow}>
            <View style={styles.axisColumn}>
              {ticks.map((value, index) => (
                <Text key={`tick-${index}`} style={styles.axisLabel}>
                  {formatCurrencyBRL(value)}
                </Text>
              ))}
            </View>
            <View style={styles.chartContainer} onLayout={handleLayout}>
              {chartWidth > 0 ? (
                <Svg width="100%" height={GRAPH_HEIGHT}>
                  <Defs>
                    <LinearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0" stopColor="#0CB05B" stopOpacity="0.25" />
                      <Stop offset="1" stopColor="#0CB05B" stopOpacity="0" />
                    </LinearGradient>
                  </Defs>
                  <Rect x={0} y={0} width="100%" height="100%" fill="transparent" />
                  {areaPath ? (
                    <Path d={areaPath} fill="url(#areaGradient)" stroke="transparent" />
                  ) : null}
                  {strokePath ? <Path d={strokePath} stroke="#0CB05B" strokeWidth={3} fill="none" /> : null}
                </Svg>
              ) : null}
            </View>
          </View>
          <View style={styles.labelsRow}>
            {data.map((point) => (
              <Text key={point.label} style={styles.label}>
                {point.label}
              </Text>
            ))}
          </View>
        </>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 20,
    gap: 16
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#032B0B'
  },
  subtitle: {
    fontSize: 13,
    color: '#4F6F58'
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(12, 176, 91, 0.12)'
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0CB05B'
  },
  graphRow: {
    flexDirection: 'row',
    gap: 8
  },
  axisColumn: {
    justifyContent: 'space-between'
  },
  axisLabel: {
    fontSize: 12,
    color: '#4F6F58',
    fontWeight: '600'
  },
  chartContainer: {
    flex: 1,
    height: GRAPH_HEIGHT
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  label: {
    fontSize: 12,
    color: '#7A8A80'
  },
  empty: {
    paddingVertical: 40,
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 14,
    color: '#7A8A80'
  }
});

export default SalesChartCard;
