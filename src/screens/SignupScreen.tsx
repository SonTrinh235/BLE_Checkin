import { useRef, useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../auth/AuthContext';
import { RootStackParamList } from '../navigation/types';
import { Button, Header, PageTitle, Screen, StatusCard, TextField } from '../components/ui';
import { spacing } from '../theme';
import { authErrorMessage } from './authErrors';

type Props = NativeStackScreenProps<RootStackParamList, 'Signup'>;

export default function SignupScreen({ navigation }: Props) {
  const { signUp } = useAuth();
  const studentIdRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const [displayName, setDisplayName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    if (!displayName.trim()) {
      setError('Vui lòng nhập họ tên.');
      return;
    }
    if (!email.trim() || password.length < 6) {
      setError('Nhập email hợp lệ và mật khẩu tối thiểu 6 ký tự.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await signUp(email.trim(), password, displayName.trim(), studentId.trim());
    } catch (err) {
      setError(authErrorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <Screen
      scroll
      keyboard
      header={<Header title="Tạo tài khoản" onBack={() => navigation.goBack()} />}
      contentStyle={styles.content}
      footer={
        <Button
          title="Đã có tài khoản? Đăng nhập"
          variant="ghost"
          onPress={() => navigation.navigate('Login')}
        />
      }
    >
      <PageTitle title="Chào mừng bạn" subtitle="Chỉ mất một phút để bắt đầu điểm danh." />

      {error ? <StatusCard tone="error" icon="alert" title="Chưa tạo được tài khoản" subtitle={error} /> : null}

      <TextField
        label="Họ tên"
        placeholder="Nguyễn Minh Anh"
        returnKeyType="next"
        onSubmitEditing={() => studentIdRef.current?.focus()}
        value={displayName}
        onChangeText={setDisplayName}
      />
      <TextField
        ref={studentIdRef}
        label="Mã sinh viên (không bắt buộc)"
        placeholder="SV221045"
        autoCapitalize="characters"
        autoCorrect={false}
        returnKeyType="next"
        onSubmitEditing={() => emailRef.current?.focus()}
        value={studentId}
        onChangeText={setStudentId}
      />
      <TextField
        ref={emailRef}
        label="Email"
        placeholder="ten@truong.edu.vn"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
        value={email}
        onChangeText={setEmail}
      />
      <TextField
        ref={passwordRef}
        label="Mật khẩu"
        placeholder="Tối thiểu 6 ký tự"
        secureTextEntry
        returnKeyType="go"
        value={password}
        onChangeText={setPassword}
        onSubmitEditing={onSubmit}
      />
      <Button title="Tạo tài khoản" onPress={onSubmit} loading={submitting} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg },
});
