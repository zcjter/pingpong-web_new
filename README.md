# 乒乓球比赛管理系统

一个基于 Spring Boot + Vue 的乒乓球比赛管理 Web 系统。

## 功能特性

- 赛事管理：创建、编辑、查看比赛信息
- 运动员管理：维护运动员信息及排名
- 比赛对阵：支持小组赛、淘汰赛对阵展示
- 公告系统：发布赛事公告
- 比赛名单：管理参赛运动员名单

## 技术栈

- 后端：Spring Boot + JPA + MySQL
- 前端：原生 HTML/JS/CSS + Element UI
- 构建：Maven

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/zcjter/pingpong-web.git
cd pingpong-web
```

### 2. 配置数据库

在 `backend/src/main/resources/application.properties` 中配置 MySQL 连接信息。

### 3. 编译运行

```bash
cd backend
mvn clean package -DskipTests
java -jar target/pingpong-web-1.0.0.jar
```

### 4. 访问系统

浏览器打开 http://localhost:8080

## 项目结构

```
pingpong-web/
├── backend/          # Spring Boot 后端
│   ├── src/
│   │   └── main/
│   │       ├── java/com/pingpong/
│   │       │   ├── controller/   # 控制器
│   │       │   ├── entity/       # 实体类
│   │       │   ├── mapper/        # 数据访问层
│   │       │   └── service/      # 业务逻辑
│   │       └── resources/
│   │           ├── static/       # 静态资源
│   │           └── application.properties
│   └── pom.xml
└── frontend/         # 前端页面
    └── index.html
```

## 许可证

MIT
