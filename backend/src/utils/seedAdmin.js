import dotenv from 'dotenv';
dotenv.config();
import { connectDB, closeDB } from '../config/db.js';
import { Admin } from '../models/Admin.js';
import { Availability } from '../models/Availability.js';
import { Policy } from '../models/Policy.js';

export async function ensureDefaultAdminAndData() {
  const adminCount = await Admin.countDocuments();
  if (adminCount === 0) {
    const defaultUsername = process.env.ADMIN_DEFAULT_USERNAME || 'harsha';
    const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'Harsha@2026';
    const defaultEmail = process.env.ADMIN_DEFAULT_EMAIL || 'harshavardhanreddy.0712@gmail.com';

    const passwordHash = await Admin.hashPassword(defaultPassword);
    await Admin.create({
      username: defaultUsername,
      email: defaultEmail,
      passwordHash,
      name: 'Harsha',
      role: 'admin',
    });
    console.log(`[Seed] Default Admin account created: username="${defaultUsername}" password="${defaultPassword}"`);
  }

  // Ensure default availability
  await Availability.getEffectiveSettings();

  // Ensure default policies
  await Policy.getOrCreate('cancellation_refund');
  await Policy.getOrCreate('privacy_policy');
  await Policy.getOrCreate('terms_of_service');
}

// If run directly via CLI: node src/utils/seedAdmin.js
if (process.argv[1]?.endsWith('seedAdmin.js')) {
  (async () => {
    try {
      await connectDB();
      await ensureDefaultAdminAndData();
      console.log('[Seed] Seeding completed successfully.');
      process.exit(0);
    } catch (err) {
      console.error('[Seed Error]', err);
      process.exit(1);
    }
  })();
}
