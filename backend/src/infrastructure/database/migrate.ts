/**
 * データベースマイグレーション実行スクリプト
 * Drizzle Kitで生成されたマイグレーションを実行
 */

import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// ESModuleでの__dirnameの取得
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * マイグレーション実行関数
 */
async function runMigrations(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('DATABASE_URL environment variable is required');
    process.exit(1);
  }

  console.log('🔄 Starting database migration...');
  console.log(
    `📍 Connection: ${connectionString.replace(/:[^:@]*@/, ':***@')}`
  );

  // マイグレーション専用の接続（max: 1）
  const migrationConnection = postgres(connectionString, { max: 1 });
  const db = drizzle(migrationConnection);

  try {
    // マイグレーションディレクトリのパス
    const migrationsFolder = join(__dirname, '../../../drizzle');

    console.log(`📁 Migrations folder: ${migrationsFolder}`);

    // マイグレーション実行
    await migrate(db, { migrationsFolder });

    console.log('✅ Database migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    // 接続をクローズ
    await migrationConnection.end();
  }
}

/**
 * データベース接続テスト
 */
async function testConnection(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('DATABASE_URL environment variable is required');
    process.exit(1);
  }

  console.log('🔄 Testing database connection...');

  const testConnection = postgres(connectionString, { max: 1 });

  try {
    const result =
      await testConnection`SELECT version() as version, now() as current_time`;
    console.log('✅ Database connection successful!');
    console.log(`📊 PostgreSQL version: ${result[0].version}`);
    console.log(`🕐 Current time: ${result[0].current_time}`);
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  } finally {
    await testConnection.end();
  }
}

/**
 * メイン実行関数
 */
async function main(): Promise<void> {
  const command = process.argv[2];

  switch (command) {
    case 'test':
      await testConnection();
      break;
    case 'migrate':
    default:
      await testConnection();
      await runMigrations();
      break;
  }
}

// スクリプトが直接実行された場合にマイグレーションを実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}
