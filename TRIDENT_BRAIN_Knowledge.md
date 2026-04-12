# TRIDENT BRAIN - 快速参考知识

**_compaction 后注入以获取 Trident Brain 上下文_

---

## 什么是 Trident Brain？

多模式推理架构，使用机械门强制执行。每个模式都是专门的推理过程，具有：
- 3+ 层深化推理
- 结构性要求（非字符计数）
- 为注入其他 agent 设计的产物输出
- 深度细化的迭代循环

**父级：** Manta Agent（共享机械门架构）

---

## 模式清单

| 模式 | 目的 | 状态 |
|------|------|------|
| Deep Planning Mode | 项目规划 | ✅ 已实施 |
| Problem Solving Mode | 调试/根因分析 | 🔄 已重构 |
| Architecture Review Mode | 代码库分析 | 🔜 未来 |
| Test Generation Mode | 测试规范 | 🔜 未来 |
| Code Review Mode | 代码分析 | 🔜 未来 |

---

## Problem Solving Mode 层级（已重构）

基于 GOLD STANDARD 文档反向工程：

| 层级 | 思考 | 要求 |
|------|------|------|
| **层级 1** | "我假设什么？" | 明确假设、推理链、成功标准 |
| **层级 2** | "我将采取什么行动？" | 精确命令、预期输出、环境状态 |
| **层级 3** | "实际发生了什么？" | 原始证据、日志检查、预期vs实际对比 |
| **层级 4** | "差距告诉我什么？" | 差距分析、更新假设、下一步行动 |
| **层级 5** | "我应该怎么做不同？" | 模式提取、系统性问题识别 |
| **层级 6** | "我如何确认修复有效？" | 目标环境执行、行为匹配、无回归 |

---

## 关键设计原则

1. **结构强制** - 必须解决所需思考点
2. **可注入输出** - 产物为其他 agent 设计
3. **通过迭代深化** - V1.0 → V1.1 → V1.2 深化每层
4. **受限执行** - 仅 `write` 用于输出，完全 `read` 访问用于综合

---

## GOLD STANDARD 参考文档来源

- **AGENT_BUILD_LOGIC_CHAIN.md** - Mattermost 集成，展示迭代调试模式（假设→行动→观察→调整→元反思）
- **SHARK_AGENT_1ST_BUILD_REPORT.md** - Space Invaders，6 阶段认知管道
- **SPACE_INVADERS_BUILD_LOG.md** - 13 agent 并行执行，战略分解

---

## 完整文档位置

```
Trident Brain/
├── Deep Planning Mode/
│   ├── ARCHITECTURE/TRIDENT_BRAIN.md
│   ├── SPEC/TRIDENT_SPEC.md
│   └── TEMPLATES/*.md
├── PROBLEM_SOLVING_MODE_DESIGN.md（已重构）
└── COMPACTION_SURVIVAL.md（存活指南）
```

---

## 反向工程的核心洞察

成功的问题解决不是"尝试 X"，而是每个步骤都有**证据**支撑下一个决定。迭代模式：

```
假设 → 行动 → 观察 → 对比 → 调整 → 元反思
```

每次失败都提供信息给下一次尝试。