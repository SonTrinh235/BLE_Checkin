import ExpoModulesCore
import CoreBluetooth

// PATCHED copy of react-native-ble-lite@1.1.0 ios/ReactNativeBleLiteModule.swift.
//
// Upstream declares `Module, CBCentralManagerDelegate, CBPeripheralManagerDelegate`
// on one class, which does not compile: those delegate protocols require
// NSObjectProtocol, and Expo's `Module` does not inherit NSObject
// ("cannot declare conformance to 'NSObjectProtocol'"). The CoreBluetooth
// delegates now live in a separate NSObject subclass (BleDelegate).
//
// The GitHub workflow copies this file over node_modules/... before building.
// Public behaviour (function names, options, onAdvertisement event) is unchanged.

enum ScanMode: Int, Enumerable {
  case lowPower = 0
  case balanced = 1
  case lowLatency = 2
  case opportunistic = -1
}

enum AdvertiseMode: Int, Enumerable {
  case lowPower = 0
  case balanced = 1
  case lowLatency = 2
}

enum AdvertisePower: Int, Enumerable {
  case ultraLow = 0
  case low = 1
  case medium = 2
  case high = 3
}

struct ScanOptions: Record {
  @Field var serviceUuid: String = ""
  @Field var scanMode: ScanMode = .balanced
  @Field var allowDuplicates: Bool = true
}

struct AdvertiseOptions: Record {
  @Field var serviceUuid: String = ""
  @Field var data: String = ""
  @Field var advertiseMode: AdvertiseMode = .lowLatency
  @Field var powerLevel: AdvertisePower = .high
  @Field var connectable: Bool = false
  @Field var includeDeviceName: Bool = false
}

// A UUID written in Bluetooth-Base form (0000xxxx-0000-1000-8000-00805f9b34fb)
// is the same thing as the 16-bit UUID xxxx. Convert explicitly so the 2-byte
// form is what goes on the air and what scans are filtered by.
fileprivate func makeUUID(_ string: String) -> CBUUID {
  let lower = string.lowercased()
  if lower.count == 36 && lower.hasPrefix("0000") && lower.hasSuffix("-0000-1000-8000-00805f9b34fb") {
    let start = lower.index(lower.startIndex, offsetBy: 4)
    let end = lower.index(start, offsetBy: 4)
    return CBUUID(string: String(lower[start..<end]))
  }
  return CBUUID(string: string)
}

fileprivate extension Data {
  func toHexString() -> String {
    return map { String(format: "%02x", $0) }.joined()
  }
}

fileprivate final class BleDelegate: NSObject, CBCentralManagerDelegate, CBPeripheralManagerDelegate {
  var onAdvertisement: (([String: Any?]) -> Void)?

  private var centralManager: CBCentralManager?
  private var peripheralManager: CBPeripheralManager?
  private var scanningOptions: ScanOptions?
  private var advertisingOptions: AdvertiseOptions?

  // MARK: - Scanning

  func startScanning(_ options: ScanOptions) {
    scanningOptions = options
    if centralManager == nil {
      centralManager = CBCentralManager(delegate: self, queue: nil)
    }
    if centralManager?.state == .poweredOn {
      beginScan(options)
    }
  }

  func stopScanning() {
    centralManager?.stopScan()
    scanningOptions = nil
  }

  private func beginScan(_ options: ScanOptions) {
    centralManager?.scanForPeripherals(
      withServices: [makeUUID(options.serviceUuid)],
      options: [CBCentralManagerScanOptionAllowDuplicatesKey: options.allowDuplicates]
    )
  }

  func centralManagerDidUpdateState(_ central: CBCentralManager) {
    if central.state == .poweredOn, let options = scanningOptions {
      beginScan(options)
    }
  }

  func centralManager(
    _ central: CBCentralManager,
    didDiscover peripheral: CBPeripheral,
    advertisementData: [String: Any],
    rssi RSSI: NSNumber
  ) {
    guard let options = scanningOptions else { return }
    let uuid = makeUUID(options.serviceUuid)

    // iOS only reports service data if the advertiser included it (Android does).
    let serviceData = advertisementData[CBAdvertisementDataServiceDataKey] as? [CBUUID: Data]
    let data = serviceData?[uuid]

    onAdvertisement?([
      "uuid": options.serviceUuid,
      "data": data?.toHexString() ?? "",
      "rssi": RSSI,
      "deviceId": peripheral.identifier.uuidString
    ])
  }

  // MARK: - Advertising

  func startAdvertising(_ options: AdvertiseOptions) {
    advertisingOptions = options
    if peripheralManager == nil {
      peripheralManager = CBPeripheralManager(delegate: self, queue: nil)
    }
    if peripheralManager?.state == .poweredOn {
      beginAdvertising()
    }
  }

  func stopAdvertising() {
    peripheralManager?.stopAdvertising()
    advertisingOptions = nil
  }

  private func beginAdvertising() {
    guard let options = advertisingOptions else { return }
    // iOS apps can only advertise service UUIDs (and a local name, foreground
    // only) - not service data. The session code therefore travels inside the
    // service UUID itself; see src/ble/constants.ts in the app.
    peripheralManager?.stopAdvertising()
    peripheralManager?.startAdvertising([
      CBAdvertisementDataServiceUUIDsKey: [makeUUID(options.serviceUuid)]
    ])
  }

  func peripheralManagerDidUpdateState(_ peripheral: CBPeripheralManager) {
    if peripheral.state == .poweredOn {
      beginAdvertising()
    }
  }
}

public class ReactNativeBleLiteModule: Module {
  private let ble = BleDelegate()

  public func definition() -> ModuleDefinition {
    Name("ReactNativeBleLite")

    Events("onAdvertisement")

    OnCreate {
      self.ble.onAdvertisement = { [weak self] payload in
        self?.sendEvent("onAdvertisement", payload)
      }
    }

    AsyncFunction("startScanning") { (options: ScanOptions) in
      self.ble.startScanning(options)
    }

    AsyncFunction("stopScanning") {
      self.ble.stopScanning()
    }

    AsyncFunction("startAdvertising") { (options: AdvertiseOptions) in
      self.ble.startAdvertising(options)
    }

    AsyncFunction("stopAdvertising") {
      self.ble.stopAdvertising()
    }
  }
}
