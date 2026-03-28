# 乒乓球比赛管理系统 - 需求规格说明书

## 1. 项目概述

### 1.1 项目背景

随着乒乓球运动的普及和赛事活动的增多，需要一个统一的 Web 系统来管理比赛信息、运动员数据、赛事排名等内容。本系统旨在为乒乓球爱好者、赛事组织者提供一个便捷的管理平台。

### 1.2 项目目标

- 集中管理运动员信息与排名数据
- 便捷创建和发布赛事活动
- 实时展示比赛对阵情况和结果
- 发布赛事公告与新闻

### 1.3 系统概述

| 属性 | 说明 |
|------|------|
| 系统名称 | 乒乓球比赛管理系统 |
| 系统类型 | Web 管理系统 |
| 技术栈 | Spring Boot + MySQL + 原生 HTML/JS |
| 部署端口 | 8090 |

---

## 2. 功能需求

### 2.1 首页

- **公告展示**：显示最新发布的赛事公告，支持点击查看详情
- **实时排名**：展示 TOP 3 运动员排名信息
- **添加公告**：管理员可发布新公告

### 2.2 运动员管理

| 功能 | 说明 |
|------|------|
| 列表查看 | 以卡片形式展示所有运动员 |
| 搜索 | 按姓名搜索运动员 |
| 详情查看 | 查看运动员详细信息（姓名、国家、年龄、性别、积分、排名、简介） |
| 添加运动员 | 新增运动员信息 |
| 编辑运动员 | 修改运动员信息 |
| 删除运动员 | 删除运动员记录 |

**运动员字段**：
- 姓名（必填）
- 国家
- 年龄
- 性别
- 排名积分
- 头像
- 个人简介

### 2.3 赛事管理

| 功能 | 说明 |
|------|------|
| 列表查看 | 展示所有赛事，支持按年份筛选 |
| 详情查看 | 查看赛事详细信息 |
| 添加赛事 | 创建新赛事 |
| 编辑赛事 | 修改赛事信息 |
| 删除赛事 | 删除赛事记录 |
| 参赛名单管理 | 添加/移除参赛运动员 |
| 比赛对阵 | 录入比赛结果，支持列表/对阵图两种视图 |
| 添加比赛 | 录入比赛信息 |

**赛事字段**：
- 赛事名称（必填）
- 开始日期
- 结束日期
- 举办地点
- 赛事描述
- 是否启用

**比赛字段**：
- 参赛选手1（球员ID、姓名、国家）
- 参赛选手2（球员ID、姓名、国家）
- 比分（JSON格式，支持多局）
- 总局数
- 比赛场馆
- 比赛日期
- 比赛状态（待开始/进行中/已结束/已取消）
- 备注
- 轮次（如：1/4决赛、半决赛、决赛）
- 项目类别（男单/女单/男双/女双/混双）

### 2.4 排名管理

| 功能 | 说明 |
|------|------|
| 列表查看 | 展示所有排名记录 |
| 筛选 | 按年份和项目类别筛选 |
| 添加排名 | 新增排名记录 |
| 编辑排名 | 修改排名信息 |
| 删除排名 | 删除排名记录 |

**排名字段**：
- 运动员ID
- 运动员姓名
- 国家
- 排名（必填）
- 积分
- 项目类别（男单/女单/男双/女双/混双）
- 年份

### 2.5 赛事冠军展示

- 展示历届赛事各项目冠军
- 按项目分类显示

---

## 3. 数据模型

### 3.1 运动员 (players)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | Long | 主键 | 自增ID |
| name | String | 非空 | 姓名 |
| country | String | - | 国家 |
| age | Integer | - | 年龄 |
| gender | String | - | 性别 |
| ranking_points | Integer | - | 排名积分 |
| avatar | String | - | 头像URL |
| introduction | String | - | 个人简介 |
| created_at | DateTime | - | 创建时间 |
| updated_at | DateTime | - | 更新时间 |

### 3.2 赛事 (competitions)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | Long | 主键 | 自增ID |
| name | String | 非空 | 赛事名称 |
| start_date | DateTime | - | 开始日期 |
| end_date | DateTime | - | 结束日期 |
| location | String | - | 举办地点 |
| description | String | - | 赛事描述 |
| is_active | Boolean | - | 是否启用 |
| competition_year | Integer | - | 赛事年份 |
| created_at | DateTime | - | 创建时间 |

### 3.3 比赛 (matches)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | Long | 主键 | 自增ID |
| competition_id | Long | 外键 | 赛事ID |
| player1_id | Long | - | 选手1 ID |
| player1_name | String | - | 选手1 姓名 |
| player1_country | String | - | 选手1 国家 |
| player2_id | Long | - | 选手2 ID |
| player2_name | String | - | 选手2 姓名 |
| player2_country | String | - | 选手2 国家 |
| scores | JSON | - | 比分数据 |
| player1_total | Integer | - | 选手1 总分 |
| player2_total | Integer | - | 选手2 总分 |
| venue | String | - | 比赛场馆 |
| match_date | DateTime | - | 比赛日期 |
| status | String | 非空 | 比赛状态 |
| remark | String | - | 备注 |
| round_number | String | - | 轮次 |
| category | String | - | 项目类别 |
| created_at | DateTime | - | 创建时间 |
| updated_at | DateTime | - | 更新时间 |

### 3.4 排名 (player_rankings)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | Long | 主键 | 自增ID |
| player_id | Long | - | 运动员ID |
| player_name | String | - | 运动员姓名 |
| country | String | - | 国家 |
| ranking | Integer | - | 排名 |
| points | Integer | - | 积分 |
| category | String | - | 项目类别 |
| ranking_year | Integer | - | 年份 |
| created_at | DateTime | - | 创建时间 |

### 3.5 公告 (announcements)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | Long | 主键 | 自增ID |
| title | String | 非空 | 标题 |
| content | Text | - | 内容 |
| type | String | 非空 | 类型 |
| is_published | Boolean | - | 是否发布 |
| created_at | DateTime | - | 创建时间 |
| updated_at | DateTime | - | 更新时间 |

### 3.6 参赛名单 (competition_roster)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | Long | 主键 | 自增ID |
| venue | String | 非空 | 场馆 |
| year | Integer | 非空 | 年份 |
| category | String | 非空 | 项目类别 |
| player_name | String | 非空 | 运动员姓名 |
| country | String | - | 国家 |
| created_at | DateTime | - | 创建时间 |
| updated_at | DateTime | - | 更新时间 |

---

## 4. 非功能性需求

### 4.1 性能需求

- 页面加载时间不超过 3 秒
- API 响应时间不超过 1 秒

### 4.2 兼容性

- 支持主流浏览器（Chrome、Firefox、Edge、Safari）
- 建议屏幕分辨率 1280x720 及以上

### 4.3 安全

- 用户输入需进行基本校验
- 防止 SQL 注入（使用 JPA 参数化查询）

---

## 5. 附录

### 5.1 项目结构

```
pingpong-web/
├── backend/
│   ├── src/main/java/com/pingpong/
│   │   ├── controller/     # REST API
│   │   ├── entity/         # 实体类
│   │   ├── mapper/         # 数据访问
│   │   ├── service/        # 业务逻辑
│   │   └── config/         # 配置
│   └── src/main/resources/
│       ├── application.yml
│       └── schema.sql
├── frontend/
│   └── index.html          # 前端页面
└── docs/
    └── requirements.md     # 本文档
```

### 5.2 数据库配置

| 配置项 | 默认值 |
|--------|--------|
| 数据库地址 | localhost:3306 |
| 数据库名 | pingpong |
| 用户名 | root |
| 密码 | 123456 |
