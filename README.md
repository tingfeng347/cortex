# 认知防锈 · Cognitive Anti-Rust

一个认知健康追踪工具，帮助用户感知、测量、延缓因过度依赖 AI 而导致的核心心智能力退化。

## 当前状态

Phase 0 → 0.9 完成。Phase 1 全部完成。

动态评估引擎已就绪：
- IRT 1PL 引擎 + EAP 能力估计 + 最大信息量选题
- 自适应测试协调器（维度轮换 + theta 追踪）
- 全部题目已标定 difficulty
- LLM 题目生成（DeepSeek SSE 流式 + Redis 缓存 + 限频）

- 44 题题库（逻辑/速算/词汇），每测 20 题随机抽取
- LLM 批量扩充至 **zh-CN 150 题 / en 148 题 / ja 146 题**（2026-05-07）
- 难度覆盖 IRT -3.0 ~ +3.0 全区间
- 三语言完整支持（中文 / English / 日本語）
- 退化指数算法 + 5 档分级 + 多维度雷达画像
- 全平台统计页（正态分布、百分位排名、AI 使用量分组）
- 个人趋势折线图
- PWA 支持 + 分享卡片 + 主题切换
- **数据存储**: [Cloudflare KV](https://developers.cloudflare.com/kv/) — Workers Paid Plan ($5/月)
  - KV: 10M 读 + 1M 写/月
  - 同时可用: D1 (5GB SQLite)、Workers AI (10K/天)、Queues、Durable Objects
  - 2026-06 从 Upstash Redis 迁移

## 技术栈

| 层     | 选型                             |
| ------ | -------------------------------- |
| 框架   | Next.js 16 (App Router)          |
| UI     | React 19 + Tailwind CSS v4 + shadcn/ui |
| 数据   | Cloudflare KV（Workers Paid $5/月） |
| 平台   | Vercel                           |
| 包管理 | pnpm                             |
| 语言   | TypeScript                       |

## 启动

```bash
pnpm dev
```

打开 [http://localhost:3000](http://localhost:3000)。

## 构建

```bash
pnpm build
pnpm start
```
