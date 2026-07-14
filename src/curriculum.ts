export type AssessmentQuestion = {
  id: string;
  prompt: string;
  hint: string;
  criteria: Array<{
    label: string;
    terms: string[];
  }>;
};

export type LearningLevel = "初级" | "中级" | "高级";

export type LearningResource = {
  title: string;
  url: string;
  kind: "官方指南" | "教程" | "开源项目" | "论文";
  description: string;
  target: string;
};

export type LearningTask = {
  id: string;
  title: string;
  acceptance: string;
};

export type CurriculumWeek = {
  week: number;
  level: LearningLevel;
  phase: string;
  title: string;
  summary: string;
  hours: string;
  color: string;
  knowledge: string[];
  resources: LearningResource[];
  practice: LearningTask[];
  deliverable: string;
  questions: AssessmentQuestion[];
};

export const curriculum: CurriculumWeek[] = [
  {
    week: 1,
    level: "初级",
    phase: "CONCEPT",
    title: "认识 Agent 与适用边界",
    summary: "区分 chatbot、workflow 与 agent，先判断问题是否真的需要自主决策。",
    hours: "6–8h",
    color: "#6c8cff",
    knowledge: ["Chatbot、Workflow、Agent 与 Multi-Agent 的边界", "Observe → Think → Act → Observe 基本循环", "自主性、可预测性与成本的取舍", "何时应使用普通脚本或确定性工作流", "面向任务的成功标准"],
    resources: [
      {
        title: "Anthropic · Building effective agents",
        url: "https://www.anthropic.com/engineering/building-effective-agents",
        kind: "官方指南",
        description: "用 workflow 与 agent 的工程边界建立第一套判断框架。",
        target: "读完 Building block、Workflow、Agent 三部分并画一张对比图。",
      },
      {
        title: "OpenAI · A practical guide to building agents",
        url: "https://openai.com/business/guides-and-resources/a-practical-guide-to-building-ai-agents/",
        kind: "官方指南",
        description: "从模型、工具、指令和护栏理解 Agent 的产品组成。",
        target: "提炼一个适合 Agent 的场景和一个不适合的场景。",
      },
      {
        title: "Lilian Weng · LLM Powered Autonomous Agents",
        url: "https://lilianweng.github.io/posts/2023-06-23-agent/",
        kind: "教程",
        description: "系统补齐规划、记忆与工具使用的经典概念。",
        target: "本阶段先精读 Agent System Overview，其余章节后续回看。",
      },
    ],
    practice: [
      { id: "s1-note", title: "写一页 Agent / Workflow 对比笔记", acceptance: "至少包含自主决策、确定性、成本、风险四个维度。" },
      { id: "s1-case", title: "拆解一个自己的业务场景", acceptance: "明确输入、决策点、可用工具、终止条件和成功指标。" },
      { id: "s1-boundary", title: "给出“不使用 Agent”的反例", acceptance: "说明为什么脚本或固定工作流更可靠。" },
    ],
    deliverable: "一页决策说明：我的场景为什么需要（或不需要）Agent",
    questions: [
      {
        id: "w1-q1",
        prompt: "Chatbot、确定性 Workflow 和 Agent 的核心差异是什么？",
        hint: "从控制流、模型自主性、工具和可预测性比较。",
        criteria: [
          { label: "Chatbot 交互", terms: ["chatbot", "对话", "单次回答"] },
          { label: "Workflow 控制", terms: ["workflow", "固定", "确定", "预定义"] },
          { label: "Agent 自主性", terms: ["agent", "自主", "决策", "选择工具"] },
          { label: "工程取舍", terms: ["可预测", "风险", "成本", "复杂"] },
        ],
      },
      {
        id: "w1-q2",
        prompt: "什么情况下不应该使用 Agent？请结合一个实际场景说明。",
        hint: "考虑任务是否稳定、可预测，以及普通程序是否足够。",
        criteria: [
          { label: "任务可预测", terms: ["可预测", "固定", "稳定", "确定"] },
          { label: "替代方案", terms: ["脚本", "workflow", "规则", "普通程序"] },
          { label: "风险成本", terms: ["风险", "成本", "不确定", "延迟"] },
        ],
      },
    ],
  },
  {
    week: 2,
    level: "初级",
    phase: "BUILD",
    title: "最小 Agent Loop 与工具调用",
    summary: "不用重型框架，亲手完成结构化决策、工具执行、反馈和终止。",
    hours: "10–12h",
    color: "#7c6cff",
    knowledge: ["消息与上下文窗口", "结构化 JSON 输出", "Function / Tool Calling", "工具注册、执行与结果回传", "最大步数、超时和结构化错误"],
    resources: [
      {
        title: "OpenAI · Function calling",
        url: "https://platform.openai.com/docs/guides/function-calling",
        kind: "官方指南",
        description: "学习工具 schema、调用结果和多轮工具循环。",
        target: "实现一个严格 schema 的 calculator 或 read_file 工具。",
      },
      {
        title: "Claude · Tool use",
        url: "https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/overview",
        kind: "官方指南",
        description: "对照另一套 API 理解工具定义、选择与结果消息。",
        target: "比较两家 API 的 tool call 消息结构和错误处理。",
      },
      {
        title: "hello-agents",
        url: "https://github.com/datawhalechina/hello-agents",
        kind: "开源项目",
        description: "中文智能体系统教程，适合对照最小实现补齐原理。",
        target: "只阅读与 Agent Loop、工具调用相关章节，不要直接复制框架代码。",
      },
    ],
    practice: [
      { id: "s2-loop", title: "实现 50–150 行最小 Agent", acceptance: "模型能选择工具、接收结果并给出最终答案。" },
      { id: "s2-guard", title: "加入最大步数、超时和错误返回", acceptance: "无限调用、非法参数、工具超时均能安全结束。" },
      { id: "s2-tests", title: "编写至少 10 条测试", acceptance: "覆盖正常调用、无需工具、失败恢复和达到步数上限。" },
      { id: "s2-trace", title: "记录一次完整执行轨迹", acceptance: "能解释每条 observation、decision、action 和 termination。" },
    ],
    deliverable: "可运行的最小 Agent + 10 条测试 + 一份失败记录",
    questions: [
      {
        id: "w2-q1",
        prompt: "一个完整的 Agent Loop 包含哪些步骤？为什么通常不止调用一次模型？",
        hint: "从观察、决策、执行、反馈和终止展开。",
        criteria: [
          { label: "观察输入", terms: ["观察", "输入", "上下文"] },
          { label: "模型决策", terms: ["决策", "推理", "选择工具"] },
          { label: "执行反馈", terms: ["执行", "工具", "反馈", "结果"] },
          { label: "终止条件", terms: ["终止", "最终答案", "最大步数", "结束"] },
        ],
      },
      {
        id: "w2-q2",
        prompt: "工具失败时，为什么应返回结构化错误而不是直接终止进程？",
        hint: "考虑模型恢复、重试策略和可观测性。",
        criteria: [
          { label: "错误可理解", terms: ["结构化", "错误类型", "错误信息"] },
          { label: "模型可恢复", terms: ["恢复", "重试", "修正参数"] },
          { label: "便于追踪", terms: ["可观测", "调试", "trace", "追踪"] },
        ],
      },
    ],
  },
  {
    week: 3,
    level: "初级",
    phase: "GROUNDING",
    title: "RAG、引用与基础记忆",
    summary: "把文档和搜索接成工具，让答案有证据、失败可识别。",
    hours: "12–14h",
    color: "#a45ee5",
    knowledge: ["Chunk、Embedding、Retrieve 与 Grounded Answer", "短期上下文、会话记忆与长期记忆", "引用生成与证据校验", "空结果、重复调用和幻觉引用", "关键词检索与向量检索基线"],
    resources: [
      {
        title: "LlamaIndex · Agents",
        url: "https://docs.llamaindex.ai/en/stable/module_guides/deploying/agents/",
        kind: "官方指南",
        description: "理解数据、检索器和 Agent 工具之间的连接方式。",
        target: "画出 ingestion → retrieval → answer with citations 数据流。",
      },
      {
        title: "GPT Researcher",
        url: "https://github.com/assafelovic/gpt-researcher",
        kind: "开源项目",
        description: "观察搜索、筛选、引用和长报告如何组成研究助手。",
        target: "定位搜索、来源筛选和报告生成模块，写一页架构笔记。",
      },
      {
        title: "AnythingLLM",
        url: "https://github.com/Mintplex-Labs/anything-llm",
        kind: "开源项目",
        description: "从完整产品理解本地 RAG 与 Agent 的用户体验。",
        target: "跑通本地文档问答，记录一个命中和一个无答案案例。",
      },
    ],
    practice: [
      { id: "s3-index", title: "为 Markdown 文档建立可替换检索接口", acceptance: "至少支持关键词基线，并保留切换向量检索的边界。" },
      { id: "s3-citation", title: "输出可点击来源并校验引用", acceptance: "每个事实能映射到实际返回的文档片段。" },
      { id: "s3-failure", title: "处理空结果、冲突证据和幻觉引用", acceptance: "无证据时明确拒答，不生成不存在的来源。" },
      { id: "s3-eval", title: "建立 20 条检索评估集", acceptance: "记录 query、期望文档、实际文档和是否命中。" },
    ],
    deliverable: "带来源的资料研究助手 + 20 条检索评估",
    questions: [
      {
        id: "w3-q1",
        prompt: "短期上下文、长期记忆和 RAG 检索分别解决什么问题？",
        hint: "区分当前任务状态、跨会话信息和外部知识。",
        criteria: [
          { label: "短期上下文", terms: ["短期", "当前", "上下文", "会话"] },
          { label: "长期记忆", terms: ["长期", "跨会话", "偏好", "记忆"] },
          { label: "RAG 外部知识", terms: ["rag", "外部知识", "检索", "文档"] },
        ],
      },
      {
        id: "w3-q2",
        prompt: "如何验证一个带引用的回答确实有证据支撑？",
        hint: "说明来源约束、片段映射和固定评估集。",
        criteria: [
          { label: "真实来源", terms: ["来源", "链接", "文档", "存在"] },
          { label: "证据映射", terms: ["片段", "引用", "事实", "映射"] },
          { label: "评估方法", terms: ["评估集", "groundedness", "准确率", "测试"] },
        ],
      },
    ],
  },
  {
    week: 4,
    level: "中级",
    phase: "HARNESS",
    title: "现代 Agent Harness",
    summary: "选一个现代系统学深，理解工具、权限、会话、压缩与 trace 如何协同。",
    hours: "12–14h",
    color: "#d85ab0",
    knowledge: ["Agent Harness 与框架 API 的区别", "Tool Registry 与 Permission Gate", "Session Store 与 Context Compaction", "Trace、回放和失败恢复", "裸 Agent Loop 与 Harness 的工程差异"],
    resources: [
      {
        title: "Claude Code · Overview",
        url: "https://code.claude.com/docs/en/overview",
        kind: "官方指南",
        description: "研究真实 coding agent 的 CLI、工具、权限和上下文管理。",
        target: "继续阅读 permissions、hooks、subagents、MCP 四个专题。",
      },
      {
        title: "learn-claude-code",
        url: "https://github.com/shareAI-lab/learn-claude-code",
        kind: "开源项目",
        description: "从零复刻 Claude Code-like harness 的渐进教程。",
        target: "至少完成基础 loop、工具注册、会话与 context compaction 章节。",
      },
      {
        title: "LangGraph",
        url: "https://langchain-ai.github.io/langgraph/",
        kind: "官方指南",
        description: "学习状态图、可恢复执行和可控编排。",
        target: "跑通包含 checkpoint 与 interrupt 的最小状态图。",
      },
    ],
    practice: [
      { id: "s4-map", title: "读懂一个 Harness 的目录结构", acceptance: "标出 loop、tool registry、permission、session、compaction、trace。" },
      { id: "s4-run", title: "跑通最小示例并加入自定义工具", acceptance: "工具有 schema、权限边界和可观察结果。" },
      { id: "s4-trace", title: "分析一次完整 Trace", acceptance: "逐步解释模型为何行动、工具为何成功或失败。" },
      { id: "s4-compare", title: "对比裸 Loop 与 Harness", acceptance: "从控制力、恢复、权限、调试、复杂度五方面记录取舍。" },
    ],
    deliverable: "可调试 Harness Demo + 架构图 + 成功与失败 Trace",
    questions: [
      {
        id: "w4-q1",
        prompt: "为什么现代 Agent 的能力不只来自模型，Harness 也很关键？",
        hint: "从工具、权限、状态、反馈和上下文管理展开。",
        criteria: [
          { label: "工具与协议", terms: ["工具", "schema", "registry", "协议"] },
          { label: "权限安全", terms: ["权限", "审批", "sandbox", "安全"] },
          { label: "状态上下文", terms: ["状态", "session", "上下文", "压缩"] },
          { label: "反馈可观测", terms: ["反馈", "trace", "日志", "测试"] },
        ],
      },
      {
        id: "w4-q2",
        prompt: "Context Compaction 要解决什么问题，又可能引入什么风险？",
        hint: "考虑长任务的 token 预算、关键信息保留与可恢复性。",
        criteria: [
          { label: "窗口预算", terms: ["token", "窗口", "预算", "长度"] },
          { label: "信息压缩", terms: ["压缩", "摘要", "裁剪"] },
          { label: "丢失风险", terms: ["丢失", "遗漏", "关键信息", "错误"] },
          { label: "验证恢复", terms: ["checkpoint", "恢复", "测试", "验证"] },
        ],
      },
    ],
  },
  {
    week: 5,
    level: "中级",
    phase: "PROTOCOL",
    title: "Skills、MCP 与能力封装",
    summary: "用协议连接外部能力，用 Skill 打包可复用流程和验收标准。",
    hours: "12–14h",
    color: "#e86f78",
    knowledge: ["Tool、Prompt、Skill 与 MCP 的边界", "MCP Host / Client / Server", "Tools、Resources 与 Prompts", "Skill 的发现、版本化和渐进加载", "A2A 与 ACP 的适用位置"],
    resources: [
      {
        title: "Model Context Protocol",
        url: "https://modelcontextprotocol.io/",
        kind: "官方指南",
        description: "学习 Agent 连接工具和数据源的开放协议。",
        target: "精读 Architecture、Tools、Resources、Security Best Practices。",
      },
      {
        title: "Claude Code · Agent Skills",
        url: "https://code.claude.com/docs/en/skills",
        kind: "官方指南",
        description: "理解 Skill 的目录、触发条件和辅助资源组织。",
        target: "总结 Tool、Prompt、Skill 三者的职责与组合方式。",
      },
      {
        title: "Agent2Agent Protocol",
        url: "https://a2a-protocol.org/latest/specification/",
        kind: "官方指南",
        description: "了解不同 Agent 发现、通信与任务协作的标准。",
        target: "只需掌握 Agent Card、Task 和 Message 的角色，不必完整实现。",
      },
    ],
    practice: [
      { id: "s5-mcp", title: "实现一个只读 MCP Server", acceptance: "至少暴露一个 tool 和一个 resource，并通过 Inspector 调试。" },
      { id: "s5-skill", title: "编写一个可复用 SKILL.md", acceptance: "包含触发描述、步骤、资源、限制和验收标准。" },
      { id: "s5-smoke", title: "给 Skill 编写 Smoke Test", acceptance: "对比使用前后至少 5 个任务的成功率。" },
      { id: "s5-security", title: "记录协议安全边界", acceptance: "覆盖认证、授权、输入校验、网络访问和敏感写操作。" },
    ],
    deliverable: "MCP Server + 可复用 Skill + Smoke Test 报告",
    questions: [
      {
        id: "w5-q1",
        prompt: "Tool、Skill 和 MCP 分别解决什么问题？它们如何组合？",
        hint: "区分接口、流程知识和连接协议。",
        criteria: [
          { label: "Tool 接口", terms: ["tool", "接口", "调用", "函数"] },
          { label: "Skill 流程", terms: ["skill", "流程", "知识", "步骤"] },
          { label: "MCP 连接", terms: ["mcp", "协议", "连接", "server"] },
          { label: "组合关系", terms: ["组合", "复用", "外部工具"] },
        ],
      },
      {
        id: "w5-q2",
        prompt: "一个高质量 Skill 应如何验证它真的提升了任务成功率？",
        hint: "不要只看文档是否完整，要设计前后对照与失败分类。",
        criteria: [
          { label: "固定任务集", terms: ["任务集", "测试集", "固定", "样例"] },
          { label: "前后对照", terms: ["对照", "基线", "使用前", "使用后"] },
          { label: "成功指标", terms: ["成功率", "指标", "质量", "成本"] },
          { label: "失败分析", terms: ["失败", "分类", "回归", "原因"] },
        ],
      },
    ],
  },
  {
    week: 6,
    level: "中级",
    phase: "COORDINATE",
    title: "可控编排与 Multi-Agent",
    summary: "把多 Agent 当作协调问题，用状态、Schema 和停止条件约束协作。",
    hours: "10–14h",
    color: "#ef8c4a",
    knowledge: ["Planner、Executor、Reviewer、Router 等角色", "Supervisor 与 Graph 编排", "输入输出 Schema 和职责边界", "循环、争论、漂移与上下文膨胀", "单 Agent 优先原则"],
    resources: [
      {
        title: "Claude Code · Subagents",
        url: "https://code.claude.com/docs/en/sub-agents",
        kind: "官方指南",
        description: "学习上下文隔离、专用角色和委派边界。",
        target: "设计一个只读 Reviewer 子 Agent，并限制其工具。",
      },
      {
        title: "Google Agent Development Kit",
        url: "https://google.github.io/adk-docs/",
        kind: "官方指南",
        description: "对照 Sequential、Parallel、Loop 和 LLM Agent 编排。",
        target: "跑通一个 research → write → review 顺序流程。",
      },
      {
        title: "ReAct",
        url: "https://arxiv.org/abs/2210.03629",
        kind: "论文",
        description: "理解 reasoning 与 acting 交错的基础范式。",
        target: "阅读方法与实验结论，记录该范式的优势和失败模式。",
      },
    ],
    practice: [
      { id: "s6-schema", title: "定义每个 Agent 的职责和 I/O Schema", acceptance: "职责无重叠，输出可验证，失败和停止条件明确。" },
      { id: "s6-flow", title: "实现 research → write → review → revise", acceptance: "由 Supervisor 或 Graph 控制，不允许自由无限对话。" },
      { id: "s6-loop", title: "加入循环与预算限制", acceptance: "达到轮数、token 或成本上限时可安全停止。" },
      { id: "s6-compare", title: "与单 Agent 基线对比", acceptance: "记录质量、延迟、成本和失败率，说明是否值得拆分。" },
    ],
    deliverable: "可控 Multi-Agent Writer + 单 Agent 对照报告",
    questions: [
      {
        id: "w6-q1",
        prompt: "为什么 Multi-Agent 的核心是协调，而不是增加角色数量？",
        hint: "说明职责、通信、状态、停止条件和成本。",
        criteria: [
          { label: "职责边界", terms: ["职责", "边界", "角色"] },
          { label: "结构化协作", terms: ["schema", "输入", "输出", "通信"] },
          { label: "停止与状态", terms: ["停止", "循环", "状态", "supervisor"] },
          { label: "效率取舍", terms: ["成本", "延迟", "单 agent", "复杂"] },
        ],
      },
      {
        id: "w6-q2",
        prompt: "Handoff 与 Manager 调用专家 Agent 有何区别？",
        hint: "比较控制权、上下文归属和结果汇总方式。",
        criteria: [
          { label: "Handoff 转交", terms: ["handoff", "转交", "控制权", "上下文"] },
          { label: "Manager 控制", terms: ["manager", "调用", "控制", "汇总"] },
          { label: "场景选择", terms: ["路由", "专家", "编排", "场景"] },
        ],
      },
    ],
  },
  {
    week: 7,
    level: "高级",
    phase: "INTERACT",
    title: "Browser 与 Computer-Use Agent",
    summary: "从 API 工具扩展到动态界面操作，并为页面变化和高风险动作设计恢复策略。",
    hours: "12–14h",
    color: "#e6ad32",
    knowledge: ["Browser Agent 与 API Tool 的差异", "DOM、截图与视觉观察", "动作空间、元素定位和等待策略", "页面变化、弹窗和失败恢复", "账号、权限和平台规则边界"],
    resources: [
      {
        title: "Claude · Computer use",
        url: "https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/computer-use-tool",
        kind: "官方指南",
        description: "理解截图观察、鼠标键盘动作与安全限制。",
        target: "精读实现建议、限制和安全措施。",
      },
      {
        title: "browser-use",
        url: "https://github.com/browser-use/browser-use",
        kind: "开源项目",
        description: "学习浏览器自动化、Agent 决策与失败恢复的完整实现。",
        target: "只在公开网页完成导航、提取和摘要任务。",
      },
      {
        title: "WebArena",
        url: "https://arxiv.org/abs/2307.13854",
        kind: "论文",
        description: "了解真实网页环境下 Agent 的评测任务与成功标准。",
        target: "提炼至少五类常见网页 Agent 失败。",
      },
    ],
    practice: [
      { id: "s7-public", title: "实现公开网页信息提取 Agent", acceptance: "能打开页面、提取指定信息、输出来源，不登录敏感账号。" },
      { id: "s7-recovery", title: "处理三类界面失败", acceptance: "覆盖加载超时、元素变化、弹窗或导航失败中的至少三类。" },
      { id: "s7-trace", title: "保存截图、DOM 与动作日志", acceptance: "失败后可依据记录复现并定位具体动作。" },
      { id: "s7-policy", title: "加入安全策略", acceptance: "限制域名、禁止敏感输入，写操作和提交必须人工确认。" },
    ],
    deliverable: "只操作公开网页的 Browser Agent + 可回放失败记录",
    questions: [
      {
        id: "w7-q1",
        prompt: "Browser Agent 为什么比普通 API Tool 更难保证可靠？",
        hint: "从观察、动作空间、环境变化和恢复展开。",
        criteria: [
          { label: "观察不稳定", terms: ["截图", "dom", "视觉", "观察"] },
          { label: "环境变化", terms: ["页面变化", "动态", "弹窗", "加载"] },
          { label: "动作歧义", terms: ["点击", "定位", "动作", "元素"] },
          { label: "恢复验证", terms: ["恢复", "重试", "日志", "验证"] },
        ],
      },
      {
        id: "w7-q2",
        prompt: "如何限制 Computer-Use Agent 的高风险行为？",
        hint: "考虑环境隔离、权限、域名、敏感信息与人工审批。",
        criteria: [
          { label: "环境隔离", terms: ["沙箱", "隔离", "测试账号", "容器"] },
          { label: "最小权限", terms: ["权限", "最小", "allowlist", "域名"] },
          { label: "敏感保护", terms: ["敏感", "密码", "隐私", "数据"] },
          { label: "人工确认", terms: ["人工", "审批", "确认", "写操作"] },
        ],
      },
    ],
  },
  {
    week: 8,
    level: "高级",
    phase: "EVALUATE",
    title: "评估、可观测与安全",
    summary: "用固定任务集、Trace 和权限边界把 Demo 变成可持续改进的系统。",
    hours: "14–16h",
    color: "#86b83d",
    knowledge: ["Task Success、Groundedness 与轨迹质量", "规则 Grader、LLM-as-Judge 与人工校准", "成功率、成本、延迟与工具调用指标", "Prompt Injection、Data Exfiltration 与 Tool Abuse", "回归测试、权限边界与人工确认"],
    resources: [
      {
        title: "OpenAI · Evals",
        url: "https://platform.openai.com/docs/guides/evals",
        kind: "官方指南",
        description: "建立可重复的任务集、grader 和迭代闭环。",
        target: "实现至少一种确定性 grader 和一种语义 grader。",
      },
      {
        title: "LangSmith · Evaluation",
        url: "https://docs.langchain.com/langsmith/evaluation",
        kind: "官方指南",
        description: "学习数据集、实验对比、Trace 和线上反馈。",
        target: "理解离线评估与在线可观测如何互相补充。",
      },
      {
        title: "AgentBench",
        url: "https://arxiv.org/abs/2308.03688",
        kind: "论文",
        description: "从 benchmark 设计理解 Agent 能力不能只看最终文本。",
        target: "记录环境交互型评测与普通问答评测的差异。",
      },
      {
        title: "SWE-bench",
        url: "https://www.swebench.com/",
        kind: "官方指南",
        description: "观察真实任务、可执行验证和污染控制如何形成强验收。",
        target: "把其中的可执行验收思想迁移到自己的 Agent 项目。",
      },
    ],
    practice: [
      { id: "s8-dataset", title: "准备至少 20 个固定任务", acceptance: "包含期望结果、实际结果、失败类型和可重复输入。" },
      { id: "s8-metrics", title: "记录质量与系统指标", acceptance: "至少包含成功率、成本、延迟、工具调用次数和引用正确率。" },
      { id: "s8-trace", title: "逐类分析失败 Trace", acceptance: "区分 prompt、模型、工具、检索、状态和权限问题。" },
      { id: "s8-safety", title: "完成一次安全红队测试", acceptance: "覆盖 prompt injection、数据外泄、工具滥用和越权写操作。" },
      { id: "s8-regression", title: "把关键任务接入回归测试", acceptance: "修改 prompt 或工具后能自动发现能力退化。" },
    ],
    deliverable: "20+ 任务 Eval 套件 + 指标报告 + 安全与回归清单",
    questions: [
      {
        id: "w8-q1",
        prompt: "为什么端到端 Agent 评估不能只看最终答案？",
        hint: "中间工具选择、执行轨迹、成本和安全同样可能失败。",
        criteria: [
          { label: "轨迹质量", terms: ["轨迹", "步骤", "过程", "trace"] },
          { label: "工具行为", terms: ["工具选择", "参数", "调用", "权限"] },
          { label: "证据质量", terms: ["证据", "引用", "groundedness", "检索"] },
          { label: "系统指标", terms: ["延迟", "成本", "安全", "成功率"] },
        ],
      },
      {
        id: "w8-q2",
        prompt: "如何组合规则 Grader、LLM-as-Judge 和人工评估？",
        hint: "说明各自擅长的任务、局限以及如何校准。",
        criteria: [
          { label: "规则 Grader", terms: ["规则", "exact", "确定性", "可执行"] },
          { label: "模型评分", terms: ["llm-as-judge", "语义", "模型评分"] },
          { label: "人工校准", terms: ["人工", "抽检", "校准", "偏差"] },
          { label: "组合策略", terms: ["组合", "成本", "置信", "分层"] },
        ],
      },
    ],
  },
  {
    week: 9,
    level: "高级",
    phase: "SHIP",
    title: "交付真实 Agent 产品",
    summary: "整合模型、工具、权限、评估与部署，交付别人能够运行和验证的产品。",
    hours: "16–24h",
    color: "#42a878",
    knowledge: ["明确用户、任务与成功标准", "超时、重试、成本上限和降级", "权限、审计与 Human-in-the-loop", "CLI、Web、Bot、Action 等部署形态", "README、架构决策与失败复盘"],
    resources: [
      {
        title: "OpenAI Agents SDK",
        url: "https://platform.openai.com/docs/guides/agents-sdk/",
        kind: "官方指南",
        description: "参考生产 Agent 的工具、handoff、guardrail 和 tracing 组织方式。",
        target: "选取需要的能力，不为使用框架而重写已经可靠的组件。",
      },
      {
        title: "OpenAI Codex",
        url: "https://github.com/openai/codex",
        kind: "开源项目",
        description: "研究 coding agent 的 sandbox、approval 和 CLI 产品形态。",
        target: "定位权限审批、命令执行和会话管理的设计。",
      },
      {
        title: "DeerFlow",
        url: "https://github.com/bytedance/deer-flow",
        kind: "开源项目",
        description: "研究长任务、sandbox、memory、skills、subagents 和产物生成。",
        target: "只拆解与自己项目相关的两个模块，避免无目标通读。",
      },
      {
        title: "SWE-agent",
        url: "https://arxiv.org/abs/2405.15793",
        kind: "论文",
        description: "理解 Agent-Computer Interface 如何影响真实任务成功率。",
        target: "把“优化接口而非只改 Prompt”的原则用于毕业项目。",
      },
    ],
    practice: [
      { id: "s9-scope", title: "定义用户、任务和验收指标", acceptance: "用一句话说明用户价值，并给出可执行成功标准。" },
      { id: "s9-product", title: "交付可运行产品", acceptance: "他人可通过 CLI、Web、Bot 或 Action 完成核心任务。" },
      { id: "s9-ops", title: "加入生产护栏", acceptance: "具备日志、trace、重试、超时、成本限制、权限和人工确认。" },
      { id: "s9-docs", title: "编写完整 README", acceptance: "包含安装、配置、运行、测试、扩展、安全与已知限制。" },
      { id: "s9-demo", title: "完成真实用户验收", acceptance: "至少 3 名用户或 10 次真实任务运行，并记录反馈和失败。" },
    ],
    deliverable: "别人可以 Clone、运行、评估并安全扩展的 Agent 项目",
    questions: [
      {
        id: "w9-q1",
        prompt: "请描述你的 Agent 从接收任务到输出结果的完整数据流与控制流。",
        hint: "覆盖入口、模型、状态、工具、证据、权限、Trace 和评估。",
        criteria: [
          { label: "入口与状态", terms: ["入口", "ui", "api", "状态", "session"] },
          { label: "模型与工具", terms: ["模型", "agent", "工具", "mcp"] },
          { label: "证据与输出", terms: ["证据", "引用", "结果", "产物"] },
          { label: "权限与观测", terms: ["权限", "审批", "trace", "日志"] },
          { label: "评估闭环", terms: ["评估", "指标", "回归", "反馈"] },
        ],
      },
      {
        id: "w9-q2",
        prompt: "如果产品上线后只能优先改进一个指标，你会选什么？如何验证？",
        hint: "给出当前基线、用户影响、改进假设和对照实验。",
        criteria: [
          { label: "明确指标", terms: ["成功率", "准确率", "延迟", "成本", "指标"] },
          { label: "基线影响", terms: ["基线", "用户", "影响", "瓶颈"] },
          { label: "改进假设", terms: ["假设", "原因", "方案", "改进"] },
          { label: "验证方法", terms: ["评估集", "实验", "对照", "验证"] },
        ],
      },
    ],
  },
];

export function getWeek(week: number): CurriculumWeek | undefined {
  return curriculum.find((item) => item.week === week);
}
