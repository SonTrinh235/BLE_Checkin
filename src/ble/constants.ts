// Shared BLE identity for the "Điểm danh gần" app.
//
// Why the session code lives INSIDE the service UUID (not in service data):
//  - iOS cannot advertise service data or a local name from an app — only
//    service UUIDs — so a code carried as data would never leave an iPhone.
//  - On Android a 128-bit UUID plus service data overflows the 31-byte
//    legacy advertising packet, and the library swallows that failure
//    silently (nothing is broadcast but no error is raised).
// A 16-bit UUID (expressed in its 128-bit Bluetooth-Base form, which both
// CoreBluetooth and Android normalise) is 2 bytes on the air, works from
// both platforms, and lets a scanner filter for exactly one session.

// 16-bit UUIDs 0xA000-0xAFFF: not assigned to any Bluetooth SIG member, so
// unrelated devices nearby are very unlikely to advertise them.
const SESSION_UUID_PREFIX = 'a';
const BLUETOOTH_BASE_SUFFIX = '-0000-1000-8000-00805f9b34fb';

// 3 random hex chars behind the 'a' prefix = 4096 possible session codes —
// plenty to tell apart the few sessions open in one building at a time.
export function randomSessionCode(): string {
  const n = Math.floor(Math.random() * 0x1000);
  return SESSION_UUID_PREFIX + n.toString(16).padStart(3, '0');
}

/** Service UUID that a given session code is broadcast/scanned under. */
export function sessionServiceUuid(code: string): string {
  const hex = code.toLowerCase().replace(/[^0-9a-f]/g, '').slice(-4).padStart(4, '0');
  return `0000${hex}${BLUETOOTH_BASE_SUFFIX}`;
}
