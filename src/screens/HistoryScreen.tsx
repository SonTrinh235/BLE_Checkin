import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { subscribeMyHistory } from '../data/history';
import { getPendingCheckInCount } from '../data/offlineQueue';
import { MyCheckInHistoryEntry } from '../types/models';
import { Badge, Card, EmptyState, Loading, PageTitle, Screen, StatusCard } from '../components/ui';
import { colors, spacing, typography } from '../theme';
import { methodLabel, methodTone } from '../ui/labels';

export default function HistoryScreen() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<MyCheckInHistoryEntry[] | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    return subscribeMyHistory(user.uid, setEntries);
  }, [user]);

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

      {entries === null ? (
        <Loading />
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="clock"
              title="Chưa có lịch sử"
              subtitle="Các buổi bạn điểm danh sẽ hiện ở đây."
            />
          }
          renderItem={({ item }) => (
            <Card>
              <View style={styles.row}>
                <Text style={styles.title} numberOfLines={1}>
                  {item.clubName}
                </Text>
                <Badge label={methodLabel[item.method]} tone={methodTone[item.method]} />
              </View>
              <Text style={styles.subtitle}>{item.sessionTitle}</Text>
              <Text style={styles.meta}>{new Date(item.checkedInAt).toLocaleString('vi-VN')}</Text>
            </Card>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, gap: spacing.lg },
  list: { gap: spacing.md, paddingBottom: spacing.xl },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  title: { ...typography.section, color: colors.text, flex: 1 },
  subtitle: { ...typography.small, color: colors.text },
  meta: { ...typography.caption, color: colors.muted, marginTop: 2 },
});
