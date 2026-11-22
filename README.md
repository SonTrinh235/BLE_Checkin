# Điểm danh gần

BLE proximity check-in app for student clubs. This repo currently has a
rough (not yet device-tested) implementation of the full MVP scope from the
project brief: auth, clubs, BLE/QR check-in sessions, history, and CSV
report export — plus the original raw BLE two-device test bench used to
validate the core technical risk (§9 of the brief).

**Nothing here has been run on a device yet.** It type-checks and passes
`expo-doctor`, but it needs a Firebase project wired up and a fresh dev
client build (see below) before it can actually be tested.

## UI

The UI follows the Figma "BLE / Design system" board. Tokens live in
`src/theme/index.ts`, shared components in `src/components/ui.tsx`, icons in
`src/components/Icon.tsx`. Navigation is a native stack with a bottom-tab
home (Trang chủ / Lịch sử / Cá nhân) — see `src/navigation/RootNavigator.tsx`.

## Landing page

`landing/` is a static, responsive page (no build step). Open
`landing/index.html` locally, or deploy the folder to GitHub Pages /
Netlify / Vercel / Cloudflare Pages. Fill in the public Behance and Figma
prototype URLs in the `LINKS` object at the bottom of `landing/index.html`;
until then those buttons stay disabled.

## App structure

- **Auth** (`src/auth/AuthContext.tsx`, `src/screens/LoginScreen.tsx`,
  `SignupScreen.tsx`) — Firebase email/password auth.
- **Clubs** (`src/data/clubs.ts`, `ClubListScreen.tsx`,
  `CreateJoinClubScreen.tsx`, `ClubDetailScreen.tsx`) — create a club (gets
  a random join code) or join one by code. Membership is stored both under
  the club (`clubs/{id}/members`) and under the user
  (`users/{uid}/clubs`) so "my clubs" is a single cheap query.
- **Sessions** (`src/data/sessions.ts`, `OpenSessionScreen.tsx`,
  `CheckInScreen.tsx`) — the club owner opens a session, which starts BLE
  advertising (via `react-native-ble-lite`) and shows a QR code as a
  fallback. Members either let BLE auto-detect the host, or scan the QR
  code with the camera (`expo-camera`).
- **Offline queue** (`src/data/offlineQueue.ts`) — a check-in is written to
  local storage first, then synced to Firestore; a `NetInfo` listener
  retries the queue when connectivity returns. This is deliberately a
  custom queue rather than relying on Firestore's own offline cache,
  because the JS SDK's React Native persistence behavior isn't reliably
  documented — see the code comment there.
- **History & report** (`src/data/history.ts`, `HistoryScreen.tsx`,
  `src/data/reportExport.ts`) — per-user check-in history, and a CSV export
  per club (session × member × method × time) shared via `expo-sharing`.
- **BLE lab test** (`src/screens/BleLabTestScreen.tsx`, reachable from the
  club list screen) — the original standalone host/scan screens with live
  RSSI readings, kept as a separate tool for walking a real venue and
  judging signal stability, independent of any club/session data.

## Set up Firebase (required before anything will run)

1. Go to <https://console.firebase.google.com>, create a free project.
2. **Authentication** → Sign-in method → enable **Email/Password**.
3. **Firestore Database** → create a database (test mode is fine while
   developing — it auto-locks after 30 days; see `firestore.rules` below
   for something to paste in before then).
4. Project settings → your apps → add a **Web app** (yes, even though this
   is a mobile app — the Firebase JS SDK used here is the "web" client
   SDK, same as any Expo/React Native app that isn't using
   `@react-native-firebase`). Copy the resulting config object.
5. Paste those values into `src/firebase/config.ts`, replacing the
   `REPLACE_ME` placeholders.
6. In the Firebase console's Firestore **Rules** tab, paste the contents of
   `firestore.rules` (in this repo) and publish. It's intentionally
   simplified for a course prototype — see the comment in that file for
   what's cut.

## Build the dev client

New native modules were added since the original BLE-only prototype
(`expo-camera`, `@react-native-community/netinfo`,
`@react-native-async-storage/async-storage`, `react-native-svg`) — if
you already built an APK before this change, it's now missing those
modules and needs a fresh build.

```bash
npx eas login                # first time only
npx eas build --profile development --platform android
```

Physical Android device only — BLE doesn't work in an emulator. (iOS
needs a paid Apple Developer account to install on a real iPhone; see the
git history / prior discussion in this project for why — plan Android↔
Android testing first.)

## Run it

```bash
npx expo start --dev-client
```

Open the dev client app on each phone and scan the QR code.

## Test procedure (real app flow)

1. Sign up two accounts (one per phone).
2. Phone A: create a club → note the join code shown in **Chi tiết CLB**.
3. Phone B: join that club with the code.
4. Phone A (owner): open the club → **Mở phiên điểm danh mới** — this
   starts BLE advertising and shows a QR code.
5. Phone B (member): open the club → **Điểm danh ngay** → try
   **Điểm danh bằng Bluetooth** first; if that doesn't fire within
   a few seconds, fall back to **Quét mã QR**.
6. Confirm phone A's screen shows the check-in appear live, and phone B
   shows "Bạn đã có mặt".
7. Turn on airplane mode on phone B *before* checking in, confirm it still
   marks itself as checked in locally, then turn network back on and
   confirm the pending badge on the Lịch sử tab clears (this is the
   offline-queue path).
8. Phone A (owner): **Xuất báo cáo (CSV)** from the club detail screen,
   confirm the share sheet opens with a CSV containing the check-in.

## Test procedure (raw BLE lab test — RSSI validation)

This is the original §9 prototype, unchanged, reachable via **Mở BLE lab test**
on the **Cá nhân** (Profile) tab:

1. Phone A → "I'm the host (advertise)" → note the session code.
2. Phone B → "I'm a student (scan)" → Start scanning.
3. Confirm phone B shows the same code, then walk it away from phone A
   through doorways/walls, recording RSSI at each distance — the goal is a
   defensible RSSI threshold for "in the room" vs. "just outside."

## Known limitation (state this openly in any report)

BLE proximity confirms the **device** was physically present, not the
**person**. It doesn't stop someone from carrying a friend's phone into
the room. This is a disclosed, accepted limitation — not a bug to hide.

## Front-end status

Screens follow the Figma board: Welcome, Login, Signup (with optional
student ID), Home (clubs, live-session badge), Club detail, Open session
(title + room, live count, show/hide QR, search, manual check-in), Manual
check-in, Sessions list + detail, Check-in (BLE / QR with every error
state), Success receipt, History, Profile (student ID, BLE lab).

**After pulling these changes, re-publish `firestore.rules`** — the rules
were tightened (owner-only sessions, owner can remove members and write
manual check-in history).

Implemented beyond the original board:
- Sessions have a fixed duration (30 min / 1 h / 2 h / unlimited). The
  owner screen shows a countdown and auto-closes the session at zero;
  members get a "Phiên đã hết giờ" screen if they try to check in late.
- Manual check-in also writes the member's own history entry, so it shows
  up in their Lịch sử tab.
- Editing the student ID in Profile updates it in every club the user
  already joined.
- Owners can remove members; members can leave a club (Club detail).
- Firestore rules: only the club owner can open/close sessions.

Known gaps vs. the Figma board:
- Organizer-specific 4-tab bar is not implemented — roles are per club, so
  there are 3 global tabs and organizer tools live inside Club detail.

## What's rough / not done

- No push notifications yet (Firebase Cloud Messaging, per the brief) —
  not needed until the scheduling/reminder phase.
- No duplicate-club-name checks and no session editing — create/join/
  open/close/check-in/remove-member is the whole loop.
- A queued offline check-in for a session that closes before the phone
  reconnects is rejected by nothing today (rules don't check session
  status) — acceptable for a prototype.
- Run `npm run typecheck` before committing.
- Everything above is **untested on a real device** — the RSSI behavior,
  the BLE code path end-to-end, and the offline queue all still need the
  real two-device pass described above.
