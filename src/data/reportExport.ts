import { collection, doc, getDoc, getDocs, orderBy, query } from '@firebase/firestore';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { db } from '../firebase/config';
import { timestampToMillis } from './firestoreUtil';

const CSV_HEADER = 'session_title,room,opened_at,member_name,student_id,method,checked_in_at';

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// ASCII-only file name: "CLB Công nghệ" -> "CLB_Cong_nghe" (the old regex
// turned every Vietnamese letter into "_").
function slug(value: string): string {
  return (
    value
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'report'
  );
}

// One CSV row per check-in, or a single blank row when nobody checked in so
// the session still appears in the report.
async function sessionRows(
  clubId: string,
  sessionId: string,
  session: Record<string, unknown>
): Promise<string[]> {
  const sessionTitle = csvEscape(session.title as string);
  const room = csvEscape((session.room as string | undefined) ?? '');
  const openedAt = new Date(timestampToMillis(session.openedAt)).toLocaleString('vi-VN');

  const checkinsSnap = await getDocs(collection(db, 'clubs', clubId, 'sessions', sessionId, 'checkins'));
  if (checkinsSnap.empty) return [`${sessionTitle},${room},${openedAt},,,,`];

  return checkinsSnap.docs.map((checkinDoc) => {
    const checkin = checkinDoc.data();
    const checkedInAt = new Date(timestampToMillis(checkin.checkedInAt)).toLocaleString('vi-VN');
    return [
      sessionTitle,
      room,
      openedAt,
      csvEscape(checkin.displayName as string),
      csvEscape((checkin.studentId as string | undefined) ?? ''),
      checkin.method as string,
      checkedInAt,
    ].join(',');
  });
}

// The BOM makes Excel open the file as UTF-8, so Vietnamese names don't
// turn into mojibake.
async function writeAndShare(fileName: string, rows: string[], dialogTitle: string): Promise<void> {
  const file = new File(Paths.cache, fileName);
  if (file.exists) file.delete();
  file.write('﻿' + rows.join('\n'));

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { mimeType: 'text/csv', dialogTitle });
  }
}

export async function exportClubReport(clubId: string, clubName: string): Promise<void> {
  const sessionsSnap = await getDocs(
    query(collection(db, 'clubs', clubId, 'sessions'), orderBy('openedAt', 'desc'))
  );

  const rows: string[] = [CSV_HEADER];
  for (const sessionDoc of sessionsSnap.docs) {
    rows.push(...(await sessionRows(clubId, sessionDoc.id, sessionDoc.data())));
  }

  await writeAndShare(`${slug(clubName)}_report.csv`, rows, `Báo cáo ${clubName}`);
}

export async function exportSessionReport(
  clubId: string,
  clubName: string,
  sessionId: string
): Promise<void> {
  const sessionSnap = await getDoc(doc(db, 'clubs', clubId, 'sessions', sessionId));
  if (!sessionSnap.exists()) throw new Error('Không tìm thấy phiên.');

  const session = sessionSnap.data();
  const rows = [CSV_HEADER, ...(await sessionRows(clubId, sessionId, session))];
  const day = new Date(timestampToMillis(session.openedAt)).toISOString().slice(0, 10);

  await writeAndShare(
    `${slug(clubName)}_${slug(session.title as string)}_${day}.csv`,
    rows,
    `Báo cáo ${session.title as string}`
  );
}
