"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Table, Select, message, Card, Row, Col, Input, Button, Space } from "antd";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { SearchOutlined, ReloadOutlined } from "@ant-design/icons";

const { Option } = Select;

export default function AdminDashboard() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [chartData, setChartData] = useState([]);
  const [updatingStatus, setUpdatingStatus] = useState({}); // Track which submission is being updated
  const [refreshing, setRefreshing] = useState(false); // Track refresh loading state
  
  // New state for search and sort
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("DESC");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchLoading, setSearchLoading] = useState(false);

  const COLORS = ["#ffc107", "#1890ff", "#52c41a", "#ff4d4f"];

  useEffect(() => {
    // Check if admin is logged in
    const checkAuth = () => {
      const isLoggedIn = localStorage.getItem("adminLoggedIn");
      console.log("Auth check - isLoggedIn:", isLoggedIn); // Debug log
      if (!isLoggedIn) {
        console.log("Not logged in, redirecting to login"); // Debug log
        router.push("/admin/login");
        return;
      }
      console.log("Logged in, fetching submissions"); // Debug log
      fetchSubmissions();
    };

    // Add a small delay to ensure localStorage is available
    setTimeout(checkAuth, 100);
  }, [router]);

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

  // Simple refresh function
  const handleRefresh = () => {
    setCurrentPage(1);
    fetchSubmissions(true);
  };

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

  const updateChartData = (data) => {
    const statusCount = data.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {});

    const chartData = Object.entries(statusCount).map(([status, count]) => ({
      name: getStatusText(status),
      value: count,
      status,
    }));

    setChartData(chartData);
  };

  const getStatusText = (status) => {
    switch (status) {
      case "PENGAJUAN_BARU":
        return "Pengajuan Baru";
      case "DIPROSES":
        return "Sedang Diproses";
      case "SELESAI":
        return "Selesai";
      case "DITOLAK":
        return "Ditolak";
      default:
        return status;
    }
  };

  const handleStatusChange = async (submissionId, newStatus) => {
    // Set loading state for this specific submission
    setUpdatingStatus((prev) => ({ ...prev, [submissionId]: true }));

    try {
      const response = await fetch(
        `/api/admin/submissions/${submissionId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
            "X-Requested-With": "XMLHttpRequest",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (response.ok) {
        message.success("Status berhasil diupdate");
        // Refresh data after status update
        setTimeout(() => {
          fetchSubmissions(true, { 
            q: searchQuery, 
            sort: sortField, 
            order: sortOrder, 
            page: currentPage, 
            limit: pageSize,
            status: statusFilter === "ALL" ? "" : statusFilter 
          });
        }, 500);
      } else {
        const error = await response.json();
        message.error(error.message || "Gagal mengupdate status");
      }
    } catch (error) {
      message.error("Terjadi kesalahan jaringan");
    } finally {
      // Clear loading state after extended delay to ensure data is fresh
      setTimeout(() => {
        setUpdatingStatus((prev) => ({ ...prev, [submissionId]: false }));
      }, 2500); // Total loading time: 2.5 seconds
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminLoggedIn");
    router.push("/admin/login");
  };

  const columns = [
    {
      title: "Kode Tracking",
      dataIndex: "tracking_code",
      key: "tracking_code",
      render: (text) => (
        <div className="max-w-[120px] sm:max-w-[200px] lg:max-w-[300px]">
          <span
            className="font-mono text-xs sm:text-sm break-all leading-tight"
            title={text}
          >
            {text}
          </span>
        </div>
      ),
      width: 200,
      fixed: "left",
    },
    {
      title: "Nama",
      dataIndex: "nama",
      key: "nama",
      width: 120,
      render: (text) => (
        <div className="max-w-[80px] sm:max-w-[120px]">
          <span
            className="text-xs sm:text-sm break-words leading-tight"
            title={text}
          >
            {text}
          </span>
        </div>
      ),
    },
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
    },
    {
      title: "Jenis Layanan",
      dataIndex: "jenis_layanan",
      key: "jenis_layanan",
      width: 120,
      render: (text) => (
        <div className="max-w-[80px] sm:max-w-[120px]">
          <span
            className="text-xs sm:text-sm break-words leading-tight"
            title={text}
          >
            {text}
          </span>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 180,
      render: (status, record) => (
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
          <Select
            value={status}
            style={{ width: "100%", minWidth: "100px", maxWidth: "150px" }}
            onChange={(value) => handleStatusChange(record.id, value)}
            disabled={updatingStatus[record.id]}
            loading={updatingStatus[record.id]}
            size="small"
          >
            <Option value="PENGAJUAN_BARU">Pengajuan Baru</Option>
            <Option value="DIPROSES">Sedang Diproses</Option>
            <Option value="SELESAI">Selesai</Option>
            <Option value="DITOLAK">Ditolak</Option>
          </Select>
          {updatingStatus[record.id] && (
            <div className="flex items-center text-blue-600 text-xs sm:text-sm">
              <svg
                className="animate-spin h-3 w-3 sm:h-4 sm:w-4 mr-1"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span className="hidden sm:inline">Updating...</span>
              <span className="sm:hidden">...</span>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Dibuat",
      dataIndex: "created_at",
      key: "created_at",
      width: 150,
      responsive: ["lg"],
      render: (date) => {
        if (!date) return "-";
        try {
          const formattedDate = new Date(date).toLocaleString("id-ID", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          });
          return (
            <div className="max-w-[100px] sm:max-w-[150px]">
              <span
                className="text-xs sm:text-sm break-words leading-tight"
                title={formattedDate}
              >
                {formattedDate}
              </span>
            </div>
          );
        } catch (error) {
          return "-";
        }
      },
    },
    {
      title: "Diupdate",
      dataIndex: "updated_at",
      key: "updated_at",
      width: 150,
      responsive: ["lg"],
      render: (date) => {
        if (!date) return "-";
        try {
          const formattedDate = new Date(date).toLocaleString("id-ID", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          });
          return (
            <div className="max-w-[100px] sm:max-w-[150px]">
              <span
                className="text-xs sm:text-sm break-words leading-tight"
                title={formattedDate}
              >
                {formattedDate}
              </span>
            </div>
          );
        } catch (error) {
          return "-";
        }
      },
    },
  ];

  // No need for client-side filtering since API handles it

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                {loading
                  ? "Memuat data pengajuan..."
                  : "Kelola pengajuan layanan masyarakat"}
              </p>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={handleRefresh}
                disabled={refreshing || loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center text-sm sm:text-base mr-2"
              >
                {refreshing ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Refreshing...
                  </>
                ) : loading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Loading...
                  </>
                ) : (
                  "Refresh"
                )}
              </button>

              {/* Force Refresh Button - Hidden for production */}
              {/* <button
                 onClick={() => {
                   // Force hard refresh
                   window.location.reload();
                 }}
                 disabled={refreshing || loading}
                 className="bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center text-sm sm:text-base mr-2"
                 title="Force hard refresh untuk bypass semua cache"
               >
                 <svg
                   className="w-4 h-4 mr-1"
                   fill="none"
                   stroke="currentColor"
                   viewBox="0 0 24 24"
                 >
                   <path
                     strokeLinecap="round"
                     strokeLinejoin="round"
                     strokeWidth={2}
                     d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                   />
                 </svg>
                 Force Refresh
               </button> */}

              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-8">
        {/* Debug Info - Hidden for production */}
        {/* <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
           <div className="flex items-center">
             <svg
               className="w-5 h-5 text-yellow-600 mr-2"
               fill="none"
               stroke="currentColor"
               viewBox="0 0 24 24"
             >
               <path
                 strokeLinecap="round"
                 strokeLinejoin="round"
                 strokeWidth={2}
                 d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
               />
             </svg>
             <div className="text-sm text-yellow-800">
               <strong>Cache Bypass Active:</strong> Data akan auto-refresh
               setelah status update. Loading state extended untuk memastikan
               data fresh.
             </div>
           </div>
         </div> */}

        {/* Stats Cards */}
        <Row gutter={[8, 8]} className="mb-6 sm:mb-8">
          <Col xs={12} sm={6}>
            <Card>
              <div className="text-center">
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg
                      className="animate-spin h-5 w-5 sm:h-6 sm:w-6 text-blue-600"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  </div>
                ) : (
                  <div className="text-lg sm:text-2xl font-bold text-blue-600">
                    {totalCount}
                  </div>
                )}
                <div className="text-sm sm:text-base text-gray-600">
                  Total Pengajuan
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <div className="text-center">
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg
                      className="animate-spin h-5 w-5 sm:h-6 sm:w-6 text-yellow-600"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  </div>
                ) : (
                  <div className="text-lg sm:text-2xl font-bold text-yellow-600">
                    {
                      submissions.filter((s) => s.status === "PENGAJUAN_BARU")
                        .length
                    }
                  </div>
                )}
                <div className="text-sm sm:text-base text-gray-600">
                  Pengajuan Baru
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <div className="text-center">
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg
                      className="animate-spin h-5 w-5 sm:h-6 sm:w-6 text-blue-600"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  </div>
                ) : (
                  <div className="text-lg sm:text-2xl font-bold text-blue-600">
                    {submissions.filter((s) => s.status === "DIPROSES").length}
                  </div>
                )}
                <div className="text-sm sm:text-base text-gray-600">
                  Sedang Diproses
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <div className="text-center">
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg
                      className="animate-spin h-5 w-5 sm:h-6 sm:w-6 text-green-600"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  </div>
                ) : (
                  <div className="text-lg sm:text-2xl font-bold text-green-600">
                    {submissions.filter((s) => s.status === "SELESAI").length}
                  </div>
                )}
                <div className="text-sm sm:text-base text-gray-600">
                  Selesai
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Chart */}
        <Card title="Distribusi Status Pengajuan" className="mb-6 sm:mb-8">
          {loading ? (
            <div className="flex items-center justify-center h-[300px]">
              <div className="text-center">
                <svg
                  className="animate-spin h-8 w-8 sm:h-12 sm:w-12 text-blue-600 mx-auto mb-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <p className="text-gray-600">Memuat data chart...</p>
              </div>
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex items-center justify-center h-[300px]">
              <div className="text-center text-gray-500">
                <svg
                  className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <p className="text-base sm:text-lg font-medium">
                  Belum ada data
                </p>
                <p className="text-xs sm:text-sm">
                  Data chart akan muncul setelah ada pengajuan
                </p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Table */}
        <Card title="Daftar Pengajuan">
          {/* Search and Filter Controls */}
          <div className="mb-4 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search Input */}
              <div className="flex-1">
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
              </div>
              
              {/* Sort Controls */}
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
            </div>
            
            {/* Status Filter */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
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
              
              {loading && (
                <span className="text-xs sm:text-sm text-gray-500">
                  Memuat data...
                </span>
              )}
            </div>
          </div>

          <div className="relative">
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

            {/* Loading overlay when any status is being updated */}
            {Object.values(updatingStatus).some(Boolean) && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
                <div className="text-center">
                  <svg
                    className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-2"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <p className="text-blue-600 font-medium text-sm sm:text-base">
                    Memperbarui status...
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Custom CSS for responsive table */}
      <style jsx global>{`
        .responsive-table .ant-table {
          overflow-x: auto;
        }

        .responsive-table .ant-table-thead > tr > th,
        .responsive-table .ant-table-tbody > tr > td {
          padding: 8px 12px;
          word-wrap: break-word;
          word-break: break-word;
        }

        .responsive-table .ant-table-thead > tr > th {
          background-color: #fafafa;
          font-weight: 600;
          color: #262626;
        }

        .responsive-table .ant-table-tbody > tr:hover > td {
          background-color: #f5f5f5;
        }

        /* Mobile optimizations */
        @media (max-width: 768px) {
          .responsive-table .ant-table {
            font-size: 11px;
          }

          .responsive-table .ant-table-thead > tr > th,
          .responsive-table .ant-table-tbody > tr > td {
            padding: 4px 6px;
            font-size: 10px;
          }

          .responsive-table .ant-table-pagination {
            font-size: 11px;
          }

          .responsive-table .ant-table-scroll {
            overflow-x: auto;
          }

          /* Ensure tracking code doesn't overflow */
          .responsive-table .ant-table-tbody > tr > td:first-child {
            max-width: 80px;
            min-width: 80px;
          }

          /* Compact status column */
          .responsive-table .ant-table-tbody > tr > td:nth-child(4) {
            max-width: 140px;
            min-width: 140px;
          }

          /* Compact nama and jenis layanan columns */
          .responsive-table .ant-table-tbody > tr > td:nth-child(2),
          .responsive-table .ant-table-tbody > tr > td:nth-child(3) {
            max-width: 80px;
            min-width: 80px;
          }
        }

        /* Small mobile devices */
        @media (max-width: 480px) {
          .responsive-table .ant-table-thead > tr > th,
          .responsive-table .ant-table-tbody > tr > td {
            padding: 2px 4px;
            font-size: 9px;
          }

          .responsive-table .ant-table-tbody > tr > td:first-child {
            max-width: 70px;
            min-width: 70px;
          }

          .responsive-table .ant-table-tbody > tr > td:nth-child(2),
          .responsive-table .ant-table-tbody > tr > td:nth-child(3) {
            max-width: 70px;
            min-width: 70px;
          }

          .responsive-table .ant-table-tbody > tr > td:nth-child(4) {
            max-width: 120px;
            min-width: 120px;
          }
        }
      `}</style>
    </div>
  );
}
