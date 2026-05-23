# 妆搭 Makeup Mate 全栈开发计划 Plan 1

> 文件名：`plan1.md`  
> 项目名称：妆搭 Makeup Mate  
> 当前阶段：已完成 HTML 高保真 Demo，准备升级为全栈版本  
> 产品定位：会记住你的 AI 美妆视频陪练  
> 核心闭环：首页粘贴美妆视频链接 → AI 解析生成妆容卡片 → 导入聊天 → 语音/视频陪伴化妆 → 上传照片分析个人风格 → 我的页沉淀妆容档案

---

## 一、阶段目标

当前已有 Claude Code 生成的 HTML 高保真 Demo。下一阶段的目标不是继续堆静态页面，而是把 Demo 改造成一个可持续迭代的全栈产品原型。

第一阶段全栈目标：

1. 将单文件 HTML 拆分为前端工程；
2. 保留当前视觉风格和三页结构；
3. 搭建后端 API 骨架；
4. 让前端通过接口获取数据；
5. 建立妆容卡片、聊天记录、妆容档案、历史记录的数据结构；
6. 为后续接入 AI 视频解析、图片分析、语音陪伴打好基础。

本阶段不追求一次性做完真实抖音解析、实时视频识别、完整登录系统和真实小程序上线。

---

## 二、技术路线

### 2.1 推荐总体路线

```text
HTML 高保真 Demo
        ↓
React 前端工程化
        ↓
FastAPI 后端骨架
        ↓
Mock API 替代前端假数据
        ↓
数据库持久化
        ↓
接入 AI 文本 / 图片能力
        ↓
语音 / 视频陪伴增强
        ↓
再考虑微信小程序迁移
```

---

### 2.2 前端技术栈

建议使用：

```text
Vite + React + TypeScript
```

原因：

- 从 HTML Demo 迁移成本低；
- 组件化清晰；
- 适合做三页导航和多弹层交互；
- Claude Code / Codex 支持较好；
- 后续可以迁移到 Taro / uni-app / 微信小程序。

前端第一阶段重点：

- 保留视觉；
- 拆分组件；
- 三页可切换；
- 与后端 API 联调；
- 不再把所有数据写死在 HTML 中。

---

### 2.3 后端技术栈

建议使用：

```text
FastAPI + PostgreSQL + SQLAlchemy / SQLModel + 对象存储
```

第一阶段可以先用：

```text
FastAPI + SQLite
```

后续再升级为：

```text
PostgreSQL + Redis + OSS / R2
```

推荐使用 FastAPI 的原因：

- Python 更适合后续接 AI、图片处理、视频抽帧；
- API 开发快；
- 调试简单；
- 适合黑客松和产品原型阶段。

---

## 三、项目目录结构

建议将项目整理为以下结构：

```text
makeup-mate/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── PhoneFrame.tsx
│   │   │   ├── BottomNav.tsx
│   │   │   ├── MakeupCard.tsx
│   │   │   ├── ChatBubble.tsx
│   │   │   ├── UploadModal.tsx
│   │   │   ├── HistoryModal.tsx
│   │   │   └── Toast.tsx
│   │   ├── pages/
│   │   │   ├── HomePage.tsx
│   │   │   ├── ChatPage.tsx
│   │   │   └── ProfilePage.tsx
│   │   ├── api/
│   │   │   └── client.ts
│   │   ├── styles/
│   │   │   ├── tokens.css
│   │   │   └── global.css
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── db.py
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── makeup_card.py
│   │   │   ├── chat.py
│   │   │   ├── beauty_profile.py
│   │   │   └── media_asset.py
│   │   ├── schemas/
│   │   │   ├── makeup_card.py
│   │   │   ├── chat.py
│   │   │   ├── beauty_profile.py
│   │   │   └── common.py
│   │   ├── routes/
│   │   │   ├── makeup_cards.py
│   │   │   ├── chat.py
│   │   │   ├── profile.py
│   │   │   ├── media.py
│   │   │   └── history.py
│   │   └── services/
│   │       ├── ai_service.py
│   │       ├── video_service.py
│   │       ├── image_service.py
│   │       ├── memory_service.py
│   │       └── share_service.py
│   ├── requirements.txt
│   └── .env.example
│
├── docs/
│   ├── prd.md
│   ├── design.md
│   └── plan1.md
│
├── README.md
└── .gitignore
```

---

## 四、前端工程化计划

### 4.1 目标

把现有单文件 HTML Demo 拆成 React 前端工程，同时保留原有高保真视觉。

### 4.2 初始化前端项目

```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
npm run dev
```

---

### 4.3 拆分核心组件

#### 组件一：PhoneFrame.tsx

负责：

- iPhone 手机壳；
- 灵动岛；
- 状态栏；
- 屏幕圆角；
- 手机阴影；
- 内部页面容器。

要求：

- 不能破坏已有高保真视觉；
- 手机内部内容必须 `overflow: hidden`；
- 桌面展示时手机仍是页面中心视觉。

---

#### 组件二：BottomNav.tsx

负责底部三页导航。

只能包含：

```text
首页
聊天
我的
```

禁止新增：

```text
个人适配
历史
复刻版
陪伴
```

---

#### 组件三：HomePage.tsx

负责首页。

功能：

- 粘贴抖音美妆视频链接；
- 点击“开始解析妆容”；
- 显示解析 loading；
- 生成妆容复刻卡片；
- 支持“分享卡片”；
- 支持“导入聊天”。

---

#### 组件四：ChatPage.tsx

负责聊天页。

功能：

- 接收首页导入的妆容卡片；
- 展示 AI 聊天消息；
- 支持用户输入；
- 支持快捷按钮；
- 右上角左侧：历史记录；
- 右上角右侧：上传照片 / 分析个人风格；
- 支持文字陪伴上妆；
- 预留语音 / 视频陪伴入口。

---

#### 组件五：ProfilePage.tsx

负责我的页。

功能：

- 展示用户妆容档案；
- 展示 AI 已记住；
- 展示历史总结；
- 展示隐私与记忆设置。

---

#### 组件六：MakeupCard.tsx

负责妆容卡片。

字段：

```text
妆容名称
风格标签
难度
预计耗时
适合场景
产品清单
步骤拆解
翻车风险
AI 提示
分享按钮
导入聊天按钮
```

---

#### 组件七：UploadModal.tsx

负责上传照片弹窗。

功能：

- 上传自拍；
- 上传自拍视频；
- 仅本次分析；
- 保存到我的妆容档案；
- 显示隐私提示。

---

#### 组件八：HistoryModal.tsx

负责历史记录弹窗。

功能：

- 展示历史妆容卡片；
- 支持继续上妆；
- 支持重新导入聊天；
- 支持删除记录。

---

### 4.4 前端验收标准

```text
1. npm run dev 可以正常启动。
2. 页面仍然保持 design.md 的奶油粉调。
3. 中间 iPhone 手机模型保留。
4. 底部导航只有：首页 / 聊天 / 我的。
5. 首页可以通过假数据生成妆容卡片。
6. 卡片可以导入聊天页。
7. 聊天页右上角两个功能存在：历史记录、上传照片。
8. 我的页可以展示假妆容档案。
9. 所有组件结构清晰，后续可接 API。
```

---

## 五、后端骨架计划

### 5.1 目标

搭建真实后端 API，使前端不再完全依赖本地假数据。

第一阶段 API 可以返回 mock 数据，但接口结构必须真实，方便后续接 AI 和数据库。

---

### 5.2 初始化后端

```bash
mkdir backend
cd backend
python -m venv .venv
source .venv/bin/activate
pip install fastapi uvicorn pydantic python-multipart sqlalchemy
pip freeze > requirements.txt
```

启动命令：

```bash
uvicorn app.main:app --reload --port 8000
```

---

### 5.3 第一批 API

#### 妆容卡片 API

```text
POST /api/makeup-cards/analyze-link
GET  /api/makeup-cards/{card_id}
POST /api/makeup-cards/{card_id}/share
```

用途：

- 解析视频链接；
- 生成妆容卡片；
- 查询卡片详情；
- 生成分享卡片。

---

#### 聊天 API

```text
POST /api/chat/sessions
GET  /api/chat/sessions/{session_id}/messages
POST /api/chat/sessions/{session_id}/messages
```

用途：

- 创建聊天会话；
- 获取聊天消息；
- 发送用户消息；
- 返回 AI 陪伴回复。

---

#### 个人妆容档案 API

```text
POST  /api/profile/analyze-photo
GET   /api/profile/me
PATCH /api/profile/me
DELETE /api/profile/me/memory
```

用途：

- 上传照片并分析个人风格；
- 获取我的妆容档案；
- 修改档案；
- 清空记忆。

---

#### 历史记录 API

```text
GET /api/history
DELETE /api/history/{item_id}
```

用途：

- 查看历史妆容卡片；
- 删除历史记录。

---

### 5.4 后端验收标准

```text
1. FastAPI 可正常启动。
2. Swagger 文档可访问。
3. analyze-link 接口可以返回妆容卡片 JSON。
4. chat 接口可以返回 AI 模拟回复。
5. profile 接口可以返回个人妆容档案。
6. history 接口可以返回历史记录。
7. 前端已经通过 API 获取数据。
```

---

## 六、数据库设计计划

### 6.1 第一阶段数据表

#### users

用于模拟用户。

```text
id
nickname
avatar_url
created_at
updated_at
```

第一阶段可以不做复杂登录，使用默认用户。

---

#### makeup_cards

用于保存妆容复刻卡片。

```text
id
user_id
source_url
title
style_tags
difficulty
estimated_time
scenes
products
steps
risk_points
tips
created_at
updated_at
```

---

#### chat_sessions

用于保存聊天会话。

```text
id
user_id
makeup_card_id
mode
current_step
created_at
updated_at
```

---

#### chat_messages

用于保存聊天消息。

```text
id
session_id
role
content
message_type
created_at
```

role 可选：

```text
user
assistant
system
```

---

#### beauty_profiles

用于保存用户妆容档案。

```text
id
user_id
face_shape
skin_tone
feature_style
eye_type
preferred_blush_position
preferred_eyeliner
preferred_lip_colors
avoid_styles
skill_level
time_preference
memory_enabled
save_raw_photo
created_at
updated_at
```

---

#### media_assets

用于保存上传图片、视频、截图信息。

```text
id
user_id
file_type
file_url
purpose
created_at
```

第一阶段如果不接对象存储，可以只保存本地路径或 mock URL。

---

#### memory_items

用于保存 AI 长期记忆。

```text
id
user_id
memory_type
content
source
created_at
updated_at
```

memory_type 示例：

```text
stable_profile
preference
history_feedback
privacy_setting
```

---

### 6.2 数据库验收标准

```text
1. 能保存妆容卡片。
2. 能保存聊天会话和消息。
3. 能保存个人妆容档案。
4. 能保存历史记录。
5. 我的页能从数据库读取档案。
```

---

## 七、核心功能开发顺序

### Step 1：保留视觉，完成前端三页

优先级最高。

```text
首页
聊天
我的
```

先保证三页结构稳定，不新增页面。

---

### Step 2：首页链接解析 mock 化

用户输入链接后，后端返回固定妆容卡片。

示例卡片：

```json
{
  "title": "清冷感通勤妆",
  "styleTags": ["低饱和", "干净", "淡颜友好"],
  "difficulty": "中等",
  "estimatedTime": "18分钟",
  "scenes": ["通勤", "上课", "面试"],
  "products": ["气垫", "浅棕眼影", "杏粉腮红", "奶茶豆沙唇泥"],
  "riskPoints": ["眼线过长", "修容过重", "唇色过深"]
}
```

---

### Step 3：卡片导入聊天

点击“导入聊天”后：

1. 创建 ChatSession；
2. 将 MakeupCard 作为聊天上下文；
3. 跳转聊天页；
4. AI 自动发送第一条消息。

AI 首条消息：

```text
我已经读完这张「清冷感通勤妆」复刻卡片啦。接下来我可以陪你一步步画，也可以先根据你的自拍帮你调整成更适合你的版本。
```

---

### Step 4：聊天功能接 API

支持：

```text
用户输入消息
AI 返回回复
消息保存
快捷按钮触发回复
```

快捷按钮：

```text
我完成了
换种说法
没有这个产品怎么办
拍照检查一下
太难了
快一点
```

---

### Step 5：上传照片分析

聊天页右上角上传照片。

流程：

```text
点击上传照片
        ↓
弹出 UploadModal
        ↓
用户上传自拍
        ↓
后端返回个人风格分析
        ↓
用户选择仅本次使用 / 保存到我的妆容档案
        ↓
聊天页根据档案改写妆容步骤
```

第一版可先返回 mock 分析：

```json
{
  "faceShape": "方圆脸",
  "skinTone": "自然偏暖",
  "featureStyle": "淡颜偏自然",
  "eyeType": "内双",
  "preferredBlushPosition": "眼下外侧上移",
  "preferredEyeliner": "后半段短眼线",
  "preferredLipColors": ["奶茶色", "豆沙色", "低饱和红棕"],
  "avoidStyles": ["重修容", "过长上挑眼线"]
}
```

---

### Step 6：我的页读取妆容档案

我的页从后端读取 BeautyProfile。

展示：

```text
脸型
肤色
五官风格
眼型
适合腮红
适合眼线
适合唇色
AI 已记住
隐私设置
```

---

### Step 7：历史记录

聊天页右上角历史记录弹层。

展示：

```text
历史解析卡片
历史聊天会话
历史上传分析
历史复刻记录
```

第一版只做：

```text
历史妆容卡片列表
继续上妆
删除
```

---

## 八、AI 接入计划

### 8.1 第一阶段：不直接接 AI，先保留接口

先让后端返回 mock 数据，但命名为真实服务：

```text
ai_service.generate_makeup_card()
ai_service.generate_chat_reply()
ai_service.analyze_beauty_profile()
```

这样后续替换真实模型时不用改前端。

---

### 8.2 第二阶段：接文本大模型

用于：

```text
根据妆容卡片生成步骤解释
根据用户问题生成陪伴回复
根据用户档案改写原教程
```

Prompt 约束：

```text
你是 Makeup Mate 的 AI 美妆陪练。
你要根据妆容卡片、用户妆容档案、当前步骤，给出简洁、可执行、低焦虑的上妆指导。
禁止颜值评分、容貌羞辱、医学诊断。
```

---

### 8.3 第三阶段：接视觉模型

用于：

```text
上传自拍分析个人风格
拍照检查当前妆容
分析视频关键帧
```

输出必须结构化，不要让模型自由发挥：

```json
{
  "faceShape": "",
  "skinTone": "",
  "featureStyle": "",
  "eyeType": "",
  "makeupSuggestions": [],
  "avoidStyles": [],
  "confidence": ""
}
```

---

### 8.4 第四阶段：语音和视频

优先级：

```text
1. AI 回复 TTS 播报
2. 用户语音转文字
3. 拍照检查
4. 摄像头预览
5. 实时视频陪伴
```

不要一开始做实时视频流分析，成本高、风险大。

---

## 九、MVP 优先级

### P0：必须完成

```text
前端 React 工程化
三页底部导航
首页链接解析 mock API
妆容卡片生成
卡片导入聊天
聊天消息 API
上传照片入口
个人风格分析 mock API
我的页妆容档案
历史记录弹层
```

---

### P1：尽量完成

```text
真实文本大模型聊天
用户反馈写入记忆
分享卡片生成图片
TTS 语音播报
拍照检查
隐私设置可交互
```

---

### P2：后续扩展

```text
真实视频抽帧
真实抖音链接解析
实时视频陪伴
AR 试妆
多平台链接解析
微信小程序迁移
商品替代推荐
```

---

## 十、第一周执行计划

### Day 1：整理项目与前端工程化

任务：

```text
备份当前 HTML Demo
初始化 Vite React 项目
拆分 PhoneFrame / BottomNav / 三页组件
保留视觉风格
完成前端假数据交互
```

交付：

```text
frontend 可运行
三页切换正常
视觉基本不变
```

---

### Day 2：搭后端骨架

任务：

```text
初始化 FastAPI
建立基础路由
返回 mock 数据
配置 CORS
前端 api/client.ts 接入后端
```

交付：

```text
后端可运行
前端可请求 API
Swagger 可访问
```

---

### Day 3：首页解析与卡片生成

任务：

```text
完成 /api/makeup-cards/analyze-link
首页点击解析显示 loading
后端返回妆容卡片
前端展示 MakeupCard
支持分享提示
支持导入聊天
```

交付：

```text
首页闭环完成
```

---

### Day 4：聊天页 API

任务：

```text
创建 ChatSession
导入 MakeupCard
发送用户消息
返回 AI mock 回复
保存消息
快捷按钮可触发回复
```

交付：

```text
聊天页可用
```

---

### Day 5：上传照片与个人风格分析

任务：

```text
UploadModal
上传图片接口
返回个人风格分析
支持仅本次使用 / 保存档案
聊天页使用档案改写建议
```

交付：

```text
上传照片功能可演示
```

---

### Day 6：我的页与历史记录

任务：

```text
ProfilePage 接真实 API
展示 BeautyProfile
展示 AI 已记住
HistoryModal 接 API
支持继续上妆和删除
```

交付：

```text
我的页和历史记录可用
```

---

### Day 7：打磨与部署

任务：

```text
补充 fallback 数据
优化 loading 动画
优化错误提示
部署前端和后端
准备演示账号
准备演示脚本
录屏备份
```

交付：

```text
线上可演示版本
```

---

## 十一、给 Claude Code 的执行提示词

```text
请基于当前已有的 HTML 高保真 Demo，将项目升级为全栈版本。不要改变现有视觉风格，严格保留 design.md 中的奶油粉调、iPhone 手机壳、三页底部导航：首页 / 聊天 / 我的。

第一阶段目标不是一次性做完所有 AI 功能，而是完成工程化和全栈骨架。

请按以下顺序执行：

1. 初始化 frontend，使用 Vite + React + TypeScript。
2. 将当前 index.html 拆分为 React 组件：
   - PhoneFrame
   - BottomNav
   - HomePage
   - ChatPage
   - ProfilePage
   - MakeupCard
   - UploadModal
   - HistoryModal
   - Toast
3. 保留当前 UI 视觉，不要重做风格。
4. 初始化 backend，使用 FastAPI。
5. 建立基础 API：
   - POST /api/makeup-cards/analyze-link
   - GET /api/makeup-cards/{card_id}
   - POST /api/makeup-cards/{card_id}/share
   - POST /api/chat/sessions
   - GET /api/chat/sessions/{session_id}/messages
   - POST /api/chat/sessions/{session_id}/messages
   - POST /api/profile/analyze-photo
   - GET /api/profile/me
   - PATCH /api/profile/me
   - GET /api/history
6. 第一版 API 可以先返回 mock 数据，但接口结构要真实。
7. 前端必须从 API 获取数据，不要继续把所有数据写死在组件里。
8. 完成后给出项目目录、启动方式、已完成内容和下一步建议。

重要限制：
- 底部导航只能有：首页、聊天、我的。
- 上传照片和历史记录必须放在聊天页右上角。
- 首页只负责粘贴链接、解析视频、生成卡片、分享卡片、导入聊天。
- 我的页只负责妆容档案、AI 已记住、历史总结、隐私设置。
- 不要引入复杂登录系统。
- 不要做真实抖音爬虫。
- 不要做颜值评分、医学诊断、人脸识别。
```

---

## 十二、风险与控制

### 12.1 真实抖音链接解析风险

风险：

```text
反爬限制
链接失效
需要登录
视频版权问题
解析不稳定
```

控制：

```text
第一版只保存链接，不做真实爬取
允许上传截图 / 视频文件
准备预设样例数据
后续再评估真实解析
```

---

### 12.2 AI 输出不稳定风险

风险：

```text
输出格式不固定
美妆建议太泛
出现颜值评价
出现医学化表达
```

控制：

```text
后端强制 JSON schema
加入安全提示词
加入输出过滤
关键字段由后端兜底
```

---

### 12.3 上传照片隐私风险

风险：

```text
用户担心人脸照片被保存
涉及敏感个人信息
容易被误解为颜值评分
```

控制：

```text
默认不保存原始照片
只保存结构化妆容档案
提供仅本次分析
提供删除档案
明确不做人脸识别和颜值评分
```

---

### 12.4 功能过多导致失焦

风险：

```text
同时做视频解析、聊天、语音、视频、档案、分享，容易做散
```

控制：

```text
第一版只跑通主链路
语音视频先做入口和演示
重点打磨：首页卡片 + 聊天陪伴 + 我的档案
```

---

## 十三、最终阶段判断

当前最优策略是：

```text
不要立刻做真实微信小程序
不要立刻做真实抖音爬虫
不要立刻做实时视频识别
先把 HTML Demo 改造成 React + FastAPI 的全栈原型
先让前端从 API 获取 mock 数据
再逐步替换为真实 AI 能力
```

第一阶段成功标准：

> 用户能在首页粘贴链接，生成妆容卡片，导入聊天，与 AI 对话，上传照片分析个人风格，并在我的页看到自己的妆容档案。

这就是当前版本最应该完成的全栈 MVP。
