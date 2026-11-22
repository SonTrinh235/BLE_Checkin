import { enqueueCheckIn } from './offlineQueue';
import { CheckInMethod } from '../types/models';

export async function checkIn(params: {
  clubId: string;
  clubName: string;
  sessionId: string;
  sessionTitle: string;
  uid: string;
  displayName: string;
  studentId?: string | null;
  method: CheckInMethod;
}): Promise<void> {
  await enqueueCheckIn({
    id: `${params.clubId}_${params.sessionId}_${params.uid}`,
    clubId: params.clubId,
    clubName: params.clubName,
    sessionId: params.sessionId,
    sessionTitle: params.sessionTitle,
    uid: params.uid,
    displayName: params.displayName,
    studentId: params.studentId ?? null,
    method: params.method,
    checkedInAt: Date.now(),
  });
}
