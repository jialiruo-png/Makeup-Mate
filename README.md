# 妆搭 Makeup Mate

会记住你的 AI 美妆视频陪练。第一阶段从 `index.html` 高保真 Demo 升级为 React + FastAPI 全栈 MVP。

文档以 [docs/phase1-development-spec.md](docs/phase1-development-spec.md) 为准，视觉准绳是 [design.md](design.md)。

---

## 工程结构

```text
Makeup Mate/
├── frontend/         Vite + React + TypeScript
├── backend/          FastAPI + SQLAlchemy + Pydantic v2
├── docs/             第一阶段开发规格
├── design.md         视觉规范（奶油粉调）
├── prd.md            产品需求
├── plan1.md          技术路线底稿
└── index.html        原 Demo（搬运参考）
```

---

## 本地开发

### 后端

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # 本地默认 SQLite，无需改
uvicorn app.main:app --reload --port 8000
```

- Swagger：http://localhost:8000/docs
- Health：http://localhost:8000/api/health

### 前端

```bash
cd frontend
# 国内可先 npm config set registry https://registry.npmmirror.com
npm install
npm run dev
```

- 开发地址：http://localhost:5173
- Vite 已配置 `/api` → `http://localhost:8000` 代理，前端代码统一调用 `/api/...`。

---

## 部署到 ECS + RDS

后端通过环境变量切换数据库，不需要改代码：

```bash
# RDS MySQL
DATABASE_URL=mysql+pymysql://USER:PASS@your-rds:3306/makeup_mate?charset=utf8mb4

# 或 RDS PostgreSQL
DATABASE_URL=postgresql+psycopg://USER:PASS@your-rds:5432/makeup_mate
```

并在 `requirements.txt` 取消注释对应驱动（`pymysql` / `psycopg`）。

前端构建产物指向生产网关：

```bash
VITE_API_BASE=https://api.your-domain.com/api npm run build
```

CORS 允许的源在后端 `CORS_ORIGINS` 配置。

---

## 第一阶段功能进度

骨架已就绪：
- 三页底部导航（首页 / 聊天 / 我的）
- iPhone 手机框桌面演示
- 首页 → POST `/api/makeup-cards/analyze` → 返回 mock 卡片 → 导入聊天
- 聊天页灵感库 / 陪伴聊天 Tab 切换 + 输入栏
- 我的页档案、AI 记忆、历史总结、隐私设置入口
- 全部 API mock 已通：`/makeup-cards`、`/inspirations`、`/chat`、`/profile`、`/media`、`/history`、`/health`

下一步搭档可以直接在 `frontend/src/pages/` 与 `frontend/src/components/` 改 UI，无需关心后端。AI / MediaPipe 的真实接入按 `docs/phase1-development-spec.md` 第 8 节路径推进。
