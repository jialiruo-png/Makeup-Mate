# Makeup Mate Repair: 存储与数据落地修复方案

> 当前阶段：黑客松演示优先  
> 目标：在不上 OSS 的前提下，修复“数据到底存在哪里”的混乱点，让线上演示稳定、可解释、可继续迭代。  
> 结论：RDS 放结构化业务数据；ECS 磁盘放用户上传的临时图片/视频；前端 `public` 放固定静态素材；个人电脑本地只用于开发调试。

---

## 1. 问题背景

项目当前已经接入了 RDS/PostgreSQL 的配置，并且 SQLAlchemy 模型也覆盖了用户、聊天、媒体、妆容卡片、历史记录、个人档案等核心业务对象。

但实际代码里仍存在三类“非 RDS 持久化”：

1. 妆容卡片存在 Python 内存缓存 `_CARD_CACHE`。
2. 用户上传图片/视频的文件二进制写在后端服务器磁盘。
3. 前端部分达人头像和灵感库素材放在 `frontend/public` 或本地 JSON 中。

这三类不等价：

- 内存缓存不可靠，服务重启或多 worker 会丢数据。
- 服务器磁盘可以作为黑客松阶段的文件存储，但需要明确路径、清理策略和 RDS 元数据。
- 前端静态资源适合固定头像、默认头像、示例素材，不适合用户动态上传内容。

---

## 2. 当前代码现状

### 2.1 妆容卡片

文件：`backend/app/routes/makeup_cards.py`

当前逻辑：

```text
/api/makeup-cards/analyze
  -> ai_service.analyze_makeup()
  -> makeup_card_validator.validate_with_evidence()
  -> 写入 _CARD_CACHE
  -> 返回 card
```

问题：

- `_CARD_CACHE` 是进程内存，不进 RDS。
- 后端重启后卡片丢失。
- 生产 systemd 使用 `--workers 2` 时，不同 worker 各有一份内存，卡片可能在 A worker 生成，却在 B worker 读取失败。
- 聊天创建会话时也依赖 `_CARD_CACHE` 获取卡片标题。

修复方向：

- `MakeupCard` 必须落 RDS 的 `makeup_cards` 表。
- 聊天、分享、历史都从 RDS 读取卡片，不再依赖 `_CARD_CACHE`。

### 2.2 用户上传媒体

文件：`backend/app/routes/media.py`

当前逻辑：

```text
UploadFile
  -> read bytes
  -> 写入 settings.storage_path
  -> media_assets 表记录 file_url / purpose / retention_policy / expires_at
```

这不是错误。黑客松阶段可以继续这样做。

但需要把概念说清楚：

- 图片/视频文件二进制：放 ECS 磁盘。
- 文件元数据：放 RDS 的 `media_assets` 表。
- Qwen 访问图片：通过 `/api/media/{media_id}/raw` 暴露公网 URL。

当前生产模板中：

```env
STORAGE_DIR=/opt/makeup-mate/backend/storage/tmp
PUBLIC_BASE_URL=http://121.43.144.91:8080
```

这条链路适合黑客松演示，只要服务器磁盘空间足够，并且不要把它误认为“所有文件都在 RDS”。

### 2.3 前端固定素材

当前已有：

```text
frontend/public/assets/creator-avatars/
frontend/src/data/creator_profiles_merged.json
frontend/src/data/makeup_mate_creator_library_schema.json
```

这些适合继续放前端：

- 达人头像
- 默认头像
- 示例素材
- 固定灵感库种子数据

它们不需要进 RDS，也不需要 OSS。

### 2.4 个人电脑本地文件

个人电脑本地只适合开发调试，不适合线上演示。

原因：

- ECS 后端读不到 Mac 本地路径。
- Qwen 不能访问 `file://` 或本地磁盘路径。
- 比赛现场如果靠内网穿透，会增加不稳定因素。

线上演示时，用户上传内容应该进入 ECS 后端，再由 ECS 提供公网可访问 URL。

---

## 3. 黑客松推荐架构

当前阶段不引入 OSS。采用：

```text
RDS PostgreSQL
  - users
  - makeup_cards
  - chat_sessions
  - chat_messages
  - media_assets 元数据
  - beauty_profiles
  - memory_items
  - history_items

ECS 磁盘
  - 用户上传自拍
  - 用户上传妆容图
  - 用户上传短视频
  - 临时进度图

frontend/public
  - 达人头像
  - 默认头像
  - 固定 UI 素材
  - 演示用静态素材
```

### 不做的事

黑客松阶段暂不做：

- OSS / S3 / R2 对象存储。
- 文件 CDN。
- 大规模文件生命周期管理。
- 把图片和视频二进制直接塞进 RDS。

### 为什么不把大文件放 RDS

RDS 适合结构化业务数据，不适合大量图片/视频二进制。

如果把图片、视频直接存 RDS，会带来：

- 表膨胀，备份变慢。
- 查询和迁移变重。
- 成本和维护复杂度上升。
- 后续迁到 OSS 反而更麻烦。

头像这类小图如果只是黑客松临时 demo，可以用默认头像或前端静态资源解决；不建议为了头像引入复杂文件系统。

---

## 4. 修复优先级

### P0：必须修复

#### 4.1 妆容卡片落 RDS

目标：

`/api/makeup-cards/analyze` 生成的卡片必须写入 `makeup_cards` 表。

涉及文件：

- `backend/app/routes/makeup_cards.py`
- `backend/app/models/makeup_card.py`
- `backend/app/schemas/makeup_card.py`
- 可能新增转换函数，例如 `services/makeup_card_repository.py`

修复后：

```text
analyze
  -> 生成 MakeupCard schema
  -> 写入 makeup_cards 表
  -> 返回 MakeupCard schema
```

验收：

- 服务重启后，`GET /api/makeup-cards/{card_id}` 仍能拿到卡片。
- `--workers 2` 下卡片读取稳定。

#### 4.2 聊天从 RDS 读取卡片

目标：

`/api/chat/sessions` 创建会话时，不再从 `_CARD_CACHE` 获取卡片。

涉及文件：

- `backend/app/routes/chat.py`
- `backend/app/models/makeup_card.py`

修复后：

```text
create_session(cardId)
  -> 查询 makeup_cards 表
  -> 写入 chat_sessions
  -> 写入初始 assistant message
```

验收：

- 首页生成卡片后导入聊天，服务重启后仍可继续创建或恢复会话。
- 初始聊天文案能正确显示卡片标题。

#### 4.3 分享接口从 RDS 读取卡片

目标：

`/api/makeup-cards/{card_id}/share` 从 RDS 获取标题，而不是内存缓存。

验收：

- 服务重启后，已生成卡片仍可生成分享文案。

### P1：建议修复

#### 4.4 历史记录落 RDS

当前 `history.py` 是 mock。

建议：

- 分析成功时写入 `history_items`，状态为 `analyzed`。
- 导入聊天时更新或新增历史，状态为 `imported`。
- 完成上妆时状态为 `completed`。

验收：

- 聊天页历史弹层可以显示真实历史。
- 删除历史会影响 RDS，而不是只改内存 set。

#### 4.5 明确媒体文件存储契约

当前可以继续使用 ECS 磁盘，但建议统一命名：

```text
STORAGE_DIR=/opt/makeup-mate/backend/storage/tmp
```

RDS `media_assets.file_url` 当前可以继续存服务器文件路径，例如：

```text
/opt/makeup-mate/backend/storage/tmp/media_xxx.jpg
```

后续如需迁移 OSS，再增加字段：

```text
storage_provider
object_key
bucket
```

黑客松阶段不必现在加。

#### 4.6 增加简单清理脚本

建议新增一个脚本：

```text
backend/scripts/cleanup_media.py
```

逻辑：

- 查询 `media_assets.expires_at < now()` 的记录。
- 删除 ECS 磁盘文件。
- 删除或标记对应 RDS 记录。

黑客松演示前可以不自动跑，但需要可手动执行。

### P2：有余力再做

#### 4.7 我的页接真实 `/profile/me`

当前 `ProfilePage.tsx` 是静态展示。

后续应改成：

- 登录后调用 `/api/profile/me`。
- 显示真实 `BeautyProfile`。
- 清空记忆调用 `/api/profile/me/memory`。

#### 4.8 前端登录接真实 auth

当前前端登录页只是本地 `signIn()`。

后续应改成：

- 注册/登录调用 `/api/auth/register` 或 `/api/auth/login`。
- token 存 localStorage。
- 请求自动带 `Authorization: Bearer ...`。

---

## 5. 数据归属规则

### 5.1 RDS 存什么

RDS 存结构化、可查询、需要长期保留的数据：

- 用户账号
- 妆容解析卡片
- 聊天会话
- 聊天消息
- 媒体文件元数据
- 个人妆容档案
- AI 记忆
- 历史记录

### 5.2 ECS 磁盘存什么

ECS 磁盘存用户上传的大文件：

- 自拍
- 妆容截图
- 进度检查图
- 短视频

这些文件必须在 RDS 有一条 `media_assets` 元数据记录。

### 5.3 前端 public 存什么

前端 `public` 存固定资源：

- 达人头像
- 默认头像
- 固定图标
- 示例图片

不存用户动态上传内容。

### 5.4 个人电脑本地存什么

个人电脑本地只用于：

- 开发调试
- 临时素材整理
- 本地前端预览

不作为线上数据源。

---

## 6. 部署注意事项

### 6.1 systemd 多 worker

当前服务配置：

```text
uvicorn app.main:app --host 127.0.0.1 --port 8001 --workers 2
```

只要还依赖 `_CARD_CACHE`，多 worker 就存在数据不一致风险。

修复卡片落 RDS 后，多 worker 才安全。

### 6.2 Qwen 图片访问

Qwen 需要公网 URL。

黑客松阶段使用：

```text
{PUBLIC_BASE_URL}/api/media/{media_id}/raw
```

生产 `.env` 必须配置：

```env
PUBLIC_BASE_URL=http://121.43.144.91:8080
```

如果这个地址外网访问不到，Qwen 看图会失败并降级到 mock。

### 6.3 磁盘空间

ECS 磁盘存上传文件时，需要注意：

- Nginx 已配置 `client_max_body_size 50m`。
- 后端 `_MAX_BYTES` 也是 50MB。
- 比赛期间建议控制上传视频长度和数量。
- 演示前可以清理旧的 `storage/tmp`。

---

## 7. 建议实施顺序

推荐按这个顺序做：

1. 卡片写入 `makeup_cards` 表。
2. `GET /makeup-cards/{card_id}` 从 RDS 读取。
3. `share` 从 RDS 读取。
4. `chat.create_session` 从 RDS 读取卡片标题。
5. 历史记录接 RDS。
6. 前端首页分享按钮调用真实分享接口。
7. 清理 `ChatPage.tsx` 里的 `mediaAssetId` 类型缺口。
8. 增加手动媒体清理脚本。

完成 1-4 后，核心数据稳定性问题基本解决。

---

## 8. 最终验收标准

完成本 repair 后，应满足：

- 首页生成卡片后，卡片数据进入 RDS。
- 后端重启后，卡片仍可读取和分享。
- 后端多 worker 下，导入聊天不受内存缓存影响。
- 用户上传图片/视频保存在 ECS 磁盘，RDS 记录元数据。
- Qwen 可以通过公网 `/api/media/{id}/raw` 读取上传图片。
- 固定头像和演示素材继续由前端静态资源承载。
- 文档中能清楚解释：为什么不上 OSS，为什么不把大文件放 RDS，为什么不能依赖个人电脑本地文件。

---

## 9. 后续升级到 OSS 的时机

暂不做 OSS，但未来出现以下情况时再升级：

- 上传文件数量明显增加。
- ECS 磁盘空间开始紧张。
- 需要跨服务器扩容。
- 需要 CDN 加速或更严格的文件权限。
- 需要更完整的文件生命周期策略。

届时可以平滑迁移为：

```text
RDS：业务数据 + 文件元数据
OSS：图片 / 视频二进制
后端：签名 URL / 权限校验 / AI 调用编排
```

黑客松阶段不必提前承担这部分复杂度。
