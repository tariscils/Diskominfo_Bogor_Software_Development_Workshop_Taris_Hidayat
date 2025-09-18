# Admin Login API dengan Sequelize dan bcrypt

## Overview
Implementasi sistem login admin menggunakan Next.js API Routes, Sequelize ORM, dan bcrypt untuk hashing password yang aman.

## Fitur yang Diimplementasi

### 1. Model Admin (Sequelize)
- **File**: `lib/sequelize.js`
- **Fitur**:
  - UUID sebagai primary key
  - Username unik dengan validasi panjang
  - Password dengan hashing otomatis menggunakan bcrypt
  - Email opsional dengan validasi format
  - Role system (ADMIN, SUPER_ADMIN)
  - Status aktif/non-aktif
  - Tracking last login
  - Timestamps otomatis

### 2. API Login Endpoint
- **File**: `app/api/admin/login/route.js`
- **Method**: POST
- **URL**: `/api/admin/login`
- **Request Body**:
  ```json
  {
    "username": "admin",
    "password": "admin123"
  }
  ```
- **Response Success**:
  ```json
  {
    "success": true,
    "message": "Login berhasil",
    "data": {
      "admin": {
        "id": "uuid",
        "username": "admin",
        "email": "admin@example.com",
        "role": "SUPER_ADMIN",
        "last_login": "2024-01-01T00:00:00.000Z"
      }
    }
  }
  ```
- **Response Error**:
  ```json
  {
    "success": false,
    "message": "Username atau password salah"
  }
  ```

### 3. Frontend Login Page
- **File**: `app/admin/login/page.jsx`
- **Fitur**:
  - Form validasi
  - Loading state
  - Error handling
  - Integration dengan API login
  - Session management (localStorage)

### 4. Script Admin Management
- **File**: `scripts/create-admin.js`
- **Command**: `npm run create-admin`
- **Fitur**:
  - Membuat admin default
  - Cek admin yang sudah ada
  - Hash password otomatis

## Setup dan Instalasi

### 1. Install Dependencies
```bash
npm install bcryptjs
```

### 2. Setup Database
Proyek mendukung SQLite (development) dan PostgreSQL (production):

**Development (SQLite)**:
- Tidak perlu setup tambahan
- Database file: `database.sqlite`

**Production (PostgreSQL)**:
- Set environment variable `DATABASE_URL`
- Format: `postgresql://username:password@host:port/database`

### 3. Buat Admin Default
```bash
npm run create-admin
```

Output:
```
✅ Default admin created successfully!
📊 Admin details:
   ID: acd0bbf3-c260-4565-b5c5-65fb9d0390b3
   Username: admin
   Email: admin@diskominfo.bogor.go.id
   Role: SUPER_ADMIN
   Active: true

🔐 Login credentials:
   Username: admin
   Password: admin123
```

### 4. Jalankan Development Server
```bash
npm run dev
```

### 5. Akses Login Page
- URL: `http://localhost:3000/admin/login`
- Username: `admin`
- Password: `admin123`

## Keamanan

### 1. Password Hashing
- Menggunakan bcrypt dengan salt rounds 12
- Hashing otomatis saat create/update
- Method `comparePassword()` untuk validasi

### 2. Input Validation
- Validasi panjang username (3-50 karakter)
- Validasi panjang password (min 6 karakter)
- Validasi format email
- Sanitasi input

### 3. Error Handling
- Pesan error yang konsisten
- Tidak expose informasi sensitif
- Logging untuk debugging

## Database Schema

### Table: admins
```sql
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  role ENUM('ADMIN', 'SUPER_ADMIN') DEFAULT 'ADMIN',
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Usage Examples

### JavaScript/Fetch
```javascript
const loginAdmin = async (username, password) => {
  try {
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        password,
      }),
    });

    const data = await response.json();
    
    if (data.success) {
      // Login berhasil
      localStorage.setItem('adminLoggedIn', 'true');
      localStorage.setItem('adminData', JSON.stringify(data.data.admin));
      return data.data.admin;
    } else {
      // Login gagal
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};
```

### cURL
```bash
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

## Troubleshooting

### 1. Database Connection Error
- Pastikan SQLite file dapat diakses
- Untuk PostgreSQL, pastikan DATABASE_URL benar
- Check network connectivity

### 2. Admin Tidak Bisa Login
- Pastikan admin sudah dibuat dengan `npm run create-admin`
- Check username dan password
- Pastikan admin status aktif

### 3. API Error 500
- Check console log untuk detail error
- Pastikan database models sudah sync
- Restart development server

## Development Notes

- Model Admin menggunakan hooks Sequelize untuk hashing password
- Frontend menggunakan localStorage untuk session management
- API mengembalikan data admin tanpa password untuk keamanan
- Last login diupdate otomatis setelah login berhasil

## Production Considerations

1. **Session Management**: Gunakan JWT atau session server-side
2. **Rate Limiting**: Implementasi rate limiting untuk login attempts
3. **Audit Log**: Log semua aktivitas login
4. **Password Policy**: Enforce password complexity rules
5. **Two-Factor Authentication**: Tambahkan 2FA untuk keamanan ekstra
