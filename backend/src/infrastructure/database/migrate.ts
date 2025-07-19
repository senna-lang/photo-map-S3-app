import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db } from './connection.js';

async function runMigrations() {
  console.log('Running database migrations...');
  
  try {
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('Migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();