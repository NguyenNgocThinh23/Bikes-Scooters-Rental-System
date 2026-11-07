# RIDENOW – HỆ THỐNG QUẢN LÝ CHO THUÊ XE ĐẠP VÀ XE TAY GA TRỰC TUYẾN
> **"Your Ride, Your Journey, Your Freedom."**  
> *Designed by Minh Do*

---

## 1. GIỚI THIỆU TỔNG QUAN

**RideNow** là nền tảng ứng dụng web full-stack hoàn chỉnh, hiện đại dành cho dịch vụ cho thuê phương tiện di chuyển cá nhân (xe đạp thể thao, xe đạp thành phố, xe đạp điện, xe scooter điện và xe tay ga động cơ xăng).

Hệ thống cung cấp giải pháp khép kín từ đặt xe, kiểm tra lịch trống theo thời gian thực (time-slot availability), chống trùng lịch (concurrency double-booking prevention), ký gửi và hoàn trả tiền đặt cọc (escrow security deposit), kiểm tra xe khi bàn giao/nhận trả xe, tự động tính phí trễ hạn (late fee) và phí tổn hại (damage assessment), gia hạn thời gian thuê (rental extension), lập hóa đơn chi tiết (itemized invoice) đến báo cáo phân tích số liệu tài chính doanh nghiệp.

Toàn bộ giao diện website và các dashboard được xây dựng bằng **tiếng Anh**, tuân thủ hệ thống nhận diện thương hiệu chuyên nghiệp:
- **Primary Navy:** `#142B45`
- **Secondary Green:** `#20B875`
- **Soft Green / Accent:** `#E7F8EF`
- **Light Gray Background:** `#F7F9FC`
- **Đơn vị tiền tệ mặc định:** Việt Nam Đồng (VND - ₫)

---

## 2. KIẾN TRÚC & CÔNG NGHỆ SỬ DỤNG

### 2.1. Frontend
- **Framework & Build Tool:** React 18 kết hợp Vite cực nhanh.
- **Styling:** Tailwind CSS 3 với bảng màu thương hiệu tùy chỉnh, thiết kế responsive trên Desktop, Tablet và Mobile.
- **Routing:** React Router DOM v6 với phân quyền chặt chẽ (`ProtectedRoute` cho Khách hàng và Admin).
- **Icons & UI:** Lucide React icons hiện đại.
- **Biểu đồ thống kê:** Recharts (AreaChart, BarChart, PieChart hiển thị xu hướng doanh thu, cơ cấu trạng thái và mức độ ưa chuộng của từng xe).
- **Quản lý biểu mẫu:** React Hook Form & validation thông minh.

### 2.2. Backend
- **Nền tảng:** Node.js (hỗ trợ LTS v18, v20, v22, v26) & Express.js RESTful API.
- **Bảo mật & Xác thực:** JSON Web Token (JWT) và bcrypt (salt rounds = 10) để băm mật khẩu an toàn.
- **Quản lý tải tệp bảo mật:** Multer kết hợp xác thực **Magic Bytes** (chữ ký số tệp thực tế của JPEG, PNG, PDF) chống giả mạo đuôi file; kiểm soát quyền sở hữu và phân quyền nghiêm ngặt chỉ Admin và chủ tài khoản mới được truy cập tài liệu CCCD/GPLX.
- **Kiểm soát đồng thời (Concurrency Control):** Sử dụng MySQL Database Transaction kết hợp khóa dòng `SELECT ... FOR UPDATE` nhằm ngăn chặn hoàn toàn tình trạng đặt trùng xe khi có 2 quản trị viên cùng xác nhận đơn đặt xe trùng lịch.

### 2.3. Cơ sở dữ liệu (Database)
- **Hệ quản trị CSDL:** MySQL / MariaDB (hỗ trợ MySQL 8.0+ và MariaDB 10.x / 11.x / 13.x).
- **Cấu trúc dữ liệu quan hệ hoàn chỉnh gồm 15 bảng:**
  1. `users`: Quản lý tài khoản (admin, customer), trạng thái xác minh danh tính.
  2. `categories`: Danh mục phương tiện (City Bikes, Mountain Bikes, Electric Bikes, Electric Scooters, Motor Scooters).
  3. `locations`: Các trạm giao nhận xe.
  4. `vehicles`: Thông tin xe, biển số, giá thuê theo giờ/ngày, tình trạng kỹ thuật và trạng thái vận hành (`available`, `rented`, `maintenance`, `unavailable`).
  5. `bookings`: Quản lý đơn đặt xe theo thời gian thực với mã đặt xe duy nhất (`BK-...`).
  6. `booking_extensions`: Quản lý các yêu cầu xin gia hạn thời gian thuê xe.
  7. `rental_returns`: Ghi nhận biên bản bàn giao và trả xe, số km, kiểm tra tình trạng, tính phụ phí trễ giờ và hư hại.
  8. `payments`: Nhật ký giao dịch thanh toán tiền thuê, phụ phí.
  9. `deposits`: Quản lý tiền cọc ký quỹ (Escrow deposit), số tiền hoàn lại và số tiền khấu trừ do hư hại.
  10. `reviews`: Đánh giá sao và nhận xét từ khách hàng sau khi hoàn tất chuyến đi.
  11. `vehicle_maintenance`: Lịch bảo dưỡng xe định kỳ và chi phí sửa chữa.
  12. `coupons`: Quản lý mã giảm giá khuyến mãi.
  13. `notifications`: Hệ thống thông báo tự động cho người dùng.
  14. `system_settings`: Cấu hình động hệ thống (phí trễ mỗi giờ, tỷ lệ cọc %, thời gian hủy miễn phí).
  15. `audit_logs`: Nhật ký kiểm toán bảo mật lưu vết mọi thao tác của hệ thống và quản trị viên.

---

## 3. TÀI KHOẢN ĐĂNG NHẬP MẪU

Cơ sở dữ liệu đã được seed sẵn các tài khoản thử nghiệm đầy đủ:

| Phân quyền | Email đăng nhập | Mật khẩu | Chức năng chính |
| :--- | :--- | :--- | :--- |
| **Quản trị viên (Admin)** | `admin@ridenow.com` | `Admin@123` | Toàn quyền kiểm soát đội xe, xác nhận đơn, bảng điều khiển bàn giao & nhận trả xe, duyệt gia hạn, duyệt hồ sơ khách hàng, xem biểu đồ doanh thu và cấu hình hệ thống. |
| **Khách hàng (Customer)** | `customer@ridenow.com` | `Customer@123` | Đặt xe, quản lý đơn đặt, yêu cầu gia hạn chuyến đi, xem hóa đơn chi tiết, thanh toán mô phỏng MoMo/Thẻ ngân hàng, tải lên giấy tờ xác minh danh tính. |

---

## 4. HƯỚNG DẪN CÀI ĐẶT & KHỞI CHẠY HỆ THỐNG

### 4.1. Yêu cầu môi trường
- **Node.js:** Phiên bản 18 trở lên (đã kiểm tra tương thích hoàn hảo trên v26.13.0).
- **npm:** Phiên bản 9 trở lên.
- **MySQL / MariaDB Server:** Đang chạy tại cổng `3306`.

### 4.2. Cấu hình biến môi trường (`.env`)
Tệp cấu hình Backend được đặt tại `backend/.env`:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Cấu hình Cơ sở dữ liệu MySQL / MariaDB
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=RideNow@2026
DB_NAME=ridenow_db

# Bảo mật JWT
JWT_SECRET=ridenow_super_secure_jwt_secret_key_2026_antigravity_token
JWT_EXPIRES_IN=7d
```

### 4.3. Khởi tạo Cơ sở dữ liệu và Seed dữ liệu mẫu
Trong thư mục `backend`, chạy lệnh:
```bash
# Cài đặt gói phụ thuộc
npm install

# Tạo cấu trúc bảng và nạp dữ liệu khởi tạo
node database/initDb.js
```
Khi hoàn tất, console sẽ thông báo: `✓ Database initialized and seeded successfully with 15 relational tables!`

### 4.4. Khởi chạy Backend API Server
Trong thư mục `backend`:
```bash
node src/server.js
```
Backend API sẽ lắng nghe tại: **`http://localhost:5000`**  
Kiểm tra tình trạng sức khỏe: **`http://localhost:5000/api/health`**

### 4.5. Khởi chạy Frontend React (Vite)
Mở một cửa sổ dòng lệnh mới, chuyển vào thư mục `frontend`:
```bash
# Cài đặt thư viện giao diện
npm install

# Khởi chạy Vite Dev Server
npm run dev
```
Truy cập ứng dụng web tại: **`http://localhost:5173`** (hoặc `http://127.0.0.1:5173`).

---

## 5. QUY TRÌNH NGHIỆP VỤ NỀN TẢNG (CORE WORKFLOWS)

### 5.1. Quy trình Đặt xe & Kiểm tra Lịch trống (Booking Workflow)
1. **Tìm kiếm & Lọc xe:** Khách hàng tìm kiếm phương tiện theo trạm nhận, khoảng thời gian (ngày & giờ nhận/trả) và phân loại xe.
2. **Kiểm tra lịch trống động (Availability Check):** Hệ thống không dùng cờ tĩnh "Reserved", mà truy vấn các đơn đặt xe có trạng thái `confirmed` hoặc `active` trong khoảng thời gian khách chọn để xác định phương tiện có khả dụng hay không.
3. **Tạo đơn đặt xe:** Khách hàng điền thông tin và xác nhận. Đơn được khởi tạo với trạng thái ban đầu là `pending`. Tiền cọc an toàn (20% giá trị chuyến thuê) được tạo tự động dưới trạng thái `held` (giữ cọc).

### 5.2. Xác nhận Đơn hàng & Chống Đặt trùng lặp (Concurrency Safe Confirmation)
- Quản trị viên vào mục **Bookings Queue** (`/admin/bookings`) để duyệt đơn.
- Khi nhấn **Confirm Booking**, Backend mở một **Database Transaction**, thực thi khóa dòng:
  ```sql
  SELECT * FROM bookings 
  WHERE vehicle_id = ? AND booking_status IN ('confirmed', 'active') 
  FOR UPDATE;
  ```
- Nếu phát hiện có đơn khác đã được xác nhận trùng khung giờ trong tích tắc vừa qua, hệ thống lập tức hủy giao dịch và thông báo xung đột, loại bỏ hoàn toàn rủi ro **Double-Booking**.

### 5.3. Bàn giao xe (Rental Pickup)
- Khi khách đến trạm nhận xe, Admin mở **Pickup & Return Console** (`/admin/console`).
- Nhân viên kiểm tra giấy tờ, số km hiện tại, tình trạng xe và chụp ảnh/ghi chú tình trạng trước chuyến đi.
- Nhấn **Handover Vehicle** -> Đơn chuyển sang `active`, trạng thái xe chuyển sang `rented`.

### 5.4. Quy trình Yêu cầu Gia hạn (Rental Extension Workflow)
- Trong thời gian đang thuê xe (`active`), khách hàng có thể nhấn **Request Extension** tại trang **Active Rentals**.
- Khách chọn thời gian trả mới mong muốn. Hệ thống kiểm tra xem xe có bị vướng đơn đặt của khách hàng khác trong tương lai hay không (thuật toán tự động **loại trừ đơn đặt hiện tại của chính khách hàng đó**).
- Tính toán lại phụ phí phát sinh tương ứng.
- Đơn gia hạn được gửi lên mục **Extension Requests** (`/admin/extensions`) để Admin kiểm tra và phê duyệt.

### 5.5. Trả xe & Tự động Tính phụ phí (Rental Return & Inspection)
- Khi khách đem xe trả lại trạm, Admin thực hiện biên bản nghiệm thu tại **Return Console**:
  - Ghi nhận thời gian trả xe thực tế.
  - Tự động so sánh với thời hạn trả dự kiến (kèm thời gian ân hạn 15 phút): Nếu quá hạn, hệ thống tự động nhân số giờ trễ với giá phạt quy định trong hệ thống (`late_fee_hourly_rate`, mặc định 50.000 ₫/giờ).
  - Ghi nhận hư hỏng (nếu có) và nhập chi phí khắc phục (`damage_fee`).
  - Xử lý tiền cọc: Tự động khấu trừ chi phí tổn hại từ số tiền cọc đang giữ và hoàn trả số tiền thừa cho khách hàng.
  - Chuyển trạng thái đơn sang `completed`, trạng thái xe trở về `available` (hoặc `maintenance` nếu xe bị hỏng hóc).

### 5.6. Xuất Hóa đơn Chi tiết (Itemized Invoice Modal)
- Bất kỳ đơn đặt xe nào cũng có thể xem và in **Hóa đơn chi tiết chuẩn hóa** (`InvoiceModal`), liệt kê đầy đủ:
  - Thông tin khách hàng & Trạm đón/trả.
  - Đơn giá thuê theo giờ và theo ngày.
  - Bảng mục phí minh bạch: Cước thuê gốc, Phí gia hạn, Giảm giá khuyến mãi, Phí trễ hạn, Phí bồi thường hư hại.
  - Tổng số tiền cần thanh toán, số tiền đã trả, số dư còn lại.
  - Chi tiết hoàn trả tiền cọc an toàn.
  - Hỗ trợ nút **Print Invoice** định dạng in đẹp mắt.

### 5.7. Cổng Thanh toán Thử nghiệm (Demo Payment Gateway)
- Khách hàng có thể trải nghiệm quy trình thanh toán không tiền mặt thông qua cổng mô phỏng:
  - **MoMo E-Wallet (Demo):** Mô phỏng quét mã QR thanh toán ví điện tử.
  - **Credit / Debit Card (Demo):** Mô phỏng nhập số thẻ, ngày hết hạn và mã CVV.
- Toàn bộ giao dịch mô phỏng đều có nhãn xác thực `[DEMO SIMULATED PAYMENT]` minh bạch, ghi rõ không có tiền thực tế bị trừ.

---

## 6. KIỂM THỬ TỰ ĐỘNG (AUTOMATED TESTS)

Hệ thống đi kèm bộ kiểm thử tự động toàn diện kiểm tra tính đúng đắn của logic nghiệp vụ cốt lõi:
```bash
cd backend
node tests/runAllTests.js
```
Kết quả kiểm thử thực tế:
```text
=======================================================
   RUNNING RIDENOW AUTOMATED BUSINESS LOGIC TEST SUITE
=======================================================

1. Authentication & JWT Security Tests:
  ✓ Should correctly hash passwords and verify bcrypt match
  ✓ Should sign and verify JWT payload with expiration and role

2. Pricing Engine & Late Fee Calculation Tests:
  ✓ Should calculate hourly pricing for rentals under 24h when hourly is cheaper
  ✓ Should cap rental fee at daily rate if hourly exceeds daily rate
  ✓ Should correctly calculate late return fee exceeding 15 min grace period
  ✓ Should waive late fee if return is within 15 minutes grace period

3. Availability & Transactional Anti-Double-Booking Tests:
  ✓ Should detect vehicle under maintenance as unavailable
  ✓ Should detect conflict when vehicle has overlapping confirmed or active booking
  ✓ Should allow booking outside the occupied date range
  ✓ Rental extension check should exclude current booking itself
  ✓ Transactional checkAvailabilityInTransaction should prevent double-booking with row-level locks

=======================================================
 Test Results: 11/11 Passed (100%)
=======================================================
```

---

## 7. CẤU TRÚC THƯ MỤC DỰ ÁN

```text
Bikes & Scooters Rental System/
├── backend/
│   ├── database/
│   │   ├── schema.sql              # Cấu trúc 15 bảng quan hệ, khóa ngoại, indexes
│   │   └── initDb.js               # Script tạo CSDL và nạp dữ liệu mẫu ban đầu
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js               # Kết nối MySQL Pool & Transaction Helper
│   │   │   └── jwt.js              # Cấu hình Token JWT
│   │   ├── controllers/            # 12 REST API Controllers đầy đủ
│   │   ├── middleware/             # Auth, AdminGuard, Upload (Magic Bytes), ErrorHandler
│   │   ├── routes/                 # Express Router cho từng phân hệ
│   │   ├── services/               # PricingService, AvailabilityService, AuditService
│   │   ├── app.js                  # Express App, CORS, Static Serving
│   │   └── server.js               # Khởi chạy máy chủ HTTP tại cổng 5000
│   ├── tests/
│   │   └── runAllTests.js          # Bộ test tự động 11 kịch bản nghiệp vụ
│   ├── uploads/documents/          # Thư mục lưu trữ tài liệu CCCD/GPLX bảo mật
│   └── .env                        # Biến môi trường Backend
│
├── frontend/
│   ├── public/
│   │   └── favicon.svg             # Logo biểu tượng xe RideNow
│   ├── src/
│   │   ├── components/common/      # Navbar, Footer, StatusBadge, InvoiceModal, ProtectedRoute
│   │   ├── context/                # AuthContext, NotificationContext
│   │   ├── layouts/                # PublicLayout, CustomerLayout, AdminLayout
│   │   ├── pages/
│   │   │   ├── public/             # Home (11 mục), Explore, VehicleDetails, Pricing, FAQ...
│   │   │   ├── customer/           # Dashboard, Bookings, ActiveRentals, History, Profile...
│   │   │   └── admin/              # Analytics, Fleet, Bookings, Console, Extensions, Settings...
│   │   ├── services/api.js         # Cấu hình Axios Interceptors
│   │   ├── utils/formatters.js     # Định dạng tiền tệ VND, ngày giờ
│   │   ├── App.jsx                 # Bộ định tuyến React Router v6
│   │   ├── main.jsx                # Điểm khởi động ứng dụng React
│   │   └── index.css               # Tailwind CSS directives
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js          # Bảng màu thương hiệu
│   └── vite.config.js              # Cấu hình Proxy cổng 5000
│
├── .gitignore                      # Bảo vệ thông tin bí mật và file tải lên
└── README.md                       # Tài liệu hướng dẫn sử dụng tiếng Việt
```

---

## 8. BẢN QUYỀN & THIẾT KẾ
- **Tên dự án:** RideNow – Bikes & Scooters Rental System
- **Khẩu hiệu:** *"Your Ride, Your Journey, Your Freedom."*
- **Thiết kế & Bản quyền:** Minh Do
