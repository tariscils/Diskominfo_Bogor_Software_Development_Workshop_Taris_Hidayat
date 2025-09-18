const { Admin, initializeDatabase } = require("../lib/sequelize");

const emails = [
  "fanani@diskominfo.go.id",
  "samsul@diskominfo.go.id",
  "arif@diskominfo.go.id",
  "rizky@diskominfo.go.id",
  "imam@diskominfo.go.id",
  "budi.santoso@diskominfo.go.id",
  "siti.rahayu@diskominfo.go.id",
  "agus.wijaya@diskominfo.go.id",
  "dewi.kartika@diskominfo.go.id",
  "joko.susilo@diskominfo.go.id",
];

async function seedAdmins() {
  try {
    console.log("🚀 Initializing database...");
    await initializeDatabase();

    const password = "admin123";

    for (const email of emails) {
      const username = email; // use email as username
      const existing = await Admin.findOne({ where: { username } });
      if (existing) {
        console.log(`ℹ️  Admin already exists: ${username}`);
        continue;
      }

      const admin = await Admin.create({
        username,
        email,
        password,
        role: "ADMIN",
        is_active: true,
      });
      console.log(`✅ Created admin: ${admin.username}`);
    }

    console.log("\n🎉 Seeding completed.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding admins:", err);
    process.exit(1);
  }
}

seedAdmins();
