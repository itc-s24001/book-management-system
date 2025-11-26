-- データベース作成
CREATE DATABASE IF NOT EXISTS book_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE book_management;

-- テーブル作成はPrisma Migrateに任せるので、ここでは初期データのみ挿入

-- サンプル管理者ユーザー (パスワード: admin123)
-- 注意: 実際にはアプリケーションから登録する必要があります