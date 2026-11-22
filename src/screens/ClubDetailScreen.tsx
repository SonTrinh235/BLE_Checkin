import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../auth/AuthContext';
import { removeMember, subscribeClub, subscribeMembers } from '../data/clubs';
import { isSessionExpired, subscribeActiveSession } from '../data/sessions';
import { exportClubReport } from '../data/reportExport';
import { Club, CheckInSession, ClubMember } from '../types/models';
import { RootStackParamList } from '../navigation/types';
import { Avatar, Badge, Button, Card, Header, Screen, SectionTitle, StatusCard } from '../components/ui';
import { colors, radius, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ClubDetail'>;

export default function ClubDetailScreen({ route, navigation }: Props) {
  const { clubId, clubName, role } = route.params;
  const { user } = useAuth();
  const [club, setClub] = useState<Club | null>(null);
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [memberError, setMemberError] = useState<string | null>(null);
  const [rawActiveSession, setActiveSession] = useState<CheckInSession | null>(null);
  const [now, setNow] = useState(Date.now());
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => subscribeClub(clubId, setClub), [clubId]);
  useEffect(() => subscribeActiveSession(clubId, setActiveSession), [clubId]);
  useEffect(() => subscribeMembers(clubId, setMembers), [clubId]);
  useEffect(() => {
    if (!rawActiveSession?.durationMin) return;
    const t = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(t);
  }, [rawActiveSession?.id, rawActiveSession?.durationMin]);
  // Members must not see an expired-but-unclosed session as live; the owner
  // still sees it so they can open it and close it.
  const activeSession =
    rawActiveSession && (role === 'owner' || !isSessionExpired(rawActiveSession, now))
      ? rawActiveSession
      : null;

  const doRemove = async (uid: string, leaving: boolean) => {
    setMemberError(null);
    try {
      await removeMember(clubId, uid);
      if (leaving) navigation.popTo('Main', { screen: 'Home' });
    } catch {
      setMemberError(leaving ? 'Chưa rời được CLB. Kiểm tra kết nối và thử lại.' : 'Chưa xoá được thành viên. Kiểm tra kết nối và thử lại.');
    }
  };

  const onRemove = (m: ClubMember) => {
    Alert.alert('Xoá thành viên?', `${m.displayName} sẽ rời khỏi CLB và cần mã tham gia để vào lại.`, [
      { text: 'Huỷ', style: 'cancel' },
      { text: 'Xoá', style: 'destructive', onPress: () => void doRemove(m.uid, false) },
    ]);
  };

  const onLeave = () => {
    if (!user) return;
    Alert.alert('Rời CLB?', `Bạn sẽ rời khỏi ${clubName} và cần mã tham gia để vào lại.`, [
      { text: 'Huỷ', style: 'cancel' },
      { text: 'Rời CLB', style: 'destructive', onPress: () => void doLeave() },
    ]);
  };

  const doLeave = async () => {
    if (user) await doRemove(user.uid, true);
  };

  const onExport = async () => {
    setExportError(null);
    setExporting(true);
    try {
      await exportClubReport(clubId, clubName);
    } catch (err) {
      setExportError(String((err as Error)?.message ?? err));
    } finally {
      setExporting(false);
    }
  };

  const isOwner = role === 'owner';

  return (
    <Screen
      scroll
      header={<Header title={clubName} onBack={() => navigation.goBack()} />}
      contentStyle={styles.content}
      footer={
        activeSession ? (
          isOwner ? (
            <Button
              title="Quản lý phiên đang mở"
              icon="bluetooth"
              onPress={() => navigation.navigate('OpenSession', { clubId, clubName })}
            />
          ) : (
            <Button
              title="Điểm danh ngay"
              icon="bluetooth"
              onPress={() => navigation.navigate('CheckIn', { clubId, clubName })}
            />
          )
        ) : isOwner ? (
          <Button
            title="Mở phiên điểm danh mới"
            icon="plus"
            onPress={() => navigation.navigate('OpenSession', { clubId, clubName })}
          />
        ) : undefined
      }
    >
      <Badge label={isOwner ? 'Chủ nhiệm CLB' : 'Thành viên'} tone={isOwner ? 'info' : 'neutral'} />

      {activeSession ? (
        <StatusCard
          tone="success"
          icon="check"
          title={`Đang mở: ${activeSession.title}`}
          subtitle={
            activeSession.room
              ? `Phòng ${activeSession.room} · đang nhận điểm danh`
              : 'Đang nhận điểm danh'
          }
        />
      ) : (
        <StatusCard
          tone="neutral"
          icon="calendar"
          title="Chưa có buổi điểm danh"
          subtitle={
            isOwner ? 'Mở phiên mới khi bắt đầu buổi sinh hoạt.' : 'Phiên sẽ hiện ở đây khi chủ nhiệm mở.'
          }
        />
      )}

      {isOwner && club ? (
        <Card>
          <SectionTitle>Mã tham gia</SectionTitle>
          <View style={styles.codeBox}>
            <Text selectable style={styles.code}>
              {club.joinCode}
            </Text>
          </View>
          <Text style={styles.hint}>Chia sẻ mã này để thành viên tham gia CLB.</Text>
        </Card>
      ) : null}

      {isOwner ? (
        <Card>
          <SectionTitle>Các phiên điểm danh</SectionTitle>
          <Text style={styles.hint}>Xem lại từng phiên và danh sách người đã có mặt.</Text>
          <View style={{ marginTop: spacing.sm }}>
            <Button
              title="Xem các phiên"
              icon="calendar"
              variant="secondary"
              onPress={() => navigation.navigate('Sessions', { clubId, clubName })}
            />
          </View>
        </Card>
      ) : null}

      {isOwner ? (
        <Card>
          <SectionTitle>{`Thành viên (${members.length})`}</SectionTitle>
          {memberError ? <StatusCard tone="error" icon="alert" title="Có lỗi" subtitle={memberError} /> : null}
          {members.map((m) => (
            <View key={m.uid} style={styles.memberRow}>
              <Avatar name={m.displayName} size={36} />
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{m.displayName}</Text>
                <Text style={styles.hint}>{m.studentId ?? 'Chưa có mã sinh viên'}</Text>
              </View>
              {m.role === 'owner' ? (
                <Badge label="Chủ nhiệm" tone="info" />
              ) : (
                <TouchableOpacity
                  onPress={() => onRemove(m)}
                  accessibilityRole="button"
                  accessibilityLabel={`Xoá ${m.displayName}`}
                  style={styles.removeBtn}
                >
                  <Text style={styles.removeText}>Xoá</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </Card>
      ) : null}

      {isOwner ? (
        <Card>
          <SectionTitle>Báo cáo</SectionTitle>
          <Text style={styles.hint}>Xuất danh sách điểm danh theo phiên và thành viên (CSV).</Text>
          {exportError ? (
            <StatusCard tone="error" icon="alert" title="Xuất báo cáo thất bại" subtitle={exportError} />
          ) : null}
          <View style={{ marginTop: spacing.sm }}>
            <Button
              title="Xuất báo cáo (CSV)"
              icon="download"
              variant="secondary"
              onPress={onExport}
              loading={exporting}
            />
          </View>
        </Card>
      ) : null}
      {!isOwner ? (
        <>
          {memberError ? <StatusCard tone="error" icon="alert" title="Có lỗi" subtitle={memberError} /> : null}
          <Button title="Rời CLB" icon="logout" variant="danger" onPress={onLeave} />
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg },
  codeBox: {
    backgroundColor: colors.accentLight,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  code: { ...typography.display, color: colors.primary, letterSpacing: 4 },
  hint: { ...typography.small, color: colors.muted },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  memberInfo: { flex: 1 },
  memberName: { ...typography.body, fontWeight: '600', color: colors.text },
  removeBtn: { paddingVertical: spacing.xs, paddingHorizontal: spacing.md },
  removeText: { ...typography.small, fontWeight: '600', color: colors.error },
});
