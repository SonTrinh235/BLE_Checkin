import { doc, getDoc, serverTimestamp, setDoc, Timestamp } from '@firebase/firestore';
import { db } from '../firebase/config';

// Session expiry compares "now" with a server-written openedAt, so phones
// whose clocks disagree would expire a session at different moments. We
// measure our own offset against Firestore's clock once after sign-in and
// add it to Date.now() wherever expiry matters.
let offsetMs = 0;

export function serverNow(): number {
  return Date.now() + offsetMs;
}

export async function syncServerClock(uid: string): Promise<void> {
  try {
    const ref = doc(db, 'users', uid);
    const t0 = Date.now();
    await setDoc(ref, { clockProbe: serverTimestamp() }, { merge: true });
    const snap = await getDoc(ref);
    const t1 = Date.now();
    const written = snap.data()?.clockProbe;
    // Offline: the timestamp is still pending (null) — keep the old offset.
    if (written instanceof Timestamp) {
      offsetMs = written.toMillis() - (t0 + t1) / 2;
    }
  } catch {
    // Best effort: with no offset we fall back to the device clock.
  }
}
