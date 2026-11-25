import { useEffect, useState, useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../auth/AuthContext';
import { subscribeMyClubs } from '../data/clubs';
import { isSessionExpired, subscribeActiveSession } from '../data/sessions';
import { serverNow } from '../data/serverClock';
import { useSessionHousekeeping } from '../hooks/useSessionHousekeeping';
import { CheckInSession, MyClub } from '../types/models';
import { MainTabParamList, RootStackParamList } from '../navigation/types';
import { Badge, Button, Card, EmptyState, ListSkeleton, LiveDot, PageTitle, Screen, StatusCard, TextField } from '../components/ui';
import { spacing, typography, Palette } from '../theme';
import { useColors } from '../theme/useTheme';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>;

export default function HomeScreen({ navigation }: Props) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { user } = useAuth();
  const [clubs, setClubs] = useState<MyClub[] | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!user) return;
    return subscribeMyClubs(user.uid, setClubs);
  }, [user]);

  const name = user?.displayName ?? user?.email ?? 'bạn';
  const q = query.trim().toLowerCase();
  const shown = (clubs ?? []).filter((c) => !q || c.name.toLowerCase().includes(q));

  return (
    <Screen edges={['top']} contentStyle={styles.content}>
      <PageTitle title={`Chào, ${name}`} subtitle="Hôm nay bạn đi sinh hoạt CLB nào?" />
      <Button
        title="Tạo / Tham gia CLB"
        icon="plus"
        onPress={() => navigation.navigate('CreateJoinClub')}
      />

      {clubs !== null && clubs.length >= 3 ? (
        <TextField
          label="Tìm CLB"
          placeholder="Nhập tên CLB"
          autoCorrect={false}
          value={query}
          onChangeText={setQuery}
        />
      ) : null}

      {clubs === null ? (
        <ListSkeleton />
      ) : (
        <FlatList
          data={shown}
          keyExtractor={(item) => item.clubId}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={shown.length ? <Text style={styles.heading}>CLB của tôi</Text> : null}
          ListEmptyComponent={
            q ? (
              <EmptyState icon="users" title="Không tìm thấy CLB" subtitle="Thử một phần khác của tên CLB." />
            ) : (
              <EmptyState
                icon="users"
                title="Chưa có CLB nào"
                subtitle="Tạo CLB mới hoặc nhập mã tham gia từ chủ nhiệm."
              />
            )
          }
          renderItem={({ item, index }) => (
            <Animated.View layout={LinearTransition} entering={FadeInDown.delay(Math.min(index, 6) * 50).duration(280)}>
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
            </Animated.View>
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
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [rawSession, setSession] = useState<CheckInSession | null>(null);
  const [now, setNow] = useState(serverNow());
  const [loaded, setLoaded] = useState(false);
  useEffect(
    () =>
      subscribeActiveSession(club.clubId, (s) => {
        setSession(s);
        setLoaded(true);
      }),
    [club.clubId]
  );
  useEffect(() => {
    if (!rawSession?.durationMin) return;
    const t = setInterval(() => setNow(serverNow()), 15_000);
    return () => clearInterval(t);
  }, [rawSession?.id, rawSession?.durationMin]);
  const isOwner = club.role === 'owner';
  useSessionHousekeeping(club.clubId, rawSession, loaded, isOwner, now);
  // Members must not see an expired-but-unclosed session as live; the owner
  // still sees it so they can open it and close it.
  const session = rawSession && (isOwner || !isSessionExpired(rawSession, now)) ? rawSession : null;

  return (
    <Card onPress={onPress}>
      <View style={styles.row}>
        {session ? <LiveDot /> : null}
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

const createStyles = (colors: Palette) =>
  StyleSheet.create({
  live: { gap: spacing.sm, marginTop: spacing.sm },
  content: { flex: 1, gap: spacing.lg },
  list: { gap: spacing.md, paddingBottom: spacing.xl },
  heading: { ...typography.section, color: colors.text, marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  cardTitle: { ...typography.section, color: colors.text, flex: 1 },
  cardMeta: { ...typography.small, color: colors.muted, marginTop: 4 },
});
