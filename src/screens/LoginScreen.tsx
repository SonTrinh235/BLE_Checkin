import { useRef, useState, useMemo } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../auth/AuthContext';
import { RootStackParamList } from '../navigation/types';
import { Button, PageTitle, Screen, StatusCard, TextField } from '../components/ui';
import Icon from '../components/Icon';
import { spacing, Palette } from '../theme';
import { useColors } from '../theme/useTheme';
import { authErrorMessage } from './authErrors';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { signIn, resetPassword } = useAuth();
  const passwordRef = useRef<TextInput>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
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
    setInfo(null);
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      setError(authErrorMessage(err));
      setSubmitting(false);
    }
  };

  const onForgot = async () => {
    setInfo(null);
    if (!email.trim()) {
      setError('Nhập email của bạn ở trên rồi bấm "Quên mật khẩu?".');
      return;
    }
    setError(null);
    setResetting(true);
    try {
      await resetPassword(email.trim());
      setInfo(`Nếu ${email.trim()} đã đăng ký, bạn sẽ nhận email đặt lại mật khẩu trong ít phút.`);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setResetting(false);
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
      {info ? <StatusCard tone="success" icon="check" title="Đã gửi email" subtitle={info} /> : null}

      <TextField
        label="Email"
        placeholder="ten@truong.edu.vn"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        textContentType="emailAddress"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
        value={email}
        onChangeText={setEmail}
      />
      <TextField
        ref={passwordRef}
        label="Mật khẩu"
        placeholder="Nhập mật khẩu"
        secureTextEntry
        returnKeyType="go"
        textContentType="password"
        value={password}
        onChangeText={setPassword}
        onSubmitEditing={onSubmit}
      />
      <Button title="Đăng nhập" onPress={onSubmit} loading={submitting} />
      <Button title="Quên mật khẩu?" variant="ghost" onPress={onForgot} loading={resetting} />
    </Screen>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
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
