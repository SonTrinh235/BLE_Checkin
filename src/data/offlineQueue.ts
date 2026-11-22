import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { doc, serverTimestamp, setDoc } from '@firebase/firestore';
import { db } from '../firebase/config';
import { CheckInMethod } from '../types/models';

const STORAGE_KEY = 'pendingCheckins.v1';

export type PendingCheckIn = {
  id: string; // `${clubId}_${sessionId}_${uid}`
  clubId: string;
  clubName: string;
  sessionId: string;
  sessionTitle: string;
  uid: string;
  displayName: string;
  studentId?: string | null;
  method: CheckInMethod;
  checkedInAt: number;
};

async function readQueue(): Promise<PendingCheckIn[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as PendingCheckIn[]) : [];
}

async function writeQueue(queue: PendingCheckIn[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

// Queues locally first (so a check-in is never lost to a flaky connection),
// then immediately tries to sync. If a sync attempt fails, the entry stays
// queued until the next flush — triggered either by regaining connectivity
// (see startOfflineQueueSync) or the next check-in attempt.
export async function enqueueCheckIn(entry: PendingCheckIn): Promise<void> {
  const queue = await readQueue();
  if (queue.some((item) => item.id === entry.id)) return;
  await writeQueue([...queue, entry]);
  void flushPendingCheckIns();
}

export async function flushPendingCheckIns(): Promise<void> {
  const queue = await readQueue();
  if (queue.length === 0) return;

  const stillPending: PendingCheckIn[] = [];
  for (const entry of queue) {
    try {
      await setDoc(
        doc(db, 'clubs', entry.clubId, 'sessions', entry.sessionId, 'checkins', entry.uid),
        {
          displayName: entry.displayName,
          studentId: entry.studentId ?? null,
          method: entry.method,
          checkedInAt: serverTimestamp(),
        }
      );
      await setDoc(doc(db, 'users', entry.uid, 'checkinHistory', `${entry.clubId}_${entry.sessionId}`), {
        clubId: entry.clubId,
        clubName: entry.clubName,
        sessionId: entry.sessionId,
        sessionTitle: entry.sessionTitle,
        method: entry.method,
        checkedInAt: serverTimestamp(),
      });
    } catch {
      stillPending.push(entry);
    }
  }
  await writeQueue(stillPending);
}

export function startOfflineQueueSync(): () => void {
  return NetInfo.addEventListener((state) => {
    if (state.isConnected) {
      void flushPendingCheckIns();
    }
  });
}

export async function getPendingCheckInCount(): Promise<number> {
  const queue = await readQueue();
  return queue.length;
}
