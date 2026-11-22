import { initializeApp } from '@firebase/app';
import { initializeAuth } from '@firebase/auth';
// @firebase/auth's package.json `exports` map lists a top-level "types"
// key ahead of its "react-native" condition block, so TypeScript always
// resolves the browser .d.ts here regardless of platform, even though
// Metro correctly resolves the React Native JS build (which does export
// this) via that same condition at bundle time. Known upstream typings
// gap, not a runtime issue — see firebase/firebase-js-sdk on GitHub for
// "getReactNativePersistence" + "exports" resolution issues.
// @ts-expect-error — see comment above
import { getReactNativePersistence } from '@firebase/auth';
import { getFirestore } from '@firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Placeholder values — create a free Firebase project at
// https://console.firebase.google.com, add a Web app, enable
// Authentication > Sign-in method > Email/Password, create a Firestore
// database (test mode is fine for development), then paste your project's
// config below. See README.md for the full walkthrough.
const firebaseConfig = {
  apiKey: "AIzaSyBhSde4Oz2TBH6XKnaqhW27ML8iBARyEh0",
  authDomain: "ble-check-in.firebaseapp.com",
  projectId: "ble-check-in",
  storageBucket: "ble-check-in.firebasestorage.app",
  messagingSenderId: "117165348479",
  appId: "1:117165348479:web:2be9e4b30195bea660514a",
  measurementId: "G-0FC52JQK37"
};

export const firebaseApp = initializeApp(firebaseConfig);

export const auth = initializeAuth(firebaseApp, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(firebaseApp);
