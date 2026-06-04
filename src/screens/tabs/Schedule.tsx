import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Optional import: if Firestore isn't installed/configured, show a proper error state.
let firestore: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  firestore = require('@react-native-firebase/firestore').default;
} catch {
  firestore = null;
}

type MedStatus = 'Done' | 'Due' | 'Upcoming';

interface ScheduleItem {
  id: string;
  name: string;
  dosage: string;
  time: string;
  instruction: string;
  status: MedStatus;
  color: string;
}

const ScheduleScreen = () => {
  const [selectedDate, setSelectedDate] = useState(4); // 1..7 (Mon..Sun)
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [nextMed, setNextMed] = useState<ScheduleItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const weekDays = useMemo(
    () => [
      { day: 'MON', date: 1 },
      { day: 'TUE', date: 2 },
      { day: 'WED', date: 3 },
      { day: 'THU', date: 4 },
      { day: 'FRI', date: 5 },
      { day: 'SAT', date: 6 },
      { day: 'SUN', date: 7 },
    ],
    []
  );

  const getDocumentDate = (date: number) => {
    // Keeping theme/UI intact. Mapping the selected weekday onto doc id YYYY-MM-DD.
    // Backend doc id must match this format.
    const base = new Date('2026-06-01T00:00:00.000Z'); // Monday
    const d = new Date(base);
    d.setUTCDate(base.getUTCDate() + (date - 1));
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const getStatusBadge = (status: MedStatus) => {
    switch (status) {
      case 'Done':
        return {
          bg: '#D1FAE5',
          text: '#065F46',
          label: 'Done',
          icon: 'check',
        };
      case 'Due':
        return {
          bg: '#FFEDD5',
          text: '#C2410C',
          label: 'Due',
          icon: 'clock-alert-outline',
        };
      default:
        return {
          bg: '#E0E7FF',
          text: '#3730A3',
          label: 'Upcoming',
          icon: null,
        };
    }
  };

  useEffect(() => {
    let unsubscribe: null | (() => void) = null;
    let mounted = true;

    const start = async () => {
      setLoading(true);
      setError(null);

      try {
        if (!firestore) {
          if (!mounted) return;
          setSchedules([]);
          setNextMed(null);
          setError('Firestore not available.');
          setLoading(false);
          return;
        }

        const userId = auth().currentUser?.uid;
        if (!userId) {
          if (!mounted) return;
          setSchedules([]);
          setNextMed(null);
          setError('User not authenticated.');
          setLoading(false);
          return;
        }

        const today = getDocumentDate(selectedDate);

        unsubscribe = firestore()
          .collection('users')
          .doc(userId)
          .collection('schedules')
          .doc(today)
          .collection('items')
          .orderBy('time')
          .onSnapshot(
            (snapshot: any) => {
              const items: ScheduleItem[] = [];
              snapshot.forEach((doc: any) => {
                items.push({ id: doc.id, ...doc.data() } as ScheduleItem);
              });

              if (!mounted) return;
              setSchedules(items);
              const due = items.find((i) => i.status === 'Due');
              setNextMed(due || null);
              setLoading(false);
            },
            (err: any) => {
              if (!mounted) return;
              setSchedules([]);
              setNextMed(null);
              setError(
                err?.message
                  ? `Failed to load schedule: ${err.message}`
                  : 'Failed to load schedule'
              );
              setLoading(false);
            }
          );
      } catch (e: any) {
        if (!mounted) return;
        setSchedules([]);
        setNextMed(null);
        setError(e?.message ? `Failed to load schedule: ${e.message}` : 'Failed to load schedule');
        setLoading(false);
      }
    };

    void start();

    return () => {
      mounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [selectedDate]);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#047857" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>MyMedi</Text>
          <Icon name="dots-vertical" size={24} color="white" />
        </View>
        <Text style={styles.monthText}>June 2026</Text>
        <Text style={styles.scheduleText}>Schedule</Text>

        <View style={styles.weekRow}>
          {weekDays.map((d) => (
            <TouchableOpacity
              key={d.date}
              onPress={() => setSelectedDate(d.date)}
              style={[
                styles.dayItem,
                selectedDate === d.date && styles.daySelected,
              ]}
            >
              <Text
                style={[
                  styles.dayLabel,
                  selectedDate === d.date && styles.dayLabelSelected,
                ]}
              >
                {d.day}
              </Text>
              <Text
                style={[
                  styles.dayDate,
                  selectedDate === d.date && styles.dayDateSelected,
                ]}
              >
                {d.date}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {loading ? (
          <Text style={styles.statusText}>Loading...</Text>
        ) : error ? (
          <Text style={styles.statusText}>{error}</Text>
        ) : (
          <>
            {/* Next Dose Banner */}
            {nextMed && (
              <View style={styles.alertBanner}>
                <Icon
                  name="clock-time-four-outline"
                  size={20}
                  color="#B45309"
                />
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <Text style={styles.alertTitle}>{nextMed.name} due in 15 min</Text>
                  <Text style={styles.alertSub}>10:00 AM - After meals</Text>
                </View>
              </View>
            )}

            <Text style={styles.timelineTitle}>Timeline</Text>

            {schedules.map((item) => {
              const badge = getStatusBadge(item.status);
              return (
                <View key={item.id} style={styles.timelineRow}>
                  <Text style={styles.timeLabel}>{item.time}</Text>
                  <View style={[styles.card, { borderLeftColor: item.color }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.medName}>{item.name}</Text>
                      <Text style={styles.medSub}>
                        {item.dosage} • {item.instruction}
                      </Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                      {badge.icon && (
                        <Icon
                          name={badge.icon}
                          size={14}
                          color={badge.text}
                        />
                      )}
                      <Text style={[styles.badgeText, { color: badge.text }]}>
                        {badge.label}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}

            {schedules.length === 0 && !loading && !error && (
              <Text style={styles.statusText}>No schedule found for selected day.</Text>
            )}
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
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  monthText: { color: '#A7F3D0', marginTop: 20, fontSize: 14 },
  scheduleText: {
    color: 'white',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
  },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  dayItem: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  daySelected: { backgroundColor: 'rgba(255,255,255,0.2)' },
  dayLabel: { color: '#A7F3D0', fontSize: 12 },
  dayLabelSelected: { color: 'white', fontWeight: '600' },
  dayDate: { color: 'white', fontSize: 16, marginTop: 4 },
  dayDateSelected: { fontWeight: '700' },
  body: { flex: 1, paddingHorizontal: 16 },
  alertBanner: {
    flexDirection: 'row',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 14,
    borderRadius: 14,
    marginTop: 16,
    alignItems: 'center',
  },
  alertTitle: { color: '#92400E', fontWeight: '600', fontSize: 14 },
  alertSub: { color: '#B45309', fontSize: 12, marginTop: 2 },
  timelineTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#064E3B',
    marginTop: 24,
    marginBottom: 12,
  },
  timelineRow: { flexDirection: 'row', marginBottom: 16, alignItems: 'flex-start' },
  timeLabel: {
    width: 50,
    color: '#047857',
    fontSize: 12,
    marginTop: 12,
    fontWeight: '600',
  },
  card: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  medName: { fontSize: 15, fontWeight: '700', color: '#064E3B' },
  medSub: { fontSize: 12, color: '#6B7280', marginTop: 3 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
  },
  badgeText: { fontSize: 12, fontWeight: '600', marginLeft: 3 },
  statusText: {
    color: '#064E3B',
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 6,
    marginTop: 16,
  },
});

export default ScheduleScreen;

