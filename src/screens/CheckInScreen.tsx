import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as BLE from 'react-native-ble-lite';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useAuth } from '../auth/AuthContext';
import { sessionServiceUuid } from '../ble/constants';
import { requestBlePermissions } from '../ble/permissions';
import { isSessionExpired, subscribeActiveSession, subscribeCheckins } from '../data/sessions';
import { checkIn } from '../data/checkin';
import { CheckInRecord, CheckInSession } from '../types/models';
import { RootStackParamList } from '../navigation/types';
import { Button, Card, Header, HeroState, Loading, Screen, StatusCard } from '../components/ui';
import { colors, radius, spacing, typography } from '../theme';
import { formatDateTime, methodLabel } from '../ui/labels';

type Props = NativeStackScreenProps<RootStackParamList, 'CheckIn'>;

type Phase =
  | 'idle'
  | 'scanning' // BLE scan running
  | 'nosignal' // BLE scan timed out
  | 'denied' // BLE or camera permission refused
  | 'recording' // writing the check-in
  | 'camera' // QR camera open
  | 'qr-invalid' // QR unreadable or not ours
  | 'qr-mismatch' // QR is for another session
  | 'expired' // session ran out of time
  | 'failed'; // check-in write failed

const BLE_SCAN_TIMEOUT_MS = 20_000;

export default function CheckInScreen({ route, navigation }: Props) {
  const { clubId, clubName } = route.params;
  const { user, studentId } = useAuth();
  const [myRecord, setMyRecord] = useState<CheckInRecord | null>(null);
  const [session, setSession] = useState<CheckInSession | null | undefined>(undefined);
  const [checkedIn, setCheckedIn] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [deniedWhat, setDeniedWhat] = useState<'bluetooth' | 'camera'>('bluetooth');
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const scanningRef = useRef(false);
  const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handledRef = useRef(false); // guards against double check-in
  const qrScanLockRef = useRef(false); // ignore repeat frames after first read

  useEffect(() => subscribeActiveSession(clubId, setSession), [clubId]);

  useEffect(() => {
    if (!session || !user) return;
    return subscribeCheckins(clubId, session.id, (records) => {
      const mine = records.find((r) => r.uid === user.uid) ?? null;
      setMyRecord(mine);
      setCheckedIn(mine !== null);
    });
  }, [clubId, session?.id, user]);

  const clearScanTimer = () => {
    if (scanTimerRef.current) {
      clearTimeout(scanTimerRef.current);
      scanTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearScanTimer();
      if (scanningRef.current) BLE.stopScanning();
    };
  }, []);

  const doCheckIn = async (method: 'ble' | 'qr') => {
    if (!session || !user || handledRef.current) return;
    if (isSessionExpired(session)) {
      setPhase('expired');
      return;
    }
    handledRef.current = true;
    setPhase('recording');
    try {
      await checkIn({
        clubId,
        clubName,
        sessionId: session.id,
        sessionTitle: session.title,
        uid: user.uid,
        displayName: user.displayName ?? user.email ?? 'Không rõ',
        studentId,
        method,
      });
      setCheckedIn(true);
      setPhase('idle');
    } catch {
      handledRef.current = false;
      setPhase('failed');
    }
  };

  const stopBleScan = () => {
    clearScanTimer();
    if (scanningRef.current) BLE.stopScanning();
    scanningRef.current = false;
  };

  const startBleScan = async () => {
    if (!session) return;
    const granted = await requestBlePermissions();
    if (!granted) {
      setDeniedWhat('bluetooth');
      setPhase('denied');
      return;
    }

    const sessionUuid = sessionServiceUuid(session.bleCode);
    const subscription = BLE.addAdvertisementListener((event) => {
      if (event.uuid.toLowerCase() !== sessionUuid) return;
      subscription.remove();
      stopBleScan();
      void doCheckIn('ble');
    });

    try {
      await BLE.startScanning({
        serviceUuid: sessionUuid,
        scanMode: BLE.ScanMode.LOW_LATENCY,
        allowDuplicates: true,
      });
      scanningRef.current = true;
      setPhase('scanning');
      scanTimerRef.current = setTimeout(() => {
        subscription.remove();
        stopBleScan();
        setPhase('nosignal');
      }, BLE_SCAN_TIMEOUT_MS);
    } catch {
      subscription.remove();
      setPhase('nosignal');
    }
  };

  const cancelBleScan = () => {
    stopBleScan();
    setPhase('idle');
  };

  const onOpenCamera = async () => {
    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) {
        setDeniedWhat('camera');
        setPhase('denied');
        return;
      }
    }
    qrScanLockRef.current = false;
    setPhase('camera');
  };

  const onBarcodeScanned = ({ data }: { data: string }) => {
    if (!session || qrScanLockRef.current) return;
    qrScanLockRef.current = true;

    try {
      const parsed = JSON.parse(data);
      if (parsed.clubId !== clubId || parsed.sessionId !== session.id) {
        setPhase('qr-mismatch');
        return;
      }
      void doCheckIn('qr');
    } catch {
      setPhase('qr-invalid');
    }
  };

  const goBack = () => navigation.goBack();
  const header = <Header title={session?.title ?? clubName} onBack={goBack} />;

  if (session === undefined) {
    return (
      <Screen header={<Header title={clubName} onBack={goBack} />}>
        <Loading />
      </Screen>
    );
  }

  if (checkedIn) {
    return (
      <Screen
        scroll
        header={header}
        footer={
          <>
            <Button title="Về trang chủ" onPress={() => navigation.popTo('Main', { screen: 'Home' })} />
            <Button
              title="Xem lịch sử"
              variant="secondary"
              onPress={() => navigation.popTo('Main', { screen: 'History' })}
            />
          </>
        }
      >
        <HeroState
          tone="success"
          icon="check"
          title="Bạn đã có mặt!"
          subtitle="Điểm danh đã được lưu. Nếu đang offline, kết quả sẽ tự đồng bộ khi có mạng."
        />
        <Card style={styles.receipt}>
          <ReceiptRow label="Họ tên" value={user?.displayName ?? user?.email ?? '—'} />
          <ReceiptRow label="Mã sinh viên" value={studentId ?? myRecord?.studentId ?? '—'} />
          <ReceiptRow label="Buổi" value={session?.title ?? clubName} />
          <ReceiptRow label="Thời gian" value={formatDateTime(myRecord?.checkedInAt ?? Date.now())} />
          <ReceiptRow label="Phương thức" value={myRecord ? methodLabel[myRecord.method] : '—'} />
          <ReceiptRow label="Trạng thái" value="Có mặt" />
        </Card>
      </Screen>
    );
  }

  if (!session) {
    return (
      <Screen header={<Header title={clubName} onBack={goBack} />} footer={<Button title="Quay lại" variant="secondary" onPress={goBack} />}>
        <HeroState
          tone="warning"
          icon="calendar"
          title="Phiên đã đóng"
          subtitle="Hiện không có phiên điểm danh nào đang mở. Hãy hỏi chủ nhiệm CLB."
        />
      </Screen>
    );
  }

  if (phase === 'camera') {
    return (
      <Screen
        header={header}
        edges={['top']}
        footer={<Button title="Huỷ" variant="secondary" onPress={() => setPhase('idle')} />}
        contentStyle={styles.cameraContent}
      >
        <View style={styles.cameraWrap}>
          <CameraView
            style={StyleSheet.absoluteFill}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={onBarcodeScanned}
          />
          <View pointerEvents="none" style={styles.cameraFrame} />
        </View>
        <Text style={styles.cameraHint}>Đặt mã QR vào khung</Text>
      </Screen>
    );
  }

  if (phase === 'recording') {
    return (
      <Screen header={header}>
        <HeroState tone="info" icon="bluetooth" busy title="Đang ghi nhận…" subtitle="Đang kiểm tra và lưu điểm danh" />
      </Screen>
    );
  }

  if (phase === 'denied') {
    const isBt = deniedWhat === 'bluetooth';
    return (
      <Screen
        header={header}
        footer={
          <>
            {isBt ? <Button title="Dùng mã QR thay thế" onPress={onOpenCamera} /> : null}
            <Button title="Quay lại" variant="secondary" onPress={() => setPhase('idle')} />
          </>
        }
      >
        <HeroState
          tone="error"
          icon="lock"
          title={isBt ? 'Chưa cấp quyền Bluetooth' : 'Chưa cấp quyền camera'}
          subtitle={
            isBt
              ? 'Cho phép Bluetooth trong Cài đặt để điểm danh tự động, hoặc quét mã QR.'
              : 'Cho phép camera trong Cài đặt để quét mã QR, hoặc dùng Bluetooth.'
          }
        />
      </Screen>
    );
  }

  if (phase === 'nosignal') {
    return (
      <Screen
        header={header}
        footer={
          <>
            <Button title="Thử lại" onPress={startBleScan} />
            <Button title="Quét mã QR" variant="secondary" onPress={onOpenCamera} />
          </>
        }
      >
        <HeroState
          tone="warning"
          icon="alert"
          title="Không tìm thấy tín hiệu"
          subtitle="Đến gần người tổ chức rồi thử lại, hoặc dùng mã QR."
        />
      </Screen>
    );
  }

  if (phase === 'qr-invalid' || phase === 'qr-mismatch') {
    return (
      <Screen
        header={header}
        footer={
          <>
            <Button title="Quét lại" onPress={onOpenCamera} />
            <Button title="Quay lại" variant="secondary" onPress={() => setPhase('idle')} />
          </>
        }
      >
        <HeroState
          tone="error"
          icon="qr"
          title={phase === 'qr-mismatch' ? 'Mã không đúng phiên' : 'Mã không hợp lệ'}
          subtitle={
            phase === 'qr-mismatch'
              ? 'Mã QR này không thuộc phiên đang mở. Yêu cầu mã mới và quét lại.'
              : 'Không đọc được dữ liệu từ mã QR này. Quét mã của người tổ chức.'
          }
        />
      </Screen>
    );
  }

  if (phase === 'expired') {
    return (
      <Screen header={header} footer={<Button title="Quay lại" variant="secondary" onPress={goBack} />}>
        <HeroState
          tone="warning"
          icon="calendar"
          title="Phiên đã hết giờ"
          subtitle="Thời gian điểm danh của phiên này đã kết thúc. Hãy báo chủ nhiệm CLB để được điểm danh thủ công."
        />
      </Screen>
    );
  }

  if (phase === 'failed') {
    return (
      <Screen
        header={header}
        footer={
          <>
            <Button title="Thử lại" onPress={() => setPhase('idle')} />
          </>
        }
      >
        <HeroState
          tone="error"
          icon="wifi-off"
          title="Chưa thể ghi nhận"
          subtitle="Kiểm tra kết nối rồi thử lại."
        />
      </Screen>
    );
  }

  const scanning = phase === 'scanning';

  return (
    <Screen
      scroll
      header={header}
      contentStyle={styles.idleContent}
      footer={
        scanning ? (
          <Button title="Dừng tìm kiếm" variant="secondary" onPress={cancelBleScan} />
        ) : undefined
      }
    >
      {scanning ? (
        <StatusCard
          tone="info"
          busy
          title="Đang tìm tín hiệu…"
          subtitle="Đứng gần người tổ chức. Máy sẽ tự điểm danh."
        />
      ) : (
        <StatusCard
          tone="info"
          icon="bluetooth"
          title="Sẵn sàng điểm danh"
          subtitle="Chọn một trong hai cách bên dưới"
        />
      )}

      <Card style={styles.method}>
        <Text style={styles.methodTitle}>Bluetooth (tự động)</Text>
        <Text style={styles.methodBody}>Đứng gần người tổ chức, không cần làm gì thêm.</Text>
        <Button
          title={scanning ? 'Đang tìm kiếm…' : 'Điểm danh bằng Bluetooth'}
          icon="bluetooth"
          onPress={startBleScan}
          disabled={scanning}
        />
      </Card>

      <Card style={styles.method}>
        <Text style={styles.methodTitle}>Mã QR (dự phòng)</Text>
        <Text style={styles.methodBody}>Dùng khi Bluetooth không hoạt động.</Text>
        <Button title="Quét mã QR" icon="qr" variant="secondary" onPress={onOpenCamera} disabled={scanning} />
      </Card>
    </Screen>
  );
}

function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.receiptRow}>
      <Text style={styles.receiptLabel}>{label}</Text>
      <Text style={styles.receiptValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  receipt: { gap: spacing.md },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.lg },
  receiptLabel: { ...typography.small, color: colors.muted },
  receiptValue: { ...typography.small, color: colors.text, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  idleContent: { gap: spacing.lg },
  method: { gap: spacing.sm },
  methodTitle: { ...typography.section, color: colors.text },
  methodBody: { ...typography.small, color: colors.muted, marginBottom: spacing.sm },
  cameraContent: { flex: 1, padding: spacing.lg, gap: spacing.md },
  cameraWrap: {
    flex: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraFrame: {
    width: 220,
    height: 220,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    borderRadius: radius.lg,
  },
  cameraHint: { ...typography.small, color: colors.muted, textAlign: 'center' },
});
