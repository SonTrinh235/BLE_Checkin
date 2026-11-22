import { collection, onSnapshot, orderBy, query } from '@firebase/firestore';
import { db } from '../firebase/config';
import { MyCheckInHistoryEntry } from '../types/models';
import { timestampToMillis } from './firestoreUtil';

export function subscribeMyHistory(
  uid: string,
  callback: (entries: MyCheckInHistoryEntry[]) => void
): () => void {
  const q = query(collection(db, 'users', uid, 'checkinHistory'), orderBy('checkedInAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    callback(
      snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          clubId: data.clubId,
          clubName: data.clubName,
          sessionId: data.sessionId,
          sessionTitle: data.sessionTitle,
          method: data.method,
          checkedInAt: timestampToMillis(data.checkedInAt),
        } as MyCheckInHistoryEntry;
      })
    );
  });
}
