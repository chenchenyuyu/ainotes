# MCP 学习笔记

Model Context Protocol（MCP）用于连接 AI 应用和外部工具或数据。Host 管理模型与用户体验，Client 连接一个 Server，Server 暴露 tools、resources 和 prompts。

Function calling 是模型供应商 API 内的一种工具调用能力；MCP 是应用与工具服务之间的开放协议。二者可以组合：Agent 通过 function calling 决定使用哪个 MCP 工具。

练习时先使用 stdio 连接本地服务，再学习 Streamable HTTP、认证和远程部署。任何来自 MCP Server 的内容都应视为不可信输入。
