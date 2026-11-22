// Maps Firebase Auth error codes to short Vietnamese messages for the UI.
export function authErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code ?? '';
  switch (code) {
    case 'auth/invalid-email':
      return 'Email không hợp lệ.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email hoặc mật khẩu chưa đúng.';
    case 'auth/email-already-in-use':
      return 'Email này đã được đăng ký.';
    case 'auth/weak-password':
      return 'Mật khẩu cần tối thiểu 6 ký tự.';
    case 'auth/too-many-requests':
      return 'Thử quá nhiều lần. Vui lòng đợi một lát rồi thử lại.';
    case 'auth/network-request-failed':
      return 'Mất kết nối mạng. Kiểm tra mạng và thử lại.';
    default:
      return 'Đã có lỗi xảy ra. Vui lòng thử lại.';
  }
}
