# 认知防锈 · Cognitive Anti-Rust

一个认知健康追踪工具，帮助用户感知、测量、延缓因过度依赖 AI 而导致的核心心智能力退化。

## 当前状态

Phase 1 完成。

- 动态评估引擎: IRT 1PL + EAP 能力估计 + 最大信息量选题
- 自适应测试协调器（维度轮换 + theta 追踪）
- 全部题目已标定 difficulty
- 44 题题库（逻辑/速算/词汇），每测 20 题随机抽取
- 多语言: zh-CN 150 题 / en 148 题 / ja 146 题
- 难度覆盖 IRT -3.0 ~ +3.0 全区间
- 退化指数算法 + 5 档分级 + 多维度雷达画像
- 全平台统计页（正态分布、百分位排名、AI 使用量分组）
- 个人趋势折线图
- PWA 支持 + 分享卡片 + 主题切换
- LLM 题目生成（DeepSeek SSE 流式 + Redis 缓存 + 限频）

## 技术栈

| 层     | 选型                                   |
| ------ | -------------------------------------- |
| 框架   | Next.js 16 (App Router)                |
| UI     | React 19 + Tailwind CSS v4 + shadcn/ui |
| 数据   | Cloudflare KV（Workers Paid $5/月）    |
| 平台   | Cloudflare Workers (via OpenNext)      |
| 包管理 | pnpm                                   |
| 语言   | TypeScript                             |

## 本地开发

```bash
pnpm install
pnpm dev
```

打开 [http://localhost:3000](http://localhost:3000)。

AI 相关功能（题目生成、AI 解读）需要设置 `OPENAI_API_KEY` 等环境变量，可在 `.env.local` 中配置（参考 `.env.example`）。

## 自部署

### 前置条件

- [Cloudflare](https://cloudflare.com) 账号（Workers Paid Plan，$5/月）
- 安装 [wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) 并登录
- 安装 [pnpm](https://pnpm.io)

### 1. 创建基础设施

```bash
# KV namespace（用于统计数据存储）
wrangler kv namespace create CORTEX_KV

# D1 database（用于社区功能）
wrangler d1 create cortex-db
```

记下输出的 ID，后续需要填入环境变量。

### 2. 配置环境变量

复制 `.env.example` 为 `.env.local`，按需修改：

```bash
cp .env.example .env.local
```

关键变量：

| 变量                    | 说明                                            |
| ----------------------- | ----------------------------------------------- |
| `OPENAI_API_KEY`        | DeepSeek / OpenAI 兼容 API 密钥                 |
| `NEXT_PUBLIC_SITE_URL`  | 你的部署域名（如 `https://cortex.example.com`） |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare 账号 ID                              |
| `CLOUDFLARE_API_TOKEN`  | Cloudflare API Token（有 KV + D1 权限）         |
| `CORTEX_KV_ID`          | 上一步创建的 KV namespace ID                    |
| `CORTEX_DB_ID`          | 上一步创建的 D1 database ID                     |
| `AI_ACCESS_KEY`         | （可选）AI 接口的 bearer token 鉴权             |

本地开发使用 `wrangler` 时，参考 `.dev.vars.example` 配置 `.dev.vars`。

### 3. 部署

```bash
# 构建
pnpm cf:build

# 部署
pnpm cf:deploy
```

## 构建

```bash
pnpm build
pnpm start
```
