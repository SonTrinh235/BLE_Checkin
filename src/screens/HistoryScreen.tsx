import { useEffect, useMemo, useState } from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { subscribeMyHistory } from '../data/history';
import { getPendingCheckInCount } from '../data/offlineQueue';
import { MyCheckInHistoryEntry } from '../types/models';
import { Badge, Card, EmptyState, ListSkeleton, PageTitle, Screen, StatusCard } from '../components/ui';
import { radius, spacing, typography, Palette } from '../theme';
import { useColors } from '../theme/useTheme';
import { formatTime, methodLabel, methodTone } from '../ui/labels';

type Row =
  | { kind: 'header'; key: string; label: string }
  | { kind: 'entry'; key: string; entry: MyCheckInHistoryEntry };

function dayKey(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function dayLabel(ms: number): string {
  const now = Date.now();
  if (dayKey(ms) === dayKey(now)) return 'Hôm nay';
  if (dayKey(ms) === dayKey(now - 24 * 60 * 60 * 1000)) return 'Hôm qua';
  return new Date(ms).toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function HistoryScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { user } = useAuth();
  const [entries, setEntries] = useState<MyCheckInHistoryEntry[] | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    return subscribeMyHistory(user.uid, setEntries);
  }, [user]);

  const monthCount = useMemo(() => {
    const now = new Date();
    return (entries ?? []).filter((e) => {
      const d = new Date(e.checkedInAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
  }, [entries]);

  // Entries arrive newest-first; insert a day header whenever the date changes.
  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    let last = '';
    for (const entry of entries ?? []) {
      const key = dayKey(entry.checkedInAt);
      if (key !== last) {
        out.push({ kind: 'header', key: `h-${key}`, label: dayLabel(entry.checkedInAt) });
        last = key;
      }
      out.push({ kind: 'entry', key: entry.id, entry });
    }
    return out;
  }, [entries]);

  useEffect(() => {
    getPendingCheckInCount().then(setPendingCount);
    const interval = setInterval(() => {
      getPendingCheckInCount().then(setPendingCount);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Screen edges={['top']} contentStyle={styles.content}>
      <PageTitle title="Lịch sử" subtitle="Các buổi bạn đã điểm danh" />

      {pendingCount > 0 ? (
        <StatusCard
          tone="warning"
          icon="wifi-off"
          title={`${pendingCount} lượt chờ đồng bộ`}
          subtitle="Mất mạng — sẽ tự đồng bộ khi có mạng lại."
        />
      ) : null}

      {entries && entries.length > 0 ? (
        <View style={styles.summary} accessibilityRole="summary">
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{entries.length}</Text>
            <Text style={styles.statLabel}>buổi đã tham dự</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{monthCount}</Text>
            <Text style={styles.statLabel}>buổi trong tháng này</Text>
          </View>
        </View>
      ) : null}

      {entries === null ? (
        <ListSkeleton />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(row) => row.key}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="clock"
              title="Chưa có lịch sử"
              subtitle="Các buổi bạn điểm danh sẽ hiện ở đây."
            />
          }
          renderItem={({ item: row, index }) =>
            row.kind === 'header' ? (
              <Text style={styles.dayHeader}>{row.label}</Text>
            ) : (
              <Animated.View entering={FadeInDown.delay(Math.min(index, 6) * 50).duration(280)}>
                <Card>
                  <View style={styles.row}>
                    <Text style={styles.title} numberOfLines={1}>
                      {row.entry.clubName}
                    </Text>
                    <Badge label={methodLabel[row.entry.method]} tone={methodTone[row.entry.method]} />
                  </View>
                  <Text style={styles.subtitle}>{row.entry.sessionTitle}</Text>
                  <Text style={styles.meta}>{formatTime(row.entry.checkedInAt)}</Text>
                </Card>
              </Animated.View>
            )
          }
        />
      )}
    </Screen>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
  content: { flex: 1, gap: spacing.lg },
  list: { gap: spacing.md, paddingBottom: spacing.xl },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  title: { ...typography.section, color: colors.text, flex: 1 },
  subtitle: { ...typography.small, color: colors.text },
  summary: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
  },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statNumber: { fontSize: 28, lineHeight: 34, fontWeight: '700', color: '#FFFFFF' },
  statLabel: { ...typography.small, color: '#DBEAFE' },
  statDivider: { width: 1, backgroundColor: '#3B5BB5' },
  dayHeader: {
    ...typography.small,
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'capitalize',
    marginTop: spacing.sm,
  },
  meta: { ...typography.caption, color: colors.muted, marginTop: 2 },
});
