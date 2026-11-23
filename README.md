# BLE Check-in (Điểm danh gần)

**Một lần chạm. Một lần có mặt.**

Ứng dụng di động điểm danh bằng Bluetooth (BLE) cho câu lạc bộ sinh viên. Điện
thoại của người tổ chức phát tín hiệu Bluetooth trong phòng, sinh viên ở gần được
nhận diện tự động; mã QR là phương án dự phòng. Chủ nhiệm theo dõi danh sách theo
thời gian thực và xuất báo cáo CSV.

| Liên kết | |
|---|---|
| Landing page | https://sontrinh235.github.io/BLE_Checkin/ |
| Mã nguồn | https://github.com/SonTrinh235/BLE_Checkin |
| Figma (thiết kế) | _cập nhật sau_ |
| Figma prototype | _cập nhật sau_ |
| Behance case study | _cập nhật sau_ |

> Dự án môn học. Trạng thái: **prototype**. App đã chạy được trên máy ảo Android;
> **phần Bluetooth thật chưa được kiểm thử trên 2 thiết bị thật** (xem mục
> [Kiểm thử](#kiểm-thử)).

## Tính năng

- Đăng ký / đăng nhập bằng email (Firebase Authentication), có mã sinh viên tuỳ chọn.
- Tạo CLB (có mã tham gia ngẫu nhiên) hoặc tham gia CLB bằng mã; chủ nhiệm có thể
  xoá thành viên, thành viên có thể rời CLB.
- Chủ nhiệm mở phiên điểm danh: tên buổi, phòng, thời lượng (30 phút / 1 giờ /
  2 giờ / không giới hạn), đồng hồ đếm ngược, tự đóng khi hết giờ.
- Điểm danh bằng Bluetooth hoặc quét QR; đầy đủ các trạng thái lỗi (không thấy
  tín hiệu, chưa cấp quyền, mã sai phiên, phiên đã đóng/hết giờ…).
- Chủ nhiệm xem danh sách điểm danh trực tiếp, tìm theo tên / mã sinh viên, điểm
  danh thủ công cho thành viên.
- Hoạt động khi mất mạng: điểm danh được lưu trên máy, tự đồng bộ khi có mạng lại.
- Lịch sử điểm danh của từng người; danh sách các phiên và chi tiết từng phiên.
- Xuất báo cáo CSV theo cả CLB hoặc theo từng phiên.
- Công cụ **BLE lab test** (tab Cá nhân) để đo cường độ tín hiệu (RSSI) giữa 2 máy.
- Trải nghiệm: giao diện **sáng / tối** (theo hệ thống hoặc chọn trong tab Cá nhân),
  màn giới thiệu 3 trang ở lần mở đầu, hiện/ẩn mật khẩu, quên mật khẩu, chia sẻ mã
  CLB, tìm CLB, lịch sử nhóm theo ngày kèm thống kê, khung xương khi tải dữ liệu,
  thông báo khi offline.

## Công nghệ

Expo SDK 57 · React Native 0.86 · TypeScript · React Navigation (stack + bottom
tabs) · Firebase Authentication + Firestore · `react-native-ble-lite` ·
`expo-camera` · `react-native-svg` / `react-native-qrcode-svg`.

Không dùng được Expo Go vì có module native (Bluetooth, camera): phải dùng
**dev client** (build bằng EAS).

## Cấu trúc thư mục

| Thư mục | Nội dung |
|---|---|
| `src/theme`, `src/components`, `src/ui` | Design tokens, component dùng chung, nhãn hiển thị |
| `src/screens` | Các màn hình |
| `src/navigation` | Stack + bottom tabs |
| `src/data` | Firestore, hàng đợi offline, xuất CSV |
| `src/ble` | Hằng số và xin quyền Bluetooth |
| `src/auth`, `src/firebase` | Đăng nhập, cấu hình Firebase |
| `firestore.rules` | Quy tắc bảo mật Firestore |
| `landing/` | Landing page tĩnh (deploy bằng GitHub Pages) |
| `.github/workflows/pages.yml` | Tự động deploy landing page |
| `.github/workflows/ios-unsigned-ipa.yml` | Build IPA iOS chưa ký (chạy tay) |

## Chạy dự án

Hướng dẫn từng bước (cài đặt, Firebase, build, máy ảo, lỗi thường gặp) nằm trong
**[HUONG_DAN_CHAY.md](HUONG_DAN_CHAY.md)**. Tóm tắt:

```bash
npm install
npx eas build --profile development --platform android   # một lần
npx expo start --dev-client
```

Kiểm tra kiểu: `npm run typecheck`.

## Firebase

Dự án dùng **Authentication (Email/Password)** và **Firestore**, không dùng
Hosting/Storage/Analytics. Sau khi sửa `firestore.rules` trong repo, phải
**Publish lại** trong Firebase console (tab Rules), nếu không app sẽ báo
`Missing or insufficient permissions`. Cấu hình web của Firebase nằm trong
`src/firebase/config.ts`.

## Kiểm thử

- **Một máy ảo:** đăng ký, tạo CLB, mở phiên, hiện QR, điểm danh thủ công, tìm
  kiếm, đóng phiên, xuất CSV. Máy ảo không có Bluetooth/camera.
- **Hai máy ảo:** ở bản dev, tab **Cá nhân → Giả lập điểm danh** chạy đúng luồng
  điểm danh thật cho phiên đang mở (nút này không có ở bản production). Kiểm tra
  được đồng bộ thời gian thực và quy tắc Firestore giữa hai tài khoản.
- **Hai điện thoại Android thật:** cần cho Bluetooth và quét QR bằng camera.
  Máy A (chủ nhiệm) mở phiên; máy B (tài khoản khác) tham gia bằng mã CLB rồi
  điểm danh bằng Bluetooth, thử thêm QR. Thử chế độ máy bay trên máy B để kiểm
  tra hàng đợi offline.
- **BLE lab test:** máy A chọn "I'm the host", máy B chọn "I'm a student", sau đó
  mang máy B đi xa dần qua cửa/tường và ghi RSSI để chọn ngưỡng "trong phòng".

## Hạn chế đã biết

- Bluetooth xác nhận **thiết bị** có mặt, không xác nhận **người dùng**: có thể
  mang hộ điện thoại của bạn vào phòng. Đây là hạn chế đã biết, không phải lỗi.
- Bảo mật ở mức prototype: mọi người đã đăng nhập đều đọc được mã tham gia của
  các CLB; việc đóng phiên và kiểm tra thành viên chủ yếu do app thực hiện. Chưa
  đủ để triển khai thật.
- Rules không kiểm tra trạng thái phiên khi ghi điểm danh. Cố ý: nếu kiểm tra
  lúc đồng bộ thì điểm danh hợp lệ làm khi mất mạng sẽ bị từ chối khi có mạng lại.
- BLE vẫn phát khi chủ nhiệm rời màn **Mở phiên**, nhưng chỉ khi app còn chạy;
  tắt hẳn app thì dừng phát (phiên vẫn mở). Phần này chưa kiểm thử trên máy thật.
- Phiên hết giờ chỉ được đóng trong Firestore khi app của chủ nhiệm đang mở (chưa
  có xử lý phía máy chủ). Thành viên vẫn thấy phiên đó là đã đóng. Giờ hết hạn
  dùng độ lệch đồng hồ đo với Firestore để các máy không lệch nhau.
- App chưa có tab riêng cho người tổ chức như Figma (vai trò tính theo từng CLB,
  công cụ tổ chức nằm trong Chi tiết CLB).
- Chưa có thông báo đẩy, chưa có sửa phiên / kiểm tra trùng tên CLB.
- Chưa kiểm thử trên iPhone. Có thể build và cài miễn phí, không cần Mac:
  xem **[HUONG_DAN_IOS.md](HUONG_DAN_IOS.md)** (GitHub Actions + Sideloadly,
  app sống 7 ngày). iPhone chỉ phát Bluetooth khi app đang mở và sáng màn hình.
- Mã phiên được mã hoá trong **service UUID** (`src/ble/constants.ts`) thay vì
  service data, vì iOS không phát được service data và Android bị tràn gói
  quảng bá 31 byte với UUID 128-bit + dữ liệu. Nhờ đó cả 4 tổ hợp chủ nhiệm /
  thành viên (Android, iPhone) dùng chung một giao thức. Chưa kiểm thử trên máy thật.
- BLE lab test: máy quét phải nhập mã phiên hiển thị trên máy chủ.

## Nhóm thực hiện

_Điền tên thành viên._
