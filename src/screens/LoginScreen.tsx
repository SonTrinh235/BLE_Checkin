import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../auth/AuthContext';
import { RootStackParamList } from '../navigation/types';
import { Button, PageTitle, Screen, StatusCard, TextField } from '../components/ui';
import Icon from '../components/Icon';
import { colors, spacing } from '../theme';
import { authErrorMessage } from './authErrors';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    if (!email.trim() || !password) {
      setError('Vui lòng nhập email và mật khẩu.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      setError(authErrorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <Screen
      scroll
      keyboard
      contentStyle={styles.content}
      footer={
        <Button
          title="Chưa có tài khoản? Đăng ký"
          variant="ghost"
          onPress={() => navigation.navigate('Signup')}
        />
      }
    >
      <View style={styles.logo}>
        <Icon name="bluetooth" size={30} color="#FFFFFF" />
      </View>
      <PageTitle title="Chào bạn trở lại." subtitle="Một lần chạm. Một lần có mặt." />

      {error ? <StatusCard tone="error" icon="alert" title="Không đăng nhập được" subtitle={error} /> : null}

      <TextField
        label="Email"
        placeholder="ten@truong.edu.vn"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        textContentType="emailAddress"
        value={email}
        onChangeText={setEmail}
      />
      <TextField
        label="Mật khẩu"
        placeholder="Nhập mật khẩu"
        secureTextEntry
        textContentType="password"
        value={password}
        onChangeText={setPassword}
        onSubmitEditing={onSubmit}
      />
      <Button title="Đăng nhập" onPress={onSubmit} loading={submitting} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { justifyContent: 'center', flexGrow: 1, gap: spacing.lg, paddingTop: spacing.xxl },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
