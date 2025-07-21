/**
 * データベースシード（初期データ投入）スクリプト
 * 開発環境用のテストデータを生成
 */

import { db, clearDatabase } from './connection';
import { users, albums } from './schema';
import { count } from 'drizzle-orm';

/**
 * シードユーザーデータ
 */
const seedUsers = [
  {
    githubId: '12345',
    username: 'john-doe',
    avatarUrl: 'https://github.com/john-doe.png',
    name: 'John Doe',
  },
  {
    githubId: '67890',
    username: 'jane-smith',
    avatarUrl: 'https://github.com/jane-smith.png',
    name: 'Jane Smith',
  },
  {
    githubId: '11111',
    username: 'dev-user',
    avatarUrl: 'https://github.com/dev-user.png',
    name: 'Development User',
  },
];

/**
 * シードアルバムデータ
 * 東京、大阪、京都の有名な場所
 */
const seedAlbums = [
  {
    coordinate: { latitude: 35.6762, longitude: 139.6503 }, // 東京駅
    imageUrls: [
      'https://example.com/tokyo-station-1.jpg',
      'https://example.com/tokyo-station-2.jpg',
    ],
  },
  {
    coordinate: { latitude: 35.6896, longitude: 139.7006 }, // 新宿駅
    imageUrls: [
      'https://example.com/shinjuku-1.jpg',
      'https://example.com/shinjuku-2.jpg',
      'https://example.com/shinjuku-3.jpg',
    ],
  },
  {
    coordinate: { latitude: 34.6937, longitude: 135.5023 }, // 大阪駅
    imageUrls: [
      'https://example.com/osaka-station.jpg',
    ],
  },
  {
    coordinate: { latitude: 35.0116, longitude: 135.7681 }, // 京都駅
    imageUrls: [
      'https://example.com/kyoto-station-1.jpg',
      'https://example.com/kyoto-station-2.jpg',
      'https://example.com/kyoto-station-3.jpg',
      'https://example.com/kyoto-station-4.jpg',
    ],
  },
  {
    coordinate: { latitude: 35.6580, longitude: 139.7016 }, // 渋谷駅
    imageUrls: [
      'https://example.com/shibuya-crossing.jpg',
      'https://example.com/shibuya-night.jpg',
    ],
  },
];

/**
 * ユーザーデータを投入
 */
async function seedUsersData(): Promise<Array<{ id: string; githubId: string }>> {
  console.log('👤 Seeding users...');
  
  const insertedUsers = await db.insert(users).values(seedUsers).returning({
    id: users.id,
    githubId: users.githubId,
  });
  
  console.log(`✅ Created ${insertedUsers.length} users`);
  return insertedUsers;
}

/**
 * アルバムデータを投入
 */
async function seedAlbumsData(userList: Array<{ id: string; githubId: string }>): Promise<void> {
  console.log('📸 Seeding albums...');
  
  const albumsWithUsers = seedAlbums.map((album, index) => ({
    ...album,
    userId: userList[index % userList.length].id, // ユーザーをローテーションで割り当て
  }));
  
  const insertedAlbums = await db.insert(albums).values(albumsWithUsers).returning({
    id: albums.id,
    userId: albums.userId,
  });
  
  console.log(`✅ Created ${insertedAlbums.length} albums`);
  
  // 各ユーザーのアルバム数を表示
  for (const user of userList) {
    const userAlbums = insertedAlbums.filter(album => album.userId === user.id);
    console.log(`  📊 User ${user.githubId}: ${userAlbums.length} albums`);
  }
}

/**
 * 全データをシード
 */
async function runSeeding(): Promise<void> {
  try {
    console.log('🌱 Starting database seeding...');
    
    // 既存データをクリア（開発環境のみ）
    if (process.env.NODE_ENV !== 'production') {
      console.log('🧹 Clearing existing data...');
      await clearDatabase();
    }
    
    // ユーザーデータを投入
    const insertedUsers = await seedUsersData();
    
    // アルバムデータを投入
    await seedAlbumsData(insertedUsers);
    
    console.log('🎉 Database seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

/**
 * データベース統計情報を表示
 */
async function showStats(): Promise<void> {
  try {
    console.log('📊 Database Statistics:');
    
    // ユーザー数
    const userCountResult = await db.select({ count: count() }).from(users);
    const userCount = userCountResult[0].count;
    console.log(`  👤 Users: ${userCount}`);
    
    // アルバム数
    const albumCountResult = await db.select({ count: count() }).from(albums);
    const albumCount = albumCountResult[0].count;
    console.log(`  📸 Albums: ${albumCount}`);
    
    // 最新のアルバム
    const latestAlbums = await db
      .select({
        id: albums.id,
        coordinate: albums.coordinate,
        imageUrls: albums.imageUrls,
        createdAt: albums.createdAt,
      })
      .from(albums)
      .orderBy(albums.createdAt)
      .limit(3);
    
    console.log('  📱 Latest Albums:');
    latestAlbums.forEach((album, index) => {
      const imageCount = Array.isArray(album.imageUrls) ? album.imageUrls.length : 0;
      console.log(`    ${index + 1}. ${album.id} (${imageCount} images) at ${JSON.stringify(album.coordinate)}`);
    });
    
  } catch (error) {
    console.error('❌ Failed to show stats:', error);
  }
}

/**
 * メイン実行関数
 */
async function main(): Promise<void> {
  const command = process.argv[2];

  switch (command) {
    case 'stats':
      await showStats();
      break;
    case 'clear':
      if (process.env.NODE_ENV === 'production') {
        console.error('❌ Cannot clear database in production environment');
        process.exit(1);
      }
      console.log('🧹 Clearing database...');
      await clearDatabase();
      console.log('✅ Database cleared');
      break;
    case 'seed':
    default:
      await runSeeding();
      await showStats();
      break;
  }
}

// スクリプトが直接実行された場合にシードを実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    })
    .finally(() => {
      process.exit(0);
    });
}