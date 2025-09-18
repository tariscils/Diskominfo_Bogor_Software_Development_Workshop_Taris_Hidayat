# Admin Dashboard - Fitur Search dan Sort

## Overview
Halaman admin dashboard telah diupdate dengan fitur search dan sort yang lengkap, menggunakan API submissions yang baru dengan pagination.

## Fitur yang Ditambahkan

### 🔍 **Search (Pencarian)**
- **Input Field**: Search box dengan placeholder "Cari berdasarkan nama, email, atau tracking code..."
- **Real-time Search**: Pencarian dilakukan saat user menekan Enter atau klik tombol search
- **Multiple Field Search**: Mencari berdasarkan:
  - Nama pengaju
  - Email pengaju
  - Tracking code
- **Loading State**: Menampilkan loading indicator saat search sedang berjalan
- **Case-insensitive**: Pencarian tidak case-sensitive

### 📊 **Sort (Pengurutan)**
- **Sort Field Dropdown**: Pilih field untuk sorting:
  - Tanggal Dibuat (createdAt)
  - Status
  - Nama
  - Email
- **Sort Order Dropdown**: Pilih urutan:
  - ↓ Desc (Descending - Z ke A, baru ke lama)
  - ↑ Asc (Ascending - A ke Z, lama ke baru)
- **Default Sort**: Tanggal Dibuat Desc (data terbaru di atas)

### 🔧 **Filter Status**
- **Status Filter**: Filter berdasarkan status pengajuan:
  - Semua Status
  - Pengajuan Baru
  - Sedang Diproses
  - Selesai
  - Ditolak
- **Real-time Filter**: Filter langsung diterapkan saat dropdown berubah

### 📄 **Pagination**
- **Server-side Pagination**: Pagination dilakukan di server untuk performa optimal
- **Page Size Options**: 10, 20, 50, 100 items per halaman
- **Navigation**: Previous/Next buttons dan page numbers
- **Quick Jumper**: Lompat langsung ke halaman tertentu
- **Total Count**: Menampilkan "X-Y dari Z pengajuan"

## UI Components

### Search Controls
```jsx
<Input.Search
  placeholder="Cari berdasarkan nama, email, atau tracking code..."
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  onSearch={handleSearch}
  enterButton={<SearchOutlined />}
  loading={searchLoading}
  disabled={loading || Object.values(updatingStatus).some(Boolean)}
  size="middle"
/>
```

### Sort Controls
```jsx
<div className="flex gap-2">
  <Select
    value={sortField}
    onChange={(value) => handleSortChange(value, sortOrder)}
    style={{ minWidth: 120 }}
    disabled={loading || Object.values(updatingStatus).some(Boolean)}
    size="middle"
  >
    <Option value="createdAt">Tanggal Dibuat</Option>
    <Option value="status">Status</Option>
    <Option value="nama">Nama</Option>
    <Option value="email">Email</Option>
  </Select>
  
  <Select
    value={sortOrder}
    onChange={(value) => handleSortChange(sortField, value)}
    style={{ minWidth: 80 }}
    disabled={loading || Object.values(updatingStatus).some(Boolean)}
    size="middle"
  >
    <Option value="DESC">↓ Desc</Option>
    <Option value="ASC">↑ Asc</Option>
  </Select>
</div>
```

### Status Filter
```jsx
<Select
  value={statusFilter}
  onChange={handleStatusFilterChange}
  style={{ minWidth: 150 }}
  placeholder="Filter by status"
  disabled={loading || Object.values(updatingStatus).some(Boolean)}
  loading={loading}
  size="middle"
>
  <Option value="ALL">Semua Status</Option>
  <Option value="PENGAJUAN_BARU">Pengajuan Baru</Option>
  <Option value="DIPROSES">Sedang Diproses</Option>
  <Option value="SELESAI">Selesai</Option>
  <Option value="DITOLAK">Ditolak</Option>
</Select>
```

## State Management

### New State Variables
```javascript
const [searchQuery, setSearchQuery] = useState("");
const [sortField, setSortField] = useState("createdAt");
const [sortOrder, setSortOrder] = useState("DESC");
const [currentPage, setCurrentPage] = useState(1);
const [pageSize, setPageSize] = useState(10);
const [totalCount, setTotalCount] = useState(0);
const [searchLoading, setSearchLoading] = useState(false);
```

### Handler Functions
```javascript
// Handle search
const handleSearch = (value) => {
  setSearchQuery(value);
  setCurrentPage(1);
  fetchSubmissions(false, { 
    q: value, 
    sort: sortField, 
    order: sortOrder, 
    page: 1, 
    status: statusFilter === "ALL" ? "" : statusFilter 
  });
};

// Handle sort change
const handleSortChange = (field, order) => {
  setSortField(field);
  setSortOrder(order);
  setCurrentPage(1);
  fetchSubmissions(false, { 
    q: searchQuery, 
    sort: field, 
    order: order, 
    page: 1, 
    status: statusFilter === "ALL" ? "" : statusFilter 
  });
};

// Handle status filter change
const handleStatusFilterChange = (value) => {
  setStatusFilter(value);
  setCurrentPage(1);
  fetchSubmissions(false, { 
    q: searchQuery, 
    sort: sortField, 
    order: sortOrder, 
    page: 1, 
    status: value === "ALL" ? "" : value 
  });
};

// Handle pagination change
const handlePageChange = (page, size) => {
  setCurrentPage(page);
  setPageSize(size);
  fetchSubmissions(false, { 
    q: searchQuery, 
    sort: sortField, 
    order: sortOrder, 
    page: page, 
    limit: size,
    status: statusFilter === "ALL" ? "" : statusFilter 
  });
};
```

## API Integration

### Updated fetchSubmissions Function
```javascript
const fetchSubmissions = async (showLoading = false, searchParams = {}) => {
  if (showLoading) {
    setRefreshing(true);
  }
  setSearchLoading(true);

  try {
    // Build query parameters
    const params = new URLSearchParams();
    
    // Use provided searchParams or current state
    const query = searchParams.q !== undefined ? searchParams.q : searchQuery;
    const sort = searchParams.sort !== undefined ? searchParams.sort : sortField;
    const order = searchParams.order !== undefined ? searchParams.order : sortOrder;
    const page = searchParams.page !== undefined ? searchParams.page : currentPage;
    const limit = searchParams.limit !== undefined ? searchParams.limit : pageSize;
    const status = searchParams.status !== undefined ? searchParams.status : (statusFilter === "ALL" ? "" : statusFilter);

    if (query) params.append("q", query);
    if (sort) params.append("sort", sort);
    if (order) params.append("order", order);
    if (page) params.append("page", page.toString());
    if (limit) params.append("limit", limit.toString());
    if (status) params.append("status", status);

    const response = await fetch(`/api/submissions?${params.toString()}`, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
        Pragma: "no-cache",
        "X-Requested-With": "XMLHttpRequest",
      },
      cache: "no-store",
    });
    
    const data = await response.json();

    if (response.ok && data.success) {
      setSubmissions(data.data);
      setTotalCount(data.pagination.totalCount);
      updateChartData(data.data);
      if (showLoading) {
        message.success("Data berhasil diperbarui");
      }
    } else {
      message.error(data.message || "Gagal memuat data pengajuan");
    }
  } catch (error) {
    message.error("Terjadi kesalahan jaringan");
  } finally {
    setLoading(false);
    setSearchLoading(false);
    if (showLoading) {
      setRefreshing(false);
    }
  }
};
```

## Table Updates

### New Table Configuration
```javascript
<Table
  columns={columns}
  dataSource={submissions}
  rowKey="id"
  loading={loading || searchLoading}
  scroll={{ x: 800, y: 400 }}
  pagination={{
    current: currentPage,
    pageSize: pageSize,
    total: totalCount,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total, range) =>
      `${range[0]}-${range[1]} dari ${total} pengajuan`,
    size: "small",
    responsive: true,
    pageSizeOptions: ['10', '20', '50', '100'],
    onChange: handlePageChange,
    onShowSizeChange: handlePageChange,
  }}
  size="small"
  className="responsive-table"
  bordered={false}
  tableLayout="fixed"
/>
```

### New Email Column
```javascript
{
  title: "Email",
  dataIndex: "email",
  key: "email",
  width: 150,
  responsive: ["lg"],
  render: (text) => (
    <div className="max-w-[120px] sm:max-w-[150px]">
      <span
        className="text-xs sm:text-sm break-words leading-tight"
        title={text}
      >
        {text || "-"}
      </span>
    </div>
  ),
}
```

## Responsive Design

### Mobile Optimizations
- **Flexible Layout**: Search dan sort controls responsive untuk mobile
- **Stacked Layout**: Controls stack vertically pada mobile
- **Touch-friendly**: Button sizes optimized untuk touch devices
- **Compact UI**: Efficient use of screen space

### Breakpoints
- **Mobile**: `< 768px` - Controls stack vertically
- **Tablet**: `768px - 1024px` - Mixed layout
- **Desktop**: `> 1024px` - Full horizontal layout

## Performance Features

### Server-side Processing
- **Database-level Search**: Search dilakukan di database, bukan di client
- **Server-side Sorting**: Sorting dilakukan di database
- **Server-side Pagination**: Hanya data yang diperlukan yang dikirim
- **Efficient Queries**: Menggunakan Sequelize dengan optimized queries

### Caching
- **Response Caching**: API responses memiliki cache headers yang sesuai
- **State Persistence**: Search dan sort state dipertahankan selama session
- **Optimistic Updates**: UI updates immediately, server syncs in background

## Error Handling

### Loading States
- **Search Loading**: Loading indicator saat search
- **General Loading**: Loading indicator saat fetch data
- **Status Update Loading**: Loading indicator saat update status
- **Disabled States**: Controls disabled saat loading

### Error Messages
- **Network Errors**: "Terjadi kesalahan jaringan"
- **API Errors**: Pesan error dari server
- **Validation Errors**: Input validation feedback

## Usage Examples

### Basic Search
1. Masukkan keyword di search box
2. Tekan Enter atau klik tombol search
3. Data akan ter-filter berdasarkan keyword

### Sort by Status
1. Pilih "Status" dari sort field dropdown
2. Pilih "↑ Asc" untuk ascending atau "↓ Desc" untuk descending
3. Data akan ter-sort berdasarkan status

### Filter by Status
1. Pilih status dari status filter dropdown
2. Data akan ter-filter berdasarkan status yang dipilih

### Pagination
1. Gunakan pagination controls di bawah tabel
2. Pilih page size dari dropdown
3. Navigate menggunakan page numbers atau previous/next buttons

## Migration Notes

### Changes from Previous Version
1. **API Endpoint**: Changed from `/api/admin/submissions` to `/api/submissions`
2. **Response Format**: New response format with pagination info
3. **Client-side Filtering**: Removed client-side filtering, now server-side
4. **State Management**: Added new state variables for search/sort/pagination
5. **UI Components**: Added search input and sort dropdowns

### Backward Compatibility
- **Status Update**: Status update functionality remains the same
- **Chart Data**: Chart still works with filtered data
- **Responsive Design**: All responsive features maintained
- **Authentication**: Authentication flow unchanged
