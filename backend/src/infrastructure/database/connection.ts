/**
 * データベース接続設定
 * PostgreSQL接続とDrizzle ORMの設定
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

/**
 * データベース接続設定
 */
interface DatabaseConfig {
  connectionString: string;
  ssl?: boolean;
  max?: number;
  idle_timeout?: number;
}

/**
 * 環境変数からデータベース設定を取得
 */
function getDatabaseConfig(): DatabaseConfig {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  return {
    connectionString,
    ssl: process.env.NODE_ENV === 'production',
    max: parseInt(process.env.DB_POOL_MAX || '10', 10),
    idle_timeout: parseInt(process.env.DB_IDLE_TIMEOUT || '30', 10),
  };
}

/**
 * PostgreSQL接続クライアント
 */
let sql: postgres.Sql | null = null;

/**
 * データベース接続を取得
 */
function getConnection(): postgres.Sql {
  if (!sql) {
    const config = getDatabaseConfig();

    sql = postgres(config.connectionString, {
      ssl: config.ssl,
      max: config.max,
      idle_timeout: config.idle_timeout,
      // 開発環境では詳細なログを出力
      debug: process.env.NODE_ENV === 'development',
      // 接続プールの設定
      onnotice:
        process.env.NODE_ENV === 'development' ? console.log : undefined,
    });
  }

  return sql;
}

/**
 * Drizzle ORMインスタンス
 */
export const db = drizzle(getConnection(), { schema });

/**
 * データベース接続をクローズ
 * アプリケーション終了時に呼び出す
 */
export async function closeConnection(): Promise<void> {
  if (sql) {
    await sql.end();
    sql = null;
  }
}

/**
 * データベース接続のヘルスチェック
 */
export async function checkConnection(): Promise<boolean> {
  try {
    const connection = getConnection();
    await connection`SELECT 1 as health_check`;
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

/**
 * 開発環境用: データベースクリア機能
 * テスト時にのみ使用
 */
export async function clearDatabase(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Cannot clear database in production environment');
  }

  const connection = getConnection();

  // 外部キー制約を一時的に無効化
  await connection`SET session_replication_role = replica`;

  // テーブルをクリア（順序が重要）
  await connection`DELETE FROM albums`;
  await connection`DELETE FROM users`;

  // 外部キー制約を再有効化
  await connection`SET session_replication_role = DEFAULT`;
}
