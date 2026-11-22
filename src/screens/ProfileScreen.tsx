import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../auth/AuthContext';
import { MainTabParamList, RootStackParamList } from '../navigation/types';
import { Avatar, Button, Card, Screen, SectionTitle, StatusCard, TextField } from '../components/ui';
import { colors, spacing, typography } from '../theme';
import DevSimulateCheckIn from '../components/DevSimulateCheckIn';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Profile'>,
  NativeStackScreenProps<RootStackParamList>
>;

export default function ProfileScreen({ navigation }: Props) {
  const { user, signOut, studentId, updateStudentId } = useAuth();
  const name = user?.displayName ?? 'Người dùng';
  const [idDraft, setIdDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<'ok' | 'error' | null>(null);

  useEffect(() => setIdDraft(studentId ?? ''), [studentId]);

  const onSaveId = async () => {
    setSaving(true);
    setSaved(null);
    try {
      await updateStudentId(idDraft);
      setSaved('ok');
    } catch {
      setSaved('error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen edges={['top']} scroll contentStyle={styles.content}>
      <Card style={styles.profile}>
        <Avatar name={name} size={72} />
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        {studentId ? <Text style={styles.email}>{studentId}</Text> : null}
      </Card>

      <SectionTitle>Thông tin điểm danh</SectionTitle>
      <Card style={{ gap: spacing.md }}>
        <TextField
          label="Mã sinh viên"
          placeholder="SV221045"
          hint="Hiện cạnh tên bạn trong danh sách điểm danh của CLB."
          autoCapitalize="characters"
          autoCorrect={false}
          value={idDraft}
          onChangeText={(v) => {
            setIdDraft(v);
            setSaved(null);
          }}
        />
        {saved === 'ok' ? <StatusCard tone="success" icon="check" title="Đã lưu mã sinh viên" /> : null}
        {saved === 'error' ? (
          <StatusCard tone="error" icon="alert" title="Chưa lưu được" subtitle="Kiểm tra kết nối và thử lại." />
        ) : null}
        <Button
          title="Lưu"
          variant="secondary"
          onPress={onSaveId}
          loading={saving}
          disabled={idDraft.trim() === (studentId ?? '')}
        />
      </Card>

      <SectionTitle>Công cụ</SectionTitle>
      <Card>
        <Text style={styles.toolTitle}>BLE lab test</Text>
        <Text style={styles.toolBody}>
          Đo cường độ tín hiệu (RSSI) giữa hai máy để kiểm tra vùng phủ sóng tại địa điểm.
        </Text>
        <View style={{ marginTop: spacing.sm }}>
          <Button
            title="Mở BLE lab test"
            icon="flask"
            variant="secondary"
            onPress={() => navigation.navigate('BleLabTest')}
          />
        </View>
      </Card>

      {__DEV__ ? <DevSimulateCheckIn /> : null}

      <Button title="Đăng xuất" icon="logout" variant="danger" onPress={() => signOut()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg },
  profile: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  name: { ...typography.title, color: colors.text },
  email: { ...typography.small, color: colors.muted },
  toolTitle: { ...typography.section, color: colors.text },
  toolBody: { ...typography.small, color: colors.muted },
});
