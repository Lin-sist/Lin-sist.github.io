---
title: Flashback-Agent编排2
date: 2026-11-02T22:05:04+08:00
tags: []
description: ""
---
## 关于常见的Agent框架

### Langchain

在经典 LangChain 中，核心编排器是 `AgentExecutor`，其伪代码机制如下：
``` python
# LangChain AgentExecutor 核心运行机制伪代码
while not should_stop():
    # 1. 组装历史 messages + tools 声明，请求 LLM
    response = llm.invoke(messages, tools=tools)
    
    # 2. 如果模型决定结束（返回纯文本），跳出循环
    if response.is_finish:
        return response.content
        
    # 3. 如果模型要求调用工具（tool_calls）
    for tool_call in response.tool_calls:
        tool = tool_registry.get(tool_call.name)
        # 4. 框架内部【自动反射执行】本地 Python/Java 方法
        observation = tool.invoke(tool_call.args)
        
        # 5. 将执行结果作为 role: "tool" 重新追加到 messages
        messages.append(ToolMessage(content=observation, tool_call_id=tool_call.id))
        
    # 6. 回到循环顶部，让 LLM 看到 observation 继续思考，直到它决定终止
```
- **核心假设**：**“模型驱动（Model-driven）”**。执行哪个工具、调用几次工具、何时终止，全部由大模型自主决定。
- **缺点**：它是一个**同步阻塞的长链调用**。如果模型反复调用 3 次工具，单次客户端请求在服务端就要连续打 4 次 LLM + 3 次工具执行。

### LangGraph

LangChain 团队后来意识到 `AgentExecutor` 太黑盒，退役了它并推出了 **LangGraph**：

- **机制**：通过 `StateGraph` 构建有向图，图上有 `AgentNode`（调大模型）和 `ToolNode`（执行工具），通过条件边 `tools_condition` 进行状态分流。
- **人在回路（Human-in-the-loop, HITL）**：它提供了 `interrupt_before=["tools"]` 机制，配合 `Checkpointer`（如持久化到 Postgres），当大模型发出 `tool_calls` 时，图的执行会被挂起（暂停），将状态序列化保存；外部用户审核通过后，发入 `Command(resume=...)`，图从断点恢复执行。
- **问题**：虽然支持了确认，但它要求依赖庞大的图引擎、状态快照序列化器和分布式 Checkpointer 基础设施，对一个追求高内聚、轻量嵌入已有 Spring Boot 事务的微信小程序后端而言，**概念膨胀且侵入性极强**。

### SpringAI

在 Java 生态的 Spring AI 中：

- 它通过 `@Tool` 注解或 `FunctionCallback` 将 Spring Bean 暴露为工具。
- 底层在 `OpenAiChatClient` 中默认开启了 `internalToolExecutionEnabled = true`：当 Provider 返回 `tool_calls` 时，Spring AI 内部会递归调用 Bean 方法，并立刻发起下一次 HTTP 请求回灌给 Provider，直到模型返回最终内容。
- **问题**：这种**后台自动多轮递归**完全剥夺了“二段式拦截”的空间。要想在 Spring AI 里强行实现“只提议、不执行、等用户稍后确认”，你必须关掉它的整个自动化机制，自己手动拆解 `ChatResponse`——这等于把它最有价值的封装全废弃了，只剩下极薄的 DTO 映射。

### 框架对比

|维度|LangChain / Spring AI 的通用假设|Flashback 的现实约束与技术选择|阻抗失配原因（Why Custom Loop）|
|---|---|---|---|
|**人机控制权**|**模型驱动**：模型决定何时调用、调用几次，框架代为自动执行。|**用户绝对驱动**：AI 不得替用户做决定，写日记是严肃私密资产。|框架机制是让 AI 执行；我们物理上**不允许模型拥有直接写库的代码路径**。|
|**时延与超时**|**单次 HTTP 内多跳循环**（LLM →\rightarrow→ Tool →\rightarrow→ LLM...）。|**微信小程序 30s 硬超时**，后端 24s 阶梯超时，单次模型均值 6.5s。|框架的多跳循环必然击穿前端 30s 超时；自研 Loop 保证**单次请求恒定只有 1 次模型调用**。|
|**状态机与追问**|靠 Prompt 提示大模型进行自主阶段流转与语义判断。|纯 Java 确定性状态机（`AgentStageMachine`），回避检测、0/1 提问硬上限。|框架依靠 Prompt 容易导致越界逼问且不可测；自研状态机实现 **100% 离线单测覆盖**。|
|**高敏隐私保护**|框架将工具出入参全量明文写入 Memory/持久化。|日记正文是高敏隐私，审计表长期**仅存脱敏哈希摘要**，参数用完即清。|框架缺乏细粒度隐私边界；自研设计了 **`pending_args` 瞬态缓冲列**（确认后原子置 NULL）。|
|**架构契约纯粹性**|引入庞大依赖包（数十个 Jar 包），黑盒度高，配置繁琐。|遵守项目既有依赖边界，轻量原生实现，与 Spring Boot 事务天然集成。|无需引入外部未经验证的大型依赖，底层协议与未来 MCP/Spring AI 保持同构。|

## 什么是Function Calling

Function Calling 是大模型与外部工具交互的机制。模型根据工具定义和用户意图，生成包含工具名称及结构化参数的调用请求，交由外部执行环境解析和执行。执行结果可以返回模型，使模型继续决策或生成最终回答。

### 1. 后端先向模型注册工具

例如定义一个工具：

```json
{
  "type": "function",
  "name": "get_weather",
  "description": "查询指定城市的天气",
  "parameters": {
    "type": "object",
    "properties": {
      "city": {
        "type": "string"
      }
    },
    "required": ["city"]
  }
}
```

模型通过这份定义知道：

- 存在一个名为 `get_weather` 的工具。
    
- 它可以用来查询天气。
    
- 调用时需要提供 `city` 参数。
    

### 2. 模型生成 Function Call

例如，OpenAI Responses API 中的调用请求可以表示为：

```json
{
  "type": "function_call",
  "call_id": "call_123",
  "name": "get_weather",
  "arguments": "{\"city\":\"北京\"}"
}
```

这里有两个核心字段：

- `name`：告诉执行环境调用哪个函数。
    
- `arguments`：告诉执行环境调用该函数时传入哪些参数。
    

`call_id` 用于关联这次调用及后续结果。

这一步就是你所理解的“大模型向后端发送结构化数据”。

严格来说，工具调用请求是模型通过 API 返回的结构化输出，由后端从模型响应中读取。

### 3. 后端执行函数

后端收到这个调用请求后，可以执行类似的 Python 代码：

```python
import jsonargs = json.loads(tool_call.arguments)result = get_weather(city=args["city"])
```

假设得到：

```json
{
  "city": "北京",
  "temperature": 18,
  "condition": "晴"
}
```

后端将工具执行结果关联 `call_id` 发送回模型，模型再组织自然语言回答。

## 什么是ReAct

ReAct 全称为 Reasoning + Acting（推理与行动），是一种专为大型语言模型（LLM）设计的范式，其核心是让模型以**交错（interleaved）** 的方式，交替生成**言语推理轨迹（reasoning traces）** 和**具体行动（actions）**，从而协同完成复杂任务。

**循环**：Thought（思考） -> Action（行动） -> Observation（观察）

1. **思考 (Thought)**：模型生成内部推理过程，用于分析任务、分解目标、制定或调整行动计划。这一步不影响外部环境，是模型的“内心独白”。
    
2. **行动 (Action)**：基于思考结果，模型调用一个外部工具（如搜索引擎、API、计算器）执行具体操作。
    
3. **观察 (Observation)**：外部工具执行行动后返回的结果（如搜索结果、API响应、错误信息），为下一轮思考提供真实的客观反馈。

**模型可以利用上一次工具执行的结果，决定下一次使用什么工具、传入什么参数。**

## 什么是Agent Loop

Agent Loop 是 Agent 运行时持续调用模型、执行工具、回传结果，并判断是否继续执行的控制循环。

简单区分：

- ReAct：描述模型如何在推理、行动和观察之间交替推进任务。
    
- Agent Loop：描述应用程序如何把模型调用、工具执行和状态更新组织成可持续运行的循环。

### 最简 Agent Loop 是怎么写出来的？

```python
MAX_STEPS = 5

messages = [
    {"role": "user", "content": "公司住宿报销上限是多少？"}
]

for step in range(MAX_STEPS):

    # 1. 请求模型判断下一步
    response = llm.chat(
        messages=messages,
        tools=tool_definitions
    )

    # 2. 保留模型响应（包括工具调用）
    messages.append(response.message)

    # 3. 没有工具调用，任务结束
    if not response.tool_calls:
        print(response.content)
        break

    # 4. 执行模型请求的工具
    for call in response.tool_calls:

        args = validate_arguments(call)

        result = execute_tool(
            name=call.name,
            arguments=args
        )

        # 5. 将结果追加到对话上下文
        messages.append({
            "role": "tool",
            "tool_call_id": call.id,
            "content": serialize(result)
        })

else:
    print("已达到最大执行步数")
```

Agent Loop 最重要的逻辑：

1. 模型决定是否调用工具。
    
2. 程序检查是否产生工具调用请求。
    
3. 程序验证参数、执行工具。
    
4. 工具结果加入消息上下文。
    
5. 循环调用模型，直到结束或触发终止条件。

## 总结

> [!NOTE] 三个概念的关系
> Function Calling 提供模型调用外部工具的能力。ReAct 在此基础上提供了一种交替推理、行动和观察的任务处理范式。Agent Loop 则由运行时负责持续调用模型、执行工具、回传结果和维护状态，同时处理终止条件、异常以及执行限制。

## Workflow 和 Agent 的根本区别

Workflow 由开发者主导执行路径，Agent 由模型动态决定执行路径。

eg:
用户问题->问题预处理->混合检索（BM25 + 向量）->Rerank 重排->LLM 生成回答

```python
def rag_workflow(query):
    documents = hybrid_search(query)
    ranked_docs = rerank(query, documents)
    answer = llm.generate(query, ranked_docs)
    return answer
```

这就是一个简单的工作流，由用户定义执行步骤。

如果是Agent，那工具顺序和执行次数可能随任务改变，则是由模型动态决定的。

### 对比总结

| 维度    | Workflow | Agent（例如 ReAct Agent） |
| ----- | -------- | --------------------- |
| 执行路径  | 开发者预设    | 模型动态决定                |
| 灵活性   | 有限且可控    | 较高                    |
| 可预测性  | 通常较高     | 相对较低                  |
| 成本与延迟 | 较容易控制    | 可能产生额外调用              |
| 错误定位  | 通常较容易    | 需要分析完整执行轨迹            |
| 典型场景  | 常规知识库问答  | 多文档分析、复杂任务探索          |