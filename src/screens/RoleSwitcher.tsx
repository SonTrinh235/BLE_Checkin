import { Button, StyleSheet, Text, View } from 'react-native';

export type Role = 'host' | 'student';

export default function RoleSwitcher({ onSelect }: { onSelect: (role: Role) => void }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Điểm danh gần</Text>
      <Text style={styles.subtitle}>BLE proximity check-in — prototype</Text>

      <View style={styles.button}>
        <Button title="I'm the host (advertise)" onPress={() => onSelect('host')} />
      </View>
      <View style={styles.button}>
        <Button title="I'm a student (scan)" onPress={() => onSelect('student')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: '700' },
  subtitle: { fontSize: 13, color: '#888', marginBottom: 32 },
  button: { marginVertical: 8, minWidth: 240 },
});
