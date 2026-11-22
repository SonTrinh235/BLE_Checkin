import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Button, FlatList, StyleSheet, Text, View } from 'react-native';
import * as BLE from 'react-native-ble-lite';
import { CHECKIN_SERVICE_UUID } from '../ble/constants';
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
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    const granted = await requestBlePermissions();
    if (!granted) {
      Alert.alert(
        'Permission required',
        'Bluetooth permissions are required to scan for a check-in session.'
      );
      return;
    }

    try {
      await BLE.startScanning({
        serviceUuid: CHECKIN_SERVICE_UUID,
        scanMode: BLE.ScanMode.LOW_LATENCY,
        allowDuplicates: true,
      });
      startedRef.current = true;
      setIsScanning(true);
    } catch (err) {
      setError(String(err));
    }
  }, []);

  useEffect(() => {
    const subscription = BLE.addAdvertisementListener((event) => {
      if (event.uuid !== CHECKIN_SERVICE_UUID) return;
      setDevices((prev) => {
        const existing = prev[event.deviceId];
        const rssiHistory = [...(existing?.rssiHistory ?? []), event.rssi].slice(
          -RSSI_HISTORY_LENGTH
        );
        return {
          ...prev,
          [event.deviceId]: {
            deviceId: event.deviceId,
            sessionCode: event.data,
            rssiHistory,
            lastSeenAt: Date.now(),
          },
        };
      });
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => stop, [stop]);

  const deviceList = Object.values(devices).sort((a, b) => b.lastSeenAt - a.lastSeenAt);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Student — scan for host</Text>

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
