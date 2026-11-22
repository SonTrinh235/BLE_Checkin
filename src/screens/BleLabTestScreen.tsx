import { useState } from 'react';
import { Button, StyleSheet, View } from 'react-native';
import HostScreen from './HostScreen';
import ScanScreen from './ScanScreen';
import RoleSwitcher, { Role } from './RoleSwitcher';

// Standalone raw BLE test bench (§9 of the project brief): advertise vs.
// scan with live RSSI readings, independent of any real club/session data.
// Kept around after the real check-in flow was built because it's still
// the tool for walking the venue and validating signal stability.
export default function BleLabTestScreen() {
  const [role, setRole] = useState<Role | null>(null);

  if (role === null) return <RoleSwitcher onSelect={setRole} />;

  return (
    <View style={styles.container}>
      {role === 'host' ? <HostScreen /> : <ScanScreen />}
      <View style={styles.backBar}>
        <Button title="← Đổi vai trò" onPress={() => setRole(null)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backBar: { padding: 16, borderTopWidth: 1, borderTopColor: '#eee' },
});
