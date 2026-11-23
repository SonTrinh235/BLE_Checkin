import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import * as BLE from 'react-native-ble-lite';
import { useDialog } from '../components/Dialog';
import { sessionServiceUuid } from '../ble/constants';
import { requestBlePermissions } from '../ble/permissions';

const RSSI_HISTORY_LENGTH = 10;

type DiscoveredDevice = {
  deviceId: string;
  sessionCode: string;
  rssiHistory: number[];
  lastSeenAt: number;
};

function average(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export default function ScanScreen() {
  const dialog = useDialog();
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [devices, setDevices] = useState<Record<string, DiscoveredDevice>>({});
  const startedRef = useRef(false);

  const stop = useCallback(() => {
    if (startedRef.current) {
      BLE.stopScanning();
      startedRef.current = false;
    }
    setIsScanning(false);
  }, []);

  const start = useCallback(async () => {
    setError(null);
    if (code.trim().length < 3) {
      setError('Nhập mã phiên hiển thị trên máy chủ (VD: A1B2).');
      return;
    }
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
      await BLE.startScanning({
        serviceUuid: sessionServiceUuid(code),
        scanMode: BLE.ScanMode.LOW_LATENCY,
        allowDuplicates: true,
      });
      startedRef.current = true;
      setIsScanning(true);
    } catch (err) {
      setError(String(err));
    }
  }, [code]);

  useEffect(() => {
    const subscription = BLE.addAdvertisementListener((event) => {
      if (event.uuid.toLowerCase() !== sessionServiceUuid(code)) return;
      setDevices((prev) => {
        const existing = prev[event.deviceId];
        const rssiHistory = [...(existing?.rssiHistory ?? []), event.rssi].slice(
          -RSSI_HISTORY_LENGTH
        );
        return {
          ...prev,
          [event.deviceId]: {
            deviceId: event.deviceId,
            sessionCode: code,
            rssiHistory,
            lastSeenAt: Date.now(),
          },
        };
      });
    });
    return () => subscription.remove();
  }, [code]);

  useEffect(() => stop, [stop]);

  const deviceList = Object.values(devices).sort((a, b) => b.lastSeenAt - a.lastSeenAt);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Student — scan for host</Text>

      <TextInput
        style={styles.input}
        placeholder="Mã phiên của máy chủ (VD: A1B2)"
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={4}
        editable={!isScanning}
        value={code}
        onChangeText={setCode}
      />

      <View style={styles.row}>
        <View style={styles.button}>
          <Button
            title={isScanning ? 'Stop scanning' : 'Start scanning'}
            onPress={isScanning ? stop : start}
          />
        </View>
        <View style={styles.button}>
          <Button title="Clear" onPress={() => setDevices({})} />
        </View>
      </View>

      <Text style={styles.status}>
        {isScanning ? '🟢 Scanning…' : '⚪ Not scanning'}
      </Text>
      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        style={styles.list}
        data={deviceList}
        keyExtractor={(item) => item.deviceId}
        ListEmptyComponent={<Text style={styles.hint}>No devices found yet.</Text>}
        renderItem={({ item }) => {
          const latest = item.rssiHistory[item.rssiHistory.length - 1];
          const avg = average(item.rssiHistory);
          const secondsAgo = Math.round((Date.now() - item.lastSeenAt) / 1000);
          return (
            <View style={styles.card}>
              <Text style={styles.code}>Code: {item.sessionCode.toUpperCase()}</Text>
              <Text style={styles.deviceId}>{item.deviceId}</Text>
              <Text>
                RSSI: {latest} dBm (avg of last {item.rssiHistory.length}: {avg.toFixed(1)})
              </Text>
              <Text style={styles.hint}>last seen {secondsAgo}s ago</Text>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 48 },
  label: { fontSize: 16, color: '#555', marginBottom: 12 },
  row: { flexDirection: 'row', gap: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    fontSize: 16,
  },
  button: { marginRight: 12, minWidth: 140 },
  status: { fontSize: 14, marginTop: 12 },
  error: { color: 'crimson', marginTop: 12 },
  hint: { fontSize: 12, color: '#888', marginTop: 4 },
  list: { marginTop: 16, flex: 1 },
  card: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  code: { fontWeight: '700', fontSize: 16 },
  deviceId: { fontSize: 11, color: '#999', marginBottom: 4 },
});
