-- 创建数据库
CREATE DATABASE IF NOT EXISTS pingpong DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE pingpong;

-- 运动员表
CREATE TABLE IF NOT EXISTS players (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    country VARCHAR(50),
    age INT,
    gender VARCHAR(10),
    ranking_points INT DEFAULT 0,
    avatar VARCHAR(500),
    introduction TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 赛事表
CREATE TABLE IF NOT EXISTS competitions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    start_date DATETIME,
    end_date DATETIME,
    location VARCHAR(200),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    competition_year INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 比赛记录表
CREATE TABLE IF NOT EXISTS matches (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    competition_id BIGINT,
    player1_id BIGINT,
    player1_name VARCHAR(100),
    player1_country VARCHAR(50),
    player2_id BIGINT,
    player2_name VARCHAR(100),
    player2_country VARCHAR(50),
    scores JSON,
    player1_total INT,
    player2_total INT,
    venue VARCHAR(200),
    match_date DATETIME,
    status VARCHAR(20) DEFAULT 'scheduled',
    remark TEXT,
    round_number VARCHAR(50),
    category VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (competition_id) REFERENCES competitions(id)
);

-- 公告表
CREATE TABLE IF NOT EXISTS announcements (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    type VARCHAR(50) DEFAULT 'general',
    is_published BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 年度排名表
CREATE TABLE IF NOT EXISTS player_rankings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    player_id BIGINT,
    player_name VARCHAR(100),
    country VARCHAR(50),
    ranking INT,
    points INT,
    category VARCHAR(50),
    ranking_year INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 参赛名单表 (和比赛地点、年度关联)
CREATE TABLE IF NOT EXISTS competition_roster (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    venue VARCHAR(200) NOT NULL,
    year INT NOT NULL,
    category VARCHAR(50) NOT NULL,
    player_name VARCHAR(100) NOT NULL,
    country VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
