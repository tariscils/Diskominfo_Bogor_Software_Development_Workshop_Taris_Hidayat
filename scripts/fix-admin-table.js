const { sequelize, Admin, initializeDatabase } = require("../lib/sequelize");

async function fixAdminTable() {
  try {
    console.log("🚀 Initializing database...");
    await initializeDatabase();

    console.log("🔧 Checking admin table structure...");
    
    // Detect database type
    const isPostgreSQL = sequelize.getDialect() === 'postgres';
    const isSQLite = sequelize.getDialect() === 'sqlite';
    
    console.log(`📊 Database type: ${sequelize.getDialect()}`);

    let results = [];
    
    if (isPostgreSQL) {
      // PostgreSQL query
      [results] = await sequelize.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'admins' 
        ORDER BY ordinal_position;
      `);
    } else if (isSQLite) {
      // SQLite query
      [results] = await sequelize.query(`
        PRAGMA table_info(admins);
      `);
      // Transform SQLite results to match PostgreSQL format
      results = results.map(col => ({
        column_name: col.name,
        data_type: col.type,
        is_nullable: col.notnull === 0 ? 'YES' : 'NO',
        column_default: col.dflt_value
      }));
    }

    console.log("📊 Current admin table structure:");
    results.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // Check if role column exists
    const hasRoleColumn = results.some(col => col.column_name === 'role');
    const hasIsActiveColumn = results.some(col => col.column_name === 'is_active');
    const hasLastLoginColumn = results.some(col => col.column_name === 'last_login');

    console.log("\n🔍 Checking required columns:");
    console.log(`   role: ${hasRoleColumn ? '✅' : '❌'}`);
    console.log(`   is_active: ${hasIsActiveColumn ? '✅' : '❌'}`);
    console.log(`   last_login: ${hasLastLoginColumn ? '✅' : '❌'}`);

    // Add missing columns based on database type
    if (!hasRoleColumn) {
      console.log("\n➕ Adding role column...");
      if (isPostgreSQL) {
        await sequelize.query(`
          DO $$ BEGIN
            CREATE TYPE admin_role AS ENUM('ADMIN', 'SUPER_ADMIN');
          EXCEPTION WHEN duplicate_object THEN null;
          END $$;
        `);
        await sequelize.query(`
          ALTER TABLE admins 
          ADD COLUMN role admin_role DEFAULT 'ADMIN';
        `);
      } else if (isSQLite) {
        await sequelize.query(`
          ALTER TABLE admins 
          ADD COLUMN role TEXT DEFAULT 'ADMIN';
        `);
      }
      console.log("✅ role column added");
    }

    if (!hasIsActiveColumn) {
      console.log("\n➕ Adding is_active column...");
      if (isPostgreSQL) {
        await sequelize.query(`
          ALTER TABLE admins 
          ADD COLUMN is_active BOOLEAN DEFAULT true;
        `);
      } else if (isSQLite) {
        await sequelize.query(`
          ALTER TABLE admins 
          ADD COLUMN is_active INTEGER DEFAULT 1;
        `);
      }
      console.log("✅ is_active column added");
    }

    if (!hasLastLoginColumn) {
      console.log("\n➕ Adding last_login column...");
      if (isPostgreSQL) {
        await sequelize.query(`
          ALTER TABLE admins 
          ADD COLUMN last_login TIMESTAMP WITH TIME ZONE;
        `);
      } else if (isSQLite) {
        await sequelize.query(`
          ALTER TABLE admins 
          ADD COLUMN last_login DATETIME;
        `);
      }
      console.log("✅ last_login column added");
    }

    // Check if we need to create an admin
    const existingAdmin = await Admin.findOne({
      where: { username: "admin" }
    });

    if (!existingAdmin) {
      console.log("\n👤 Creating default admin...");
      const admin = await Admin.create({
        username: "admin",
        password: "admin123",
        email: "admin@diskominfo.bogor.go.id",
        role: "SUPER_ADMIN",
        is_active: true,
      });

      console.log("✅ Default admin created!");
      console.log(`   ID: ${admin.id}`);
      console.log(`   Username: ${admin.username}`);
      console.log(`   Role: ${admin.role}`);
    } else {
      console.log("\n✅ Admin already exists");
      console.log(`   Username: ${existingAdmin.username}`);
      console.log(`   Role: ${existingAdmin.role}`);
    }

    console.log("\n🎉 Database fix completed successfully!");

  } catch (error) {
    console.error("❌ Error fixing admin table:", error);
    process.exit(1);
  }
}

// Run the script
fixAdminTable()
  .then(() => {
    console.log("\n✅ Script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Script failed:", error);
    process.exit(1);
  });
