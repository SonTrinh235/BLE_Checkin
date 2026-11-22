import { useEffect, useRef } from 'react';
import { stopAdvertisingForClub } from '../ble/advertiser';
import { closeSession, isSessionExpired } from '../data/sessions';
import { CheckInSession } from '../types/models';

// Owner-side cleanup that must not depend on one particular screen being open:
//  - an expired session gets closed in Firestore (there is no server job);
//  - Bluetooth advertising stops once the club has no open session.
// `loaded` guards against treating the initial "no data yet" null as "closed".
export function useSessionHousekeeping(
  clubId: string,
  session: CheckInSession | null,
  loaded: boolean,
  isOwner: boolean,
  now: number
): void {
  const closedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isOwner || !loaded) return;
    if (!session) {
      stopAdvertisingForClub(clubId);
      return;
    }
    if (isSessionExpired(session, now) && closedRef.current !== session.id) {
      closedRef.current = session.id;
      stopAdvertisingForClub(clubId);
      closeSession(clubId, session.id).catch(() => {
        closedRef.current = null; // retry on the next tick
      });
    }
  }, [clubId, session, loaded, isOwner, now]);
}
