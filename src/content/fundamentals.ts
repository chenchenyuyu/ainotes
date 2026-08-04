export type LearningLink = {
  label: string;
  href: string;
  kind: "论文" | "官方指南" | "教程" | "开源";
};

export type TimelineEvent = {
  id: string;
  year: string;
  title: string;
  summary: string;
  highlights: string[];
  visual: "transformer" | "tools" | "react-loop" | "harness" | "mcp";
  imageAlt: string;
  links: LearningLink[];
};

export type ConceptCard = {
  title: string;
  summary: string;
  points: string[];
  links: LearningLink[];
};

export const historyIntro = {
  eyebrow: "HISTORY TIMELINE",
  title: "AI Agent 发展史",
  copy: "沿时间轴理解 Agent 如何从模型与工具增强，演进到可控交付与协议化协作。每一段都配有示意结构图，并可跳转到相关论文与官方文档继续学习。",
};

export const agentTimeline: TimelineEvent[] = [
  {
    id: "transformer",
    year: "2017–2019",
    title: "Transformer 与早期工具增强",
    summary:
      "Transformer 与大规模预训练语言模型奠定基础；早期系统开始把检索、计算器、搜索引擎接到模型之外，形成“模型 + 工具”雏形。",
    highlights: ["Attention 机制", "预训练语言模型", "模型外工具雏形"],
    visual: "transformer",
    imageAlt: "Transformer 编码器与注意力连接示意",
    links: [
      {
        label: "Attention Is All You Need",
        href: "https://arxiv.org/abs/1706.03762",
        kind: "论文",
      },
      {
        label: "Lilian Weng · LLM Powered Agents",
        href: "https://lilianweng.github.io/posts/2023-06-23-agent/",
        kind: "教程",
      },
    ],
  },
  {
    id: "tools",
    year: "2020–2022",
    title: "指令微调与插件 / 函数调用",
    summary:
      "InstructGPT / ChatGPT 让通用对话能力普及；插件、函数调用和工具 API 让模型能调用外部能力，Agent 从论文走向产品原型。",
    highlights: ["Instruction Tuning", "Plugin 生态", "Function Calling"],
    visual: "tools",
    imageAlt: "模型通过函数调用连接外部工具示意",
    links: [
      {
        label: "InstructGPT 论文",
        href: "https://arxiv.org/abs/2203.02155",
        kind: "论文",
      },
      {
        label: "OpenAI Function Calling",
        href: "https://platform.openai.com/docs/guides/function-calling",
        kind: "官方指南",
      },
    ],
  },
  {
    id: "react",
    year: "2022–2023",
    title: "ReAct 与 Autonomous Agent 热潮",
    summary:
      "ReAct 把“思考—行动—观察”写成可复用循环；Auto-GPT、BabyAGI 等把自主 Agent 推到大众视野，也暴露幻觉、失控循环与成本问题。",
    highlights: ["Thought / Act / Observe", "Auto-GPT", "失控与成本风险"],
    visual: "react-loop",
    imageAlt: "ReAct 观察决策行动循环示意",
    links: [
      {
        label: "ReAct 论文",
        href: "https://arxiv.org/abs/2210.03629",
        kind: "论文",
      },
      {
        label: "IBM · What is AutoGPT?",
        href: "https://www.ibm.com/think/topics/autogpt",
        kind: "教程",
      },
      {
        label: "Auto-GPT 仓库",
        href: "https://github.com/Significant-Gravitas/AutoGPT",
        kind: "开源",
      },
    ],
  },
  {
    id: "harness",
    year: "2024",
    title: "从 Demo 到可靠系统",
    summary:
      "行业从“完全自主”转向可控 Workflow + 有限自主 Agent；强调 RAG 证据、人工审批、评测、预算与可观测性。",
    highlights: ["RAG + Citation", "人工审批", "评测与预算"],
    visual: "harness",
    imageAlt: "带护栏与审批的 Agent Harness 示意",
    links: [
      {
        label: "Anthropic · Building effective agents",
        href: "https://www.anthropic.com/engineering/building-effective-agents",
        kind: "官方指南",
      },
      {
        label: "OpenAI · Practical guide to agents",
        href: "https://openai.com/business/guides-and-resources/a-practical-guide-to-building-ai-agents/",
        kind: "官方指南",
      },
    ],
  },
  {
    id: "mcp",
    year: "2025–今",
    title: "协议化、多 Agent 与工程交付",
    summary:
      "MCP、Skills、Harness、Browser Agent、多智能体协作成为工程主线；企业关注交付质量、安全边界与岗位技能匹配。",
    highlights: ["MCP 工具协议", "Multi-Agent", "生产交付"],
    visual: "mcp",
    imageAlt: "MCP 连接多工具与多 Agent 协作示意",
    links: [
      {
        label: "Model Context Protocol 介绍",
        href: "https://www.anthropic.com/news/model-context-protocol",
        kind: "官方指南",
      },
      {
        label: "MCP 规范文档",
        href: "https://modelcontextprotocol.io/",
        kind: "官方指南",
      },
      {
        label: "Agent 协议发展时间线",
        href: "https://hidekazu-konishi.com/entry/tool_use_and_agent_protocol_history_and_timeline.html",
        kind: "教程",
      },
    ],
  },
];

export const coreConcepts: ConceptCard[] = [
  {
    title: "Chatbot",
    summary: "以对话为中心，单轮或多轮回答问题，通常不主动规划多步行动。",
    points: ["适合问答与内容生成", "工具调用可选但有限", "结果可预测性较高"],
    links: [
      {
        label: "OpenAI · Chat Completions",
        href: "https://platform.openai.com/docs/guides/text",
        kind: "官方指南",
      },
    ],
  },
  {
    title: "Workflow",
    summary: "按预定义步骤执行，确定性强，适合稳定业务流程。",
    points: ["步骤固定、可审计", "成本与延迟可控", "遇到开放决策时不够灵活"],
    links: [
      {
        label: "Anthropic · Workflows vs Agents",
        href: "https://www.anthropic.com/engineering/building-effective-agents",
        kind: "官方指南",
      },
    ],
  },
  {
    title: "Agent",
    summary: "在目标约束下自主选择工具与下一步，形成观察—决策—行动循环。",
    points: ["适合开放式任务", "需要护栏、预算与评测", "失败模式更复杂"],
    links: [
      {
        label: "ReAct 论文",
        href: "https://arxiv.org/abs/2210.03629",
        kind: "论文",
      },
    ],
  },
  {
    title: "Multi-Agent",
    summary: "多个角色分工协作（规划、执行、审查），用协议与共享状态对齐。",
    points: ["可拆解复杂任务", "通信与一致性成本上升", "适合研究、编码、评审场景"],
    links: [
      {
        label: "MCP 文档",
        href: "https://modelcontextprotocol.io/",
        kind: "官方指南",
      },
    ],
  },
];

/** @deprecated use historyIntro */
export const fundamentalsIntro = historyIntro;
