# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Implementation Plan

refer to `/Users/senna/Documents/Repos/photo-map-S3/photo-app-s3-app/.kiro/specs`

## Project Overview

This is a Next.js photo mapping application that allows users to upload photos with location data and view them on an interactive map. The app integrates with Supabase for database operations, AWS S3 for photo storage, and Mapbox for map visualization.

## Development Commands

- `npm run dev` - Start development server on <http://localhost:3000>
- `npm run build` - Build the application for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint to check code quality
- `npm run types` - Generate TypeScript types from Supabase schema

## Architecture

### Core Technologies

- **Next.js 14** with App Router for the React framework
- **TypeScript** for type safety
- **Tailwind CSS** + **shadcn/ui** for styling and components
- **Zustand** for client-side state management
- **React Hook Form** + **Zod** for form handling and validation
- **Supabase** for authentication and database
- **AWS S3** for image storage
- **Mapbox GL JS** via react-map-gl for interactive maps

### Directory Structure

- `src/app/` - Next.js App Router pages and layouts
- `src/common/` - Shared utilities, types, and business logic
  - `actions/` - Server actions for form submissions
  - `hooks/` - Custom React hooks
  - `lib/` - Database clients, utilities, and configuration
  - `store/` - Zustand store for global state
  - `types/` - TypeScript type definitions
- `src/components/` - React components organized by purpose
  - `elements/` - Small, reusable UI components
  - `features/` - Complex feature components (Map, Form)
  - `layouts/` - Layout components (Header, ImageList)
  - `ui/` - shadcn/ui component library

### Key Workflows

**Photo Upload Process:**

1. User clicks on map to set coordinates (stored in Zustand store)
2. Form submission triggers server action in `src/common/actions/server.ts`
3. Images uploaded to S3 bucket with public read access
4. Album record created in Supabase with image URLs and coordinates
5. Map updates to show new photo marker

**Data Flow:**

- Map coordinates managed by Zustand store (`src/common/store/store.ts`)
- Database operations abstracted in `src/common/lib/supabase.ts`
- Server/client Supabase instances separated for security
- Type safety maintained through generated Supabase types

### Environment Configuration

Required environment variables:

- `NEXT_PUBLIC_MAP_BOX_ACCESS_KEY` - Mapbox API key
- Supabase configuration for database
- AWS S3 credentials (`ACCESS_KEY_ID`, `SECRET_ACCESS_KEY_ID`, `REGION`, `S3_BUCKET_NAME`)

### Important Implementation Details

- Uses App Router with server components for initial data fetching
- Client components handle interactive features (map, forms)
- Authentication handled through Supabase Auth
- Images stored with public S3 ACL for direct browser access
- Map style configured for custom Mapbox style ID
- Japanese text used in some UI components (coordinate labels)

When modifying this codebase, maintain the separation between server and client components, follow the established patterns for database operations, and ensure type safety is preserved throughout.

### Coding rules

## 基本方針

- **TDD 必須**: コード生成時は必ずユニットテストも作成
- **型安全重視**: TypeScript の型システムを最大限活用
- **DDD 適用**: ドメイン駆動設計の原則に従う
-

## ファイル構成ルール

### 各ファイルの冒頭にはコメントで仕様を記述する

出力例

`````ts
/**
 * 2点間のユークリッド距離を計算する
**/
type Point = { x: number; y: number; };
export function distance(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

出力例

````ts

/**

* 2点間のユークリッド距離を計算する

**/

type Point = { x: number; y: number; };

export function distance(a: Point, b: Point): number {

return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);

}



### TDDサイクル

TDDを実施する。コードを生成するときはそれに対応するユニットテストを常に生成する。コードを追加で修正した時、'npm test'がパスすることを常に確認する。

1. **Red**: 失敗するテストを書く

2. **Green**: テストを通す最小限のコード

3. **Refactor**: コードを改善

4. **確認**: `npm test`でパスすることを確認



## 型定義パターン



### ブランデッド型（型安全性確保）

```typescript

type Branded<T, B> = T & { _brand: B };

type UserId = Branded<string, "UserId">;

type Email = Branded<string, "Email">;

`````

### Result 型（エラーハンドリング）

```typescript
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });

const err = <E>(error: E): Result<never, E> => ({ ok: false, error });
```

## DDD 実装パターン

### 値オブジェクト

```typescript
/**

* 金額を表す値オブジェクト

*/

export class Money {
  private constructor(private readonly amount: number) {}

  static create(amount: number): Result<Money, Error> {
    if (amount < 0) return err(new Error("負の金額は無効"));

    return ok(new Money(amount));
  }

  getValue(): number {
    return this.amount;
  }

  add(other: Money): Money {
    return new Money(this.amount + other.amount);
  }
}
```

### エンティティ

```typescript
/**

* ユーザーエンティティ

*/

export class User {
  constructor(
    private readonly id: UserId,

    private email: Email,

    private name: string
  ) {}

  getId(): UserId {
    return this.id;
  }

  changeEmail(newEmail: Email): void {
    this.email = newEmail;
  }
}
```

### リポジトリ

```typescript
/**

* ユーザーリポジトリのインターフェース

*/

export interface UserRepository {
  findById(id: UserId): Promise<User | null>;

  save(user: User): Promise<void>;

  delete(id: UserId): Promise<void>;
}
```

## テスト戦略

### 単体テスト例

```typescript
/**

* Moneyクラスのテスト

*/

describe("Money", () => {
  describe("create", () => {
    it("正の数値で正常に作成される", () => {
      const result = Money.create(100);

      expect(result.ok).toBe(true);

      if (result.ok) {
        expect(result.value.getValue()).toBe(100);
      }
    });

    it("負の数値でエラーになる", () => {
      const result = Money.create(-100);

      expect(result.ok).toBe(false);
    });
  });
});
```

### インメモリテスト実装

```typescript
/**

* テスト用ユーザーリポジトリ

*/

export class InMemoryUserRepository implements UserRepository {
  private users = new Map<string, User>();

  async findById(id: UserId): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async save(user: User): Promise<void> {
    this.users.set(user.getId(), user);
  }
}
```

## 実装手順チェックリスト

### 1. 型設計

- [ ] ドメインオブジェクトの型定義
- [ ] ブランデッド型でプリミティブ型を区別
- [ ] Result 型でエラーハンドリング設計

### 2. テストファースト

- [ ] 期待する動作のテストを先に記述
- [ ] `npm test`で失敗することを確認
- [ ] 最小限のコードでテストを通す

### 3. DDD 実装

- [ ] 値オブジェクト：不変・自己検証・ドメイン操作
- [ ] エンティティ：ID 同一性・制御された更新
- [ ] リポジトリ：ドメインモデルのみ扱う

### 4. リファクタリング

- [ ] 純粋関数への分離
- [ ] 副作用の境界明確化
- [ ] 早期リターンで条件分岐フラット化

## コードレビューポイント

- ✅ ファイル冒頭にコメントがある
- ✅ 対応するテストが存在する
- ✅ `npm test`がパスする
- ✅ 型安全性が確保されている
- ✅ 純粋関数が優先されている
- ✅ エラーハンドリングが適切
- ✅ ドメインルールがコードに表現されている

  ## 禁止事項

- ❌ テストなしでのコード追加
- ❌ any 型の使用
- ❌ 副作用を持つ純粋関数
- ❌ プリミティブ型の直接使用（ブランデッド型を使う）
- ❌ throw Error（Result 型を使う）
- ❌ クラスの過度な使用
