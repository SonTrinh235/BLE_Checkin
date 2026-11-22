import {
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from '@firebase/firestore';
import { db } from '../firebase/config';
import { Club, ClubMember, MyClub } from '../types/models';
import { timestampToMillis } from './firestoreUtil';

const JOIN_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I to avoid confusion

function randomJoinCode(length = 6): string {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += JOIN_CODE_CHARS[Math.floor(Math.random() * JOIN_CODE_CHARS.length)];
  }
  return code;
}

export async function createClub(
  uid: string,
  displayName: string,
  clubName: string,
  studentId: string | null = null
): Promise<string> {
  const clubRef = doc(collection(db, 'clubs'));
  const joinCode = randomJoinCode();

  await setDoc(clubRef, {
    name: clubName,
    joinCode,
    ownerId: uid,
    ownerName: displayName,
    createdAt: serverTimestamp(),
  });
  await setDoc(doc(db, 'clubs', clubRef.id, 'members', uid), {
    displayName,
    studentId,
    role: 'owner',
    joinedAt: serverTimestamp(),
  });
  await setDoc(doc(db, 'users', uid, 'clubs', clubRef.id), {
    clubId: clubRef.id,
    name: clubName,
    role: 'owner',
    joinedAt: serverTimestamp(),
  });

  return clubRef.id;
}

export async function joinClubByCode(
  uid: string,
  displayName: string,
  code: string,
  studentId: string | null = null
): Promise<{ clubId: string; name: string }> {
  const q = query(collection(db, 'clubs'), where('joinCode', '==', code.toUpperCase()), limit(1));
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    throw new Error('Không tìm thấy CLB với mã này.');
  }

  const clubDoc = snapshot.docs[0];
  const clubData = clubDoc.data();

  await setDoc(doc(db, 'clubs', clubDoc.id, 'members', uid), {
    displayName,
    studentId,
    role: 'member',
    joinedAt: serverTimestamp(),
  });
  await setDoc(doc(db, 'users', uid, 'clubs', clubDoc.id), {
    clubId: clubDoc.id,
    name: clubData.name,
    role: 'member',
    joinedAt: serverTimestamp(),
  });

  return { clubId: clubDoc.id, name: clubData.name as string };
}

export function subscribeMyClubs(uid: string, callback: (clubs: MyClub[]) => void): () => void {
  return onSnapshot(collection(db, 'users', uid, 'clubs'), (snapshot) => {
    callback(
      snapshot.docs.map((d) => {
        const data = d.data();
        return {
          clubId: data.clubId,
          name: data.name,
          role: data.role,
          joinedAt: timestampToMillis(data.joinedAt),
        } as MyClub;
      })
    );
  });
}

export function subscribeClub(clubId: string, callback: (club: Club | null) => void): () => void {
  return onSnapshot(doc(db, 'clubs', clubId), (snap) => {
    if (!snap.exists()) {
      callback(null);
      return;
    }
    const data = snap.data();
    callback({
      id: snap.id,
      name: data.name,
      joinCode: data.joinCode,
      ownerId: data.ownerId,
      ownerName: data.ownerName,
      createdAt: timestampToMillis(data.createdAt),
    });
  });
}

export function subscribeMembers(
  clubId: string,
  callback: (members: ClubMember[]) => void
): () => void {
  return onSnapshot(collection(db, 'clubs', clubId, 'members'), (snapshot) => {
    callback(
      snapshot.docs
        .map((d) => {
          const data = d.data();
          return {
            uid: d.id,
            displayName: data.displayName,
            studentId: (data.studentId as string | undefined) || null,
            role: data.role,
          } as ClubMember;
        })
        .sort((a, b) => a.displayName.localeCompare(b.displayName, 'vi'))
    );
  });
}

// Removes a member from a club (owner kicking someone, or a member leaving).
// Deletes both the club-side member doc and the user-side "my clubs" entry.
export async function removeMember(clubId: string, uid: string): Promise<void> {
  const batch = writeBatch(db);
  batch.delete(doc(db, 'clubs', clubId, 'members', uid));
  batch.delete(doc(db, 'users', uid, 'clubs', clubId));
  await batch.commit();
}

// The student ID is copied into each club's member doc on join, so editing
// it in Profile has to fan out to every club the user belongs to.
export async function syncStudentIdToClubs(uid: string, studentId: string | null): Promise<void> {
  const mine = await getDocs(collection(db, 'users', uid, 'clubs'));
  await Promise.all(
    mine.docs.map((d) =>
      updateDoc(doc(db, 'clubs', d.id, 'members', uid), { studentId }).catch(() => undefined)
    )
  );
}
