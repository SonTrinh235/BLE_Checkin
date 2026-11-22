import { useEffect, useRef, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import QRCode from 'react-native-qrcode-svg';
import { useAuth } from '../auth/AuthContext';
import { isAdvertising, startAdvertisingFor, stopAdvertising } from '../ble/advertiser';
import { serverNow } from '../data/serverClock';
import {
  closeSession,
  isSessionExpired,
  openSession,
  sessionEndsAt,
  subscribeActiveSession,
  subscribeCheckins,
} from '../data/sessions';
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
  TextField,
} from '../components/ui';
import { colors, radius, spacing, typography } from '../theme';
import Icon from '../components/Icon';
import { formatElapsed, formatTime, methodLabel, methodTone } from '../ui/labels';

type Props = NativeStackScreenProps<RootStackParamList, 'OpenSession'>;

const DURATION_OPTIONS: { label: string; value: number | null }[] = [
  // Dev-only: lets us exercise expiry/auto-close without waiting 30 minutes.
  ...(__DEV__ ? [{ label: '2 phút (DEV)', value: 2 }] : []),
  { label: '30 phút', value: 30 },
  { label: '1 giờ', value: 60 },
  { label: '2 giờ', value: 120 },
  { label: 'Không giới hạn', value: null },
];

type BleState = 'starting' | 'advertising' | 'denied' | 'error';

export default function OpenSessionScreen({ route, navigation }: Props) {
  const { clubId, clubName } = route.params;
  const { user } = useAuth();
  const [session, setSession] = useState<CheckInSession | null>(null);
  const [checkins, setCheckins] = useState<CheckInRecord[]>([]);
  const [bleState, setBleState] = useState<BleState>('starting');
  const [retryKey, setRetryKey] = useState(0);
  const [opening, setOpening] = useState(false);
  const [openError, setOpenError] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [title, setTitle] = useState('');
  const [room, setRoom] = useState('');
  const [duration, setDuration] = useState<number | null>(60);
  const [showQr, setShowQr] = useState(false);
  const [search, setSearch] = useState('');
  const [now, setNow] = useState(serverNow());
  const [loaded, setLoaded] = useState(false);

  useEffect(
    () =>
      subscribeActiveSession(clubId, (s) => {
        setSession(s);
        setLoaded(true);
      }),
    [clubId]
  );

  useEffect(() => {
    if (!session) {
      setCheckins([]);
      return;
    }
    return subscribeCheckins(clubId, session.id, setCheckins);
  }, [clubId, session?.id]);

  useEffect(() => {
    if (!session) return;
    const t = setInterval(() => setNow(serverNow()), 1000);
    return () => clearInterval(t);
  }, [session?.id]);

  // Advertising is owned by src/ble/advertiser.ts, not this screen: leaving
  // the screen keeps broadcasting; it stops when the session closes/expires.
  useEffect(() => {
    if (!session) return;
    if (isAdvertising(session.id)) {
      setBleState('advertising');
      return;
    }
    let cancelled = false;
    setBleState('starting');
    startAdvertisingFor(session).then((result) => {
      if (!cancelled) setBleState(result);
    });
    return () => {
      cancelled = true;
    };
  }, [session?.id, session?.bleCode, retryKey]);

  // Session closed from elsewhere (e.g. another device): stop broadcasting.
  useEffect(() => {
    if (loaded && !session) stopAdvertising();
  }, [loaded, session]);

  const onOpen = async () => {
    if (!user) return;
    setOpenError(null);
    setOpening(true);
    try {
      await openSession(clubId, user.uid, { title, room, durationMin: duration });
    } catch (err) {
      setOpenError(String((err as Error)?.message ?? err));
    } finally {
      setOpening(false);
    }
  };

  const autoClosedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!session || autoClosedRef.current === session.id || !isSessionExpired(session, now)) return;
    autoClosedRef.current = session.id;
    void doClose(true);
  });

  const doClose = async (auto = false) => {
    if (!session) return;
    setClosing(true);
    stopAdvertising();
    try {
      await closeSession(clubId, session.id);
      setConfirmClose(false);
      if (auto) Alert.alert('Phiên đã hết giờ', 'Phiên điểm danh đã tự đóng khi hết thời lượng.');
      navigation.goBack();
    } catch (err) {
      setClosing(false);
      setConfirmClose(false);
      if (auto) autoClosedRef.current = null;
      Alert.alert('Không đóng được phiên', String((err as Error)?.message ?? err));
    }
  };

  const onClose = () => setConfirmClose(true);

  if (!loaded) {
    return (
      <Screen header={<Header title={clubName} onBack={() => navigation.goBack()} />}>
        <Loading />
      </Screen>
    );
  }

  if (!session) {
    return (
      <Screen
        scroll
        keyboard
        header={<Header title={clubName} onBack={() => navigation.goBack()} />}
        contentStyle={styles.content}
        footer={
          <Button title="Mở phiên điểm danh" icon="bluetooth" onPress={onOpen} loading={opening} />
        }
      >
        <StatusCard
          tone="neutral"
          icon="calendar"
          title="Bản nháp"
          subtitle="Điền thông tin buổi sinh hoạt rồi mở phiên."
        />
        {openError ? (
          <StatusCard tone="error" icon="alert" title="Không mở được phiên" subtitle={openError} />
        ) : null}
        <TextField
          label="Tên buổi sinh hoạt"
          placeholder="VD: Workshop UI/UX thực chiến"
          hint="Bỏ trống để dùng tên theo thời gian."
          value={title}
          onChangeText={setTitle}
        />
        <TextField label="Phòng / địa điểm" placeholder="VD: B.302" value={room} onChangeText={setRoom} />
        <View style={styles.durationBlock}>
          <Text style={styles.durationLabel}>Thời lượng phiên</Text>
          <View style={styles.chips}>
            {DURATION_OPTIONS.map((o) => {
              const active = o.value === duration;
              return (
                <TouchableOpacity
                  key={o.label}
                  onPress={() => setDuration(o.value)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{o.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.durationHint}>Phiên tự đóng khi hết giờ. Bạn vẫn có thể đóng sớm.</Text>
        </View>
        <StatusCard
          tone="info"
          icon="bluetooth"
          title="Sẵn sàng mở"
          subtitle="Điện thoại sẽ phát Bluetooth, mã QR dự phòng hiện kèm theo."
        />
      </Screen>
    );
  }

  const qrValue = JSON.stringify({ clubId, sessionId: session.id });
  const manualCount = checkins.filter((c) => c.method === 'manual').length;
  const endsAt = sessionEndsAt(session);
  const timerLabel =
    endsAt !== null ? `CÒN ${formatElapsed(endsAt - now)}` : `ĐANG MỞ · ${formatElapsed(now - session.openedAt)}`;

  const q = search.trim().toLowerCase();
  const shown = [...checkins]
    .sort((a, b) => b.checkedInAt - a.checkedInAt)
    .filter(
      (c) => !q || c.displayName.toLowerCase().includes(q) || (c.studentId ?? '').toLowerCase().includes(q)
    );

  const bleLine = {
    starting: 'Đang bật tín hiệu Bluetooth…',
    advertising: 'Bluetooth đang phát · QR dự phòng sẵn sàng',
    denied: 'Chưa cấp quyền Bluetooth · dùng QR',
    error: 'Không phát được Bluetooth · dùng QR',
  }[bleState];

  return (
    <Screen
      scroll
      keyboard
      header={<Header title="Điểm danh trực tiếp" onBack={() => navigation.goBack()} />}
      contentStyle={styles.content}
      footer={<Button title="Đóng điểm danh" variant="danger" onPress={onClose} loading={closing} />}
    >
      <Modal
        visible={confirmClose}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!closing) setConfirmClose(false);
        }}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => {
            if (!closing) setConfirmClose(false);
          }}
          accessibilityLabel="Đóng hộp thoại"
        >
          {/* Inner Pressable swallows taps so touching the sheet doesn't dismiss it. */}
          <Pressable style={styles.sheet} onPress={() => undefined}>
            <View style={styles.sheetWarn}>
              <Icon name="alert" size={44} color={colors.warning} />
              <Text style={styles.sheetTitle}>Đóng phiên điểm danh?</Text>
              <Text style={styles.sheetSubtitle}>
                Sinh viên sẽ không thể điểm danh thêm bằng BLE hoặc QR.
              </Text>
            </View>

            <Card>
              <Text style={styles.sheetSession}>{session.title}</Text>
              <Text style={styles.sheetMeta}>
                {`${checkins.length} người đã điểm danh`}
                {manualCount > 0 ? ` · ${manualCount} bản ghi thủ công` : ''}
              </Text>
            </Card>

            <Text style={styles.sheetNote}>
              Danh sách được lưu vào lịch sử. Không chỉnh sửa bản ghi điểm danh trong phiên bản MVP.
            </Text>

            <Button
              title="Đóng và lưu danh sách"
              variant="danger"
              onPress={() => void doClose()}
              loading={closing}
            />
            <Button
              title="Tiếp tục điểm danh"
              variant="secondary"
              onPress={() => setConfirmClose(false)}
              disabled={closing}
            />
          </Pressable>
        </Pressable>
      </Modal>

      <Text style={styles.sessionTitle}>{session.title}</Text>
      {session.room ? <Text style={styles.sessionMeta}>Phòng {session.room}</Text> : null}

      <View style={styles.summary} accessibilityRole="summary">
        <Text style={styles.summaryEyebrow}>{timerLabel}</Text>
        <Text style={styles.summaryCount}>{checkins.length} người đã điểm danh</Text>
        <Text style={styles.summaryLine}>{bleLine}</Text>
      </View>

      {bleState === 'denied' || bleState === 'error' ? (
        <>
          <StatusCard
            tone={bleState === 'denied' ? 'error' : 'warning'}
            icon={bleState === 'denied' ? 'lock' : 'alert'}
            title={bleState === 'denied' ? 'Chưa cấp quyền Bluetooth' : 'Không phát được Bluetooth'}
            subtitle={
              bleState === 'denied'
                ? 'Cho phép Bluetooth trong cài đặt, hoặc dùng mã QR.'
                : 'Kiểm tra Bluetooth đã bật. Mã QR vẫn dùng được.'
            }
          />
          <Button title="Thử lại" variant="secondary" onPress={() => setRetryKey((k) => k + 1)} />
        </>
      ) : null}

      <View style={styles.actionRow}>
        <View style={styles.actionCell}>
          <Button
            title={showQr ? 'Ẩn QR' : 'Hiện QR'}
            icon="qr"
            variant="secondary"
            onPress={() => setShowQr((v) => !v)}
          />
        </View>
        <View style={styles.actionCell}>
          <Button
            title="Thủ công"
            icon="plus"
            variant="secondary"
            onPress={() =>
              navigation.navigate('ManualCheckIn', {
                clubId,
                clubName,
                sessionId: session.id,
                sessionTitle: session.title,
              })
            }
          />
        </View>
      </View>

      {showQr ? (
        <Card style={styles.qrCard}>
          <View style={styles.qrFrame}>
            <QRCode value={qrValue} size={200} color={colors.primary} />
          </View>
          <Text style={styles.qrHint}>Mã QR dự phòng cho máy không hỗ trợ Bluetooth</Text>
        </Card>
      ) : null}

      <SectionTitle>Người tham dự</SectionTitle>
      <TextField
        label="Tìm kiếm"
        placeholder="Tìm tên hoặc mã sinh viên"
        autoCorrect={false}
        value={search}
        onChangeText={setSearch}
      />

      {checkins.length === 0 ? (
        <EmptyState icon="users" title="Chưa có ai điểm danh" subtitle="Danh sách cập nhật ngay khi có người." />
      ) : shown.length === 0 ? (
        <EmptyState icon="users" title="Không có kết quả" subtitle="Thử tên hoặc mã sinh viên khác." />
      ) : (
        shown.map((item) => (
          <Card key={item.uid} style={styles.personCard}>
            <View style={styles.person}>
              <Avatar name={item.displayName} size={40} />
              <View style={styles.personInfo}>
                <Text style={styles.personName}>{item.displayName}</Text>
                <Text style={styles.personMeta}>
                  {item.studentId ? `${item.studentId} · ` : ''}
                  {formatTime(item.checkedInAt)}
                </Text>
              </View>
              <Badge label={methodLabel[item.method]} tone={methodTone[item.method]} />
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md },
  backdrop: { flex: 1, backgroundColor: 'rgba(23, 23, 23, 0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  sheetWarn: {
    backgroundColor: colors.warningLight,
    borderRadius: radius.lg,
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
  },
  sheetTitle: { ...typography.title, color: colors.warning, textAlign: 'center' },
  sheetSubtitle: { ...typography.body, color: colors.muted, textAlign: 'center' },
  sheetSession: { ...typography.section, color: colors.text },
  sheetMeta: { ...typography.small, color: colors.muted },
  sheetNote: { ...typography.small, color: colors.muted },
  sessionTitle: { ...typography.title, color: colors.primary },
  sessionMeta: { ...typography.small, color: colors.muted, marginTop: -spacing.sm },
  summary: { backgroundColor: colors.primary, borderRadius: radius.lg, padding: spacing.xl, gap: 4 },
  summaryEyebrow: { ...typography.caption, color: '#BFDBFE', fontWeight: '700', letterSpacing: 0.8 },
  summaryCount: { fontSize: 24, lineHeight: 30, fontWeight: '700', color: '#FFFFFF' },
  summaryLine: { ...typography.small, color: '#DBEAFE' },
  durationBlock: { gap: spacing.sm },
  durationLabel: { ...typography.small, fontWeight: '600', color: colors.text },
  durationHint: { ...typography.caption, color: colors.muted },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { ...typography.small, color: colors.text },
  chipTextActive: { color: '#FFFFFF', fontWeight: '600' },
  actionRow: { flexDirection: 'row', gap: spacing.md },
  actionCell: { flex: 1 },
  qrCard: { alignItems: 'center', gap: spacing.md },
  qrFrame: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  qrHint: { ...typography.small, color: colors.muted, textAlign: 'center' },
  personCard: { padding: spacing.md },
  person: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  personInfo: { flex: 1 },
  personName: { ...typography.body, fontWeight: '600', color: colors.text },
  personMeta: { ...typography.small, color: colors.muted },
});
