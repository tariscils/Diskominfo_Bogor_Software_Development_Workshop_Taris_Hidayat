import { NextResponse } from "next/server";
import { Submission, NotificationLog, initializeDatabase } from "@/lib/sequelize";
import { Op } from "sequelize";
import { normalizePhoneNumber } from "@/lib/phone";
import { sendInitialSubmissionNotification } from "@/lib/notify/sicuba";

// Initialize database on first request
let dbInitialized = false;
const initDB = async () => {
  if (!dbInitialized) {
    await initializeDatabase();
    dbInitialized = true;
  }
};

export async function GET(request) {
  try {
    await initDB();

    // Parse query parameters
    const url = new URL(request.url);
    const {
      q: searchQuery,
      sort,
      order = "DESC",
      page = "1",
      limit = "10",
      status
    } = Object.fromEntries(url.searchParams);

    console.log(`[${new Date().toISOString()}] Fetching submissions with params:`, {
      searchQuery,
      sort,
      order,
      page,
      limit,
      status
    });

    // Build where clause for search
    const whereClause = {};
    
    // Search by name or email
    if (searchQuery && searchQuery.trim()) {
      whereClause[Op.or] = [
        {
          nama: {
            [Op.iLike]: `%${searchQuery.trim()}%`
          }
        },
        {
          email: {
            [Op.iLike]: `%${searchQuery.trim()}%`
          }
        },
        {
          tracking_code: {
            [Op.iLike]: `%${searchQuery.trim()}%`
          }
        }
      ];
    }

    // Filter by status
    if (status && status.trim()) {
      whereClause.status = status.trim().toUpperCase();
    }

    // Build order clause
    let orderClause = [["created_at", "DESC"]]; // Default order
    
    if (sort) {
      const validSortFields = ["createdAt", "status", "nama", "email"];
      const validSortField = validSortFields.find(field => 
        sort.toLowerCase() === field.toLowerCase() ||
        sort.toLowerCase() === field.replace(/([A-Z])/g, '_$1').toLowerCase()
      );
      
      if (validSortField) {
        const dbField = validSortField === "createdAt" ? "created_at" : 
                       validSortField === "nama" ? "nama" :
                       validSortField === "email" ? "email" :
                       validSortField;
        
        const validOrder = ["ASC", "DESC"].includes(order.toUpperCase()) ? 
                          order.toUpperCase() : "DESC";
        
        orderClause = [[dbField, validOrder]];
      }
    }

    // Parse pagination
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
    const offset = (pageNum - 1) * limitNum;

    // Get total count for pagination
    const totalCount = await Submission.count({ where: whereClause });

    // Fetch submissions with pagination
    const submissions = await Submission.findAll({
      where: whereClause,
      order: orderClause,
      limit: limitNum,
      offset: offset,
      attributes: [
        "id",
        "tracking_code",
        "nama",
        "email",
        "jenis_layanan",
        "status",
        "created_at",
        "updated_at",
      ],
    });

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    console.log(`[${new Date().toISOString()}] Found ${submissions.length} submissions (${totalCount} total)`);

    // Build response
    const responseData = {
      success: true,
      data: submissions,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        limit: limitNum,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? pageNum + 1 : null,
        prevPage: hasPrevPage ? pageNum - 1 : null,
      },
      filters: {
        search: searchQuery || null,
        status: status || null,
        sort: sort || "createdAt",
        order: order.toUpperCase(),
      }
    };

    const response = NextResponse.json(responseData);

    // Set cache headers
    response.headers.set(
      "Cache-Control",
      "private, max-age=30, stale-while-revalidate=60"
    );

    return response;
  } catch (error) {
    console.error("Error fetching submissions:", error);

    return NextResponse.json(
      { 
        success: false,
        message: "Terjadi kesalahan internal server",
        error: process.env.NODE_ENV === "development" ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await initDB();

    const body = await request.json();

    // Validate required fields with detailed errors
    const { nama, nik, email, no_wa, jenis_layanan, consent } = body;

    const errors = {};
    if (!nama || !nama.trim()) {
      errors.nama = "Nama lengkap wajib diisi";
    }
    if (!nik || !nik.trim()) {
      errors.nik = "NIK wajib diisi";
    } else if (!/^\d{16}$/.test(nik)) {
      errors.nik = "NIK harus 16 digit angka";
    }
    if (!email || !email.trim()) {
      errors.email = "Email wajib diisi";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Format email tidak valid";
    }
    if (!no_wa || !no_wa.trim()) {
      errors.no_wa = "Nomor WhatsApp wajib diisi";
    } else if (!/^\d+$/.test(no_wa.replace(/\D/g, ""))) {
      errors.no_wa = "Nomor WhatsApp harus angka";
    }
    if (!jenis_layanan || !jenis_layanan.trim()) {
      errors.jenis_layanan = "Jenis layanan wajib dipilih";
    }
    if (!consent) {
      errors.consent = "Anda harus menyetujui pemberian notifikasi";
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Validasi gagal. Periksa isian Anda.",
          errors,
        },
        { status: 400 }
      );
    }

    // Generate tracking code
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const tracking_code = `WS-${timestamp}-${random}`;

    // Normalize phone number to +62 format
    const normalizedPhone = normalizePhoneNumber(no_wa);

    // Create submission
    const submission = await Submission.create({
      tracking_code,
      nama,
      nik,
      jenis_layanan,
      email,
      no_wa: normalizedPhone,
      consent,
      status: "PENGAJUAN_BARU",
    });

    console.log(
      `[${new Date().toISOString()}] Created submission: ${tracking_code}`
    );

    // Send initial WhatsApp notification
    try {
      const waResult = await sendInitialSubmissionNotification(submission);
      await NotificationLog.create({
        submission_id: submission.id,
        channel: "WHATSAPP",
        send_status: waResult.success ? "SUCCESS" : "FAILED",
        payload: {
          to: submission.no_wa,
          status: "PENGAJUAN_BARU",
          result: waResult,
        },
      });
      console.log(`[${new Date().toISOString()}] Initial WhatsApp notification sent:`, waResult.success ? "SUCCESS" : "FAILED");
    } catch (notificationError) {
      console.error("Error sending initial WhatsApp notification:", notificationError);
      // Don't fail the submission creation if notification fails
    }

    return NextResponse.json(
      {
        success: true,
        message: "Pengajuan berhasil dibuat",
        tracking_code: submission.tracking_code,
        submission: submission,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating submission:", error);

    return NextResponse.json(
      { message: "Terjadi kesalahan internal server" },
      { status: 500 }
    );
  }
}
