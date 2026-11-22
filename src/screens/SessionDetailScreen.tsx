import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { subscribeCheckins, subscribeSessions } from '../data/sessions';
import { exportSessionReport } from '../data/reportExport';
import { CheckInRecord, CheckInSession } from '../types/models';
import { RootStackParamList } from '../navigation/types';
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  Header,
  Loading,
  Screen,
  SectionTitle,
  StatusCard,
} from '../components/ui';
import { colors, radius, spacing, typography } from '../theme';
import { formatDateTime, formatTime, methodLabel, methodTone } from '../ui/labels';

type Props = NativeStackScreenProps<RootStackParamList, 'SessionDetail'>;

export default function SessionDetailScreen({ route, navigation }: Props) {
  const { clubId, clubName, sessionId } = route.params;
  const [session, setSession] = useState<CheckInSession | null | undefined>(undefined);
  const [checkins, setCheckins] = useState<CheckInRecord[]>([]);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(
    () =>
      subscribeSessions(clubId, (list) => setSession(list.find((s) => s.id === sessionId) ?? null)),
    [clubId, sessionId]
  );
  useEffect(() => subscribeCheckins(clubId, sessionId, setCheckins), [clubId, sessionId]);

  const sorted = [...checkins].sort((a, b) => a.checkedInAt - b.checkedInAt);
  const open = session?.status === 'open';
  const byMethod = {
    ble: checkins.filter((c) => c.method === 'ble').length,
    qr: checkins.filter((c) => c.method === 'qr').length,
    manual: checkins.filter((c) => c.method === 'manual').length,
  };

  const onExport = async () => {
    setExportError(null);
    setExporting(true);
    try {
      await exportSessionReport(clubId, clubName, sessionId);
    } catch (err) {
      const msg = (err as Error)?.message;
      setExportError(
        msg === 'Không tìm thấy phiên.'
          ? msg
          : 'Kết nối mạng bị gián đoạn. Danh sách điểm danh vẫn được lưu an toàn, hãy thử lại.'
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <Screen
      scroll
      header={<Header title="Chi tiết phiên" onBack={() => navigation.goBack()} />}
      contentStyle={styles.content}
      footer={
        session ? (
          <>
            <Button
              title="Tải báo cáo CSV"
              icon="download"
              onPress={onExport}
              loading={exporting}
            />
            <Button title="Về danh sách phiên" variant="secondary" onPress={() => navigation.goBack()} />
          </>
        ) : undefined
      }
    >
      {session === undefined ? (
        <Loading />
      ) : session === null ? (
        <EmptyState icon="calendar" title="Không tìm thấy phiên" subtitle="Phiên có thể đã bị xoá." />
      ) : (
        <>
          <Text style={styles.club}>{clubName}</Text>
          <Text style={styles.title}>{session.title}</Text>
          <View style={styles.summary}>
            <View style={styles.summaryTop}>
              <Text style={styles.count}>{checkins.length}</Text>
              <Badge label={open ? 'Đang mở' : 'Đã đóng'} tone={open ? 'success' : 'neutral'} />
            </View>
            <Text style={styles.countLabel}>người đã điểm danh</Text>
            <Text style={styles.summaryMeta}>
              {session.room ? `Phòng ${session.room} · ` : ''}
              {formatDateTime(session.openedAt)}
            </Text>
            <Text style={styles.summaryMeta}>
              {`BLE ${byMethod.ble} · QR ${byMethod.qr} · Thủ công ${byMethod.manual}`}
            </Text>
          </View>

          {exportError ? (
            <StatusCard tone="warning" icon="wifi-off" title="Chưa thể xuất CSV" subtitle={exportError} />
          ) : null}

          <SectionTitle>Danh sách điểm danh</SectionTitle>
          {sorted.length === 0 ? (
            <EmptyState icon="users" title="Không có ai điểm danh" />
          ) : (
            sorted.map((c) => (
              <Card key={c.uid} style={styles.card}>
                <View style={styles.row}>
                  <Avatar name={c.displayName} size={40} />
                  <View style={styles.info}>
                    <Text style={styles.name}>{c.displayName}</Text>
                    <Text style={styles.meta}>
                      {c.studentId ? `${c.studentId} · ` : ''}
                      {formatTime(c.checkedInAt)}
                    </Text>
                  </View>
                  <Badge label={methodLabel[c.method]} tone={methodTone[c.method]} />
                </View>
              </Card>
            ))
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md },
  club: { ...typography.small, color: colors.muted },
  title: { ...typography.title, color: colors.primary },
  summary: { backgroundColor: colors.primary, borderRadius: radius.lg, padding: spacing.xl, gap: 2 },
  summaryTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  count: { fontSize: 40, lineHeight: 46, fontWeight: '800', color: '#FFFFFF' },
  countLabel: { ...typography.body, color: '#DBEAFE' },
  summaryMeta: { ...typography.small, color: '#BFDBFE', marginTop: spacing.sm },
  card: { padding: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  info: { flex: 1 },
  name: { ...typography.body, fontWeight: '600', color: colors.text },
  meta: { ...typography.small, color: colors.muted },
});
