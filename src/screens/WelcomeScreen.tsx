import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Button, Card, Screen } from '../components/ui';
import Icon from '../components/Icon';
import { radius, spacing, typography, Palette } from '../theme';
import { useColors } from '../theme/useTheme';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

export default function WelcomeScreen({ navigation }: Props) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <Screen
      scroll
      contentStyle={styles.content}
      footer={
        <>
          <Button title="Bắt đầu" onPress={() => navigation.navigate('Signup')} />
          <Button
            title="Tôi đã có tài khoản"
            variant="secondary"
            onPress={() => navigation.navigate('Login')}
          />
        </>
      }
    >
      <View style={styles.logo}>
        <Icon name="bluetooth" size={34} color="#FFFFFF" />
      </View>
      <View style={styles.titleBlock}>
        <Text style={styles.eyebrow}>BLE CHECK-IN</Text>
        <Text style={styles.title}>Một lần chạm.{'\n'}Một lần có mặt.</Text>
        <Text style={styles.subtitle}>
          Xác nhận hiện diện bằng Bluetooth, QR khi cần. Danh sách rõ ràng cho mỗi buổi sinh hoạt.
        </Text>
      </View>

      <Card style={styles.flow}>
        <Text style={styles.flowTitle}>Dành cho sinh viên</Text>
        <Text style={styles.flowBody}>Mở phiên → Cho phép Bluetooth → Điểm danh → Nhận xác nhận.</Text>
      </Card>
      <Card style={styles.flow}>
        <Text style={styles.flowTitle}>Dành cho ban tổ chức</Text>
        <Text style={styles.flowBody}>Tạo phiên → Theo dõi trực tiếp → Ghi nhận thủ công → Đóng và lưu.</Text>
      </Card>
    </Screen>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
  content: { gap: spacing.lg, paddingTop: spacing.xxl },
  logo: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: { gap: spacing.sm },
  eyebrow: { ...typography.caption, color: colors.accent, fontWeight: '700', letterSpacing: 1 },
  title: { fontSize: 36, lineHeight: 42, fontWeight: '800', color: colors.link },
  subtitle: { ...typography.body, color: colors.muted },
  flow: { backgroundColor: colors.accentLight, borderColor: colors.accentBorder },
  flowTitle: { ...typography.section, color: colors.link },
  flowBody: { ...typography.small, color: colors.muted },
});
