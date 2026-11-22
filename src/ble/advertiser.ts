import * as BLE from 'react-native-ble-lite';
import { CHECKIN_SERVICE_UUID } from './constants';
import { requestBlePermissions } from './permissions';

// Advertising lives at module level (not inside a screen) so the owner can
// leave the "Mở phiên" screen and the phone keeps broadcasting until the
// session is closed, expires, or the owner signs out.
let current: { sessionId: string; clubId: string } | null = null;
let starting: { sessionId: string; promise: Promise<AdvertiseResult> } | null = null;

export type AdvertiseResult = 'advertising' | 'denied' | 'error';

export function isAdvertising(sessionId: string): boolean {
  return current?.sessionId === sessionId;
}

type AdvertiseTarget = { id: string; clubId: string; bleCode: string };

// Two screens can ask for the same session at once (e.g. while the owner
// screen re-mounts); share one in-flight start instead of advertising twice.
export function startAdvertisingFor(session: AdvertiseTarget): Promise<AdvertiseResult> {
  if (current?.sessionId === session.id) return Promise.resolve('advertising');
  if (starting?.sessionId === session.id) return starting.promise;
  const promise = doStart(session).finally(() => {
    if (starting?.promise === promise) starting = null;
  });
  starting = { sessionId: session.id, promise };
  return promise;
}

async function doStart(session: AdvertiseTarget): Promise<AdvertiseResult> {
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
