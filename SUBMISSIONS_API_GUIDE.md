# API Submissions dengan Search dan Sorting

## Overview
API submissions yang telah diupdate dengan fitur pencarian (search), sorting, filtering, dan pagination menggunakan Sequelize ORM.

## Endpoint
```
GET /api/submissions
```

## Query Parameters

### 1. Search (q)
- **Parameter**: `q`
- **Type**: String
- **Description**: Mencari berdasarkan nama, email, atau tracking code
- **Example**: `?q=admin` atau `?q=test@example.com`

### 2. Sorting
- **Parameter**: `sort`
- **Type**: String
- **Options**: `createdAt`, `status`, `nama`, `email`
- **Description**: Field yang digunakan untuk sorting
- **Example**: `?sort=status`

### 3. Order
- **Parameter**: `order`
- **Type**: String
- **Options**: `ASC`, `DESC`
- **Default**: `DESC`
- **Description**: Urutan sorting (ascending/descending)
- **Example**: `?order=ASC`

### 4. Pagination
- **Parameter**: `page`
- **Type**: Number
- **Default**: `1`
- **Description**: Nomor halaman
- **Example**: `?page=2`

- **Parameter**: `limit`
- **Type**: Number
- **Default**: `10`
- **Max**: `100`
- **Description**: Jumlah data per halaman
- **Example**: `?limit=20`

### 5. Filter Status
- **Parameter**: `status`
- **Type**: String
- **Options**: `PENGAJUAN_BARU`, `DIPROSES`, `SELESAI`, `DITOLAK`
- **Description**: Filter berdasarkan status pengajuan
- **Example**: `?status=PENGAJUAN_BARU`

## Response Format

### Success Response
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "tracking_code": "WS-1234567890-ABC123",
      "nama": "John Doe",
      "email": "john@example.com",
      "jenis_layanan": "KTP",
      "status": "PENGAJUAN_BARU",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalCount": 47,
    "limit": 10,
    "hasNextPage": true,
    "hasPrevPage": false,
    "nextPage": 2,
    "prevPage": null
  },
  "filters": {
    "search": "admin",
    "status": null,
    "sort": "createdAt",
    "order": "DESC"
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Terjadi kesalahan internal server",
  "error": "Detailed error message (development only)"
}
```

## Usage Examples

### 1. Basic Request
```bash
GET /api/submissions
```

### 2. Search by Name or Email
```bash
GET /api/submissions?q=john
```

### 3. Sort by Status (Ascending)
```bash
GET /api/submissions?sort=status&order=ASC
```

### 4. Pagination
```bash
GET /api/submissions?page=2&limit=5
```

### 5. Filter by Status
```bash
GET /api/submissions?status=PENGAJUAN_BARU
```

### 6. Complex Query
```bash
GET /api/submissions?q=admin&sort=createdAt&order=DESC&page=1&limit=10&status=DIPROSES
```

## JavaScript/Fetch Examples

### Basic Fetch
```javascript
const fetchSubmissions = async () => {
  try {
    const response = await fetch('/api/submissions');
    const data = await response.json();
    
    if (data.success) {
      console.log('Submissions:', data.data);
      console.log('Pagination:', data.pagination);
    } else {
      console.error('Error:', data.message);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
};
```

### Search with Pagination
```javascript
const searchSubmissions = async (query, page = 1, limit = 10) => {
  try {
    const params = new URLSearchParams({
      q: query,
      page: page.toString(),
      limit: limit.toString()
    });
    
    const response = await fetch(`/api/submissions?${params}`);
    const data = await response.json();
    
    return data;
  } catch (error) {
    console.error('Search error:', error);
    return { success: false, message: 'Search failed' };
  }
};
```

### Advanced Query Builder
```javascript
const buildSubmissionsQuery = (options = {}) => {
  const {
    search,
    sort = 'createdAt',
    order = 'DESC',
    page = 1,
    limit = 10,
    status
  } = options;
  
  const params = new URLSearchParams();
  
  if (search) params.append('q', search);
  if (sort) params.append('sort', sort);
  if (order) params.append('order', order);
  if (page) params.append('page', page.toString());
  if (limit) params.append('limit', limit.toString());
  if (status) params.append('status', status);
  
  return `/api/submissions?${params.toString()}`;
};

// Usage
const queryUrl = buildSubmissionsQuery({
  search: 'admin',
  sort: 'status',
  order: 'ASC',
  page: 2,
  limit: 5,
  status: 'PENGAJUAN_BARU'
});
```

## cURL Examples

### Basic Request
```bash
curl -X GET "http://localhost:3000/api/submissions"
```

### Search Request
```bash
curl -X GET "http://localhost:3000/api/submissions?q=admin"
```

### Sort Request
```bash
curl -X GET "http://localhost:3000/api/submissions?sort=status&order=ASC"
```

### Complex Request
```bash
curl -X GET "http://localhost:3000/api/submissions?q=test&sort=createdAt&order=DESC&page=1&limit=5&status=PENGAJUAN_BARU"
```

## Features

### 1. Search Functionality
- **Case-insensitive search** menggunakan `iLike` operator
- **Multiple field search**: nama, email, tracking_code
- **Partial matching**: mencari substring dalam field

### 2. Sorting
- **Multiple sort fields**: createdAt, status, nama, email
- **Flexible order**: ASC/DESC
- **Default sorting**: createdAt DESC

### 3. Pagination
- **Page-based pagination**
- **Configurable limit** (max 100 items)
- **Complete pagination info** dalam response
- **Navigation helpers**: hasNextPage, hasPrevPage

### 4. Filtering
- **Status filter**: Filter berdasarkan status pengajuan
- **Case-insensitive**: Status otomatis di-convert ke uppercase

### 5. Performance
- **Database-level filtering**: Semua filter dilakukan di database
- **Indexed queries**: Menggunakan index pada field yang umum dicari
- **Caching headers**: Response dengan cache control yang sesuai

## Database Schema

### Submissions Table
```sql
CREATE TABLE submissions (
  id UUID PRIMARY KEY,
  tracking_code VARCHAR UNIQUE NOT NULL,
  nama VARCHAR NOT NULL,
  nik VARCHAR(16) NOT NULL,
  email VARCHAR,
  no_wa VARCHAR NOT NULL,
  jenis_layanan VARCHAR NOT NULL,
  status ENUM('PENGAJUAN_BARU', 'DIPROSES', 'SELESAI', 'DITOLAK') DEFAULT 'PENGAJUAN_BARU',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Error Handling

### Common Errors
- **400 Bad Request**: Invalid parameters
- **500 Internal Server Error**: Database atau server error

### Error Response Format
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error (development only)"
}
```

## Best Practices

### 1. Pagination
- Gunakan pagination untuk dataset besar
- Limit maksimal 100 items per request
- Implement client-side pagination controls

### 2. Search
- Gunakan search untuk dataset besar
- Implement debouncing pada search input
- Berikan feedback loading saat search

### 3. Sorting
- Default sort by createdAt DESC untuk data terbaru
- Implement sort indicators di UI
- Persist sort preferences

### 4. Caching
- Response memiliki cache headers yang sesuai
- Implement client-side caching untuk data yang jarang berubah
- Gunakan ETags untuk conditional requests

## Migration Notes

### Changes from Previous Version
1. **Response format**: Sekarang menggunakan struktur `{success, data, pagination, filters}`
2. **Query parameters**: Mendukung multiple parameters
3. **Search functionality**: Baru ditambahkan
4. **Pagination**: Baru ditambahkan
5. **Error handling**: Improved error responses

### Backward Compatibility
- Endpoint URL tetap sama: `/api/submissions`
- POST method untuk create submission tetap sama
- Response structure berubah, pastikan update client code
