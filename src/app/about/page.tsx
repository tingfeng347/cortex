import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QUESTIONS_PER_TEST, QUESTION_TIME } from "@/lib/questions";

export default function AboutPage() {
  return (
    <div className="min-h-dvh bg-gradient-to-b from-background to-muted/30">
      <div className="mx-auto max-w-2xl p-4 md:p-8">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">关于</h1>
            <p className="text-xs text-muted-foreground">认知防锈 · 项目起源</p>
          </div>
        </div>

        <div className="space-y-8">
          {/* Origin */}
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">
              为什么做这个项目
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              2024 年以来，我发现自己越来越习惯把问题直接丢给
              AI，而不是先自己想一想。
              遇到难题的第一反应从"让我想想"变成了"让我问问"。
              这种变化很舒服——但也让人不安。
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              "认知防锈"不是要否定 AI 工具的价值，而是提供一个简单的工具，
              让你能定期给自己的认知状态拍一张快照。不是为了证明什么，
              只是让趋势变得可见——因为看不见的东西，你不会在意。
            </p>
          </section>

          {/* How it works */}
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">怎么用</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              完成 {QUESTIONS_PER_TEST} 道混合题型（逻辑推理 / 速算 / 词汇语义），每道题限时 {QUESTION_TIME}
              秒。 完成后你会得到一个认知活跃度评分（0-100）。 分数越低越活跃。
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              单次测试的分数意义有限——真正的价值在于复测。 两次测试之间隔 7
              天以上，把分数连起来看趋势。
            </p>
          </section>

          {/* Data & Privacy */}
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">
              数据与隐私
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              我们不收集任何个人身份信息（没有 Cookie、没有用户 ID）。
              每次测试结果以匿名方式存储，仅用于生成全平台的统计分布图。
              你的个人历史记录保存在浏览器本地，不会上传。
            </p>
          </section>

          {/* Roadmap */}
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">后续计划</h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-medium text-foreground">已上线</p>
                <ul className="mt-1 space-y-1 text-muted-foreground">
                  <li>• 个人趋势折线图（统计页查看）</li>
                  <li>• 挑战分享——朋友点开链接能看到对比</li>
                  <li>• 按 AI 使用量分组的统计数据</li>
                  <li>• 浅色/深色主题切换</li>
                  <li>• 浏览器通知提醒（7 天后复测）</li>
                  <li>• PWA 支持（可安装到桌面）</li>
                  <li>• 动态 OG 分享卡片</li>
                  <li>• 题库 44 题，每测 20 题随机抽取</li>
                  <li>• 倒计时最后 10 秒紧迫感提示</li>
                  <li>• 测试完成过渡动画</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-foreground">近期</p>
                <ul className="mt-1 space-y-1 text-muted-foreground">
                  <li>• 中途保存/恢复——14 分钟测试可暂停继续</li>
                  <li>• 自适应出题（IRT + LLM 动态生成题目）</li>
                  <li>• 题库扩展与新题型维度</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-foreground">长期</p>
                <ul className="mt-1 space-y-1 text-muted-foreground">
                  <li>• 认知趋势预警——持续退化时提供早期提醒</li>
                  <li>• 社区基准——按行业、年龄段等维度对比</li>
                </ul>
              </div>
            </div>
          </section>
        </div>

        {/* Signature */}
        <p className="mt-16 text-right text-xs text-muted-foreground">
          2026 年 5 月 7 日<br />
          简律纯
        </p>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link href="/" className="hover:underline underline-offset-4">
            返回测试
          </Link>
          {" · "}
          <a
            href="https://github.com/HsiangNianian"
            target="_blank"
            rel="noreferrer"
            className="hover:underline underline-offset-4"
          >
            GitHub
          </a>
        </p>
      </div>
    </div>
  );
}
