#!/usr/bin/env bash
# Makeup Mate 一键部署脚本
# 用法：在服务器上 cd /opt/makeup-mate && ./deploy/deploy.sh
set -euo pipefail

APP_DIR="/opt/makeup-mate"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"
LOG_DIR="/var/log/makeup-mate"
PIP_MIRROR="https://pypi.tuna.tsinghua.edu.cn/simple"
NPM_MIRROR="https://registry.npmmirror.com"

log() { echo -e "\033[1;36m[$(date +%H:%M:%S)]\033[0m $*"; }

cd "$APP_DIR"

log "1/5 拉取最新代码"
git fetch --all --quiet
git reset --hard origin/main

log "2/5 后端依赖"
mkdir -p "$LOG_DIR"
if [ ! -d "$BACKEND_DIR/.venv" ]; then
    python3 -m venv "$BACKEND_DIR/.venv"
fi
"$BACKEND_DIR/.venv/bin/pip" install -q --upgrade pip -i "$PIP_MIRROR"
"$BACKEND_DIR/.venv/bin/pip" install -q -r "$BACKEND_DIR/requirements.txt" -i "$PIP_MIRROR"
[ -f "$BACKEND_DIR/.env" ] || cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"

log "3/5 前端构建"
cd "$FRONTEND_DIR"
npm config set registry "$NPM_MIRROR" --location=user >/dev/null
npm ci --silent --no-audit --no-fund 2>/dev/null || npm install --silent --no-audit --no-fund
npm run build

log "4/5 同步 systemd & Nginx 配置"
cd "$APP_DIR"
if ! cmp -s deploy/makeup-mate-backend.service /etc/systemd/system/makeup-mate-backend.service 2>/dev/null; then
    cp deploy/makeup-mate-backend.service /etc/systemd/system/makeup-mate-backend.service
    systemctl daemon-reload
fi
if ! cmp -s deploy/nginx-makeup-mate.conf /etc/nginx/sites-available/makeup-mate 2>/dev/null; then
    cp deploy/nginx-makeup-mate.conf /etc/nginx/sites-available/makeup-mate
    ln -sf /etc/nginx/sites-available/makeup-mate /etc/nginx/sites-enabled/makeup-mate
    nginx -t && systemctl reload nginx
fi

log "5/5 重启后端"
systemctl enable makeup-mate-backend >/dev/null 2>&1 || true
systemctl restart makeup-mate-backend

for i in 1 2 3 4 5 6 7 8 9 10; do
    sleep 1
    if curl -fsS http://127.0.0.1:8001/api/health >/dev/null 2>&1; then
        log "✅ 部署完成。访问 http://121.43.144.91:8080"
        exit 0
    fi
done
log "⚠️ 后端 health 10s 内未起来，查 /var/log/makeup-mate/backend.err.log 或 journalctl -u makeup-mate-backend"
exit 1
