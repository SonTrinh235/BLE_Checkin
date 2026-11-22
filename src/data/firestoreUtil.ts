import { Timestamp } from '@firebase/firestore';
import { serverNow } from './serverClock';

// serverTimestamp() resolves to null in the local cache until the server
// round-trip completes, so reads immediately after a write (or while
// offline) need a fallback instead of crashing on `.toMillis()`.
export function timestampToMillis(value: unknown): number {
  if (value instanceof Timestamp) return value.toMillis();
  return serverNow();
}
