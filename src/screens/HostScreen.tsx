import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import * as BLE from 'react-native-ble-lite';
import { useDialog } from '../components/Dialog';
import { CHECKIN_SERVICE_UUID, randomSessionCode } from '../ble/constants';
import { requestBlePermissions } from '../ble/permissions';

export default function HostScreen() {
  const dialog = useDialog();
  const [sessionCode] = useState(randomSessionCode);
  const [isAdvertising, setIsAdvertising] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  const stop = useCallback(() => {
    if (startedRef.current) {
      BLE.stopAdvertising();
      startedRef.current = false;
    }
    setIsAdvertising(false);
  }, []);

  const start = useCallback(async () => {
    setError(null);
    const granted = await requestBlePermissions();
    if (!granted) {
      void dialog.alert({
        title: 'Cần quyền Bluetooth',
        message: 'Hãy cho phép Bluetooth trong Cài đặt để dùng công cụ này.',
        tone: 'warning',
        icon: 'lock',
      });
      return;
    }

    try {
      await BLE.startAdvertising({
        serviceUuid: CHECKIN_SERVICE_UUID,
        data: sessionCode,
        powerLevel: BLE.AdvertisePower.HIGH,
        advertiseMode: BLE.AdvertiseMode.LOW_LATENCY,
        includeDeviceName: true,
      });
      startedRef.current = true;
      setIsAdvertising(true);
    } catch (err) {
      setError(String(err));
    }
  }, [sessionCode]);

  useEffect(() => stop, [stop]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Host — check-in session</Text>
      <Text style={styles.code}>{sessionCode.toUpperCase()}</Text>
      <Text style={styles.hint}>
        Session code — should match what the scanning device sees.
      </Text>

      <View style={styles.button}>
        <Button
          title={isAdvertising ? 'Stop advertising' : 'Start advertising'}
          onPress={isAdvertising ? stop : start}
        />
      </View>

      <Text style={styles.status}>
        {isAdvertising ? '🟢 Advertising — discoverable nearby' : '⚪ Not advertising'}
      </Text>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
  label: { fontSize: 16, color: '#555' },
  code: { fontSize: 48, fontWeight: '700', letterSpacing: 4, marginVertical: 8 },
  hint: { fontSize: 12, color: '#888', textAlign: 'center', marginBottom: 24 },
  button: { marginVertical: 16, minWidth: 220 },
  status: { fontSize: 14, marginTop: 8 },
  error: { color: 'crimson', marginTop: 12, textAlign: 'center' },
});
