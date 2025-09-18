const { Admin, initializeDatabase } = require("../lib/sequelize");

async function createDefaultAdmin() {
  try {
    console.log("🚀 Initializing database...");
    await initializeDatabase();

    console.log("👤 Creating default admin...");
    
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({
      where: { username: "admin" }
    });

    if (existingAdmin) {
      console.log("✅ Admin 'admin' already exists");
      console.log("📊 Admin details:");
      console.log(`   ID: ${existingAdmin.id}`);
      console.log(`   Username: ${existingAdmin.username}`);
      console.log(`   Email: ${existingAdmin.email || 'Not set'}`);
      console.log(`   Role: ${existingAdmin.role}`);
      console.log(`   Active: ${existingAdmin.is_active}`);
      console.log(`   Last Login: ${existingAdmin.last_login || 'Never'}`);
      return;
    }

    // Create default admin
    const admin = await Admin.create({
      username: "admin",
      password: "admin123", // This will be hashed automatically by the hook
      email: "admin@diskominfo.bogor.go.id",
      role: "SUPER_ADMIN",
      is_active: true,
    });

    console.log("✅ Default admin created successfully!");
    console.log("📊 Admin details:");
    console.log(`   ID: ${admin.id}`);
    console.log(`   Username: ${admin.username}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   Active: ${admin.is_active}`);
    console.log("\n🔐 Login credentials:");
    console.log("   Username: admin");
    console.log("   Password: admin123");
    console.log("\n⚠️  Please change the default password after first login!");

  } catch (error) {
    console.error("❌ Error creating admin:", error);
    process.exit(1);
  }
}

// Run the script
createDefaultAdmin()
  .then(() => {
    console.log("\n🎉 Script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Script failed:", error);
    process.exit(1);
  });
