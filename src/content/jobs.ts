export type SalaryBand = {
  level: string;
  cityTier: string;
  range: string;
  median: string;
  note: string;
};

export type RoleProfile = {
  title: string;
  demand: "高" | "中高" | "中";
  salaryHint: string;
  mustHave: string[];
  niceToHave: string[];
  interviewFocus: string[];
};

export type MarketSourceNote = {
  title: string;
  summary: string;
};

export type JobBoard = {
  name: string;
  region: "国内" | "海外 / 远程" | "技术社区";
  summary: string;
  searchHint: string;
  url: string;
};

export const jobsIntro = {
  eyebrow: "TALENT MARKET",
  title: "招聘市场：薪资与岗位要求",
  copy: "以下为面向国内一线/新一线城市的 Agent / LLM 应用工程岗位观察汇总（2025–2026 公开招聘口径整理），并附常见招聘网站直达链接，方便立刻去平台检索真实 JD。",
};

export const jobBoards: JobBoard[] = [
  {
    name: "Boss 直聘",
    region: "国内",
    summary: "国内互联网岗位沟通效率高，适合快速对比 Agent / LLM 应用岗薪资与要求。",
    searchHint: "关键词：AI Agent、大模型应用、RAG",
    url: "https://www.zhipin.com/web/geek/job?query=AI%20Agent",
  },
  {
    name: "拉勾网",
    region: "国内",
    summary: "偏互联网与产品技术岗，可筛 AI 产品工程师、算法工程交叉岗位。",
    searchHint: "关键词：大模型、AI 工程师",
    url: "https://www.lagou.com/wn/jobs?kd=AI%E5%B7%A5%E7%A8%8B%E5%B8%88",
  },
  {
    name: "猎聘",
    region: "国内",
    summary: "中高端与社招岗位较多，适合看高级 Agent / 平台治理类 JD。",
    searchHint: "关键词：LLM、智能体、AI 平台",
    url: "https://www.liepin.com/zhaopin/?key=AI%20Agent",
  },
  {
    name: "智联招聘",
    region: "国内",
    summary: "覆盖城市与行业广，可补充传统企业数字化与 AI 落地岗位。",
    searchHint: "关键词：人工智能工程师、大模型",
    url: "https://www.zhaopin.com/sou?jl=489&kw=AI%E5%B7%A5%E7%A8%8B%E5%B8%88",
  },
  {
    name: "前程无忧 51Job",
    region: "国内",
    summary: "综合招聘平台，适合按城市批量浏览 AI 相关社招信息。",
    searchHint: "关键词：机器学习、大模型应用",
    url: "https://search.51job.com/list/000000,000000,0000,00,9,99,AI,2,1.html",
  },
  {
    name: "Nowcoder 牛客",
    region: "技术社区",
    summary: "校招/社招讨论活跃，可看面经与公司 AI 岗真实反馈。",
    searchHint: "搜索：AI Agent 面经、大模型岗",
    url: "https://www.nowcoder.com/jobs/center?keyword=AI",
  },
  {
    name: "脉脉",
    region: "技术社区",
    summary: "职场讨论与内推信息多，适合验证 JD 含金量与团队口碑。",
    searchHint: "话题：大模型、Agent、内推",
    url: "https://maimai.cn/search?query=AI%20Agent&type=feed",
  },
  {
    name: "LinkedIn",
    region: "海外 / 远程",
    summary: "海外与外企远程岗位主渠道，可跟 Agent Engineer / LLM Engineer。",
    searchHint: "Keywords: AI Agent, LLM Engineer",
    url: "https://www.linkedin.com/jobs/search/?keywords=AI%20Agent",
  },
  {
    name: "Indeed",
    region: "海外 / 远程",
    summary: "全球综合招聘引擎，便于横向比较不同国家薪资口径。",
    searchHint: "Keywords: Agentic AI, LLM Application",
    url: "https://www.indeed.com/jobs?q=AI+Agent",
  },
  {
    name: "Wellfound (AngelList)",
    region: "海外 / 远程",
    summary: "创业公司与 AI 初创密集，适合看早期 Agent 产品岗。",
    searchHint: "Keywords: AI Engineer, Founding Engineer",
    url: "https://wellfound.com/role/l/artificial-intelligence-engineer",
  },
  {
    name: "Y Combinator Work at a Startup",
    region: "海外 / 远程",
    summary: "YC 生态岗位入口，AI Agent / infra 类创业机会较多。",
    searchHint: "Filter: Artificial Intelligence",
    url: "https://www.workatastartup.com/jobs?query=AI%20agent",
  },
  {
    name: "电鸭社区",
    region: "海外 / 远程",
    summary: "中文远程/兼职机会社区，可关注 AI 应用与独立开发协作。",
    searchHint: "标签：远程、AI、兼职",
    url: "https://eleduck.com/categories/5?keyword=AI",
  },
];

export const salaryBands: SalaryBand[] = [
  {
    level: "初级 / 转岗",
    cityTier: "一线 · 新一线",
    range: "18–30K",
    median: "~24K",
    note: "有前端/后端基础，能接 API、做 RAG Demo、写清约束",
  },
  {
    level: "中级工程师",
    cityTier: "一线 · 新一线",
    range: "30–50K",
    median: "~38K",
    note: "能独立交付内部 Agent，含评测、日志、权限与失败兜底",
  },
  {
    level: "高级 / 负责人",
    cityTier: "一线为主",
    range: "50–80K+",
    median: "~60K",
    note: "多 Agent 架构、成本治理、安全合规与跨团队落地经验",
  },
  {
    level: "海外远程 / 外资",
    cityTier: "Remote · 混合",
    range: "$90K–$180K",
    median: "~$130K",
    note: "强调英文协作、系统设计与生产事故处理能力",
  },
];

export const roleProfiles: RoleProfile[] = [
  {
    title: "AI 应用工程师 / Agent Engineer",
    demand: "高",
    salaryHint: "30–55K（一线常见）",
    mustHave: [
      "TypeScript 或 Python 工程能力",
      "能设计 Tool / Function Calling 与参数校验",
      "理解 RAG、拒答与引用校验",
      "会做基础评测与错误分类",
    ],
    niceToHave: ["MCP", "LangGraph / Agents SDK", "前端交互体验"],
    interviewFocus: ["最小 Agent Loop 手写", "一次真实失败复盘", "如何限制工具权限"],
  },
  {
    title: "LLM 全栈 / AI 产品工程师",
    demand: "高",
    salaryHint: "28–48K",
    mustHave: [
      "把 Agent 能力做成可用产品界面",
      "流式输出、会话状态、反馈闭环",
      "Prompt / 工作流可配置化",
      "基础观测：延迟、费用、成功率",
    ],
    niceToHave: ["设计感与信息架构", "A/B 与用户研究"],
    interviewFocus: ["从 Demo 到可运营的差距", "如何展示不确定性"],
  },
  {
    title: "RAG / 知识工程工程师",
    demand: "中高",
    salaryHint: "30–50K",
    mustHave: [
      "分块、召回、重排与引用一致性",
      "语料治理与权限隔离",
      "离线评测集维护",
    ],
    niceToHave: ["混合检索", "结构化抽取", "多模态文档"],
    interviewFocus: ["无证据为什么必须拒答", "如何定位坏召回"],
  },
  {
    title: "AI 平台 / 安全与治理",
    demand: "中",
    salaryHint: "40–70K",
    mustHave: [
      "密钥与租户隔离",
      "工具白名单、预算与审批流",
      "审计日志与红队用例",
    ],
    niceToHave: ["策略引擎", "合规框架经验"],
    interviewFocus: ["SSRF / Prompt 注入防护", "事故演练设计"],
  },
];

export const hiringSignals: string[] = [
  "JD 从“会调 GPT”转向“能上线、能控成本、能解释失败”",
  "高频要求：Zod/Pydantic 校验、结构化输出、人工审批点",
  "加分项：MCP、评测集、Trace、多 Agent 分工案例",
  "减分项：只会堆 Prompt、无法说明边界与回滚策略",
  "转岗友好路径：原前端/后端 + 1–2 个可演示的 Agent 交付物",
];

export const marketNotes: MarketSourceNote[] = [
  {
    title: "数据口径说明",
    summary:
      "薪资区间综合公开招聘平台、技术社区讨论与常见 Offer 反馈，按月薪税前粗粒度汇总；不同城市、股权与 Bonuses 差异很大。",
  },
  {
    title: "如何用于学习",
    summary:
      "对照岗位 must-have 回看本仓库九阶段路线：初级打基础，中级补 RAG/评测，高级补 Harness 与交付，再准备作品集。",
  },
];
