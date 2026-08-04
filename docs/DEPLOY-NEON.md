# Neon + Vercel 部署（ai.cychenyu.com）

博客 `cychenyu.com` 继续走 GitHub Pages；学习台与数据库分开部署。

## 1. 配置 Neon

1. 打开 [Neon Console](https://console.neon.tech) → 你的项目  
2. 复制 **Connection string**（URI，建议带 `sslmode=require`）  
3. 在本仓库创建 `.env.local`：

```bash
cp .env.example .env.local
```

把 `DATABASE_URL=` 换成 Neon 连接串，并设置更强的 `SESSION_SECRET`。

## 2. 建表并初始化数据

```bash
npm install
npm run db:push
npm run db:bootstrap
```

`db:push` 会按 `src/db/schema.ts` 创建表；`db:bootstrap` 会写入管理员、面试题种子、社区种子。

默认管理员：`admin` / `admin123456`（可用环境变量覆盖）。

## 3. 本地验证

```bash
npm run dev
npm test
```

打开 http://localhost:3000 ，登录、发帖、上传面试题，确认数据写入 Neon。

## 4. 部署到 Vercel

1. 把仓库推到 GitHub，在 Vercel Import  
2. Environment Variables 配置与本地相同的：
   - `DATABASE_URL`
   - `SESSION_SECRET`
   - `ADMIN_USERNAME` / `ADMIN_PASSWORD`（可选）
3. Deploy 成功后，在项目终端或本地对**同一条** `DATABASE_URL` 再跑一次：

```bash
npm run db:push
npm run db:bootstrap
```

（若表已存在，`push`/`bootstrap` 可安全重复执行。）

4. Domains 添加 `ai.cychenyu.com`  
5. DNS 增加 CNAME：`ai` → Vercel 给出的目标（如 `cname.vercel-dns.com`）

## 5. 与博客的关系

| 主机 | 内容 |
|------|------|
| `cychenyu.com` | GitHub Pages 博客（不变） |
| `ai.cychenyu.com` | 本学习台（Vercel） |
| Neon | 用户 / 进度 / 面试题 / 社区数据 |

不要把 Neon 连接串提交到 Git。
