# 乒乓球比赛管理系统

一个基于 Spring Boot + Vue 的乒乓球比赛管理 Web 系统。

## 功能特性

- **首页**: 最新公告展示、实时排名 TOP 3
- **运动员管理**: 维护运动员信息（姓名、国家、年龄、性别、积分、简介）
- **赛事管理**: 创建比赛、添加参赛名单、比赛对阵（小组赛/淘汰赛）
- **排名管理**: 管理不同年份、项目（男单/女单/男双/女双/混双）的排名
- **冠军展示**: 展示历届赛事冠军

## 技术栈

- **后端**: Spring Boot 2.7.14 + Spring Data JPA + MySQL
- **前端**: 原生 HTML/JS/CSS + Element UI + Marked.js
- **构建**: Maven

## 项目结构

```
pingpong-web/
├── backend/                    # Spring Boot 后端
│   ├── src/main/java/com/pingpong/
│   │   ├── controller/        # REST API 控制器
│   │   │   ├── PlayerController
│   │   │   ├── CompetitionController
│   │   │   ├── MatchController
│   │   │   ├── PlayerRankingController
│   │   │   ├── AnnouncementController
│   │   │   └── CompetitionRosterController
│   │   ├── entity/             # JPA 实体类
│   │   │   ├── Player
│   │   │   ├── Competition
│   │   │   ├── Match
│   │   │   ├── PlayerRanking
│   │   │   ├── Announcement
│   │   │   └── CompetitionRoster
│   │   ├── mapper/             # 数据访问层 (Repository)
│   │   ├── service/            # 业务逻辑层
│   │   └── config/             # 配置类
│   ├── src/main/resources/
│   │   ├── application.yml    # 应用配置
│   │   └── schema.sql          # 数据库初始化
│   └── pom.xml
├── frontend/
│   └── index.html              # 前端页面 (SPA)
└── README.md
```

## 快速开始

### 1. 环境要求

- JDK 1.8+
- Maven 3.6+
- MySQL 5.7+

### 2. 克隆项目

```bash
git clone https://github.com/zcjter/pingpong-web.git
cd pingpong-web
```

### 3. 配置数据库

编辑 `backend/src/main/resources/application.yml`，配置 MySQL 连接信息：

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/pingpong?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai
    username: root
    password: your_password
```

创建数据库：
```sql
CREATE DATABASE pingpong CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. 编译运行

```bash
cd backend
mvn clean package -DskipTests
java -jar target/pingpong-web-1.0.0.jar
```

### 5. 访问系统

浏览器打开 http://localhost:8090

## API 接口

| 模块 | 路径 | 方法 | 说明 |
|------|------|------|------|
| 运动员 | `/api/players` | GET/POST | 获取/添加运动员 |
| 运动员 | `/api/players/{id}` | GET/PUT/DELETE | 获取/更新/删除运动员 |
| 赛事 | `/api/competitions` | GET/POST | 获取/添加赛事 |
| 赛事 | `/api/competitions/{id}` | GET/PUT/DELETE | 获取/更新/删除赛事 |
| 比赛 | `/api/matches` | GET/POST | 获取/添加比赛 |
| 排名 | `/api/rankings` | GET/POST | 获取/添加排名 |
| 公告 | `/api/announcements` | GET/POST | 获取/添加公告 |
| 参赛名单 | `/api/roster` | GET/POST | 获取/添加参赛名单 |

## 许可证

MIT
