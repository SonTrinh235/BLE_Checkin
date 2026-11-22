# Cài app lên iPhone (không cần Mac, không cần trả phí)

Cách làm: GitHub build ra file `.ipa` chưa ký → bạn ký bằng **Apple ID miễn phí**
trên máy Windows bằng **Sideloadly** → cài vào iPhone qua cáp USB.

Giới hạn của Apple ID miễn phí:
- App **hết hạn sau 7 ngày** (mở không lên nữa). Ký lại bằng đúng các bước dưới
  là xong, dữ liệu trên Firebase không mất. **Hãy ký lại vào ngày trước buổi demo.**
- Tối đa 3 app sideload cùng lúc; tối đa 10 App ID mới mỗi tuần.
- Nên dùng một Apple ID phụ, không dùng tài khoản chính.

## 1. Build IPA trên GitHub (mất khoảng 15–30 phút)

1. Đẩy code lên GitHub (repo phải là **public** thì mới miễn phí phút macOS).
2. Vào repo → tab **Actions** → chọn **Build iOS IPA (unsigned)** → **Run workflow**.
3. Chờ chạy xong (dấu tick xanh) → bấm vào lượt chạy → kéo xuống **Artifacts**
   → tải `diem-danh-gan-unsigned-ipa` (file zip, giải nén ra `.ipa`).

Lần chạy đầu có thể đỏ. Bấm vào bước bị lỗi, copy đoạn log cuối cho Claude sửa.

## 2. Chuẩn bị máy Windows (một lần)

1. Cài **iTunes bản tải từ apple.com** (không dùng bản Microsoft Store).
2. Cài **Sideloadly**: https://sideloadly.io
3. Cắm iPhone bằng cáp, mở khoá máy, bấm **Tin cậy (Trust)** khi iPhone hỏi.

## 3. Ký và cài

1. Mở Sideloadly. Kéo file `.ipa` vào ô IPA.
2. Nhập Apple ID → **Start** → nhập mật khẩu (nếu bật xác thực 2 lớp thì nhập mã).
3. Chờ báo *Done*. Icon app xuất hiện trên iPhone nhưng **chưa mở được**.

## 4. Tin tưởng app và bật Developer Mode (trên iPhone)

1. **Cài đặt → Cài đặt chung → VPN & Quản lý thiết bị** → chạm vào Apple ID
   của bạn → **Tin cậy**.
2. **Cài đặt → Quyền riêng tư & Bảo mật → kéo xuống cuối → Chế độ nhà phát triển
   (Developer Mode)** → bật → máy hỏi khởi động lại → **Khởi động lại**.
   Sau khi lên máy, hiện hộp thoại → **Bật** → nhập mật mã.
   (Mục này chỉ xuất hiện sau khi đã cài app sideload ở bước 3.)
3. Mở app. Lần đầu iPhone hỏi quyền **Bluetooth** → **Cho phép**.

## 5. Lưu ý khi dùng trên iPhone

- iPhone chỉ phát Bluetooth khi app **đang mở và màn hình sáng**. Chủ nhiệm giữ
  màn hình bật trong suốt phiên (Cài đặt → Màn hình & Độ sáng → Tự động khoá →
  Không bao giờ).
- Điểm danh BLE giữa iPhone và Android dùng chung một giao thức, nhưng **chưa
  được thử trên máy thật**. Nếu BLE không bắt được, dùng **mã QR** — QR chạy
  giống hệt trên cả hai nền tảng.
- Lỗi "Unable to verify app" / app đóng ngay: kiểm tra lại bước 4 (Tin cậy +
  Developer Mode).
- Lỗi Sideloadly về Apple ID / quá nhiều App ID: đợi vài ngày hoặc dùng Apple
  ID khác.
