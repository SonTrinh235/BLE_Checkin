import { useEffect, useState, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { isSessionExpired, subscribeCheckins, subscribeSessions } from '../data/sessions';
import { CheckInSession } from '../types/models';
import { RootStackParamList } from '../navigation/types';
import { Badge, Card, EmptyState, Header, ListSkeleton, Screen } from '../components/ui';
import { spacing, typography, Palette } from '../theme';
import { useColors } from '../theme/useTheme';
import { formatDateTime } from '../ui/labels';

type Props = NativeStackScreenProps<RootStackParamList, 'Sessions'>;

export default function SessionsScreen({ route, navigation }: Props) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { clubId, clubName } = route.params;
  const [sessions, setSessions] = useState<CheckInSession[] | null>(null);

  useEffect(() => subscribeSessions(clubId, setSessions), [clubId]);

  return (
    <Screen
      scroll
      header={<Header title="Các phiên điểm danh" onBack={() => navigation.goBack()} />}
      contentStyle={styles.content}
    >
      <Text style={styles.club}>{clubName}</Text>
      {sessions === null ? (
        <ListSkeleton />
      ) : sessions.length === 0 ? (
        <EmptyState
          icon="calendar"
          title="Chưa có phiên nào"
          subtitle="Các phiên bạn mở sẽ hiện ở đây."
        />
      ) : (
        sessions.map((s) => (
          <SessionRow
            key={s.id}
            session={s}
            onPress={() =>
              navigation.navigate('SessionDetail', { clubId, clubName, sessionId: s.id })
            }
          />
        ))
      )}
    </Screen>
  );
}

function SessionRow({ session, onPress }: { session: CheckInSession; onPress: () => void }) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [count, setCount] = useState<number | null>(null);
  useEffect(
    () => subscribeCheckins(session.clubId, session.id, (r) => setCount(r.length)),
    [session.clubId, session.id]
  );
  const open = session.status === 'open' && !isSessionExpired(session);

  return (
    <Card onPress={onPress}>
      <View style={styles.row}>
        <Text style={styles.title} numberOfLines={1}>
          {session.title}
        </Text>
        <Badge label={open ? 'Đang mở' : 'Đã đóng'} tone={open ? 'success' : 'neutral'} />
      </View>
      <Text style={styles.meta}>
        {session.room ? `Phòng ${session.room} · ` : ''}
        {formatDateTime(session.openedAt)}
      </Text>
      <Text style={styles.meta}>{count === null ? '…' : `${count} người điểm danh`}</Text>
    </Card>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
  content: { gap: spacing.md },
  club: { ...typography.section, color: colors.link },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  title: { ...typography.section, color: colors.text, flex: 1 },
  meta: { ...typography.small, color: colors.muted },
});
