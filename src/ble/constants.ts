// Shared BLE identity for the "Điểm danh gần" prototype.
// Both the host (advertiser) and student (scanner) devices must use the
// same service UUID to find each other. Generated once for this prototype;
// keep it for all test sessions so old builds keep talking to new ones.
export const CHECKIN_SERVICE_UUID = 'a1b2c3d4-0001-4a5b-8c9d-1234567890ab';

// A random 1-byte code per open session, encoded as 2 hex chars. The
// scanning device reads this back out of the advertisement so it can
// confirm it found *this* session's host and not some unrelated BLE
// device advertising the same service UUID.
export function randomSessionCode(): string {
  return Math.floor(Math.random() * 256)
    .toString(16)
    .padStart(2, '0');
}
