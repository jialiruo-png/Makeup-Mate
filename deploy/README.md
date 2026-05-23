# 部署说明（阿里云 ECS · 121.43.144.91）

## 架构

```
http://121.43.144.91:8080   →  Nginx (listen 8080)
                              ├─ /          →  /opt/makeup-mate/frontend/dist
                              └─ /api/      →  127.0.0.1:8001  (uvicorn, systemd)
```

- 不动现有 80 端口上的 manufacturing-oms 项目
- 后端走 systemd 服务 `makeup-mate-backend.service`
- 阿里云安全组需要放行 **8080/tcp**

## 文件说明

| 文件 | 用途 |
|---|---|
| `deploy.sh` | 一键部署脚本，拉代码 + 装依赖 + 构建 + 重启 |
| `makeup-mate-backend.service` | systemd 单元 |
| `nginx-makeup-mate.conf` | Nginx server block (listen 8080) |

## 手动部署（首次或恢复时）

```bash
ssh root@121.43.144.91
cd /opt/makeup-mate
./deploy/deploy.sh
```

## 自动部署（GitHub Actions）

仓库 `main` 分支一旦 push，会触发 `.github/workflows/deploy.yml`，
通过 SSH 跑服务器上的 `deploy.sh`。

需要在仓库 Settings → Secrets and variables → Actions 配置三个 Secret：

| Secret | 值 |
|---|---|
| `DEPLOY_HOST` | `121.43.144.91` |
| `DEPLOY_USER` | `root` |
| `DEPLOY_SSH_KEY` | 一把**专门用于 Actions** 的私钥（不要复用个人密钥） |

生成专用私钥的命令（在服务器或本地任一台机器）：
```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f gh_actions_key -N ""
# 把 gh_actions_key.pub 内容追加到 /root/.ssh/authorized_keys
# 把 gh_actions_key（私钥）粘贴到 GitHub Secret DEPLOY_SSH_KEY
```

## 查看服务状态

```bash
systemctl status makeup-mate-backend
journalctl -u makeup-mate-backend -f
tail -f /var/log/makeup-mate/backend.err.log
tail -f /var/log/nginx/makeup-mate.access.log
```

## 回滚

```bash
cd /opt/makeup-mate
git log --oneline -10           # 找到要回滚的 commit
git reset --hard <commit-hash>
./deploy/deploy.sh
```
