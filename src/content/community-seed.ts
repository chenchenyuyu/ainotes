export type SeedCommunityPost = {
  title: string;
  body: string;
  category: "提问" | "经验" | "讨论";
  tags: string[];
};

export const communitySeed: SeedCommunityPost[] = [
  {
    title: "第一周卡在 Chatbot / Workflow / Agent 边界，怎么判断？",
    body: "业务方说要做「智能助手」，但需求里又有很多固定流程。你们一般怎么快速判断该做成 Chatbot、Workflow 还是 Agent？有没有一套可复用的提问清单？",
    category: "提问",
    tags: ["基础", "产品判断"],
  },
  {
    title: "分享：我给 Agent 工具调用加的三道护栏",
    body: "落地时踩过坑后沉淀：1）单工具超时 + 重试上限；2）结构化错误回传 observation，不直接中断；3）总步数与费用预算。欢迎补充你们团队的护栏清单。",
    category: "经验",
    tags: ["Harness", "工程落地"],
  },
  {
    title: "RAG 检索没有 citation 时，你们会拒答还是硬答？",
    body: "课程要求 citation，但真实业务里检索经常空召回。想听听大家在面试场景和实际项目里分别怎么处理，以及如何跟产品对齐预期。",
    category: "讨论",
    tags: ["RAG", "面试"],
  },
];
