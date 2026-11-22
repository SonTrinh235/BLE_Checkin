export type MemberRole = 'owner' | 'member';

export interface Club {
  id: string;
  name: string;
  joinCode: string;
  ownerId: string;
  ownerName: string;
  createdAt: number;
}

export interface MyClub {
  clubId: string;
  name: string;
  role: MemberRole;
  joinedAt: number;
}

export type SessionStatus = 'open' | 'closed';

export interface CheckInSession {
  id: string;
  clubId: string;
  title: string;
  status: SessionStatus;
  bleCode: string;
  openedBy: string;
  openedAt: number;
  closedAt: number | null;
  room: string | null;
  /** Planned length in minutes; null = no fixed end. */
  durationMin: number | null;
}

export type CheckInMethod = 'ble' | 'qr' | 'manual';

export interface CheckInRecord {
  uid: string;
  displayName: string;
  method: CheckInMethod;
  checkedInAt: number;
  studentId: string | null;
}

export interface ClubMember {
  uid: string;
  displayName: string;
  studentId: string | null;
  role: MemberRole;
}

export interface MyCheckInHistoryEntry {
  id: string; // `${clubId}_${sessionId}`
  clubId: string;
  clubName: string;
  sessionId: string;
  sessionTitle: string;
  method: CheckInMethod;
  checkedInAt: number;
}
