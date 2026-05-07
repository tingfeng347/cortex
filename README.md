# 认知防锈 · Cognitive Anti-Rust

一个认知健康追踪工具，帮助用户感知、测量、延缓因过度依赖 AI 而导致的核心心智能力退化。

## 当前状态

Phase 0 → 0.9 完成。项目具备完整闭环：测试 → 中途可暂停 → 统计 → 留存。

- 44 题题库（逻辑/速算/词汇），每测 20 题随机抽取
- 三语言完整支持（中文 / English / 日本語）
- 退化指数算法 + 5 档分级 + 多维度雷达画像
- 全平台统计页（正态分布、百分位排名、AI 使用量分组）
- 个人趋势折线图
- PWA 支持 + 分享卡片 + 主题切换

## 技术栈

| 层     | 选型                             |
| ------ | -------------------------------- |
| 框架   | Next.js 16 (App Router)          |
| UI     | React 19 + Tailwind CSS v4 + shadcn/ui |
| 数据   | Upstash Redis                    |
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
