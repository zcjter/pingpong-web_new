# 乒乓球比赛管理系统

一个基于 Spring Boot + 原生 HTML/JS 的乒乓球比赛管理 Web 系统。

## 功能特性

- **首页**: 最新公告展示、实时排名 TOP 3、数据统计图表
- **运动员管理**: 维护运动员信息（姓名、国家、年龄、性别、积分、简介、头像）
- **赛事管理**: 创建赛事、添加参赛名单、管理多项目（男单/女单/男双/女双/混双/男团/女团）比赛
- **比赛对阵**:
  - **表格视图**: 按项目/轮次分组展示，小组赛矩阵布局（行视角比分），淘汰赛卡片详情
  - **对阵图视图**: 资格赛/正赛分 Tab 展示，含晋级连线
  - **阶段过滤**: 小组赛/资格赛/淘汰赛三 Tab 切换
  - **团体赛**: 子场次比分详情，运动员名单聚合展示
- **排名管理**: 管理不同年份、项目的排名，支持排名变动趋势图
- **图片附件**: 上传/管理运动员头像等图片
- **数据统计**: 赛事统计、运动员胜率、项目分布等
- **冠军展示**: 展示历届赛事冠军

## 技术栈

- **后端**: Spring Boot 2.7.14 + Spring Data JPA + MySQL
- **前端**: 原生 HTML/JS/CSS（SPA），Element UI 样式，ECharts 图表，Marked.js 渲染
- **构建**: Maven

## 项目结构

```
pingpong-web/
├── backend/                    # Spring Boot 后端
│   ├── src/main/java/com/pingpong/
│   │   ├── controller/        # REST API 控制器
│   │   │   ├── AnnouncementController
│   │   │   ├── CompetitionController
│   │   │   ├── FileUploadController
│   │   │   ├── MatchController
│   │   │   ├── PlayerController
│   │   │   ├── PlayerRankingController
│   │   │   └── StatisticsController
│   │   ├── entity/             # JPA 实体类
│   │   │   ├── Announcement
│   │   │   ├── Competition
│   │   │   ├── ImageAttachment
│   │   │   ├── Match
│   │   │   ├── Player
│   │   │   └── PlayerRanking
│   │   ├── mapper/             # 数据访问层 (Repository)
│   │   ├── service/            # 业务逻辑层
│   │   └── config/             # 配置类（CORS等）
│   ├── src/main/resources/
│   │   ├── application.yml    # 应用配置
│   │   └── schema.sql          # 数据库初始化
│   └── pom.xml
├── frontend/
│   └── index.html              # 前端单页面应用 (SPA, ~6000行)
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

前端开发时可直接打开 `frontend/index.html`，API 默认请求 `http://localhost:8090`。

## API 接口

| 模块 | 路径 | 方法 | 说明 |
|------|------|------|------|
| 运动员 | `/api/players` | GET/POST | 获取/添加运动员 |
| 运动员 | `/api/players/{id}` | GET/PUT/DELETE | 获取/更新/删除运动员 |
| 赛事 | `/api/competitions` | GET/POST | 获取/添加赛事 |
| 赛事 | `/api/competitions/{id}` | GET/PUT/DELETE | 获取/更新/删除赛事 |
| 比赛 | `/api/matches` | GET/POST | 获取/添加比赛 |
| 比赛 | `/api/matches/competition/{id}` | GET | 按赛事获取比赛 |
| 比赛 | `/api/matches/{id}` | GET/PUT/DELETE | 获取/更新/删除比赛 |
| 排名 | `/api/rankings` | GET/POST | 获取/添加排名 |
| 公告 | `/api/announcements` | GET/POST | 获取/添加公告 |
| 统计 | `/api/statistics/overall` | GET | 系统总体统计 |
| 统计 | `/api/statistics/player/{id}` | GET | 运动员个人统计 |
| 文件 | `/api/files/upload` | POST | 上传图片附件 |

## 许可证

MIT
