# 认知防锈 (Cognitive Anti-Rust)

## 项目定位

一个认知健康追踪工具，帮助用户感知、测量、延缓因过度依赖 AI 而导致的核心心智能力退化。

核心假设：**当人们看见自己的某项脑力正在因 AI 使用而退化时，他们会在意，并且会分享。**

## 技术栈

| 层     | 选型                             | 说明                                      |
| ------ | -------------------------------- | ----------------------------------------- |
| 框架   | Next.js 16 (App Router)          | Turbopack                                 |
| UI     | React 19 + Tailwind CSS v4 + shadcn/ui |                                    |
| 数据   | Cloudflare KV + D1               | KV 用于统计/标记计数, D1 用于用户/License/结果 |
| 平台   | Cloudflare Workers               | opennextjs-cloudflare                     |
| 包管理 | pnpm                             |                                           |
| 语言   | TypeScript                       |                                           |

## 当前状态

**660 题，四维度，三语言，付费 + 免费双轨，全部上线。**

### 题型矩阵

| 维度 | 子类型 | zh-CN | en | ja |
|------|--------|-------|----|----|
| 逻辑推理 | logic | 42 | 43 | 44 |
| 速算 | math | 50 | 47 | 45 |
| 词汇语义 | vocab | 34 | 52 | 57 |
| 事件排序 | event | 52 | 50 | 50 |
| 因果推断 | event-cause | 17 | 15 | 15 |
| 论证分析 | event-argument | 17 | 15 | 15 |
| **合计** | | **212** | **222** | **226** |

总计 **660 题**，覆盖 IRT -3.0 ~ +3.0 全难度区间。

### 功能清单

**测试体验**
- 自适应 IRT 选题（1PL EAP + Fisher 信息量最大）
- 四维雷达图（逻辑/速算/词汇/事理）
- 半途保存/恢复（localStorage checkpoint）
- 40s 倒计时 + 最后 10s 紧迫感动画
- 退化指数 0-100 + 5 档分级
- 题目反馈标记（标记后写入 KV，按题目聚合计数）

**数据与统计**
- `/stats` 全平台统计（正态分布、百分位、AI 使用量分组、等级分布）
- 个人趋势折线图（四维度切换）
- 动态 OG 分享卡片 + 客户端 PNG 下载
- 挑战分享（`?ref=` 参数）

**搜索**
- `/search` BM25 全文搜索（Intl.Segmenter 中日文分词）
- 搜索结果展示题目/选项/答案/解析
- 搜索页也可标记题目反馈

**付费系统**
- 爱发电支付（微信/支付宝）
- License Key 激活/设备绑定
- 免费用户 7 天冷却（本地 dev 关闭）
- Premium 云端同步（D1）、CSV 导出、逐维度趋势分析
- 赞助墙（`/sponsors`）

**国际化**
- 三语言 UI（中文 / English / 日本語）
- 语言切换器 + 主题切换器（亮/暗）
- PWA 支持（manifest + Service Worker）

**基础设施**
- Cloudflare Workers（opennextjs-cloudflare）
- KV: 统计、标记计数
- D1: License、设备、测试结果
- LLM 批量出题管线（DeepSeek, batch-generate.ts + merge-bank.ts）
- 题目质量审计脚本（regression-check.ts）

### 技术债清理

- Vercel Blob → Upstash Redis → Cloudflare KV 两次迁移完成
- 中间件迁移 Next.js 16 规范（middleware.ts → proxy.ts）
- test-flow 组件化拆分（useTestState + 5 阶段组件）
- LLM 调用日志（traceId + 耗时 + token + 推理过程）

## 路线图

### Phase 0：静态验证器 ✅

固定题库 + 规则评分，验证"退化感知"的情绪价值。

### Phase 0.5-0.9：数据基建、留存、国际化、体验 ✅

统计页面、分享回流、PWA、三语言、中途保存。

### Phase 1：动态评估引擎 ✅

IRT 1PL 引擎 + EAP 能力估计 + 最大信息量选题 + LLM 题目生成。
660 题题库，四维度，六题型。

### Phase 2：微干预引擎

**目标**：从"告诉你退化了"走向"帮你维持"。

双 Agent 协作：
- **评测 Agent**：持续评估用户的退化曲线
- **教练 Agent**：根据退化维度，设计微型训练计划

### Phase 3：认知镜像与盲区揭示

成熟 Multi-Agent：观察 → 建模 → 呈现 → 隐私安全。

### Phase 4：认知防锈经济

Multi-Agent + 市场机制：雇主匹配、保险定价、去中心化认知信用记录。

## 路线图总览

| 阶段 | 做什么 | 所需 Agent | 核心挑战 | 状态 |
|------|--------|------------|----------|------|
| Phase 0 | 静态验证器 | 无 | 找到情绪钩子 | ✅ |
| Phase 1 | 动态评估引擎 | 单 Agent | 出题质量、能力估计 | ✅ |
| Phase 2 | 微干预引擎 | 双 Agent | 留存、干预有效性 | 待开始 |
| Phase 3 | 认知镜像与盲区 | 成熟 Multi-Agent | 跨域分析、隐私 | 规划中 |
| Phase 4 | 认知防锈经济 | Multi-Agent + 市场 | 双边网络、信任 | 远期 |

## 免费 vs 付费

| | 免费 | 付费（¥29.9 一次性） |
|---|---|---|
| 测试频率 | 7 天一次 | 无限次 |
| 数据存储 | localStorage | 云端同步（D1，跨设备） |
| 维度分析 | 仅总分 | 逐维度趋势 + 改善速度 |
| 数据导出 | 无 | CSV |
| 分享图片 | 带水印 | 无水印 |
| 历史记录 | 最多 20 条 | 全量 + 云端永久 |

## 启动命令

```bash
pnpm dev                      # 本地开发
pnpm cf:build && pnpm cf:deploy  # 构建 + 部署到 Cloudflare
npx tsx scripts/batch-generate.ts --env-file=.env  # 批量生成题目
npx tsx scripts/merge-bank.ts  # 合并生成的题目到题库
```
