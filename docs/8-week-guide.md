# 8 周执行手册

这不是阅读清单，而是一套每周可验收的工程训练。TypeScript/Node.js 占约 65%，Python 占约 35%。每周投入 10–14 小时：阅读 3–4 小时、编码 6–8 小时、评估与复盘 1–2 小时。

## 每周固定节奏

- 周一：阅读本周核心文档，写 5 个概念问题。
- 周二：完成最小示例，禁止复制整段教程。
- 周四：加入错误处理、日志与测试。
- 周五：整理至少 3 个失败案例。
- 周末：完成周项目、运行验收命令、写复盘。

复盘只回答四件事：Agent 能做什么、最常见的 3 个失败、如何量化、下周只改善哪一项。

## 第 1 周：LLM 基础与最小 Agent loop

目标：理解消息、结构化输出、tool calling 和 Agent loop，不把 Agent 等同于聊天接口。

阅读：

1. [OpenAI API Quickstart](https://developers.openai.com/api/docs/quickstart)
2. [Building Effective AI Agents](https://www.anthropic.com/engineering/building-effective-agents)
3. [Hugging Face Agents Course Unit 1](https://huggingface.co/learn/agents-course/en/unit1/introduction)

实验：

1. 阅读 `src/core/minimal-agent.ts`，画出 `模型 → 工具 → 观察 → 模型` 循环。
2. 给计算器增加 `power` 操作和相应测试。
3. 写一个真实 OpenAI provider 适配 `ModelProvider` 接口。
4. 构造未知工具、非法参数、除零和无限循环四种失败。

验收：

```bash
npm test -- tests/minimal-agent.test.ts
```

完成标准：能解释为什么工具错误要作为 observation 返回给模型，以及为什么必须设置最大步数。

## 第 2 周：工具与上下文工程

目标：让工具易被模型正确选择，让上下文只包含解决当前问题所需的信息。

阅读：

1. [Effective Context Engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
2. `src/core/notes.ts`
3. `data/notes/` 中的示例知识库

实验：

1. 增加一个真实只读 API 工具，并设置 10 秒超时。
2. 给笔记搜索加入中文分词或字符 n-gram，比较改进前后的评估结果。
3. 构造空结果、损坏文件、超大文档、prompt injection 四种输入。
4. 在 `data/evals/retrieval.jsonl` 中记录失败，不凭感觉修改 prompt。

验收：

```bash
npm test -- tests/notes.test.ts
npm run eval
```

## 第 3 周：Agents SDK 双语言实践

目标：掌握 Agent、tool、handoff、guardrail、session、streaming 与 tracing，理解框架替你处理了什么。

阅读：

1. [OpenAI Agents SDK TypeScript](https://openai.github.io/openai-agents-js/)
2. [OpenAI Agents SDK Python](https://openai.github.io/openai-agents-python/)
3. `src/agent/research-agent.ts`

实验：

1. 配置 `.env.local` 后运行 `npm run agent -- "MCP 是什么？"`。
2. 检查 trace 中的模型调用、工具参数、handoff 和 token 使用。
3. 给输入增加越权请求 guardrail。
4. 用 Python 实现只有一个工具的缩小版，并记录 TS/Python 在类型、异步和调试上的差异。

验收：同一问题连续运行 5 次，记录成功率、平均延迟、工具调用次数和费用。

## 第 4 周：RAG、记忆与证据

目标：区分对话历史、长期记忆和检索；让回答有来源，无证据时拒答。

实验：

1. 将 `searchNotes` 的词法检索替换为 embedding 检索，但保留同一接口。
2. 为文档设计 chunk、metadata 和 source schema。
3. 实现“检索 → 回答 → 引用校验”；引用不存在时判定失败。
4. 比较词法检索、向量检索、混合检索在 50 条数据上的 pass rate 和延迟。

完成标准：不是“接入了向量数据库”，而是能用评估数据说明它是否更好。

## 第 5 周：LangGraph 可控工作流

目标：用显式状态图实现可暂停、恢复、测试的人机协作流程。

阅读：

1. [LangChain Academy: Introduction to LangGraph](https://academy.langchain.com/courses/intro-to-langgraph)
2. [LangGraph 文档](https://docs.langchain.com/oss/python/langgraph/overview)
3. `python/research_workflow.py`

实验：

```bash
cd python
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
pytest
```

把 deterministic 的 `retrieve_evidence` 和 `write_draft` 逐个替换成真实工具/模型节点。不要一次替换全部，否则无法定位回归。

完成标准：能展示 checkpoint、interrupt、批准/拒绝两条分支，并为每个纯函数节点写测试。

## 第 6 周：MCP 与 Web 产品

目标：把本地能力发布成可复用 MCP Server，并从前端展示 Agent 状态。

阅读：

1. [MCP 官方文档](https://modelcontextprotocol.io/docs)
2. [MCP TypeScript SDK v1](https://github.com/modelcontextprotocol/typescript-sdk/tree/v1.x)
3. `src/mcp/server.ts`、`app/`

运行：

```bash
npm run mcp
cp .env.example .env.local
npm run dev
```

实验：

1. 用 MCP Inspector 调用 `search_notes`。
2. 把 Python 工作流的检索节点改成 MCP Client。
3. Web UI 增加工具开始/结束、引用和人工批准事件。
4. 增加取消请求、网络断开、API Key 缺失和服务端超时状态。

注意：截至 2026-07-14，仓库固定使用稳定的 MCP TypeScript SDK v1；v2 尚处预发布阶段，不用于本轮生产练习。

## 第 7 周：评估、安全与可观测性

目标：把“看起来不错”变成可重复测量的成功率、延迟、费用和安全边界。

阅读：

1. [Demystifying Evals for AI Agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)
2. `src/evals/run.ts`
3. [安全与上线清单](security-and-production.md)

实验：

1. 扩充 50 条检索用例为端到端用例，加入期望引用和禁止行为。
2. 组合 exact match、规则 grader、LLM-as-judge 和 10% 人工抽检。
3. 修改一个 prompt 或工具描述，使用相同数据集做前后对比。
4. 加入 allowlist、输入校验、最大步骤、超时、预算和敏感操作审批。

不要新建依赖 OpenAI 托管 Evals 平台的方案；该平台已有退役时间表。评估数据和 runner 应保留在代码仓库。

## 第 8 周：毕业项目

交付“AI 技术研究助理”：

- TypeScript/Next.js 入口和流式反馈；
- OpenAI Agents SDK 单 Agent；
- Python LangGraph 可控工作流；
- 至少一个自建 MCP Server；
- 本地笔记检索、结构化输出、引用；
- trace、50 条以上离线评估和安全限制；
- README 中的架构、运行方法、指标、失败模式和后续计划。

建议验收门槛：

- 核心任务成功率不低于 80%；
- 所有引用能追溯到真实 source；
- 工具错误可恢复，危险操作需要批准；
- 每次运行有最大步骤、超时和预算；
- 新 prompt 在合并前必须通过同一评估集。

加餐：[Hugging Face Agents Course Final Assignment](https://huggingface.co/learn/agents-course/unit4/introduction)。

## 书籍顺序

1. 主读：Chip Huyen，《AI Engineering》。贯穿 8 周，选读 prompt、RAG、evaluation、agents、production。
2. 基础补充：Jay Alammar、Maarten Grootendorst，《Hands-On Large Language Models》。
3. Agent 专题：Anjanava Biswas、Wrick Talukdar，《Building Agentic AI Systems》。框架 API 以官方文档为准。
4. 后续生产方向：Chip Huyen，《Designing Machine Learning Systems》。

本轮不需要从零训练 LLM，也不需要先补完整高等数学。工程目标是正确使用模型、工具、状态和评估，而不是训练基础模型。
