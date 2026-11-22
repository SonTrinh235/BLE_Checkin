import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { subscribeMembers } from '../data/clubs';
import { manualCheckIn, subscribeCheckins } from '../data/sessions';
import { CheckInRecord, ClubMember } from '../types/models';
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
  StatusCard,
  TextField,
} from '../components/ui';
import { colors, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ManualCheckIn'>;

// Organizer marks a member present by hand — for dead phones, denied
// permissions, or anyone BLE/QR couldn't reach.
export default function ManualCheckInScreen({ route, navigation }: Props) {
  const { clubId, clubName, sessionId, sessionTitle } = route.params;
  const [members, setMembers] = useState<ClubMember[] | null>(null);
  const [checkins, setCheckins] = useState<CheckInRecord[]>([]);
  const [search, setSearch] = useState('');
  const [busyUid, setBusyUid] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => subscribeMembers(clubId, setMembers), [clubId]);
  useEffect(() => subscribeCheckins(clubId, sessionId, setCheckins), [clubId, sessionId]);

  const present = useMemo(() => new Set(checkins.map((c) => c.uid)), [checkins]);

  const q = search.trim().toLowerCase();
  const shown = (members ?? []).filter(
    (m) => !q || m.displayName.toLowerCase().includes(q) || (m.studentId ?? '').toLowerCase().includes(q)
  );

  const onMark = async (member: ClubMember) => {
    setError(null);
    setBusyUid(member.uid);
    try {
      await manualCheckIn(clubId, clubName, { id: sessionId, title: sessionTitle }, member);
    } catch {
      setError(`Chưa ghi nhận được cho ${member.displayName}. Kiểm tra kết nối và thử lại.`);
    } finally {
      setBusyUid(null);
    }
  };

  return (
    <Screen
      scroll
      keyboard
      header={<Header title="Điểm danh thủ công" onBack={() => navigation.goBack()} />}
      contentStyle={styles.content}
    >
      <Text style={styles.sessionTitle}>{sessionTitle}</Text>
      <TextField
        label="Tìm thành viên"
        placeholder="Tìm tên hoặc mã sinh viên"
        autoCorrect={false}
        value={search}
        onChangeText={setSearch}
      />
      {error ? <StatusCard tone="error" icon="alert" title="Chưa ghi nhận" subtitle={error} /> : null}

      {members === null ? (
        <Loading />
      ) : shown.length === 0 ? (
        <EmptyState
          icon="users"
          title={members.length === 0 ? 'CLB chưa có thành viên' : 'Không có kết quả'}
          subtitle={members.length === 0 ? undefined : 'Thử tên hoặc mã sinh viên khác.'}
        />
      ) : (
        shown.map((m) => {
          const done = present.has(m.uid);
          return (
            <Card key={m.uid} style={styles.card}>
              <View style={styles.row}>
                <Avatar name={m.displayName} size={40} />
                <View style={styles.info}>
                  <Text style={styles.name}>{m.displayName}</Text>
                  <Text style={styles.meta}>{m.studentId ?? 'Chưa có mã sinh viên'}</Text>
                </View>
                {done ? (
                  <Badge label="Đã điểm danh" tone="success" />
                ) : (
                  <View style={styles.action}>
                    <Button
                      title="Điểm danh"
                      variant="secondary"
                      onPress={() => onMark(m)}
                      loading={busyUid === m.uid}
                      disabled={busyUid !== null}
                    />
                  </View>
                )}
              </View>
            </Card>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md },
  sessionTitle: { ...typography.section, color: colors.primary },
  card: { padding: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  info: { flex: 1 },
  name: { ...typography.body, fontWeight: '600', color: colors.text },
  meta: { ...typography.small, color: colors.muted },
  action: { minWidth: 104 },
});
