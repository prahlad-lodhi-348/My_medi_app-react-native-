import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface MedicineStock {
  id: string;
  name: string;
  regime: string;
  stockLeft: number;
  threshold: number;
  icon: string;
  color: string;
}

const StockAlertsScreen = () => {
  const [critical, setCritical] = useState<MedicineStock[]>([]);
  const [low, setLow] = useState<MedicineStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: null | (() => void) = null;
    let mounted = true;

    const load = () => {
      setLoading(true);
      setError(null);

      const userId = auth().currentUser?.uid;
      if (!userId) {
        setCritical([]);
        setLow([]);
        setError('User not authenticated.');
        setLoading(false);
        return;
      }

      unsubscribe = firestore()
        .collection('users')
        .doc(userId)
        .collection('medications')
        .onSnapshot(
          snapshot => {
            const meds: MedicineStock[] = [];
            snapshot.forEach(doc => {
              meds.push({ id: doc.id, ...doc.data() } as MedicineStock);
            });

            if (!mounted) return;

            // IMPORTANT: remove hardcoded UI counters; compute from real data.
            const criticalItems = meds.filter(
              m => m.stockLeft <= 3 || m.stockLeft <= m.threshold * 0.4
            );
            const lowItems = meds.filter(
              m => m.stockLeft > m.threshold * 0.4 && m.stockLeft < m.threshold
            );

            setCritical(criticalItems);
            setLow(lowItems);
            setLoading(false);
          },
          err => {
            if (!mounted) return;
            setCritical([]);
            setLow([]);
            setError(err?.message ? `Failed to load stock alerts: ${err.message}` : 'Failed to load stock alerts');
            setLoading(false);
          }
        );
    };

    load();

    return () => {
      mounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const StockCard = ({
    item,
    isCritical,
  }: {
    item: MedicineStock;
    isCritical: boolean;
  }) => {
    const percent = Math.min(100, (item.stockLeft / Math.max(1, item.threshold)) * 100);

    return (
      <View style={styles.stockCard}>
        <View style={[styles.iconBox, { backgroundColor: isCritical ? '#FEE2E2' : '#FEF3C7' }]}>
          <Icon name={item.icon} size={22} color={isCritical ? '#DC2626' : '#D97706'} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={styles.medTitle}>{item.name}</Text>
            <Text style={[styles.stockNumber, { color: isCritical ? '#DC2626' : '#D97706' }]}>
              {item.stockLeft}
            </Text>
          </View>
          <Text style={styles.regimeText}>
            {item.regime} • Only {item.stockLeft} {item.stockLeft === 1 ? 'tablet' : 'tablets'} left
          </Text>
          <View style={styles.progressRow}>
            <Text style={styles.leftText}>{item.stockLeft} left</Text>
            <Text style={styles.thresholdText}>Threshold: {item.threshold}</Text>
          </View>
          <View style={styles.progressBg}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${percent}%`,
                  backgroundColor: isCritical ? '#EF4444' : '#F59E0B',
                },
              ]}
            />
          </View>
          {isCritical && <Text style={styles.criticalLabel}>CRITICAL</Text>}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#047857" barStyle="light-content" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>MyMedi</Text>
        <Text style={styles.headerSub}>Keep an eye on</Text>
        <Text style={styles.headerMain}>Stock Alerts</Text>
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {loading ? (
          <Text style={styles.statusText}>Loading...</Text>
        ) : error ? (
          <Text style={styles.statusText}>{error}</Text>
        ) : (
          <>
            {/* Summary Cards */}
            <View style={styles.summaryRow}>
              <View style={[styles.summaryCard, { borderLeftColor: '#DC2626' }]}>
                <Text style={styles.summaryNumber}>{critical.length}</Text>
                <Text style={styles.summaryLabel}>Critical - Reorder Now</Text>
              </View>
              <View style={[styles.summaryCard, { borderLeftColor: '#F59E0B' }]}>
                <Text style={[styles.summaryNumber, { color: '#D97706' }]}>{low.length}</Text>
                <Text style={styles.summaryLabel}>Low - Running Out</Text>
              </View>
            </View>

            {/* Critical Stock */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Critical Stock</Text>
              <Text style={styles.sectionBadge}>{critical.length} items</Text>
            </View>
            {critical.map(item => (
              <StockCard key={item.id} item={item} isCritical />
            ))}

            {/* Low Stock */}
            <View style={[styles.sectionHeader, { marginTop: 24 }]}>
              <Text style={styles.sectionTitle}>Low Stock</Text>
              <Text
                style={[styles.sectionBadge, { backgroundColor: '#FEF3C7', color: '#92400E' }]}
              >
                {low.length} items
              </Text>
            </View>
            {low.map(item => (
              <StockCard key={item.id} item={item} isCritical={false} />
            ))}

            <View style={{ height: 100 }} />
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ECFDF5' },
  header: {
    backgroundColor: '#047857',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: { color: 'white', fontSize: 16, opacity: 0.9 },
  headerSub: { color: '#A7F3D0', fontSize: 14, marginTop: 8 },
  headerMain: { color: 'white', fontSize: 26, fontWeight: '700' },
  body: { flex: 1, paddingHorizontal: 16, marginTop: -20 },
  statusText: { marginTop: 24, color: '#064E3B', fontWeight: '600' },

  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  summaryCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 4,
    elevation: 2,
  },
  summaryNumber: { fontSize: 28, fontWeight: '800', color: '#DC2626' },
  summaryLabel: { fontSize: 12, color: '#6B7280', marginTop: 4 },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#064E3B' },
  sectionBadge: {
    backgroundColor: '#FEE2E2',
    color: '#B91C1C',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '600',
  },

  stockCard: {
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    marginBottom: 12,
    elevation: 1,
  },
  iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  medTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  stockNumber: { fontSize: 18, fontWeight: '800' },
  regimeText: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  leftText: { fontSize: 11, color: '#9CA3AF' },
  thresholdText: { fontSize: 11, color: '#9CA3AF' },
  progressBg: {
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    marginTop: 4,
    overflow: 'hidden',
  },
  progressFill: { height: 6, borderRadius: 3 },
  criticalLabel: {
    position: 'absolute',
    right: 0,
    top: -2,
    fontSize: 10,
    fontWeight: '800',
    color: '#DC2626',
  },
});

export default StockAlertsScreen;

