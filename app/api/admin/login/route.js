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
          message: "Username dan password wajib diisi" 
        },
        { status: 400 }
      );
    }

    // Find admin by username (avoid selecting missing columns like role)
    const admin = await Admin.findOne({
      // Select only safe columns
      attributes: ["id", "password", "email"],
      where: {
        email: loginId,
      },
    });

    if (!admin) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Username atau password salah" 
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
          message: "Username atau password salah" 
        },
        { status: 401 }
      );
    }

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
      message: "Login berhasil",
      data: {
        admin: adminData,
      },
    });

  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Terjadi kesalahan internal server" 
      },
      { status: 500 }
    );
  }
}
