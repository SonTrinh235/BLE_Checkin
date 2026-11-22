import { CheckInMethod } from '../types/models';
import { Tone } from '../theme';

export const methodLabel: Record<CheckInMethod, string> = {
  ble: 'Bluetooth',
  qr: 'QR',
  manual: 'Thủ công',
};

export const methodTone: Record<CheckInMethod, Tone> = {
  ble: 'info',
  qr: 'neutral',
  manual: 'warning',
};

export function formatTime(ms: number): string {
  return new Date(ms).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

export function formatDateTime(ms: number): string {
  return new Date(ms).toLocaleString('vi-VN');
}

export function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}
