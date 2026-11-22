# Hướng dẫn chạy app BLE Check-in

App Expo (React Native) + Firebase (Authentication + Firestore). Không dùng
được Expo Go vì có module native (Bluetooth, camera) — phải dùng **dev client**.

## 1. Cài một lần

| Cần có | Ghi chú |
|---|---|
| Node.js 22.13+ | `node -v` để kiểm tra |
| Tài khoản Expo | miễn phí, expo.dev |
| Android Studio | để tạo máy ảo; SDK của bạn ở `E:\Android` |
| Firebase project | xem mục 2 |

Trong thư mục dự án chạy một lần: `npm install`

## 2. Firebase (một lần)

Console: console.firebase.google.com → project **ble-check-in**.

1. **Security → Authentication → Get started → Sign-in method →
   Email/Password → Enable → Save.**
2. **Databases & Storage → Firestore → Create database** (region nào cũng được).
3. Tab **Rules** → xoá hết, dán toàn bộ nội dung `firestore.rules` → **Publish**.
   (Nút *Develop & test* chỉ để thử rules, không phải Publish.)
4. Config Web app đã nằm trong `src/firebase/config.ts`. Không cần Hosting,
   Storage hay Analytics; không thêm `firebase/app` hay `getAnalytics`.

Mỗi lần sửa `firestore.rules` trong repo, phải **Publish lại** ở console.

## 3. Build dev client (một lần, hoặc khi đổi package native)

```powershell
npx eas login
npx eas build --profile development --platform android
```

Build chạy trên cloud (~5–20 phút). Cần build lại khi thêm/đổi thư viện native
hoặc plugin trong `app.json`; đổi code `src/` thì **không** cần.

## 4. Máy ảo Android

1. Android Studio → **More Actions → Virtual Device Manager → Create Device**
   → Pixel 8 → image Google Play x86_64 → Finish → bấm ▶.
2. Đặt biến môi trường (Start → "environment variables" → *Edit environment
   variables for your account*):
   - User variable `ANDROID_HOME` = `E:\Android`
   - Thêm vào `Path`: `E:\Android\platform-tools`
   - **Đóng hẳn VS Code rồi mở lại** để terminal nhận biến.
3. Kiểm tra: `adb devices` phải hiện `emulator-5554   device`.

Chưa đặt được biến vĩnh viễn thì mỗi terminal mới gõ:

```powershell
$env:ANDROID_HOME = "E:\Android"
$env:Path += ";E:\Android\platform-tools"
```

> Máy ảo **không có Bluetooth**: phần BLE sẽ hiện trạng thái lỗi/không có
> tín hiệu. Dùng nó để test giao diện, đăng nhập, CLB, phiên, QR, thủ công,
> CSV. Test BLE thật cần 2 điện thoại Android.

## 5. Chạy hằng ngày

```powershell
# 1) Cài bản build lên máy ảo (lần đầu, hoặc sau khi build mới)
npx eas build:run -p android --latest

# 2) Bật máy chủ code
npx expo start --dev-client
```

Trong terminal bấm **a** để mở app. Nếu app dừng ở màn *Development servers*:
gõ `http://10.0.2.2:8081` vào ô `http://` → **Connect**
(`10.0.2.2` là máy tính của bạn nhìn từ máy ảo).

Đừng chạy `npx expo install --check` / nâng cấp Expo giữa chừng — dễ lệch phiên
bản so với bản build đã cài.

## 6. Kịch bản test nhanh (1 máy)

1. **Bắt đầu** → đăng ký (VD `a@test.com` / `123456`, mã SV tuỳ chọn).
2. Trang chủ → **Tạo / Tham gia CLB** → tạo CLB → ghi mã tham gia.
3. Chi tiết CLB → **Mở phiên điểm danh mới** → nhập tên + phòng → mở.
4. **Hiện QR**, **Thủ công** → tick chính mình → xuất hiện nhãn *Thủ công*.
5. Ô tìm kiếm lọc theo tên / mã SV.
6. **Đóng điểm danh** → Chi tiết CLB → **Xem các phiên** → mở chi tiết.
7. **Xuất báo cáo (CSV)** → share sheet.
8. Tab **Cá nhân** → sửa mã SV, đăng xuất, đăng nhập lại.

Test BLE/QR thật (2 máy): máy A chủ nhiệm mở phiên; máy B đăng ký tài khoản
khác → tham gia bằng mã → *Điểm danh ngay* → thử Bluetooth, rồi QR. Chi tiết
nằm trong `README.md`.

## 7. Lỗi thường gặp

| Triệu chứng | Cách xử lý |
|---|---|
| `adb ... ENOENT` | Chưa có `ANDROID_HOME`/`Path`; đóng mở lại VS Code hoặc gõ 2 dòng `$env:` ở mục 4 |
| App dừng ở *Development servers* | Gõ `http://10.0.2.2:8081` → Connect; đảm bảo `expo start` đang chạy |
| `Missing or insufficient permissions` | Chưa Publish đúng `firestore.rules` mới nhất |
| Đăng ký báo lỗi `auth/operation-not-allowed` | Chưa bật Email/Password trong Authentication |
| `INSTALL_FAILED_NO_MATCHING_ABIS` | Bản build không có x86_64; dùng điện thoại thật hoặc build lại |
| App đóng ngay khi mở (Android 17) | Tạo thêm máy ảo API thấp hơn (VD 35) |
| Màn hình đỏ sau khi sửa code | Trong terminal Metro bấm **r** để reload |

## 8. Cấu trúc thư mục

- `src/theme`, `src/components` — design tokens, component dùng chung
- `src/screens` — các màn hình; `src/navigation` — stack + bottom tabs
- `src/data` — Firestore, hàng đợi offline, CSV; `src/ble` — Bluetooth
- `firestore.rules` — quy tắc bảo mật Firestore
- `landing/` — landing page tĩnh (mở `landing/index.html`)

## 9. Test 2 máy ảo (không có Bluetooth/camera)

Máy ảo không có BLE nên thành viên không tự điểm danh được. Ở bản dev, tab
**Cá nhân → Giả lập điểm danh** chạy đúng luồng điểm danh thật cho phiên đang
mở của từng CLB (ghi Firestore, hàng đợi offline, lịch sử). Nút này **không có
trong bản production**.

1. Bật 2 máy ảo trong Device Manager (VD `Pixel_8` và `Medium_Phone_API_37.0`).
2. Cài app vào cả hai: `npx eas build:run -p android --latest` rồi chọn từng máy
   (hoặc `adb -s emulator-5556 install <file.apk>`). `adb devices` phải thấy 2 máy.
3. Chạy `npx expo start --dev-client`; ở mỗi máy ảo nhập
   `http://10.0.2.2:8081` → Connect.
4. Máy A (chủ nhiệm, `a@test.com`): tạo CLB, mở phiên. Máy B (`b@test.com`):
   tham gia bằng mã CLB.
5. Máy B: tab **Cá nhân → Giả lập điểm danh** → máy A thấy người mới hiện ngay
   (nhãn *Bluetooth*). Kiểm tra thêm: tab Lịch sử của B, điểm danh thủ công
   từ A, đóng phiên, xuất CSV theo phiên.
