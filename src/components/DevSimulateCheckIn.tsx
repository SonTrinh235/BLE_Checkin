import { useEffect, useState, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../auth/AuthContext';
import { RootStackParamList } from '../navigation/types';
import { subscribeMyClubs } from '../data/clubs';
import { checkIn } from '../data/checkin';
import { isSessionExpired, subscribeActiveSession, subscribeCheckins } from '../data/sessions';
import { CheckInSession, MyClub } from '../types/models';
import { Badge, Button, Card } from './ui';
import { spacing, typography, Palette } from '../theme';
import { useColors } from '../theme/useTheme';

// Dev-only helper (rendered under `__DEV__` in the Profile tab). Emulators
// have no Bluetooth and no usable camera, so this runs the REAL check-in
// path — offline queue, Firestore writes, history — without a BLE/QR read.
// Recorded as a Bluetooth check-in so reports look like the real thing.
export default function DevSimulateCheckIn() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { user } = useAuth();
  const [clubs, setClubs] = useState<MyClub[] | null>(null);

  useEffect(() => {
    if (!user) return;
    return subscribeMyClubs(user.uid, setClubs);
  }, [user]);

  return (
    <Card>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Giả lập điểm danh</Text>
        <Badge label="DEV" tone="warning" />
      </View>
      <Text style={styles.body}>
        Dành cho máy ảo không có Bluetooth/camera. Chạy đúng luồng điểm danh thật cho phiên đang mở của từng
        CLB. Không có trong bản production.
      </Text>
      {clubs === null ? null : clubs.length === 0 ? (
        <Text style={styles.body}>Bạn chưa tham gia CLB nào.</Text>
      ) : (
        clubs.map((c) => <ClubRow key={c.clubId} club={c} />)
      )}
    </Card>
  );
}

function ClubRow({ club }: { club: MyClub }) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { user, studentId } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [session, setSession] = useState<CheckInSession | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => subscribeActiveSession(club.clubId, setSession), [club.clubId]);

  useEffect(() => {
    if (!session || !user) {
      setDone(false);
      return;
    }
    return subscribeCheckins(club.clubId, session.id, (records) =>
      setDone(records.some((r) => r.uid === user.uid))
    );
  }, [club.clubId, session?.id, user]);

  const onPress = async () => {
    if (!session || !user) return;
    if (isSessionExpired(session)) {
      setError('Phiên đã hết giờ.');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await checkIn({
        clubId: club.clubId,
        clubName: club.name,
        sessionId: session.id,
        sessionTitle: session.title,
        uid: user.uid,
        displayName: user.displayName ?? user.email ?? 'Không rõ',
        studentId,
        method: 'ble',
      });
      // Land on the real check-in screen, which shows the "Bạn đã có mặt!" receipt.
      navigation.navigate('CheckIn', { clubId: club.clubId, clubName: club.name });
    } catch {
      setError('Chưa ghi nhận được. Thử lại.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.row}>
      <Text style={styles.clubName} numberOfLines={1}>
        {club.name}
      </Text>
      {!session ? (
        <Text style={styles.body}>Chưa có phiên đang mở.</Text>
      ) : done ? (
        <Badge label="Đã điểm danh" tone="success" />
      ) : (
        <Button title={`Điểm danh: ${session.title}`} variant="secondary" onPress={onPress} loading={busy} />
      )}
      {error ? <Text style={[styles.body, { color: colors.error }]}>{error}</Text> : null}
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { ...typography.section, color: colors.text },
  body: { ...typography.small, color: colors.muted },
  row: { gap: spacing.sm, marginTop: spacing.md },
  clubName: { ...typography.body, fontWeight: '600', color: colors.text },
});
