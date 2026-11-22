import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from '@firebase/firestore';
import { db } from '../firebase/config';
import { randomSessionCode } from '../ble/constants';
import { CheckInRecord, CheckInSession } from '../types/models';
import { timestampToMillis } from './firestoreUtil';

function toSession(id: string, clubId: string, data: Record<string, unknown>): CheckInSession {
  return {
    id,
    clubId,
    title: data.title as string,
    status: data.status as CheckInSession['status'],
    bleCode: data.bleCode as string,
    openedBy: data.openedBy as string,
    openedAt: timestampToMillis(data.openedAt),
    closedAt: data.closedAt ? timestampToMillis(data.closedAt) : null,
    room: (data.room as string | undefined) || null,
    durationMin: typeof data.durationMin === 'number' ? data.durationMin : null,
  };
}

/** Epoch ms at which the session ends, or null when it has no fixed duration. */
export function sessionEndsAt(session: CheckInSession): number | null {
  return session.durationMin ? session.openedAt + session.durationMin * 60_000 : null;
}

export function isSessionExpired(session: CheckInSession, now = Date.now()): boolean {
  const end = sessionEndsAt(session);
  return end !== null && now >= end;
}

export async function openSession(
  clubId: string,
  uid: string,
  details: { title?: string; room?: string; durationMin?: number | null } = {}
): Promise<{ id: string; bleCode: string }> {
  const sessionRef = doc(collection(db, 'clubs', clubId, 'sessions'));
  const bleCode = randomSessionCode();

  await setDoc(sessionRef, {
    title: details.title?.trim() || `Phiên ${new Date().toLocaleString('vi-VN')}`,
    room: details.room?.trim() || null,
    durationMin: details.durationMin && details.durationMin > 0 ? details.durationMin : null,
    status: 'open',
    bleCode,
    openedBy: uid,
    openedAt: serverTimestamp(),
    closedAt: null,
  });

  return { id: sessionRef.id, bleCode };
}

export async function closeSession(clubId: string, sessionId: string): Promise<void> {
  await updateDoc(doc(db, 'clubs', clubId, 'sessions', sessionId), {
    status: 'closed',
    closedAt: serverTimestamp(),
  });
}

export function subscribeActiveSession(
  clubId: string,
  callback: (session: CheckInSession | null) => void
): () => void {
  const q = query(collection(db, 'clubs', clubId, 'sessions'), where('status', '==', 'open'));
  return onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      callback(null);
      return;
    }
    const first = snapshot.docs[0];
    callback(toSession(first.id, clubId, first.data()));
  });
}

export function subscribeSessions(
  clubId: string,
  callback: (sessions: CheckInSession[]) => void
): () => void {
  const q = query(collection(db, 'clubs', clubId, 'sessions'), orderBy('openedAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((d) => toSession(d.id, clubId, d.data())));
  });
}

export function subscribeCheckins(
  clubId: string,
  sessionId: string,
  callback: (records: CheckInRecord[]) => void
): () => void {
  return onSnapshot(collection(db, 'clubs', clubId, 'sessions', sessionId, 'checkins'), (snapshot) => {
    callback(
      snapshot.docs.map((d) => {
        const data = d.data();
        return {
          uid: d.id,
          displayName: data.displayName,
          method: data.method,
          checkedInAt: timestampToMillis(data.checkedInAt),
          studentId: (data.studentId as string | undefined) || null,
        } as CheckInRecord;
      })
    );
  });
}

// Owner marks a member present by hand (e.g. their phone died). Written as
// the member's own check-in doc id so a later BLE/QR check-in by the same
// person just overwrites it instead of double-counting. Also writes the
// member's own history entry so it shows up in their History tab.
export async function manualCheckIn(
  clubId: string,
  clubName: string,
  session: { id: string; title: string },
  member: { uid: string; displayName: string; studentId: string | null }
): Promise<void> {
  const batch = writeBatch(db);
  batch.set(doc(db, 'clubs', clubId, 'sessions', session.id, 'checkins', member.uid), {
    displayName: member.displayName,
    studentId: member.studentId,
    method: 'manual',
    checkedInAt: serverTimestamp(),
  });
  batch.set(doc(db, 'users', member.uid, 'checkinHistory', `${clubId}_${session.id}`), {
    clubId,
    clubName,
    sessionId: session.id,
    sessionTitle: session.title,
    method: 'manual',
    checkedInAt: serverTimestamp(),
  });
  await batch.commit();
}
