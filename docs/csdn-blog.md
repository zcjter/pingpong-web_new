---
title: 从零搭建乒乓球比赛管理系统——Spring Boot + 原生 HTML 实战
date: 2026-06-13
categories:
  - 项目实战
  - Java
tags:
  - Spring Boot
  - MySQL
  - JPA
  - 乒乓球
  - 全栈开发
---

## 前言

> 本文是基于此前发布的《乒乓球比赛管理系统——从需求到实现全记录》的更新优化版。相较于上一篇，本次迭代增加了 U11/U13/U15/U17/U19 年龄段分组、团体赛子场次比分、资格赛过滤、对阵图 UI 重构等一系列功能改进，同时对代码和文档做了全面梳理。

作为一个乒乓球爱好者，平时约球、看比赛时总想有一个地方能管理运动员信息、记录赛事和排名。市面上很多体育管理系统要么太复杂，要么收费，于是决定自己动手写一个轻量级的**乒乓球比赛管理系统**。

本文将从项目架构、数据模型、后端实现、前端设计等维度，完整分享这个项目的开发过程。项目已开源在 GitHub：[pingpong-web](https://github.com/zcjter/pingpong-web)。

<!-- more -->

---

## 一、项目概览

### 1.1 系统功能

系统主要包含以下功能模块：

| 模块 | 功能 |
|------|------|
| 🏠 **首页** | 最新公告展示、实时排名 TOP 3 |
| 🏃 **运动员管理** | 运动员信息的增删改查、按姓名搜索 |
| 🏆 **赛事管理** | 创建赛事、添加参赛名单、比赛对阵录入 |
| 📊 **排名管理** | 按年份、项目（男单/女单/男双/女双/混双）管理排名 |
| 👑 **冠军展示** | 历届赛事冠军数据展示 |

### 1.2 技术栈

| 层级 | 技术选型 |
|------|----------|
| 后端框架 | Spring Boot 2.7.14 |
| ORM | Spring Data JPA |
| 数据库 | MySQL 5.7+ |
| 前端 | 原生 HTML + CSS + JavaScript |
| UI 组件库 | Element UI（CDN） |
| Markdown 渲染 | Marked.js |
| 构建工具 | Maven |
| 部署端口 | 8090 |

选型考量：之所以前端没有使用 Vue/React 等框架，而是直接使用原生 HTML + Element UI CDN，是因为这个项目定位是**轻量级管理后台**，不需要复杂的前端工程化。一个 `index.html` 搞定所有页面，对于小团队或个人项目来说开发效率反而更高。

---

## 二、页面展示

系统主要包含以下几个核心页面，以下列出各页面的功能要点，供截图参考（建议 1280×720 以上分辨率截取）：

| # | 页面 | 截图内容 | 说明 |
|---|------|----------|------|
| 1 | **首页** | 顶部公告区域 + 排名 TOP 3 卡片 | 展示最新公告列表和实时积分排名前三的运动员 |
| 2 | **运动员管理** | 运动员卡片列表 + 搜索框 | 展示所有运动员以卡片形式呈现，支持按姓名搜索 |
| 3 | **运动员管理** | 新增/编辑弹窗 | 表单包含姓名、国家、年龄、性别、积分、简介等字段 |
| 4 | **赛事管理** | 赛事列表示例 | 展示已创建的赛事，支持年份筛选 |
| 5 | **赛事详情** | 比赛对阵列表或对阵图视图 | 展示某赛事下的所有比赛，含选手、比分、状态、轮次 |
| 6 | **比赛录入** | 比赛编辑弹窗 | 录入选手1/选手2、比分（多局）、场馆、轮次、项目类别等 |
| 7 | **排名管理** | 排名表格 + 年份/项目筛选器 | 按年份（如 2026）和项目（男单/女单/男双等）筛选排名 |
| 8 | **冠军展示** | 历届冠军列表 | 按项目分类展示历届赛事冠军 |
| 9 | **公告管理** | 公告发布弹窗 | 支持 Markdown 内容编辑 |

> 💡 **截图建议**：每张截图保持浏览器窗口宽度一致；避免截到书签栏等无关区域；如有演示数据效果更佳。

---

## 三、项目结构

```
pingpong-web/
├── backend/                          # Spring Boot 后端
│   ├── src/main/java/com/pingpong/
│   │   ├── PingPongApplication.java  # 启动类
│   │   ├── config/
│   │   │   └── WebConfig.java        # CORS 跨域配置
│   │   ├── entity/                   # JPA 实体（6个）
│   │   ├── mapper/                   # Repository 层
│   │   ├── service/                  # 业务逻辑层
│   │   └── controller/               # REST API 控制器
│   ├── src/main/resources/
│   │   ├── application.yml           # 应用配置
│   │   └── schema.sql                # 数据库初始化脚本
│   └── pom.xml
├── frontend/
│   └── index.html                    # 单页应用（4849行）
└── docs/
    └── requirements.md               # 需求文档
```

---

## 四、数据库设计

系统共设计了 **5 张核心表**：

### 4.1 运动员表（players）

```sql
CREATE TABLE IF NOT EXISTS players (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,        -- 姓名
    country VARCHAR(50),               -- 国家
    age INT,                           -- 年龄
    gender VARCHAR(10),                -- 性别
    ranking_points INT DEFAULT 0,      -- 排名积分
    avatar VARCHAR(500),               -- 头像URL
    introduction TEXT,                 -- 个人简介
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 4.2 赛事表（competitions）

```sql
CREATE TABLE IF NOT EXISTS competitions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,        -- 赛事名称
    start_date DATETIME,               -- 开始日期
    end_date DATETIME,                 -- 结束日期
    location VARCHAR(200),             -- 举办地点
    description TEXT,                  -- 赛事描述
    is_active BOOLEAN DEFAULT TRUE,    -- 是否启用
    competition_year INT,              -- 赛事年份
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 4.3 比赛记录表（matches）

这是业务最复杂的表，需要记录对阵双方、比分、轮次等信息：

```sql
CREATE TABLE IF NOT EXISTS matches (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    competition_id BIGINT,             -- 关联赛事
    player1_id BIGINT,                 -- 选手1 ID
    player1_name VARCHAR(100),         -- 选手1 姓名
    player1_country VARCHAR(50),       -- 选手1 国家
    player2_id BIGINT,                 -- 选手2 ID
    player2_name VARCHAR(100),         -- 选手2 姓名
    player2_country VARCHAR(50),       -- 选手2 国家
    scores JSON,                       -- 比分数据（JSON格式）
    team_scores TEXT,                  -- 团队比分
    player1_total INT,                 -- 选手1 总分
    player2_total INT,                 -- 选手2 总分
    venue VARCHAR(200),                -- 比赛场馆
    match_date DATETIME,               -- 比赛日期
    status VARCHAR(20) DEFAULT 'scheduled',  -- 状态
    remark TEXT,                       -- 备注
    round_number VARCHAR(50),          -- 轮次
    category VARCHAR(50),              -- 项目类别
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (competition_id) REFERENCES competitions(id)
);
```

这里特别说明一下 `scores` 字段使用了 **MySQL 的 JSON 类型**，用于存储多局比分，例如 `[{"set": 1, "player1": 11, "player2": 7}, {"set": 2, "player1": 9, "player2": 11}]`，灵活支持不同赛制的比分记录。

### 4.4 年度排名表（player_rankings）

```sql
CREATE TABLE IF NOT EXISTS player_rankings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    player_id BIGINT,                  -- 运动员ID
    player_name VARCHAR(100),          -- 运动员姓名
    country VARCHAR(50),               -- 国家
    ranking INT,                       -- 排名
    points INT,                        -- 积分
    category VARCHAR(50),              -- 项目类别
    ranking_year INT,                  -- 年份
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 4.5 公告表（announcements）

```sql
CREATE TABLE IF NOT EXISTS announcements (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,       -- 标题
    content TEXT,                      -- 内容
    type VARCHAR(50) DEFAULT 'general',-- 类型
    is_published BOOLEAN DEFAULT TRUE, -- 是否发布
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## 五、后端实现详解

### 5.1 项目启动类

```java
@SpringBootApplication
public class PingPongApplication {
    public static void main(String[] args) {
        SpringApplication.run(PingPongApplication.class, args);
    }
}
```

最标准的 Spring Boot 启动方式，没有任何多余配置。

### 5.2 CORS 跨域配置

由于前端是独立部署的 HTML 文件，需要配置跨域支持：

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOriginPatterns("*")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .maxAge(3600);
    }
}
```

这里注意使用 `allowedOriginPatterns("*")` 而不是 `allowedOrigins("*")`，因为后者在较新版本中已被标记为不安全。

### 5.3 JPA 实体类

以运动员实体为例，使用 Lombok 的 `@Data` 简化代码：

```java
@Data
@Entity
@Table(name = "players")
public class Player {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String country;
    private Integer age;
    private String gender;

    @Column(name = "ranking_points")
    private Integer rankingPoints;

    private String avatar;

    @Column(columnDefinition = "TEXT")
    private String introduction;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
```

使用 `@PrePersist` 和 `@PreUpdate` 自动管理时间戳，比在业务代码中手动设置更优雅。

### 5.4 Repository 层

Spring Data JPA 的强大之处在于，你只需要定义接口方法签名，就能自动生成查询：

```java
@Repository
public interface PlayerRepository extends JpaRepository<Player, Long> {
    List<Player> findByNameContaining(String name);

    @Query("SELECT p FROM Player p ORDER BY p.rankingPoints DESC")
    List<Player> findAllOrderByRankingPointsDesc();
}
```

- `findByNameContaining`：自动实现模糊查询，等价于 SQL 的 `LIKE %keyword%`
- `@Query`：自定义 JPQL 查询，按积分降序排列

其他 Repository 类似，感受一下 Spring Data JPA 的方法命名约定：

```java
// CompetitionRepository
List<Competition> findByIsActiveTrueOrderByStartDateDesc();

// MatchRepository
List<Match> findByCompetitionIdOrderByMatchDateAsc(Long competitionId);
List<Match> findByStatusOrderByMatchDateAsc(String status);

// PlayerRankingRepository
List<PlayerRanking> findByRankingYearAndCategoryOrderByRankingAsc(Integer year, String category);
```

方法名就是 SQL！这种约定大大减少了样板代码。

### 5.5 Service 层

业务逻辑层，以 PlayerService 为例：

```java
@Service
public class PlayerService {
    @Autowired
    private PlayerRepository playerRepository;

    public List<Player> findAll() {
        return playerRepository.findAll();
    }

    public List<Player> findAllOrderByRanking() {
        return playerRepository.findAllOrderByRankingPointsDesc();
    }

    public Optional<Player> findById(Long id) {
        return playerRepository.findById(id);
    }

    public List<Player> search(String keyword) {
        return playerRepository.findByNameContaining(keyword);
    }

    @Transactional
    public Player save(Player player) {
        return playerRepository.save(player);
    }

    @Transactional
    public void deleteById(Long id) {
        playerRepository.deleteById(id);
    }
}
```

写入操作加上 `@Transactional` 确保事务一致性。

### 5.6 Controller 层

RESTful API 设计，以 PlayerController 为例：

```java
@RestController
@RequestMapping("/api/players")
public class PlayerController {

    @Autowired
    private PlayerService playerService;

    @GetMapping
    public List<Player> getAllPlayers() {
        return playerService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Player> getPlayerById(@PathVariable Long id) {
        return playerService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/search")
    public List<Player> searchPlayers(@RequestParam String keyword) {
        return playerService.search(keyword);
    }

    @PostMapping
    public Player createPlayer(@RequestBody Player player) {
        return playerService.save(player);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Player> updatePlayer(@PathVariable Long id, @RequestBody Player player) {
        return playerService.findById(id)
                .map(existingPlayer -> {
                    player.setId(id);
                    return ResponseEntity.ok(playerService.save(player));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePlayer(@PathVariable Long id) {
        if (playerService.findById(id).isPresent()) {
            playerService.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
```

设计要点：
- 统一使用 `ResponseEntity` 包装响应，支持 200/404 等状态码
- GET/POST/PUT/DELETE 对应 CRUD 操作
- 路径参数和查询参数分离清晰

### 5.7 完整 API 接口一览

| 模块 | 路径 | 方法 | 说明 |
|------|------|------|------|
| 运动员 | `/api/players` | GET | 获取所有运动员 |
| 运动员 | `/api/players` | POST | 添加运动员 |
| 运动员 | `/api/players/{id}` | GET | 获取运动员详情 |
| 运动员 | `/api/players/{id}` | PUT | 更新运动员 |
| 运动员 | `/api/players/{id}` | DELETE | 删除运动员 |
| 运动员 | `/api/players/search?keyword=` | GET | 搜索运动员 |
| 运动员 | `/api/players/ranking` | GET | 按积分排序 |
| 赛事 | `/api/competitions` | GET/POST | 赛事列表/新增 |
| 赛事 | `/api/competitions/{id}` | GET/PUT/DELETE | 赛事详情/更新/删除 |
| 比赛 | `/api/matches` | GET/POST | 比赛列表/新增 |
| 比赛 | `/api/matches/competition/{id}` | GET | 按赛事查询比赛 |
| 排名 | `/api/rankings` | GET/POST | 排名列表/新增 |
| 排名 | `/api/rankings/year/{year}/category/{cat}` | GET | 按年份和项目筛选 |
| 公告 | `/api/announcements` | GET/POST | 公告列表/新增 |
| 公告 | `/api/announcements/published` | GET | 已发布的公告 |

### 5.8 配置文件

```yaml
server:
  port: 8090

spring:
  datasource:
    url: jdbc:mysql://localhost:3306/pingpong?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai
    username: root
    password: 123456
    driver-class-name: com.mysql.cj.jdbc.Driver

  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true
    properties:
      hibernate:
        format_sql: true

logging:
  level:
    com.pingpong: debug
```

`ddl-auto: update` 可以让 JPA 自动根据实体类创建/更新表结构，开发阶段非常方便。生产环境建议改为 `validate`。

---

## 六、前端实现

前端只有一个 `index.html` 文件，约 4850 行。使用原生技术实现了完整的 SPA（单页应用）体验。

### 6.1 技术选型理由

为什么不用 Vue/React？

1. **项目规模小**——5 个功能模块，不需要路由、状态管理等复杂机制
2. **快速开发**——一个 HTML 文件，打开即用，不需要构建工具链
3. **便于分享**——复制给任何人，双击就能运行（配合后端 API）
4. **CDN 引入 Element UI**——组件化开发体验，表格、弹窗、表单等开箱即用

### 6.2 页面架构

```
┌─────────────────────────────────────┐
│  Header：标题 + 系统名称             │
├─────────────────────────────────────┤
│  Nav：首页 | 运动员 | 赛事 | 排名    │
├─────────────────────────────────────┤
│                                     │
│  Container：动态内容区域              │
│  （根据导航切换显示不同模块）          │
│                                     │
│  ┌ 首页：公告 + TOP3 排名 ───────┐   │
│  ├ 运动员：搜索 + 卡片列表 ──────┤   │
│  ├ 赛事：表格 + 年份筛选 ────────┤   │
│  ├ 排名：表格 + 年份/项目筛选 ────┤   │
│  └ 冠军：赛事冠军展示 ───────────┘   │
│                                     │
└─────────────────────────────────────┘
```

### 6.3 核心实现思路

**导航切换**——通过 JS 控制不同 `div` 的显示/隐藏：

```javascript
function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
    document.getElementById(tab).style.display = 'block';
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    event.target.classList.add('active');
}
```

**数据渲染**——每次切换到对应 Tab 时调用 API 获取数据，使用 Element UI 的 `el-table`、`el-card` 等组件渲染：

```javascript
// 以运动员管理为例
function loadPlayers() {
    fetch('/api/players')
        .then(res => res.json())
        .then(data => {
            // 渲染运动员卡片
            const container = document.getElementById('player-list');
            container.innerHTML = data.map(player => `
                <el-card class="player-card">
                    <div class="player-name">${player.name}</div>
                    <div class="player-info">
                        <span>${player.country}</span>
                        <span>${player.gender}</span>
                        <span>积分：${player.rankingPoints}</span>
                    </div>
                </el-card>
            `).join('');
        });
}
```

**弹窗表单**——使用 Element UI 的 `el-dialog` 实现模态框，统一处理新增和编辑：

```html
<el-dialog :visible.sync="dialogVisible" :title="dialogTitle">
    <el-form :model="form">
        <el-form-item label="姓名">
            <el-input v-model="form.name"></el-input>
        </el-form-item>
        <!-- 更多表单项 -->
    </el-form>
    <span slot="footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
    </span>
</el-dialog>
```

---

## 七、环境搭建与部署

### 7.1 环境要求

- JDK 1.8+
- Maven 3.6+
- MySQL 5.7+

### 7.2 快速启动

```bash
# 1. 克隆项目
git clone https://github.com/zcjter/pingpong-web.git
cd pingpong-web

# 2. 创建数据库
mysql -u root -p -e "CREATE DATABASE pingpong CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 3. 配置数据库连接
# 编辑 backend/src/main/resources/application.yml

# 4. 编译打包
cd backend
mvn clean package -DskipTests

# 5. 运行
java -jar target/pingpong-web-1.0.0.jar

# 6. 访问系统
# 浏览器打开 http://localhost:8090
```

### 7.3 演示数据

启动后直接访问 `http://localhost:8090`，你会看到初始化的空数据页面。建议先用 API 工具（如 Postman）或前端页面添加一些演示数据：

1. 添加几个运动员（樊振东、马龙、孙颖莎等）
2. 创建一个赛事（如 "2026 年乒乓球世锦赛"）
3. 录入比赛对阵和结果
4. 发布一条公告

---

## 八、项目亮点与踩坑记录

### 8.1 设计亮点

**1. JSON 比分存储**

`matches` 表的 `scores` 字段使用了 MySQL 的 JSON 类型，可以灵活存储多局比分：

```json
[
    {"set": 1, "player1": 11, "player2": 7},
    {"set": 2, "player1": 9, "player2": 11},
    {"set": 3, "player1": 11, "player2": 5},
    {"set": 4, "player1": 11, "player2": 8}
]
```

这样无论是 3 局 2 胜还是 7 局 4 胜，都能灵活支持。

**2. 排名多维度筛选**

排名模块支持按**年份**和**项目类别**交叉筛选，男单、女单、男双、女双、混双各有一套独立的排名体系，符合实际乒乓球赛事的运作方式。

**3. 级联删除**

删除赛事时，同时删除该赛事下的所有比赛记录，保证数据完整性：

```java
@Transactional
public void deleteById(Long id) {
    List<Match> matches = matchRepository.findByCompetitionId(id);
    matchRepository.deleteAll(matches);
    competitionRepository.deleteById(id);
}
```

### 8.2 遇到的坑

**1. MySQL 时区问题**

连接字符串中必须指定 `serverTimezone=Asia/Shanghai`，否则会报时区错误。

**2. CORS 跨域**

开发阶段前端是直接打开 HTML 文件（`file://` 协议），与后端 `http://localhost:8090` 不同源。解决方案是后端配置全局 CORS。

**3. JSON 字段的 JPA 映射**

MySQL 的 JSON 类型在 JPA 中直接用 `String` 映射即可，不需要特殊处理：

```java
@Column(name = "scores", columnDefinition = "JSON")
private String scores;
```

前端直接 `JSON.parse()` / `JSON.stringify()` 即可操作。

**4. Lombok 的 @Data 与 @PrePersist**

`@Data` 会生成 `@EqualsAndHashCode`，这在 JPA 实体中有时会因为懒加载代理导致问题。不过本项目所有关联都是手动维护的外键 ID，没有使用 `@OneToMany` / `@ManyToOne` 等关联注解，所以没有问题。

---

## 九、总结与展望

### 9.1 项目成果

一个功能完整的乒乓球比赛管理系统：
- ✅ 6 个 RESTful API 控制器，覆盖所有 CRUD 操作
- ✅ 5 张数据库表，数据模型清晰合理
- ✅ 一个完整的 SPA 前端，Element UI 加持
- ✅ 支持运动员管理、赛事管理、排名管理、公告发布等核心功能

### 9.2 后续可扩展的方向

1. **用户登录与权限**——区分管理员和普通用户
2. **小组赛/淘汰赛自动生成**——根据参赛名单自动生成对阵图
3. **数据可视化**——使用 ECharts 展示运动员积分趋势、赛事统计数据
4. **Excel 导入导出**——方便批量导入运动员和比赛数据
5. **图片上传**——运动员头像、赛事海报等
6. **WebSocket 实时推送**——比赛比分实时更新

### 9.3 一点感悟

这个项目最大的特点是**简洁**——后端标准的 Spring Boot 三层架构，前端一个 HTML 搞定所有页面。对于个人项目或小团队内部工具来说，不需要过度工程化。技术在精不在多，能解决问题就是好方案。

如果你正在学习 Spring Boot，这个项目也是一个很好的入门实战案例。从数据库设计到 REST API，从 JPA 使用到前端交互，覆盖了全栈开发的完整链路。

项目源码：[https://github.com/zcjter/pingpong-web](https://github.com/zcjter/pingpong-web)

欢迎 star、fork、提 issue！

---

*本文为原创，转载请保留原文链接。*
