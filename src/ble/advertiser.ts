import * as BLE from 'react-native-ble-lite';
import { CHECKIN_SERVICE_UUID } from './constants';
import { requestBlePermissions } from './permissions';

// Advertising lives at module level (not inside a screen) so the owner can
// leave the "Mở phiên" screen and the phone keeps broadcasting until the
// session is closed, expires, or the owner signs out.
let current: { sessionId: string; clubId: string } | null = null;

export type AdvertiseResult = 'advertising' | 'denied' | 'error';

export function isAdvertising(sessionId: string): boolean {
  return current?.sessionId === sessionId;
}

export async function startAdvertisingFor(session: {
  id: string;
  clubId: string;
  bleCode: string;
}): Promise<AdvertiseResult> {
  if (current?.sessionId === session.id) return 'advertising';
  if (current) stopAdvertising();

  const granted = await requestBlePermissions();
  if (!granted) return 'denied';

  try {
    await BLE.startAdvertising({
      serviceUuid: CHECKIN_SERVICE_UUID,
      data: session.bleCode,
      powerLevel: BLE.AdvertisePower.HIGH,
      advertiseMode: BLE.AdvertiseMode.LOW_LATENCY,
      includeDeviceName: true,
    });
    current = { sessionId: session.id, clubId: session.clubId };
    return 'advertising';
  } catch {
    return 'error';
  }
}

export function stopAdvertising(): void {
  if (!current) return;
  current = null;
  BLE.stopAdvertising();
}

export function stopAdvertisingForClub(clubId: string): void {
  if (current?.clubId === clubId) stopAdvertising();
}
