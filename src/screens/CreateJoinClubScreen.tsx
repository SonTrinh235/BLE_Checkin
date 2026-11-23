import { useState } from 'react';
import { StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../auth/AuthContext';
import { createClub, joinClubByCode } from '../data/clubs';
import { useToast } from '../components/Toast';
import { RootStackParamList } from '../navigation/types';
import { Button, Card, Header, Screen, SectionTitle, StatusCard, TextField } from '../components/ui';
import { spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateJoinClub'>;

export default function CreateJoinClubScreen({ navigation }: Props) {
  const { user, studentId } = useAuth();
  const toast = useToast();
  const [clubName, setClubName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [busy, setBusy] = useState<'create' | 'join' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const displayName = user?.displayName ?? user?.email ?? 'Không rõ';

  const onCreate = async () => {
    if (!user || !clubName.trim()) return;
    setError(null);
    setBusy('create');
    try {
      const clubId = await createClub(user.uid, displayName, clubName.trim(), studentId);
      toast.show('Đã tạo CLB');
      navigation.replace('ClubDetail', { clubId, clubName: clubName.trim(), role: 'owner' });
    } catch (err) {
      setError(`Không tạo được CLB. ${String((err as Error)?.message ?? err)}`);
      setBusy(null);
    }
  };

  const onJoin = async () => {
    if (!user || !joinCode.trim()) return;
    setError(null);
    setBusy('join');
    try {
      const club = await joinClubByCode(user.uid, displayName, joinCode.trim(), studentId);
      toast.show(`Đã tham gia ${club.name}`);
      navigation.replace('ClubDetail', { clubId: club.clubId, clubName: club.name, role: 'member' });
    } catch (err) {
      setError(`Không tham gia được CLB. ${String((err as Error)?.message ?? err)}`);
      setBusy(null);
    }
  };

  return (
    <Screen
      scroll
      keyboard
      header={<Header title="Tạo / Tham gia CLB" onBack={() => navigation.goBack()} />}
      contentStyle={styles.content}
    >
      {error ? <StatusCard tone="error" icon="alert" title="Có lỗi xảy ra" subtitle={error} /> : null}

      <Card style={styles.card}>
        <SectionTitle>Tạo CLB mới</SectionTitle>
        <TextField
          label="Tên CLB"
          placeholder="VD: CLB Công nghệ"
          value={clubName}
          onChangeText={setClubName}
        />
        <Button
          title="Tạo CLB"
          onPress={onCreate}
          loading={busy === 'create'}
          disabled={busy !== null || !clubName.trim()}
        />
      </Card>

      <Card style={styles.card}>
        <SectionTitle>Tham gia CLB có sẵn</SectionTitle>
        <TextField
          label="Mã tham gia"
          placeholder="VD: AB12CD"
          hint="Hỏi chủ nhiệm CLB để lấy mã."
          autoCapitalize="characters"
          autoCorrect={false}
          value={joinCode}
          onChangeText={setJoinCode}
        />
        <Button
          title="Tham gia"
          variant="secondary"
          onPress={onJoin}
          loading={busy === 'join'}
          disabled={busy !== null || !joinCode.trim()}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg },
  card: { gap: spacing.md },
});
