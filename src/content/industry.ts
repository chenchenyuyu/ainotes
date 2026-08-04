export type TopicCategory = "tech" | "industry" | "conference";
export type TagCategory = "tech" | "industry" | "product";

export type DiscussionTag = {
  label: string;
  weight: number;
  category: TagCategory;
  href: string;
};

export type RankedHotTopic = {
  id: string;
  category: TopicCategory;
  title: string;
  summary: string;
  source: string;
  href: string;
  discussions: number;
  hot: boolean;
  rankScore: number;
};

export const industryIntro = {
  eyebrow: "INDUSTRY PULSE",
  title: "行业发展热点",
  copy: "汇聚 AI 业界正在讨论的技术与行业话题：上方标签云可一键跳转原文；下方按技术 / 行业 / AI 大会直播视频分栏排序，带 HOT 标记与观看热度。",
};

export const categoryMeta: Record<
  TopicCategory,
  { label: string; eyebrow: string; description: string }
> = {
  tech: {
    label: "技术热点",
    eyebrow: "TECH",
    description: "协议、检索、评测、安全执行等工程讨论。",
  },
  industry: {
    label: "行业热点",
    eyebrow: "INDUSTRY",
    description: "企业落地、治理合规、岗位与交付形态变化。",
  },
  conference: {
    label: "AI 大会直播视频",
    eyebrow: "LIVE / REPLAY",
    description: "国内外 AI 大会主题演讲与直播回放，点击直达观看。",
  },
};

/** Tag cloud — clickable topics linking to source articles. */
export const discussionTagCloud: DiscussionTag[] = [
  {
    label: "MCP",
    weight: 5,
    category: "tech",
    href: "https://www.anthropic.com/news/model-context-protocol",
  },
  {
    label: "RAG Citation",
    weight: 4,
    category: "tech",
    href: "https://www.anthropic.com/engineering/building-effective-agents",
  },
  {
    label: "ReAct",
    weight: 3,
    category: "tech",
    href: "https://arxiv.org/abs/2210.03629",
  },
  {
    label: "Eval Harness",
    weight: 4,
    category: "tech",
    href: "https://openai.com/index/introducing-simple-evals/",
  },
  {
    label: "Function Calling",
    weight: 3,
    category: "tech",
    href: "https://platform.openai.com/docs/guides/function-calling",
  },
  {
    label: "Computer Use",
    weight: 4,
    category: "product",
    href: "https://www.anthropic.com/news/3-5-models-and-computer-use",
  },
  {
    label: "Coding Agent",
    weight: 5,
    category: "product",
    href: "https://cursor.com/",
  },
  {
    label: "Deep Research",
    weight: 4,
    category: "product",
    href: "https://openai.com/index/introducing-deep-research/",
  },
  {
    label: "Multi-Agent",
    weight: 4,
    category: "tech",
    href: "https://www.anthropic.com/engineering/built-multi-agent-research-system",
  },
  {
    label: "Agentic Workflow",
    weight: 3,
    category: "industry",
    href: "https://www.anthropic.com/engineering/building-effective-agents",
  },
  {
    label: "AI 治理",
    weight: 3,
    category: "industry",
    href: "https://www.nist.gov/itl/ai-risk-management-framework",
  },
  {
    label: "内部知识库",
    weight: 3,
    category: "industry",
    href: "https://www.anthropic.com/news/retrieval",
  },
  {
    label: "可观测性",
    weight: 2,
    category: "tech",
    href: "https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents",
  },
  {
    label: "Browser Agent",
    weight: 4,
    category: "product",
    href: "https://openai.com/index/introducing-operator/",
  },
  {
    label: "Skills",
    weight: 3,
    category: "tech",
    href: "https://docs.anthropic.com/en/docs/agents-and-tools/agent-skills/overview",
  },
  {
    label: "成本治理",
    weight: 3,
    category: "industry",
    href: "https://platform.openai.com/docs/guides/production-best-practices",
  },
  {
    label: "人工审批",
    weight: 2,
    category: "industry",
    href: "https://www.anthropic.com/engineering/building-effective-agents",
  },
  {
    label: "A2A 协议",
    weight: 2,
    category: "tech",
    href: "https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/",
  },
];

/** Ranked hot topics across tech / industry / conference livestreams. */
export const rankedHotTopics: RankedHotTopic[] = [
  {
    id: "mcp-standard",
    category: "tech",
    title: "MCP 成为跨厂商工具协议共识",
    summary: "工具、资源与提示被标准化暴露，Agent 不再为每个集成重写适配层。",
    source: "Anthropic · Model Context Protocol",
    href: "https://www.anthropic.com/news/model-context-protocol",
    discussions: 12840,
    hot: true,
    rankScore: 98,
  },
  {
    id: "multi-agent-research",
    category: "tech",
    title: "多 Agent 研究系统如何真正协作",
    summary: "Planner / Researcher / Reviewer 分工、共享状态与失败交接成为工程焦点。",
    source: "Anthropic Engineering",
    href: "https://www.anthropic.com/engineering/built-multi-agent-research-system",
    discussions: 9620,
    hot: true,
    rankScore: 95,
  },
  {
    id: "agent-evals",
    category: "tech",
    title: "Agent Eval：从 Demo 到可度量",
    summary: "任务成功率、groundedness、费用与步骤数被拉进同一套评测叙事。",
    source: "Anthropic · Demystifying evals",
    href: "https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents",
    discussions: 7840,
    hot: true,
    rankScore: 91,
  },
  {
    id: "effective-agents",
    category: "tech",
    title: "Workflow 优先，还是高自主 Agent？",
    summary: "业界强调先可控工作流，再按需提高自主性，避免失控循环。",
    source: "Anthropic · Building effective agents",
    href: "https://www.anthropic.com/engineering/building-effective-agents",
    discussions: 11320,
    hot: true,
    rankScore: 94,
  },
  {
    id: "function-calling",
    category: "tech",
    title: "结构化工具调用仍是生产底座",
    summary: "JSON Schema / 参数校验决定 Agent 能不能稳定调用外部系统。",
    source: "OpenAI Docs",
    href: "https://platform.openai.com/docs/guides/function-calling",
    discussions: 6510,
    hot: false,
    rankScore: 82,
  },
  {
    id: "enterprise-governance",
    category: "industry",
    title: "企业 AI 治理从原则走到执行清单",
    summary: "密钥隔离、审计、人工审批与风险分级成为上线门槛。",
    source: "NIST AI RMF",
    href: "https://www.nist.gov/itl/ai-risk-management-framework",
    discussions: 5890,
    hot: true,
    rankScore: 88,
  },
  {
    id: "internal-kb",
    category: "industry",
    title: "内部知识库 Agent 成最常见切入点",
    summary: "客服、研报、运维助手优先落地，强调证据引用与权限边界。",
    source: "Anthropic · Retrieval",
    href: "https://www.anthropic.com/news/retrieval",
    discussions: 7340,
    hot: true,
    rankScore: 90,
  },
  {
    id: "cost-control",
    category: "industry",
    title: "Token / 步骤预算进入交付合同",
    summary: "企业不再只问“能不能做”，更问单位任务成本与失败回滚。",
    source: "OpenAI Production Best Practices",
    href: "https://platform.openai.com/docs/guides/production-best-practices",
    discussions: 4210,
    hot: false,
    rankScore: 79,
  },
  {
    id: "hiring-shift",
    category: "industry",
    title: "岗位从“会调模型”转向“能上线控风险”",
    summary: "JD 更看重评测、护栏、可观测与真实交付物，而不是堆 Prompt。",
    source: "OpenAI · Practical guide to agents",
    href: "https://openai.com/business/guides-and-resources/a-practical-guide-to-building-ai-agents/",
    discussions: 5120,
    hot: true,
    rankScore: 85,
  },
  {
    id: "gtc-keynote",
    category: "conference",
    title: "NVIDIA GTC Keynote 直播 / 回放",
    summary: "黄仁勋主题演讲，聚焦 GPU、推理基础设施与 Agent 算力演进。",
    source: "NVIDIA GTC",
    href: "https://www.nvidia.com/gtc/",
    discussions: 18600,
    hot: true,
    rankScore: 98,
  },
  {
    id: "google-io",
    category: "conference",
    title: "Google I/O 主题演讲与 AI 专场",
    summary: "Gemini、Deep Research、Workspace Agent 等产品发布与演示回放。",
    source: "Google I/O",
    href: "https://io.google/2025/",
    discussions: 15240,
    hot: true,
    rankScore: 95,
  },
  {
    id: "openai-devday",
    category: "conference",
    title: "OpenAI DevDay 开发者大会",
    summary: "模型、API、Agent 与开发者工具发布会直播回放入口。",
    source: "OpenAI DevDay",
    href: "https://openai.com/devday/",
    discussions: 14120,
    hot: true,
    rankScore: 94,
  },
  {
    id: "ms-build",
    category: "conference",
    title: "Microsoft Build AI 专场",
    summary: "Copilot、Azure AI Agent 与开发者平台更新的大会视频。",
    source: "Microsoft Build",
    href: "https://build.microsoft.com/",
    discussions: 11850,
    hot: true,
    rankScore: 90,
  },
  {
    id: "waic",
    category: "conference",
    title: "世界人工智能大会 WAIC 直播",
    summary: "上海 WAIC 主论坛与产业论坛直播/回放，覆盖政策、产业与大模型应用。",
    source: "世界人工智能大会",
    href: "https://www.worldaic.com.cn/",
    discussions: 12680,
    hot: true,
    rankScore: 92,
  },
  {
    id: "neurips",
    category: "conference",
    title: "NeurIPS 大会演讲与教程视频",
    summary: "顶级学术会议的 Invited Talk、Tutorial 与 Workshop 录像入口。",
    source: "NeurIPS",
    href: "https://neurips.cc/",
    discussions: 9740,
    hot: false,
    rankScore: 86,
  },
  {
    id: "aws-reinvent",
    category: "conference",
    title: "AWS re:Invent AI / Agent 专场",
    summary: "云上 Agent、Bedrock 与企业落地案例的主题演讲回放。",
    source: "AWS re:Invent",
    href: "https://reinvent.awsevents.com/",
    discussions: 8320,
    hot: false,
    rankScore: 83,
  },
  {
    id: "baidu-create",
    category: "conference",
    title: "百度 Create 人工智能大会",
    summary: "文心大模型、智能体与产业应用发布会直播入口。",
    source: "百度 Create",
    href: "https://create.baidu.com/",
    discussions: 7650,
    hot: true,
    rankScore: 84,
  },
];

export function topicsByCategory(category: TopicCategory): RankedHotTopic[] {
  return rankedHotTopics
    .filter((item) => item.category === category)
    .sort((a, b) => b.rankScore - a.rankScore || b.discussions - a.discussions);
}

export type HotProductApp = {
  id: string;
  name: string;
  region: "国内" | "海外";
  kind: string;
  summary: string;
  newFeatures: string[];
  website: string;
  hot: boolean;
  discussions: number;
};

/** Domestic & international hotspot Agent / AI apps with official links. */
export const hotProductApps: HotProductApp[] = [
  {
    id: "cursor",
    name: "Cursor",
    region: "海外",
    kind: "编程 Agent",
    summary: "编辑器内 Agent，把改码、检索、终端与多文件重构串成连续任务。",
    newFeatures: [
      "Agent / Background Agent 可跨文件自动改代码",
      "支持规则、Skills 与 MCP 工具扩展",
      "对话式审查 diff 与一键应用补丁",
    ],
    website: "https://cursor.com/",
    hot: true,
    discussions: 15680,
  },
  {
    id: "chatgpt",
    name: "ChatGPT",
    region: "海外",
    kind: "通用助手",
    summary: "对话 + 工具调用平台，覆盖写作、编程、研究与自定义 GPT。",
    newFeatures: [
      "Deep Research 长程检索与报告生成",
      "Operator / Computer Use 网页与桌面操作",
      "Projects、记忆与自定义 GPT 工作区",
    ],
    website: "https://chatgpt.com/",
    hot: true,
    discussions: 18200,
  },
  {
    id: "claude",
    name: "Claude",
    region: "海外",
    kind: "通用 / 编程助手",
    summary: "长上下文对话与 Artifacts，适合分析、写作与代码协作。",
    newFeatures: [
      "Computer Use 桌面操作能力",
      "Artifacts 可交互产物面板",
      "Projects 与 MCP 工具连接",
    ],
    website: "https://claude.ai/",
    hot: true,
    discussions: 13450,
  },
  {
    id: "perplexity",
    name: "Perplexity",
    region: "海外",
    kind: "搜索研究",
    summary: "带引用的回答与研究模式，面向实时信息检索。",
    newFeatures: [
      "Pro Search / Deep Research 多步检索",
      "回答附带来源引用",
      "Spaces 整理主题研究资料",
    ],
    website: "https://www.perplexity.ai/",
    hot: true,
    discussions: 9780,
  },
  {
    id: "gemini",
    name: "Google Gemini",
    region: "海外",
    kind: "通用助手",
    summary: "多模态助手，与 Google 搜索、Workspace 深度集成。",
    newFeatures: [
      "Deep Research 研究报告",
      "多模态理解图片、文档与视频",
      "与 Gmail / Docs 等 Workspace 协作",
    ],
    website: "https://gemini.google.com/",
    hot: true,
    discussions: 11240,
  },
  {
    id: "github-copilot",
    name: "GitHub Copilot",
    region: "海外",
    kind: "编程助手",
    summary: "IDE / GitHub 内补全与 Agent 式编程辅助。",
    newFeatures: [
      "Copilot Workspace / Agent 模式",
      "PR 摘要与代码审查建议",
      "多模型切换与企业策略管控",
    ],
    website: "https://github.com/features/copilot",
    hot: false,
    discussions: 8650,
  },
  {
    id: "devin",
    name: "Devin",
    region: "海外",
    kind: "自主软件工程师",
    summary: "面向端到端开发任务的自主 Agent 产品。",
    newFeatures: [
      "自主规划并执行开发任务",
      "集成浏览器、终端与代码仓库",
      "面向团队的任务委派与结果回传",
    ],
    website: "https://devin.ai/",
    hot: true,
    discussions: 7420,
  },
  {
    id: "kimi",
    name: "Kimi",
    region: "国内",
    kind: "长上下文助手",
    summary: "月之暗面产品，以长文本理解与联网研究见长。",
    newFeatures: [
      "超长上下文阅读与总结",
      "Kimi Researcher / 深度研究能力",
      "文件、网页与多步问答工作流",
    ],
    website: "https://www.kimi.com/",
    hot: true,
    discussions: 12100,
  },
  {
    id: "doubao",
    name: "豆包",
    region: "国内",
    kind: "通用助手",
    summary: "字节跳动 C 端助手，覆盖对话、创作与生活场景。",
    newFeatures: [
      "多模态对话与内容创作",
      "智能体 / 插件扩展能力",
      "移动端与桌面端连续体验",
    ],
    website: "https://www.doubao.com/",
    hot: true,
    discussions: 14860,
  },
  {
    id: "tongyi",
    name: "通义千问",
    region: "国内",
    kind: "通用 / 企业助手",
    summary: "阿里云通义系列，面向对话、办公与行业应用。",
    newFeatures: [
      "Qwen 系列模型持续升级",
      "文档理解、联网问答与创作工具",
      "企业知识库与应用搭建能力",
    ],
    website: "https://tongyi.aliyun.com/",
    hot: true,
    discussions: 10920,
  },
  {
    id: "wenxin",
    name: "文心一言",
    region: "国内",
    kind: "通用助手",
    summary: "百度文心大模型对话产品，强调搜索增强与智能体。",
    newFeatures: [
      "文心智能体搭建与分发",
      "搜索增强回答",
      "办公文档与多模态创作",
    ],
    website: "https://yiyan.baidu.com/",
    hot: false,
    discussions: 8340,
  },
  {
    id: "zhipu",
    name: "智谱清言",
    region: "国内",
    kind: "通用 / 研究助手",
    summary: "智谱 AI 对话产品，覆盖研究、写作与代码场景。",
    newFeatures: [
      "GLM 系列模型能力升级",
      "清言智能体与工具调用",
      "长文档分析与学术辅助",
    ],
    website: "https://chatglm.cn/",
    hot: false,
    discussions: 6920,
  },
  {
    id: "coze",
    name: "扣子 Coze",
    region: "国内",
    kind: "Agent 搭建平台",
    summary: "字节扣子，可视化搭建 Bot / Agent 并发布到多端。",
    newFeatures: [
      "工作流编排与插件市场",
      "知识库与记忆配置",
      "一键发布到飞书、豆包等渠道",
    ],
    website: "https://www.coze.cn/",
    hot: true,
    discussions: 9150,
  },
  {
    id: "tongyi-lingma",
    name: "通义灵码",
    region: "国内",
    kind: "编程助手",
    summary: "阿里云 IDE 插件，面向补全、对话改码与工程问答。",
    newFeatures: [
      "行级 / 函数级智能补全",
      "仓库级问答与单元测试生成",
      "企业私域知识增强",
    ],
    website: "https://lingma.aliyun.com/",
    hot: false,
    discussions: 5280,
  },
  {
    id: "metaso",
    name: "秘塔 AI 搜索",
    region: "国内",
    kind: "搜索研究",
    summary: "面向研究与资料整理的 AI 搜索产品。",
    newFeatures: [
      "无广告检索结果",
      "结构化摘要与资料整理",
      "学术 / 研究报告场景增强",
    ],
    website: "https://metaso.cn/",
    hot: false,
    discussions: 4610,
  },
  {
    id: "manus",
    name: "Manus",
    region: "海外",
    kind: "通用自主 Agent",
    summary: "面向复杂任务委派的自主 Agent 产品讨论热度高。",
    newFeatures: [
      "多步骤任务自主执行",
      "浏览器与工具协同完成交付物",
      "结果回传与过程可追踪",
    ],
    website: "https://manus.im/",
    hot: true,
    discussions: 10340,
  },
];

export function sortedProductApps(): HotProductApp[] {
  return [...hotProductApps].sort((a, b) => {
    if (a.hot !== b.hot) return a.hot ? -1 : 1;
    return b.discussions - a.discussions;
  });
}

export function formatDiscussions(count: number): string {
  if (count >= 10000) return `${(count / 10000).toFixed(1)} 万讨论`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k 讨论`;
  return `${count} 讨论`;
}
