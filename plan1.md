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
接入多模态 AI 文本 / 图片 / 视频理解能力
        ↓
接入 MediaPipe 用户脸部几何解析
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

### 2.4 视觉理解与脸部解析技术路线

第一阶段将视觉能力拆成三层，避免把所有任务都压到多模态 AI 或 MediaPipe 任意一方：

```text
视频/照片证据增强：MediaPipe + 图像处理
妆容语义理解：多模态 AI
聊天页上传自拍后的脸部几何解析：MediaPipe Face Landmarker + 短期/长期记忆规则
```

#### MediaPipe 证据增强层

用于在多模态 AI 判断前，把视频/图片处理成更精细、更可解释的视觉证据：

```text
从视频中抽取关键帧
筛选有人脸、清晰、正脸、遮挡少的帧
定位眼部、眉毛、脸颊、嘴唇区域
裁剪全脸 / 眼妆 / 腮红 / 唇妆局部图
提取区域色彩、位置、变化趋势等辅助特征
生成 VideoEvidence JSON
```

MediaPipe 在这里不判断“清冷感 / 韩系 / 港风”，但它会帮助 AI 看得更细：AI 不再只看整张图，而是同时看到关键帧、局部 crop 和结构化证据。

#### 多模态 AI 负责

用于基于关键帧、局部 crop、字幕/ASR 和 VideoEvidence 理解美妆视频、截图、聊天页上传照片中的语义内容：

```text
视频是什么妆容
视频中出现了哪些步骤
使用了哪些产品类型
妆容风格、难度、耗时
是否像美妆教程
用户当前妆容进度照片的问题点
```

第一阶段不自研视频理解模型，不要求 MediaPipe 判断妆容风格。后端通过 `ai_service` 封装多模态模型调用，统一输出结构化 JSON。

#### AI 结果校验层

多模态 AI 生成 MakeupCard 后，后端使用 VideoEvidence 做轻量校验和置信度修正：

```text
AI 说“眼线较长” → 检查眼尾区域 evidence 是否支持
AI 说“腮红偏低” → 检查脸颊色块位置是否支持
AI 说“豆沙唇” → 检查唇部区域主色是否接近低饱和红棕
AI 说“步骤包含唇妆” → 检查后段帧唇部区域是否有明显变化
证据不足 → 降低置信度或改写为“不明显 / 推测”
```

这层不是为了推翻 AI，而是减少 AI 在妆容细节上的自由发挥，让最终卡片更稳定。

#### MediaPipe 负责

用于解析聊天页上传自拍的人脸关键点和基础几何特征，也复用在视频关键帧证据增强中：

```text
是否检测到人脸
脸部轮廓关键点
眼部、眉毛、唇部关键点
面部朝向和基础姿态
脸型比例辅助特征
眼线、腮红、唇妆建议所需的几何位置
```

MediaPipe 的输出不直接等于“美妆结论”。后端会把 MediaPipe 几何特征、多模态 AI 结果和产品规则合并，生成 `BeautyProfile`。

自拍上传保持 PRD 设计：入口放在聊天页右上角，是可选功能。用户不上传自拍时，仍可基于妆容卡片进行通用版文字陪伴；用户上传后，当前聊天会话获得短期图片上下文，用户选择保存档案后才写入长期结构化记忆。

#### 调用方式

MVP 阶段：

```text
视频 / 图片输入
        ↓
video_service 抽帧或读取图片
        ↓
mediapipe_service 提取人脸关键点和局部区域
        ↓
video_evidence_service 生成 VideoEvidence
        ↓
ai_service 基于关键帧、局部 crop、字幕/ASR、VideoEvidence 生成 MakeupCard
        ↓
makeup_card_validator 使用 VideoEvidence 校验 AI 输出
```

聊天页上传自拍：

```text
FastAPI 接收聊天页上传自拍
        ↓
Python MediaPipe Face Landmarker 提取关键点
        ↓
后端整理为 face_geometry JSON
        ↓
多模态 AI + 规则生成 BeautyProfile
        ↓
原始图片仅进入当前 ChatSession 短期上下文
        ↓
用户确认后，仅保存 BeautyProfile / face_geometry_summary 到长期档案
```

后续实时视频陪伴阶段：

```text
React 前端接 @mediapipe/tasks-vision
        ↓
浏览器本地 detectForVideo
        ↓
只把阶段性结果或用户授权截图发给后端
```

当前仓库中的 `mediapipe-master` 作为源码参考和后续二次定制储备。第一阶段优先使用 Python 包或可运行的 Tasks API，不直接编译整个 `mediapipe-master` 源码仓库。

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
│   │       ├── mediapipe_service.py
│   │       ├── video_evidence_service.py
│   │       ├── makeup_card_validator.py
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

接入用户脸部几何解析时，后端增加：

```bash
pip install mediapipe opencv-python pillow numpy
```

如果部署环境不方便安装完整 OpenCV，可优先评估 `opencv-python-headless`。

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
- 调用 MediaPipe 提取脸部关键点和几何特征；
- 调用多模态 AI / 规则生成结构化 BeautyProfile；
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
short_term_context
created_at
updated_at
```

`short_term_context` 用于当前会话内的临时上下文，例如本次上传图片的分析摘要、当前步骤偏好、临时改写建议。它不等同于长期档案，默认不进入 `beauty_profiles` 或 `memory_items`。

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
face_geometry_summary
created_at
updated_at
```

`face_geometry_summary` 用于保存 MediaPipe 解析后的结构化摘要，不保存原始人脸图片。例如：

```json
{
  "faceDetected": true,
  "landmarkVersion": "mediapipe_face_landmarker",
  "faceRatio": "slightly_round",
  "eyeDistanceRatio": 0.42,
  "jawWidthRatio": 0.86,
  "headPose": {
    "yaw": "front",
    "pitch": "neutral"
  },
  "suggestionAnchors": {
    "blushArea": "under_eye_outer",
    "eyelinerArea": "outer_third",
    "lipArea": "natural_lip_boundary"
  }
}
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
analysis_status
analysis_result
retention_policy
expires_at
created_at
```

第一阶段如果不接对象存储，可以只保存本地路径或 mock URL。

`analysis_result` 可保存多模态 AI 对视频/照片的语义理解结果，或 MediaPipe 对自拍的几何解析摘要。聊天页上传的原始自拍默认只作为短期会话素材，`retention_policy` 默认为 `session_only`，可在会话结束或过期后清理。长期档案只保存用户确认后的结构化摘要。

---

#### video_evidence

用于保存 MediaPipe + 图像处理生成的视觉证据摘要。第一阶段也可以不单独建表，先作为 `media_assets.analysis_result.videoEvidence` 保存。

```text
id
media_asset_id
source_type
selected_frames
region_assets
visual_hints
quality_summary
validator_notes
created_at
```

示例结构：

```json
{
  "sourceType": "uploaded_video",
  "selectedFrames": [
    {
      "frameId": "frame_014",
      "timestampMs": 8200,
      "faceDetected": true,
      "quality": {
        "frontFacing": true,
        "blur": "low",
        "occlusion": "low"
      }
    }
  ],
  "regions": {
    "eyes": ["eye_crop_014.jpg"],
    "cheeks": ["cheek_crop_020.jpg"],
    "lips": ["lip_crop_032.jpg"]
  },
  "visualHints": {
    "lipColor": "low_saturation_red_brown",
    "blushPosition": "under_eye_outer",
    "eyeMakeupTone": "light_brown",
    "eyelinerLengthHint": "outer_third_short"
  }
}
```

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

后续接入真实视频 / 图片上传后，首页解析路径升级为：

```text
链接 / 视频 / 截图
        ↓
video_service 抽帧或读取图片
        ↓
mediapipe_service 定位人脸和妆容关键区域
        ↓
video_evidence_service 生成 VideoEvidence
        ↓
ai_service 基于关键帧、局部 crop、字幕/ASR、VideoEvidence 生成 MakeupCard
        ↓
makeup_card_validator 校验并修正 AI 输出置信度
        ↓
返回最终妆容复刻卡片
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

聊天页右上角上传照片。该功能是可选能力，不阻塞首页解析和通用版聊天陪伴。

流程：

```text
点击上传照片
        ↓
弹出 UploadModal
        ↓
用户上传自拍
        ↓
后端调用 MediaPipe 提取脸部关键点 / 几何特征
        ↓
后端调用多模态 AI 或规则生成个人风格分析
        ↓
分析结果进入当前 ChatSession 短期记忆
        ↓
用户选择仅本次使用 / 保存结构化档案
        ↓
仅本次使用：只影响当前对话，不写入长期档案
        ↓
保存结构化档案：写入 BeautyProfile / memory_items
        ↓
聊天页根据短期记忆或长期档案改写妆容步骤
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

第一版可以先 mock 多模态 AI 结果，但接口结构要保留两类输出：

```json
{
  "retention": {
    "rawImage": "session_only",
    "longTermProfileSaved": false
  },
  "faceGeometry": {
    "faceDetected": true,
    "source": "mediapipe",
    "faceRatio": "slightly_round",
    "suggestionAnchors": {
      "blushArea": "under_eye_outer",
      "eyelinerArea": "outer_third"
    }
  },
  "beautyProfile": {
    "faceShape": "方圆脸",
    "skinTone": "自然偏暖",
    "featureStyle": "淡颜偏自然"
  }
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

### 8.1 第一阶段：保留真实接口，AI 和 MediaPipe 先可 mock

先让后端返回 mock 数据，但命名为真实服务：

```text
ai_service.generate_makeup_card()
ai_service.generate_chat_reply()
ai_service.analyze_video_or_image()
ai_service.generate_beauty_profile()
mediapipe_service.extract_face_geometry()
video_evidence_service.build_video_evidence()
makeup_card_validator.validate_with_evidence()
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

### 8.3 第三阶段：接多模态视觉模型

用于：

```text
美妆视频内容理解
视频关键帧 / 截图语义分析
上传照片中的妆容风格分析
拍照检查当前妆容进度
```

输出必须结构化，不要让模型自由发挥：

```json
{
  "contentType": "makeup_video",
  "makeupStyle": "",
  "steps": [],
  "products": [],
  "riskPoints": [],
  "difficulty": "",
  "estimatedTime": "",
  "confidence": ""
}
```

多模态 AI 负责判断“视频里是什么妆、有什么步骤、照片里当前妆容哪里需要调整”。它不负责稳定输出脸部关键点。

多模态 AI 的输入应尽量包含 MediaPipe 处理后的证据，而不是只上传原始整段视频：

```text
精选关键帧
眼妆 / 腮红 / 唇妆局部 crop
字幕 / ASR 文本
VideoEvidence JSON
```

AI 输出后必须经过 `makeup_card_validator` 做证据一致性检查：

```text
字段缺失 → 后端兜底
证据支持 → 保持结论
证据不足 → 降低 confidence 或改成“推测”
证据冲突 → 保留更保守表达，避免过度确定
```

### 8.3.0 MediaPipe 视频证据增强

MediaPipe 在视频/图片解析环节作为 AI 的前处理和后校验依据：

```text
video_service.extract_frames()
mediapipe_service.detect_face_landmarks()
mediapipe_service.crop_makeup_regions()
image_service.extract_region_color_hints()
video_evidence_service.build_video_evidence()
ai_service.generate_makeup_card(evidence)
makeup_card_validator.validate_with_evidence(card, evidence)
```

第一阶段可 mock `VideoEvidence`，第二阶段再接真实抽帧和 MediaPipe。

### 8.3.1 MediaPipe 用户脸部解析

MediaPipe 不负责判断“这个妆好不好看”或“用户适合什么风格”，只负责稳定提取用户自拍中的脸部几何数据：

```text
人脸检测状态
脸部关键点
脸部轮廓比例
眼部 / 眉毛 / 唇部位置
面部姿态
用于腮红、眼线、唇妆建议的几何锚点
```

后端输出示例：

```json
{
  "faceDetected": true,
  "landmarks": "internal_or_reduced",
  "faceRatio": "slightly_round",
  "headPose": {
    "yaw": "front",
    "pitch": "neutral"
  },
  "suggestionAnchors": {
    "blushArea": "under_eye_outer",
    "eyelinerArea": "outer_third",
    "lipArea": "natural_lip_boundary"
  }
}
```

隐私要求：

```text
默认不保存原始自拍
默认不保存完整 landmark 明细到长期档案
聊天页上传图片默认只进入当前 ChatSession 短期记忆
长期档案只保存结构化摘要
用户选择“仅本次分析”时，不写入 beauty_profiles
用户明确选择“保存到我的妆容档案”后，才写入 BeautyProfile / memory_items
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
VideoEvidence mock 结构
妆容卡片生成
卡片导入聊天
聊天消息 API
上传照片入口
MediaPipe 脸部几何解析接口可 mock
个人风格分析 mock API（合并 faceGeometry + beautyProfile）
我的页妆容档案
历史记录弹层
```

---

### P1：尽量完成

```text
真实文本大模型聊天
多模态 AI 分析视频 / 图片内容
MediaPipe Face Landmarker 真实接入
MediaPipe 视频关键帧证据增强
MakeupCard 证据一致性校验
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
更精细的时序步骤识别
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
后端返回 mock VideoEvidence
后端返回妆容卡片
前端展示 MakeupCard
支持分享提示
支持导入聊天
```

交付：

```text
首页闭环完成
MakeupCard 接口已预留 videoEvidence 和 confidence 字段
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
MediaPipe 解析 faceGeometry
返回个人风格分析
支持仅本次使用 / 保存结构化档案
聊天页使用短期记忆或长期档案改写建议
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
5. 增加视觉服务骨架：
   - services/mediapipe_service.py：调用 MediaPipe Face Landmarker，解析人脸关键点、妆容局部区域和几何摘要。
   - services/video_evidence_service.py：基于关键帧、局部 crop、颜色提示生成 VideoEvidence。
   - services/makeup_card_validator.py：用 VideoEvidence 校验 AI 生成的 MakeupCard。
6. 建立基础 API：
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
7. 第一版 API 可以先返回 mock 数据，但接口结构要真实。视频/照片内容理解字段按多模态 AI 输出设计；视频/图片证据增强字段按 VideoEvidence 输出设计；用户脸部解析字段按 MediaPipe faceGeometry 输出设计。
8. 前端必须从 API 获取数据，不要继续把所有数据写死在组件里。
9. 完成后给出项目目录、启动方式、已完成内容和下一步建议。

重要限制：
- 底部导航只能有：首页、聊天、我的。
- 上传照片和历史记录必须放在聊天页右上角。
- 首页只负责粘贴链接、解析视频、生成卡片、分享卡片、导入聊天。
- 我的页只负责妆容档案、AI 已记住、历史总结、隐私设置。
- 聊天页上传的原始图片默认只进入当前会话短期记忆，不自动写入长期档案。
- 只有用户选择保存结构化档案时，才把 BeautyProfile / faceGeometry 摘要写入长期记忆。
- 不要引入复杂登录系统。
- 不要做真实抖音爬虫。
- 视频和照片内容理解由多模态 AI 完成，但输入应优先使用 MediaPipe 处理后的关键帧、局部 crop 和 VideoEvidence。
- MediaPipe 不硬判妆容风格，它负责视频/图片证据增强、用户自拍人脸关键点、几何特征和建议锚点。
- AI 生成 MakeupCard 后，要用 VideoEvidence 做轻量校验：证据不足时降低置信度或使用更保守表达。
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

### 12.2.1 多模态 AI 与 MediaPipe 职责混淆风险

风险：

```text
误用 MediaPipe 判断妆容风格
误用多模态 AI 输出精确脸部关键点
多模态 AI 直接看整段视频导致细节粗糙或幻觉
缺少 VideoEvidence 导致 MakeupCard 难以解释和校验
自拍分析结果缺少稳定几何依据
长期档案保存过细的人脸数据
```

控制：

```text
视频/照片语义理解统一走多模态 AI
视频/图片先经过 MediaPipe 证据增强，生成关键帧、局部 crop 和 VideoEvidence
MakeupCard 输出后用 VideoEvidence 做轻量一致性校验
用户脸部关键点和几何锚点统一走 MediaPipe
BeautyProfile 由后端合并 AI 语义、MediaPipe 几何和产品规则生成
聊天页上传图片默认进入短期会话记忆
长期档案只保存用户确认后的结构化摘要，不保存完整 landmarks 和原始照片
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
聊天页上传图片默认只用于当前会话短期记忆
只有用户确认后才保存结构化妆容档案
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

> 用户能在首页粘贴链接，生成妆容卡片，导入聊天，与 AI 对话；可选在聊天页上传照片做本次短期分析，并在用户确认后把结构化个人档案沉淀到我的页。

这就是当前版本最应该完成的全栈 MVP。
