# LogicAI

**Evolving LLM from Intuition to Logic - A Logic-Driven Workflow Orchestration System that Automatically Creates Agents for Complex Task Execution**

[![Stars](https://img.shields.io/github/stars/masol/logicai?style=social)](https://github.com/masol/logicai/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-0.0.1-green.svg)](https://github.com/masol/logicai/releases)


**English** | [中文](doc/README.cn.md)

**Tips: The English version is translated from the Chinese version by LLM.**

---

# Project Overview

This project aims to build an intelligent task decomposition system based on logical reasoning. By treating Large Language Model (LLM) calls as idempotent functions, it achieves automated decomposition of complex tasks and workflow orchestration. The core innovation of the system lies in combining the intuitive reasoning capabilities of LLMs with formal logical systems, constructing and maintaining an ontological knowledge space to enable recursive task decomposition and automatic workflow generation and optimization.

In this framework, all inputs and outputs are treated as structured data, including prompt design which follows this principle. For example, when we ask an LLM to process information in a "more accessible" or "more professional" manner, these requirements are viewed by LogicAI as adding new dimensions to the data structure - specifically manifested as adding entries like "readability level" and "professionalism degree" to the structured data. These attribute names can be dynamically obtained through LLMs, equivalent to type elevation in logic - like asking "What is an apple?" -> "An apple is a fruit", then asking "What is a fruit?" -> "A fruit is a plant product", recursively obtaining the complete classification chain: apple → fruit → plant product → biological product → matter. This structured perspective enables the system to process and optimize various seemingly ambiguous human requirements in a logical manner.

The entire system combines formal logical systems with neuron-based LLMs (viewed as intuition), transferring system complexity from the LLM level to the architectural level, keeping each sub-task entering the LLM within a controllable complexity range, thereby improving the overall system's reliability and maintainability.

# Explanation of core concepts

To better understand the design philosophy of this project, we can analogize it to the knowledge system of production line design:

**Production Line Design Analogy**: Imagine an engineer needs to design a production line to manufacture a specific product. In this analogy:

- **Engineer's knowledge system** = Ontological space (similar to Prolog knowledge base)
- **Specific production line** = Workflow
- **Storage of production line blueprints** = Agent
- **Operating manual for production line workers** = Knowledge required by workflow users

The engineer possesses professional knowledge about industrial design, process optimization, equipment selection, etc., which forms a logical system capable of answering questions like "how to design an efficient production line." When the engineer applies this knowledge to design a specific production line, production line operators only need to master the operating manual without understanding the entire design knowledge system.

Similarly, imagine a Prolog program with sufficient knowledge that can autonomously "design" production lines based on logical rules. In our system:

**Design Layer Knowledge** (Ontological Space):

Taking coffee table floral selection as an example: designers filter suitable flowers in the flower market through dimensions such as "size," "color," and "maintenance requirements." Correspondingly, we can construct prompts to enable LLMs to make selections by progressively adding constraint conditions like "size is XXX" and "color is XXX," ultimately making the LLM's decisions converge with the designer's judgment.

This example demonstrates LogicAI's core philosophy: redefining prompts from semantic expressions to structured data of dimensional combinations. These dimensions are not arbitrarily determined, but derived through logical reasoning from the real-world constraints that the delivery target (flowers) must satisfy, such as coffee table compatibility and user preferences.

The key lies in clearly separating the logic system construction task: through specially designed meta-prompts, enabling the LLM to systematically explore decision dimensions, automatically derive constraint conditions and logical rules, and ultimately construct a complete rule base.

**Execution Layer Knowledge** (Workflow Usage):

For residents, as long as the flowers can bring emotional pleasure, there is no need to master the aforementioned design layer knowledge. In other words, whether a solidified workflow (Agent) can meet requirements depends on functional implementation rather than implementation methods—regardless of whether it's manually designed or AI-generated.

However, when residents hope to achieve emotional tranquility through flowers due to insomnia, existing Agents need improvement. Such improvements rely on design layer knowledge and require Agent designers to update the system. Therefore, Agents designed with current context engineering are only suitable for relatively stable application scenarios, and struggle to meet dynamic demands in real-world domains with frequent changes, such as novel writing and programming development.

Further reflection reveals that in the real world, if flowers are merely one component in a resident's product offering to their users, the resident themselves becomes a designer and can adopt the same approach. This creates nested calling relationships between workflows—though the current version does not yet support this feature.

**Difference from Chain of Thought (COT)**:

- COT method: Guides LLM linear thinking through "step by step" prompts
- Our method: First obtains initial workflow by asking "what are the best practice steps to achieve XXX deliverables" (leveraging LLM intuition), then performs type analysis on inputs/outputs of each workflow step, builds classification trees, recursively explores processing rules, forming a logical world. By querying this logical world to analyze and improve workflows, the logical world (ontological space) and workflow implementation evolve synchronously during this process.

**Differences from Reasoning + Acting (ReAct)**:

- ReAct Method: The ReAct method adopts an AI problem-solving pattern of Reasoning + Acting + Observation, but its reasoning component relies on manual design and lacks a systematic design methodology.
- This Method: This method focuses on optimizing the reasoning component by replacing manual design with algorithmic approaches, achieving automated construction of the reasoning process.

**Difference from Plan-and-Execute**:

- Plan-and-Execute is a classic pattern in the LangChain framework that decomposes complex tasks into two separate stages: planning and execution. This approach faces a fundamental contradiction between abstraction levels and execution precision—high-level planning may lose critical context, while detailed planning may sacrifice system flexibility. Current practices with automated development tools like claude-code and Cursor demonstrate this challenge: even when focusing the abstraction level on software development domains, issues such as inconsistent code architecture and module interface conflicts still arise due to context loss.
- This method adopts a different design philosophy: modeling LLM calls as idempotent functions and maintaining dimensional relationships between inputs and outputs through a logical system. In theory, this can ensure system flexibility while preserving context integrity, potentially avoiding the disconnect between abstraction and execution. This makes ultra-large-scale tasks such as complete novel creation and large-scale software development possible—refer to the long-term vision below for more possibilities.

# Problems to Solve

## 1. Complexity Control Issues in LLM Applications

Existing LLMs suffer from decreased accuracy and logical confusion in complex tasks, while optimization methods such as prompt engineering remain constrained by the boundaries of model capabilities.

## 2. Lack of Interpretability in AI Systems

Most LLM-based systems lack clear reasoning paths, making it difficult to trace decision-making processes, which becomes a critical obstacle in applications requiring high reliability.

## 3. The Disconnect Between Logic and Intuition

There is a lack of effective bridge between LLM's intuitive reasoning and expert systems' formal logical reasoning. Intuitive reasoning excels at pattern recognition, while logical reasoning ensures rigor, but the two are difficult to integrate, limiting AI applications in complex scenarios.

# Solution

## 1. Idempotent Function-based LLM Calls

Encapsulate each LLM call as an idempotent function, ensuring the same input always produces the same output, making system behavior predictable and reproducible. This design makes LLM calls similar to pure functions in traditional programming, facilitating composition and testing.

## 2. Construction and Maintenance of Ontological Space

The system maintains a logical space similar to a Prolog knowledge base, containing core knowledge needed for workflow design:

- **Knowledge trees (classification trees)**: Categorize all inputs and outputs into classification trees, forming hierarchical type systems
- **Logical rule repository**: Processing rules, constraints, and transformation patterns for each data type
- **Inference engine**: Capable of deriving new workflow design solutions based on existing rules
- **Knowledge update mechanism**: Extract new rules and patterns from workflow execution results

## 3. Recursive Task Decomposition and Logic Construction

Achieve evolution from intuition to logic through the following steps:

1. **Initial intuition acquisition**: Query LLMs for best practices, obtaining initial workflows
2. **Type analysis**: Analyze inputs/outputs of each step, building type classification trees
3. **Rule extraction**: Recursively explore processing patterns for various types, forming logical rules
4. **Logical querying**: Analyze workflow rationality by querying the logical world
5. **Synchronous optimization**: Simultaneously improve workflows and logical rules based on analysis results

## 4. Workflow Persistence and Agent Generation

Persist validated workflows as Agents, with each Agent focusing on solving specific types of problems. Users don't need to understand underlying design logic, only need to master Agent usage methods.

# Technical Goals

1. **Logical queryability**: Build a Prolog-like knowledge base capable of analyzing and optimizing workflows through logical queries
    
2. **Dual-system collaboration**: Separate design knowledge from execution knowledge while promoting mutual enhancement, achieving hierarchical knowledge management
    
3. **Self-evolution capability**: Ontological space and workflows continuously learn and optimize during execution
    
4. **Knowledge reusability**: Abstract logical rules can guide the design of multiple similar workflows
    

# Long-term Vision: Self-Evolving LogicAI

**Core Insight**: Under our design framework, everything is a function, everything is a workflow. Goal determination itself, workflow design processes, system optimization decisions, etc., can all be modeled as functions, therefore can all be included in the continuous iterative improvement scope of this method.

**Self-bootstrapping Foundation Environment**: The initial system we provide is equivalent to a fixed point with self-updating capabilities - similar to the stable state described by the Banach fixed-point theorem in mathematics. The system can improve its own reasoning capabilities by applying its own logical reasoning capabilities on this foundation. This recursive self-improvement mechanism enables LogicAI to achieve unlimited growth potential with limited initial investment.

**Meta-level Workflows**: The system can not only decompose user tasks but also decompose the meta-task of "how to better decompose tasks," thereby achieving reflection and improvement of its own capabilities. The logical rules in the ontological space will also include meta-cognitive rules about knowledge acquisition, rule optimization, reasoning improvement, etc.

**Boundless Growth**: Through this design, LogicAI can theoretically break through the cognitive boundaries of initial designers, discover better problem-solving patterns in practice, and encode these discoveries as new logical rules, forming true autonomous evolution of artificial intelligence.

**Current Stage Focus**: Despite such ambitious long-term goals, limited by energy and practical constraints, the current version will focus on automatic decomposition of complex tasks and generation of practical Agents. I believe that even this relatively limited goal will lay the foundation for building more powerful self-evolving AI systems.

Through this approach, our goal is to achieve the transformation from LLM intuition to formal logic, constructing an intelligent system that can think and design like human engineers, while reserving possibilities for future autonomous evolution.