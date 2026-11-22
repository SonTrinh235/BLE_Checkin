import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../auth/AuthContext';
import { subscribeMyClubs } from '../data/clubs';
import { isSessionExpired, subscribeActiveSession } from '../data/sessions';
import { CheckInSession, MyClub } from '../types/models';
import { MainTabParamList, RootStackParamList } from '../navigation/types';
import { Badge, Button, Card, EmptyState, Loading, PageTitle, Screen, StatusCard } from '../components/ui';
import { colors, spacing, typography } from '../theme';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>;

export default function HomeScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [clubs, setClubs] = useState<MyClub[] | null>(null);

  useEffect(() => {
    if (!user) return;
    return subscribeMyClubs(user.uid, setClubs);
  }, [user]);

  const name = user?.displayName ?? user?.email ?? 'bạn';

  return (
    <Screen edges={['top']} contentStyle={styles.content}>
      <PageTitle title={`Chào, ${name}`} subtitle="Hôm nay bạn đi sinh hoạt CLB nào?" />
      <Button
        title="Tạo / Tham gia CLB"
        icon="plus"
        onPress={() => navigation.navigate('CreateJoinClub')}
      />

      {clubs === null ? (
        <Loading />
      ) : (
        <FlatList
          data={clubs}
          keyExtractor={(item) => item.clubId}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={clubs.length ? <Text style={styles.heading}>CLB của tôi</Text> : null}
          ListEmptyComponent={
            <EmptyState
              icon="users"
              title="Chưa có CLB nào"
              subtitle="Tạo CLB mới hoặc nhập mã tham gia từ chủ nhiệm."
            />
          }
          renderItem={({ item }) => (
            <ClubCard
              club={item}
              onPress={() =>
                navigation.navigate('ClubDetail', {
                  clubId: item.clubId,
                  clubName: item.name,
                  role: item.role,
                })
              }
              onCheckIn={() => navigation.navigate('CheckIn', { clubId: item.clubId, clubName: item.name })}
              onManage={() => navigation.navigate('OpenSession', { clubId: item.clubId, clubName: item.name })}
            />
          )}
        />
      )}
    </Screen>
  );
}

// One subscription per card: shows "Đang mở" and a one-tap action when the
// club has a live session, so the common case (walk in, tap, done) is
// reachable straight from the home tab.
function ClubCard({
  club,
  onPress,
  onCheckIn,
  onManage,
}: {
  club: MyClub;
  onPress: () => void;
  onCheckIn: () => void;
  onManage: () => void;
}) {
  const [rawSession, setSession] = useState<CheckInSession | null>(null);
  const [now, setNow] = useState(Date.now());
  useEffect(() => subscribeActiveSession(club.clubId, setSession), [club.clubId]);
  useEffect(() => {
    if (!rawSession?.durationMin) return;
    const t = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(t);
  }, [rawSession?.id, rawSession?.durationMin]);
  const isOwner = club.role === 'owner';
  // Members must not see an expired-but-unclosed session as live; the owner
  // still sees it so they can open it and close it.
  const session = rawSession && (isOwner || !isSessionExpired(rawSession, now)) ? rawSession : null;

  return (
    <Card onPress={onPress}>
      <View style={styles.row}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {club.name}
        </Text>
        <Badge label={isOwner ? 'Chủ nhiệm' : 'Thành viên'} tone={isOwner ? 'info' : 'neutral'} />
      </View>
      {session ? (
        <View style={styles.live}>
          <StatusCard
            tone="success"
            icon="bluetooth"
            title={`Đang mở · ${session.title}`}
            subtitle={session.room ? `Phòng ${session.room}` : 'Điểm danh đang diễn ra'}
          />
          <Button
            title={isOwner ? 'Quản lý phiên' : 'Điểm danh ngay'}
            onPress={isOwner ? onManage : onCheckIn}
          />
        </View>
      ) : (
        <Text style={styles.cardMeta}>
          Tham gia {new Date(club.joinedAt).toLocaleDateString('vi-VN')}
        </Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  live: { gap: spacing.sm, marginTop: spacing.sm },
  content: { flex: 1, gap: spacing.lg },
  list: { gap: spacing.md, paddingBottom: spacing.xl },
  heading: { ...typography.section, color: colors.text, marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  cardTitle: { ...typography.section, color: colors.text, flex: 1 },
  cardMeta: { ...typography.small, color: colors.muted, marginTop: 4 },
});
