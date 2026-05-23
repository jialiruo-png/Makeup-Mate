# 妆搭 Makeup Mate 第一阶段开发文档

> 版本：Phase 1  
> 依据：`prd.md` 为产品准绳，`plan1.md` 为技术路线底稿，`design.md` 为视觉约束  
> 当前日期：2026-05-23  
> 第一阶段目标：把现有 `index.html` 高保真 Demo 升级为可持续迭代的 React + FastAPI 全栈 MVP。

---

## 1. 阶段定位

第一阶段不是做完整商业化小程序，也不是一次性接齐真实抖音解析、实时视频陪伴和完整 AI 能力，而是完成一个可演示、可迭代、接口结构真实的全栈原型。

第一阶段必须跑通 PRD 的核心闭环：

```text
首页粘贴链接 / 上传图片 / 上传视频
        ↓
生成妆容解析卡片
        ↓
分享卡片或导入聊天
        ↓
聊天页基于卡片 / 灵感库开启文字陪伴
        ↓
可选上传自拍做短期个人风格分析
        ↓
用户确认后保存结构化妆容档案
        ↓
我的页展示长期档案、AI 记忆、历史总结与隐私设置
```

产品范围以新版 PRD 为准：

- 底部导航只保留：首页、聊天、我的。
- 首页只承担解析入口与妆容卡片生成。
- 聊天页同时承担 AI 陪伴与美妆灵感库。
- 历史记录与上传照片固定在聊天页右上角。
- 我的页承接长期档案、AI 已记住、历史总结、隐私设置。
- 自拍 / 自拍视频上传为可选功能，默认只进入当前聊天会话短期记忆。
- 原始自拍、原始视频默认不长期保存。
- 长期记忆只保存用户确认后的结构化 `BeautyProfile` 和 `faceGeometrySummary`。

---

## 2. 第一阶段技术栈

### 2.1 前端

```text
Vite + React + TypeScript
```

第一阶段前端职责：

- 将当前单文件 `index.html` 拆成工程化组件。
- 保留 `design.md` 的奶油粉调、iPhone 手机框、三页底部导航。
- 所有核心数据从后端 API 获取，组件内只允许保留兜底展示数据。
- 实现首页解析、卡片导入聊天、灵感库、聊天快捷回复、上传弹窗、历史弹窗、我的页档案展示。

暂不采用：

- Next.js：当前不需要 SSR、复杂路由和一体化后端。
- Taro / uni-app：微信小程序迁移放在后续阶段。

### 2.2 后端

```text
FastAPI + Python + SQLite + SQLAlchemy / SQLModel
```

第一阶段后端职责：

- 提供真实 API 骨架。
- 使用 SQLite 落地妆容卡片、聊天会话、历史、档案、媒体素材元数据。
- AI、MediaPipe、视频抽帧能力先封装为服务层，允许 mock 返回。
- 保证接口输入输出结构稳定，后续可替换为真实模型和真实解析。

后续升级：

```text
PostgreSQL + Redis + 对象存储 + 后台任务队列
```

---

## 3. 阶段范围

### 3.0 已确认开发决策

本轮已确认以下第一阶段策略：

- P0 先跑通全栈闭环，聊天、解析、个人风格分析先使用 mock 结果。
- P0 保留真实 `ai_service`、`mediapipe_service`、`video_evidence_service`、`makeup_card_validator` 服务接口，后续替换内部实现。
- P0 实现真实文件上传到后端临时目录，但图片 / 视频内容分析先 mock。
- P1 优先接入 MediaPipe 自拍脸部几何解析，再接视频关键帧证据增强。
- P0 分享卡片先做分享成功提示和分享文案，不生成真实图片。
- 第一阶段不做真实登录，使用默认用户 `user_demo`。
- 语音陪伴 P0 只保留入口和按钮状态，不做真实 TTS / ASR。

### 3.1 P0 必须完成

| 模块 | P0 功能 | 实现方式 |
|---|---|---|
| 基础工程 | 前端 React 工程、后端 FastAPI 工程 | 真实工程 |
| 三页结构 | 首页 / 聊天 / 我的三页底部导航 | 真实前端 |
| 首页解析 | 链接输入、上传图片入口、上传视频入口、解析状态 | 前端真实交互，后端 mock 分析 |
| 文件上传 | 首页图片/视频、聊天页自拍/进度图上传 | 真实 multipart 上传到后端临时目录 |
| 妆容卡片 | 名称、标签、难度、耗时、场景、产品、步骤、翻车点、AI 提示 | 后端返回结构化 `MakeupCard` |
| 分享卡片 | 点击后生成分享成功状态 | P0 可先模拟，不生成真实图片 |
| 导入聊天 | 卡片导入聊天并创建 `ChatSession` | 真实接口 |
| 聊天页灵感库 | 美妆博主库、风格复刻、场景妆容、新手陪练 | 后端返回 mock 数据 |
| 灵感卡片 | 展示名称、标签、代表妆容、适合人群、难度、分析、操作 | 数据驱动 |
| 生成我的版本 | 从灵感卡片生成个性化复刻方案 | P0 mock，接口真实 |
| 文字陪伴 | 分步骤聊天指导、快捷按钮 | mock AI 回复 |
| 语音陪伴入口 | 聊天页保留语音按钮和状态入口 | P0 只保留入口，不做真实语音 |
| 历史记录 | 聊天页右上角历史弹层，支持继续上妆、删除 | 真实接口，数据可 mock/SQLite |
| 上传照片 | 聊天页右上角上传弹窗，支持仅本次 / 保存档案选择 | 真实 UI，分析可 mock |
| 个人风格分析 | 输出脸型、肤色、五官、眼型、腮红、眼线、唇色、避免风格 | mock `faceGeometry + BeautyProfile` |
| 我的页 | 妆容档案、AI 已记住、历史总结、隐私设置 | 从 API 获取 |
| 隐私边界 | 不保存原始自拍默认规则、结构化长期档案规则 | 文案 + 数据字段体现 |

### 3.2 P1 尽量完成

| 模块 | P1 功能 | 实现方式 |
|---|---|---|
| MediaPipe 自拍解析 | 使用 Python MediaPipe Face Landmarker 输出基础几何摘要 | 可接真实包 |
| 视频证据增强 | 抽帧、脸部检测、眼颊唇 crop、颜色提示 | 可先处理上传视频，链接仍 mock |
| MakeupCard 校验 | 用 `VideoEvidence` 修正 AI 输出置信度 | 规则实现 |
| 文本大模型 | 真实生成聊天回复、改写步骤 | 封装在 `ai_service` |
| 上传图片检查 | 聊天中上传当前妆容进度图并返回建议 | 多模态 AI 可后接 |
| TTS 语音播报 | 播报当前步骤 | 前端 Web Speech 或后端 TTS |
| 分享图片 | 生成可分享卡片图片 | 前端 canvas 或后端图片服务 |
| 灵感筛选 | 按风格、达人、场景、难度筛选 | 接口支持 |

### 3.3 P2 暂不做

- 实时视频陪伴。
- 摄像头连续画面理解。
- AR 试妆。
- 真实抖音 / 小红书 / B站全链路抓取。
- 微信小程序上线。
- 完整登录系统。
- 电商商品推荐闭环。
- 社区分享。

---

## 4. 推荐目录结构

```text
Makeup Mate/
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.ts
│   │   │   ├── makeupCards.ts
│   │   │   ├── chat.ts
│   │   │   ├── inspirations.ts
│   │   │   ├── profile.ts
│   │   │   └── history.ts
│   │   ├── components/
│   │   │   ├── PhoneFrame.tsx
│   │   │   ├── BottomNav.tsx
│   │   │   ├── MakeupCard.tsx
│   │   │   ├── InspirationCard.tsx
│   │   │   ├── ChatBubble.tsx
│   │   │   ├── StepCard.tsx
│   │   │   ├── UploadModal.tsx
│   │   │   ├── HistoryModal.tsx
│   │   │   └── Toast.tsx
│   │   ├── pages/
│   │   │   ├── HomePage.tsx
│   │   │   ├── ChatPage.tsx
│   │   │   └── ProfilePage.tsx
│   │   ├── state/
│   │   │   └── appStore.ts
│   │   ├── styles/
│   │   │   ├── tokens.css
│   │   │   └── global.css
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── db.py
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── makeup_card.py
│   │   │   ├── inspiration.py
│   │   │   ├── chat.py
│   │   │   ├── beauty_profile.py
│   │   │   ├── media_asset.py
│   │   │   └── memory.py
│   │   ├── schemas/
│   │   │   ├── makeup_card.py
│   │   │   ├── inspiration.py
│   │   │   ├── chat.py
│   │   │   ├── beauty_profile.py
│   │   │   ├── media.py
│   │   │   └── common.py
│   │   ├── routes/
│   │   │   ├── makeup_cards.py
│   │   │   ├── inspirations.py
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
│   │       ├── inspiration_service.py
│   │       ├── memory_service.py
│   │       └── share_service.py
│   ├── requirements.txt
│   └── .env.example
│
├── docs/
│   └── phase1-development-spec.md
├── index.html
├── prd.md
├── plan1.md
├── design.md
└── mediapipe-master/
```

---

## 5. 前端开发规格

### 5.1 全局要求

- 默认展示可保持当前 Demo 的 iPhone 模型形式，适合桌面演示。
- 手机内部只展示小程序三页，不新增独立页面。
- 样式以 `design.md` 为准：奶油白、奶茶粉、豆沙粉、勃艮第酒红、少量 AI 绿色。
- 不采用新版 PRD 中提到的黑色 + 荧光绿聊天页方向，除非后续明确修改 `design.md`。当前视觉准绳是 `design.md`。
- 所有页面需要移动端约束，避免文字溢出和内容遮挡。
- 所有请求统一走 `api/client.ts`。

### 5.2 状态管理

第一阶段可使用 React 内置状态或轻量 store，不引入复杂状态库。

建议全局状态：

```ts
type AppState = {
  activeTab: "home" | "chat" | "profile";
  currentUserId: string;
  currentCard?: MakeupCard;
  currentSession?: ChatSession;
  toast?: ToastState;
};
```

### 5.3 首页 HomePage

首页必须包含：

- 品牌区：妆搭 Makeup Mate。
- 核心文案：粘贴美妆视频链接，或上传图片/视频，生成你的专属复刻卡片。
- 链接输入框。
- 上传图片按钮。
- 上传视频按钮。
- 开始解析妆容按钮。
- 解析状态流转。
- 妆容卡片区域。
- 分享卡片按钮。
- 导入聊天按钮。

交互流程：

```text
用户输入链接或选择上传文件
        ↓
点击开始解析妆容
        ↓
调用 /api/makeup-cards/analyze
        ↓
展示 loading steps
        ↓
显示 MakeupCard
        ↓
分享 / 导入聊天
```

异常提示：

- 链接为空：请先粘贴一个美妆内容链接，或上传图片/视频。
- 平台不支持：当前版本优先支持抖音链接，也可以上传截图或视频。
- 非美妆内容：这个内容不像美妆教程，可以换一个妆容内容来源。
- 解析失败：内容解析失败，请稍后重试。

### 5.4 聊天页 ChatPage

聊天页是第一阶段最重要页面，需要同时承载三块内容：

```text
顶部工具栏
美妆灵感库
聊天陪伴区
```

顶部工具栏：

- 左侧：返回 / 首页入口。
- 中间：妆搭 MM。
- 右上角左侧：历史记录图标。
- 右上角右侧：上传照片图标。

美妆灵感库：

- 四类入口：美妆博主库、风格复刻、场景妆容、新手陪练。
- 筛选：按风格、按达人、按场景、按难度。
- 卡片字段：名称、头像/占位图、风格标签、代表妆容、适合人群、难度、妆搭分析、代表视频链接、生成我的版本、导入聊天。

聊天陪伴区：

- 已导入妆容卡片摘要。
- AI / 用户消息气泡。
- 当前步骤卡片。
- 快捷按钮：我完成了、换种说法、没有这个产品怎么办、拍照检查一下、太难了、快一点。
- 底部输入框：图片上传、文本输入、语音按钮、发送按钮。

导入卡片后的初始消息：

```text
我已经读完这张「清冷感通勤妆」解析卡片啦。接下来我可以陪你一步步画，也可以先根据你的自拍帮你调整成更适合你的版本。
```

灵感卡片生成我的版本后的初始消息：

```text
我已经根据「清冷通勤妆助手」生成了一版适合日常复刻的方案。你可以直接开始，也可以上传自拍，让我把腮红、眼线和唇色再调得更贴合你。
```

### 5.5 上传弹窗 UploadModal

入口固定在聊天页右上角。

弹窗内容：

- 上传自拍。
- 上传自拍视频。
- 隐私提示。
- 选项：仅本次分析。
- 选项：保存到我的妆容档案。

默认规则：

- 默认选择“仅本次分析”。
- 不默认保存原始图片。
- 用户选择保存档案时，也只保存结构化摘要，不保存原始图片。

上传后展示：

- 脸型。
- 肤色。
- 五官风格。
- 眼型。
- 推荐腮红。
- 推荐眼线。
- 推荐唇色。
- 避免风格。
- 该分析是否已保存到长期档案。

### 5.6 历史弹窗 HistoryModal

入口固定在聊天页右上角。

列表字段：

- 妆容名称。
- 来源：链接 / 上传图片 / 上传视频 / 灵感库。
- 时间。
- 状态：只解析 / 已导入聊天 / 已完成。
- 操作：继续上妆、重新导入、删除。

### 5.7 我的页 ProfilePage

必须展示：

- 用户头像 / 昵称 / 档案完成度。
- 我的妆容档案。
- AI 已记住。
- 历史总结。
- 隐私设置。

隐私设置第一阶段可先做 UI + API mock：

- 是否保存妆容档案。
- 删除照片分析结果。
- 清空妆容记忆。
- 导出我的档案。

---

## 6. 后端 API 规格

统一前缀：

```text
/api
```

### 6.1 妆容卡片

#### POST `/api/makeup-cards/analyze`

支持链接、图片、视频三类输入。第一阶段可根据 `sourceType` 返回 mock 卡片。

请求：

```json
{
  "sourceType": "link",
  "sourceUrl": "https://v.douyin.com/xxx",
  "mediaAssetId": null
}
```

返回：

```json
{
  "card": {
    "cardId": "card_001",
    "sourceType": "link",
    "sourcePlatform": "douyin",
    "sourceUrl": "https://v.douyin.com/xxx",
    "title": "清冷感通勤妆",
    "styleTags": ["低饱和", "干净", "淡颜友好"],
    "difficulty": "中等",
    "estimatedTime": "18分钟",
    "scenes": ["通勤", "上课", "面试"],
    "productTypes": ["气垫", "遮瑕", "浅棕眼影", "棕色眼线笔", "杏粉腮红", "奶茶豆沙唇泥"],
    "steps": [
      {
        "stepNo": 1,
        "part": "底妆",
        "instruction": "轻薄雾面底妆，重点均匀肤色",
        "tips": ["不要追求强遮瑕", "保持妆面干净"]
      }
    ],
    "riskPoints": ["眼线过长", "修容过重", "唇色过深"],
    "aiTip": "这个妆容整体适合日常，新手建议弱化眼线和修容。",
    "confidence": 0.82,
    "evidenceSummary": {
      "hasVideoEvidence": true,
      "supportLevel": "mock"
    },
    "createdAt": "2026-05-23T00:00:00+08:00"
  },
  "videoEvidence": {
    "sourceType": "link",
    "selectedFrames": [],
    "regions": {},
    "visualHints": {
      "lipColor": "low_saturation_red_brown",
      "blushPosition": "under_eye_outer",
      "eyeMakeupTone": "light_brown",
      "eyelinerLengthHint": "outer_third_short"
    }
  }
}
```

#### GET `/api/makeup-cards/{card_id}`

返回指定妆容卡片。

#### POST `/api/makeup-cards/{card_id}/share`

P0 返回分享文案和模拟分享图片 URL。

### 6.2 媒体上传

#### POST `/api/media/upload`

用于首页上传图片 / 视频、聊天页上传自拍 / 进度图。

P0 要实现真实 multipart 上传，并把文件保存到后端临时目录或本地开发目录。第一阶段不要求真实分析文件内容，上传后的分析结果仍由 mock service 返回。这样前端上传链路、后端媒体元数据和后续 MediaPipe 接入路径都是真实的。

表单字段：

```text
file
purpose: makeup_source_image | makeup_source_video | selfie | progress_check
sessionId: 可选
retentionPolicy: session_only | profile_summary_allowed
```

返回：

```json
{
  "mediaAssetId": "media_001",
  "fileType": "image",
  "purpose": "selfie",
  "analysisStatus": "pending",
  "retentionPolicy": "session_only",
  "expiresAt": "2026-05-24T00:00:00+08:00"
}
```

P0 保存策略：

- 首页上传的妆容图片 / 视频保存为临时素材，供 mock 分析链路引用。
- 聊天页自拍默认 `retentionPolicy = session_only`。
- 不把原始自拍写入长期档案。
- 本地开发阶段可使用 `backend/storage/tmp/`，生产阶段再替换为对象存储。

### 6.3 美妆灵感库

#### GET `/api/inspirations`

查询参数：

```text
type=creator | style | scene | beginner_training
style=清冷通勤
scene=通勤
difficulty=新手
```

返回：

```json
{
  "items": [
    {
      "inspirationId": "insp_001",
      "type": "style",
      "name": "清冷通勤妆助手",
      "avatarUrl": null,
      "styleTags": ["清冷", "低饱和", "通勤"],
      "representativeLook": "清冷感通勤妆",
      "suitableFor": ["淡颜", "新手", "上班族"],
      "difficulty": "中等",
      "analysis": "底妆干净、眼线短、腮红弱存在感。",
      "representativeVideoUrl": null,
      "categories": {
        "style": ["清冷通勤"],
        "creatorType": [],
        "scene": ["通勤", "面试"]
      }
    }
  ]
}
```

#### POST `/api/inspirations/{inspiration_id}/generate-my-version`

基于灵感卡片、当前用户档案、可选自拍短期分析，生成个人复刻方案。

请求：

```json
{
  "sessionId": "chat_001",
  "useProfile": true,
  "useShortTermContext": true
}
```

返回：

```json
{
  "card": {
    "cardId": "card_from_insp_001",
    "title": "我的清冷通勤妆",
    "styleTags": ["清冷", "低饱和", "新手友好"],
    "difficulty": "简单",
    "estimatedTime": "15分钟",
    "steps": []
  },
  "personalizedAdjustments": [
    {
      "original": "眼线自然延长",
      "mine": "只画后半段，眼尾延长约 2mm",
      "reason": "更适合淡颜和通勤场景"
    }
  ]
}
```

### 6.4 聊天

#### POST `/api/chat/sessions`

请求：

```json
{
  "cardId": "card_001",
  "inspirationId": null,
  "mode": "text_companion"
}
```

返回：

```json
{
  "sessionId": "chat_001",
  "cardId": "card_001",
  "mode": "text_companion",
  "currentStep": "准备开始",
  "messages": [
    {
      "messageId": "msg_001",
      "role": "assistant",
      "content": "我已经读完这张「清冷感通勤妆」解析卡片啦。接下来我可以陪你一步步画，也可以先根据你的自拍帮你调整成更适合你的版本。",
      "messageType": "text"
    }
  ]
}
```

#### GET `/api/chat/sessions/{session_id}/messages`

返回会话消息。

#### POST `/api/chat/sessions/{session_id}/messages`

请求：

```json
{
  "content": "我没有杏粉色腮红怎么办？",
  "messageType": "text",
  "quickAction": null
}
```

返回：

```json
{
  "userMessage": {},
  "assistantMessage": {
    "role": "assistant",
    "content": "可以用低饱和豆沙粉或很浅的奶茶粉替代。重点是少量多次，位置放在眼下外侧，不要压到颧骨下方。",
    "messageType": "text"
  },
  "currentStep": "腮红"
}
```

### 6.5 个人档案

#### POST `/api/profile/analyze-photo`

用于聊天页上传自拍后的分析。原始图片默认短期使用。

请求：

```json
{
  "mediaAssetId": "media_001",
  "sessionId": "chat_001",
  "saveToProfile": false
}
```

返回：

```json
{
  "retention": {
    "rawImage": "session_only",
    "longTermProfileSaved": false
  },
  "faceGeometry": {
    "faceDetected": true,
    "source": "mediapipe_mock",
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
  },
  "beautyProfile": {
    "faceShape": "方圆脸",
    "skinTone": "自然偏暖",
    "featureStyle": "淡颜偏自然",
    "eyeType": "内双",
    "preferredBlushPosition": "眼下外侧上移",
    "preferredEyeliner": "后半段短眼线",
    "preferredLipColors": ["奶茶色", "豆沙色", "低饱和红棕"],
    "avoidStyles": ["重修容", "过长上挑眼线"]
  }
}
```

#### GET `/api/profile/me`

返回当前用户长期妆容档案。

#### PATCH `/api/profile/me`

更新结构化档案或隐私设置。

#### DELETE `/api/profile/me/memory`

清空 AI 长期记忆。

### 6.6 历史记录

#### GET `/api/history`

返回历史妆容卡片、灵感方案、聊天会话摘要。

#### DELETE `/api/history/{item_id}`

删除历史记录。

---

## 7. 数据模型

### 7.1 users

```text
id
nickname
avatar_url
created_at
updated_at
```

第一阶段使用默认用户，不做注册登录。

### 7.2 makeup_cards

```text
id
user_id
source_type
source_platform
source_url
source_asset_id
title
style_tags JSON
difficulty
estimated_time
scenes JSON
product_types JSON
steps JSON
risk_points JSON
ai_tip
confidence
evidence_summary JSON
created_at
updated_at
```

### 7.3 beauty_inspirations

```text
id
type
name
avatar_url
style_tags JSON
representative_look
suitable_for JSON
difficulty
analysis
representative_video_url
categories JSON
created_at
updated_at
```

P0 可 seed 一组 mock 数据到 SQLite。

### 7.4 chat_sessions

```text
id
user_id
makeup_card_id
inspiration_id
mode
current_step
short_term_context JSON
created_at
updated_at
```

`short_term_context` 用于保存当前会话临时信息：

- 本次上传自拍的分析摘要。
- 本次进度图检查结果。
- 当前步骤偏好。
- 10 分钟快速版 / 新手版等临时改写状态。

这些信息默认不进入长期档案。

### 7.5 chat_messages

```text
id
session_id
role
content
message_type
metadata JSON
created_at
```

### 7.6 beauty_profiles

```text
id
user_id
face_shape
skin_tone
feature_style
eye_type
preferred_blush_position
preferred_eyeliner
preferred_lip_colors JSON
avoid_styles JSON
skill_level
common_scenes JSON
time_preference
memory_enabled
save_raw_photo
face_geometry_summary JSON
created_at
updated_at
```

### 7.7 media_assets

```text
id
user_id
file_type
file_url
purpose
analysis_status
analysis_result JSON
retention_policy
expires_at
created_at
```

`retention_policy` 取值：

```text
session_only
profile_summary_allowed
temporary_source
```

### 7.8 memory_items

```text
id
user_id
memory_type
content
source
created_at
updated_at
```

`memory_type` 示例：

```text
stable_profile
preference
history_feedback
privacy_setting
```

---

## 8. AI 与 MediaPipe 实现路径

### 8.1 职责边界

MediaPipe 不负责判断美妆风格，也不负责判断“适不适合”。它负责提供稳定的视觉几何证据。

多模态 AI 负责妆容语义理解：

- 这是什么妆容。
- 有哪些步骤。
- 产品类型是什么。
- 风格标签是什么。
- 难度和耗时如何。
- 用户当前进度图哪里需要调整。

后端规则层负责：

- 合并 MediaPipe 证据、多模态 AI 结果、用户档案。
- 生成结构化 `MakeupCard`、`BeautyProfile`、`personalizedAdjustments`。
- 做隐私裁剪和安全表达过滤。

### 8.2 视频 / 图片解析流程

第一阶段接口结构按真实流程设计，内部可 mock：

```text
用户上传链接 / 图片 / 视频
        ↓
video_service 提取关键帧或读取图片
        ↓
mediapipe_service 检测人脸、关键点、姿态
        ↓
image_service 裁剪眼部、脸颊、唇部区域并提取颜色提示
        ↓
video_evidence_service 生成 VideoEvidence
        ↓
ai_service 根据关键帧、局部 crop、字幕/ASR、VideoEvidence 生成 MakeupCard
        ↓
makeup_card_validator 用 VideoEvidence 检查 AI 结论
        ↓
返回最终 MakeupCard
```

P0：

- `video_service` 返回 mock 关键帧。
- `mediapipe_service` 返回 mock face landmarks summary。
- `video_evidence_service` 返回 mock `VideoEvidence`。
- `ai_service` 返回固定结构化卡片。
- `makeup_card_validator` 只补默认 `confidence` 和保守提示。

P1：

- 对上传图片 / 视频接真实 MediaPipe。
- 链接类输入仍可暂时 mock 或使用预设样例。

### 8.3 自拍个人风格分析流程

```text
聊天页上传自拍
        ↓
media_assets 写入 session_only
        ↓
mediapipe_service 提取 faceGeometry
        ↓
ai_service / rules 生成 BeautyProfile 建议
        ↓
写入 chat_sessions.short_term_context
        ↓
如果 saveToProfile = true，写入 beauty_profiles 和 memory_items
        ↓
原始图片不写入长期档案
```

长期保存只允许保存：

- 脸型标签。
- 肤色倾向。
- 五官风格。
- 眼型。
- 适合腮红位置。
- 适合眼线位置。
- 适合唇色。
- 避免风格。
- 精简 `face_geometry_summary`。

默认不保存：

- 原始自拍。
- 原始自拍视频。
- 完整 landmarks 明细。
- 可用于人脸识别的向量或模板。

### 8.4 MakeupCard 证据校验

`makeup_card_validator.py` 负责减少多模态 AI 自由发挥。

规则示例：

```text
AI 说“眼线较长”
  如果 VideoEvidence.eyelinerLengthHint 支持，则保留
  如果证据不足，则改为“眼尾有轻微延长，具体长度以画面为准”

AI 说“腮红偏低”
  如果 blushPosition 支持，则保留
  如果冲突，则改为“腮红位置不完全清晰，建议复刻时放在眼下外侧”

AI 说“豆沙唇”
  如果 lipColor 接近低饱和红棕，则保留
  如果证据不足，则改为“低饱和红棕系或奶茶豆沙系”
```

P0 可只实现一个简单函数：

```text
validate_with_evidence(card, evidence) -> card_with_confidence
```

---

## 9. 安全、隐私与表达规则

### 9.1 禁止功能

- 颜值评分。
- 容貌缺陷评价。
- 医疗诊断。
- 皮肤病判断。
- 人脸识别登录。
- 人脸比对。
- 建立人脸库。
- 强商品导购。

### 9.2 推荐表达

错误：

```text
你的脸太圆，眼睛不够大。
```

正确：

```text
你的脸型偏圆，更适合把腮红位置上移到眼下外侧，整体会更轻盈。
```

### 9.3 数据保留

P0 必须通过字段和 UI 文案体现：

- 上传内容仅用于生成美妆适配建议。
- 默认仅本次分析。
- 保存档案时只保存结构化标签。
- 用户可以删除档案与历史记忆。

---

## 10. 开发顺序

### Step 1：前端工程化

- 初始化 `frontend`。
- 迁移 `index.html` 视觉到 React。
- 建立 `PhoneFrame`、`BottomNav`、三页组件。
- 保留现有 demo 的高保真外观。

验收：

- `npm run dev` 可启动。
- 三页切换正常。
- 底部导航只有：首页、聊天、我的。

### Step 2：后端骨架

- 初始化 `backend`。
- 配置 FastAPI、CORS、SQLite。
- 建立路由、schemas、services。
- Swagger 可访问。

验收：

- `uvicorn app.main:app --reload --port 8000` 可启动。
- `/docs` 可打开。
- mock API 可返回数据。

### Step 3：首页解析闭环

- 实现 `/api/makeup-cards/analyze`。
- 前端调用接口展示 loading。
- 返回 `MakeupCard + VideoEvidence`。
- 支持分享提示和导入聊天。

验收：

- 用户能从首页生成卡片。
- 卡片字段完整。
- 导入聊天能创建会话。

### Step 4：聊天页与灵感库

- 实现 `/api/inspirations`。
- 实现 `/api/inspirations/{id}/generate-my-version`。
- 实现聊天会话和消息 API。
- 聊天页展示灵感库与聊天区。

验收：

- 用户没有链接时，也能从灵感库选择方案。
- 用户可以发送消息并收到 AI mock 回复。
- 快捷按钮可触发回复。

### Step 5：上传自拍与档案

- 实现媒体上传接口。
- 实现 `/api/profile/analyze-photo`。
- 写入 `chat_sessions.short_term_context`。
- 用户选择保存时写入长期档案。

验收：

- 上传弹窗可用。
- 可展示个人风格分析。
- “仅本次分析”和“保存档案”表现不同。

### Step 6：我的页和历史记录

- 实现 `/api/profile/me`、`PATCH /api/profile/me`。
- 实现 `/api/history`、`DELETE /api/history/{id}`。
- 前端接入我的页和历史弹窗。

验收：

- 我的页可展示保存后的结构化档案。
- 历史弹窗可展示解析记录和聊天记录。

### Step 7：打磨和演示准备

- 完善错误提示。
- 完善 loading 状态。
- 补兜底数据。
- 准备演示脚本和样例链接 / 图片 / 视频。

---

## 11. 第一阶段验收标准

### 11.1 产品验收

- 三页架构符合 PRD。
- 首页可生成妆容解析卡片。
- 妆容卡片可分享、可导入聊天。
- 聊天页包含美妆灵感库，不只是聊天窗口。
- 灵感库支持生成我的版本。
- 聊天页右上角有历史记录和上传照片。
- 上传照片默认仅本次分析。
- 我的页能展示长期妆容档案与 AI 已记住。
- 所有隐私提示符合 PRD。

### 11.2 技术验收

- 前端工程可启动。
- 后端工程可启动。
- 前端通过 API 获取数据。
- API schemas 与 PRD 核心数据结构一致。
- mock AI / mock MediaPipe 被封装在 services 中，后续可替换。
- SQLite 能保存卡片、会话、消息、档案、历史。

### 11.3 演示验收

演示链路必须稳定：

```text
打开应用
进入首页
粘贴美妆链接或上传图片
生成清冷感通勤妆卡片
导入聊天
查看聊天页美妆灵感库
从清冷通勤妆助手生成我的版本
上传自拍
获得个人风格分析
保存结构化档案
进入我的页看到 AI 已记住
回到聊天页查看历史记录
```

---

## 12. 已确认实现决策

以下实现路径已确认，后续开发按这些决策执行：

1. 第一阶段不立即接真实文本大模型。

   执行方式：P0 聊天、解析、个性化改写先返回 mock 数据，但所有能力都通过 `ai_service` 封装，等前后端闭环稳定后再替换为真实模型。

2. P0 要做真实文件上传。

   执行方式：实现真实 multipart 上传到后端临时目录，保存 `media_assets` 元数据；图片 / 视频分析结果先 mock。这样后续接 MediaPipe 不需要改前端。

3. MediaPipe P1 优先接自拍脸部几何解析。

   执行方式：先实现 `mediapipe_service.extract_face_geometry()`，用于聊天页自拍分析和我的妆容档案；视频关键帧证据增强放到下一步。

4. 分享卡片 P0 不生成真实图片。

   执行方式：P0 返回分享文案和模拟分享链接 / 图片 URL，前端展示分享成功提示；P1 再做 canvas 或后端图片生成。

5. 第一阶段不做真实登录。

   执行方式：使用默认用户 `user_demo`，所有 API 默认按该用户读写数据。

6. 聊天页语音陪伴 P0 只保留入口。

   执行方式：前端保留语音按钮、语音陪伴状态和入口文案；P0 不做 TTS / ASR。P1 再做 TTS 播报，实时语音和实时视频继续后置。

---

## 13. 结论

第一阶段最重要的不是炫技，而是建立一个产品闭环清晰、数据结构稳定、后续 AI 能力可替换的全栈 MVP。

优先级排序：

```text
三页结构稳定
        ↓
首页妆容卡片生成
        ↓
聊天页导入卡片 + 灵感库 + 文字陪伴
        ↓
上传自拍短期分析 + 用户确认后长期档案
        ↓
我的页长期记忆展示
        ↓
再接真实 AI / MediaPipe / 语音视频
```

只要这条链路跑通，妆搭 Makeup Mate 就已经从静态 Demo 进入了可以持续开发的产品原型阶段。
