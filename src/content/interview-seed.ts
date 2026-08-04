export type SeedInterviewQuestion = {
  title: string;
  prompt: string;
  answerHint: string;
  tags: string[];
  companies: string[];
  recruitType: "校招" | "社招";
  adminBoost: number;
};

export const interviewSeed: SeedInterviewQuestion[] = [
  {
    title: "解释 Agent Loop：Observe → Decide → Act",
    prompt:
      "请用自己的话解释最小 Agent Loop，并说明工具错误为什么也应该作为 observation 返回给模型，而不是直接抛异常中断。",
    answerHint: "强调闭环、结构化错误、最大步数/超时护栏。",
    tags: ["基础", "Agent Loop"],
    companies: ["字节跳动", "阿里巴巴"],
    recruitType: "校招",
    adminBoost: 8,
  },
  {
    title: "Chatbot / Workflow / Agent 边界",
    prompt:
      "给出一个适合 Agent 的业务场景和一个不适合的场景，并从自主性、可预测性、成本、风险四个维度对比。",
    answerHint: "固定报表更适合 Workflow；开放式研究更适合 Agent。",
    tags: ["基础", "产品判断"],
    companies: ["美团", "腾讯"],
    recruitType: "社招",
    adminBoost: 7,
  },
  {
    title: "RAG 无证据时如何处理",
    prompt:
      "当检索结果不足以回答用户问题时，Agent 应该怎么做？如何保证引用一定来自本次检索？",
    answerHint: "拒答、说明缺口、citation 白名单校验。",
    tags: ["RAG", "中级"],
    companies: ["百度", "智谱 AI"],
    recruitType: "社招",
    adminBoost: 9,
  },
  {
    title: "Function Calling 参数校验",
    prompt:
      "为什么工具参数必须用 Zod/Pydantic 校验？如果模型传了超范围路径或超长字符串，你会如何设计失败返回？",
    answerHint: "校验失败返回结构化 observation，不暴露内部路径。",
    tags: ["工具", "安全"],
    companies: ["OpenAI", "Anthropic"],
    recruitType: "社招",
    adminBoost: 8,
  },
  {
    title: "人工审批与写操作",
    prompt:
      "哪些 Agent 动作必须人工审批？请设计一个“待批准 → 批准/拒绝 → 继续执行”的状态机，并说明拒绝后如何落盘。",
    answerHint: "写文件、发消息、付款、删除；拒绝要可审计。",
    tags: ["Harness", "高级"],
    companies: ["蚂蚁集团", "华为"],
    recruitType: "社招",
    adminBoost: 10,
  },
  {
    title: "MCP 解决什么问题",
    prompt:
      "Model Context Protocol 相比“每个 Agent 单独接工具 API”有什么优势？请举一个 notes search 类工具的例子。",
    answerHint: "统一工具/资源/提示暴露，降低重复集成与权限碎片化。",
    tags: ["MCP", "协议"],
    companies: ["Anthropic", "Cursor"],
    recruitType: "校招",
    adminBoost: 7,
  },
  {
    title: "评测集如何设计",
    prompt:
      "给你一个内部知识库 Agent，你会建立哪些离线评测维度？如何判断一次 prompt 改动是变好还是只是变贵？",
    answerHint: "成功率、groundedness、引用有效率、延迟、费用、拒答正确率。",
    tags: ["Eval", "高级"],
    companies: ["微软", "Google"],
    recruitType: "社招",
    adminBoost: 9,
  },
  {
    title: "多 Agent 分工",
    prompt:
      "把“研究并发布报告”拆成 Planner / Researcher / Reviewer，说明各自输入输出、失败交接和最终谁有发布权。",
    answerHint: "Reviewer 评分门槛 + 人类批准后才能 publish。",
    tags: ["Multi-Agent", "高级"],
    companies: ["字节跳动", "月之暗面", "DeepSeek"],
    recruitType: "校招",
    adminBoost: 8,
  },
];
