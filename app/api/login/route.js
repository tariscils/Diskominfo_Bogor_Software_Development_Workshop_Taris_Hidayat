import { NextResponse } from "next/server";
import { Admin, initializeDatabase } from "@/lib/sequelize";

// Initialize database on first request
let dbInitialized = false;
const initDB = async () => {
  if (!dbInitialized) {
    await initializeDatabase();
    dbInitialized = true;
  }
};

export async function POST(request) {
  try {
    await initDB();

    const { username, password, email } = await request.json();

    // Validate input
    const loginId = (username || email || "").trim();
    if (!loginId || !password) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Username dan password wajib diisi",
          errors: {
            username: !loginId ? "Username wajib diisi" : null,
            password: !password ? "Password wajib diisi" : null
          }
        },
        { status: 400 }
      );
    }

    // Find admin by email (treat provided username as email for login)
    const admin = await Admin.findOne({
      // Select only safe columns that are commonly present
      attributes: ["id", "password", "email"],
      where: {
        email: loginId,
      },
    });

    if (!admin) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Username atau password salah",
          errors: {
            general: "Username atau password salah"
          }
        },
        { status: 401 }
      );
    }

    // Compare password
    const isPasswordValid = await admin.comparePassword(password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Username atau password salah",
          errors: {
            general: "Username atau password salah"
          }
        },
        { status: 401 }
      );
    }

    // Update last login (ignore if column doesn't exist)
    // Skip updating last_login to avoid touching non-existing columns

    // Return success response (without password)
    const adminData = {
      id: admin.id,
      username: admin.email,
      email: admin.email,
      role: "ADMIN",
    };

    return NextResponse.json({
      success: true,
      message: "Login berhasil! Mengalihkan ke dashboard...",
      data: {
        admin: adminData,
      },
    });

  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Terjadi kesalahan internal server. Silakan coba lagi.",
        errors: {
          general: "Terjadi kesalahan sistem. Silakan hubungi administrator."
        }
      },
      { status: 500 }
    );
  }
}
