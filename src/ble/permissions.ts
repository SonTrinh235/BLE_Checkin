import { PermissionsAndroid, Platform } from 'react-native';

// react-native-ble-lite does not request runtime permissions itself — the
// app has to do it before calling startScanning/startAdvertising.
// Android's BLE permission model changed at API 31 (Android 12): older
// versions gate scanning behind ACCESS_FINE_LOCATION, newer versions use
// dedicated BLUETOOTH_SCAN/ADVERTISE/CONNECT permissions instead.
// iOS needs no runtime call here — CoreBluetooth shows its own system
// prompt the first time startScanning/startAdvertising runs, driven by the
// NSBluetooth*UsageDescription strings set via the Expo config plugin.
export async function requestBlePermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }

  if (Platform.Version >= 31) {
    const results = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    ]);
    return Object.values(results).every(
      (status) => status === PermissionsAndroid.RESULTS.GRANTED
    );
  }

  const status = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
  );
  return status === PermissionsAndroid.RESULTS.GRANTED;
}
