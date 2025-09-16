# LogicAI

**Evolving LLM from Intuition to Logic - A Logic-Driven Workflow Orchestration System that Automatically Creates Agents for Complex Task Execution**

[![Stars](https://img.shields.io/github/stars/masol/logicai?style=social)](https://github.com/masol/logicai/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-0.0.1-green.svg)](https://github.com/masol/logicai/releases)


**English** | [中文](doc/README.cn.md)

**Tips: The English version is translated from the Chinese version by LLM.**

---

# Project Overview

This project aims to build an automatic task decomposition system based on logical reasoning, achieving complex task decomposition and orchestration by treating Large Language Model (LLM) calls as idempotent functions. The core of the system lies in combining the intuitive reasoning capabilities of LLMs with formal logical systems, implementing continuous iteration of task decomposition and orchestration through constructing and maintaining an ontological space.

In this framework, both inputs and outputs of LLMs are treated as structured data, and the composition of prompts follows this principle as well, no longer viewing them as semantics but as collections of logical dimensions. For example, when we refine prompts by requesting "more accessible" or "more professional" writing, these requirements are viewed by LogicAI as adding new dimensions to the input data—specifically manifested as adding entries such as "readability level" and "professional degree" to the structured data. These attribute names can be dynamically obtained through LLMs, equivalent to type elevation in logic—similar to asking "What is an apple?" -> "An apple is a fruit," then further asking "What is a fruit?" -> "A fruit is a plant product," recursively obtaining the complete classification chain: apple → fruit → plant product → biological product → matter. This structured perspective enables the system to introduce logical systems to process and optimize system workflows.

The entire system combines logic-based formal systems with neuron-based LLMs (viewed as intuition), transferring system complexity from the LLM level to the architectural level, keeping each subtask entering the LLM within a controllable complexity range, thereby improving the complexity the system can handle—treating the entire system as an input/output entity, it can be viewed as an "external augmentation model" that enhances LLM capabilities.

# Core Concept Clarification

To better understand the design philosophy of this project, we can analogize it to the knowledge system of production line design:

**Production Line Design Analogy**: Imagine an engineer needs to design a production line to manufacture a specific product. In this analogy:

- **Engineer's knowledge system** = Ontological space (similar to Prolog knowledge base)
- **Specific production line** = Workflow
- **Storage of production line blueprints** = Agent
- **Operating manual for production line workers** = Knowledge required by workflow users

The engineer possesses professional knowledge about industrial design, process optimization, equipment selection, etc., which forms a logical system capable of answering questions like "how to design an efficient production line." When the engineer applies this knowledge to design a specific production line, production line operators only need to master the operating manual without understanding the entire design knowledge system.

Similarly, imagine a Prolog program with sufficient knowledge that can autonomously "design" production lines based on logical rules. In our system:

**Design-level knowledge** (ontological space) includes:

- Logical rules for task decomposition
- Classification systems for input/output types
- Processing constraints for various data types
- Best practices for workflow design

**Execution-level knowledge** (workflow usage) includes:

- Specific execution steps
- Parameter configuration methods
- Input/output format requirements

**Difference from Chain of Thought (COT)**:

- COT method: Guides LLM linear thinking through "step by step" prompts
- Our method: First obtains initial workflow by asking "what are the best practice steps to achieve XXX deliverables" (leveraging LLM intuition), then performs type analysis on inputs/outputs of each workflow step, builds classification trees, recursively explores processing rules, forming a logical world. By querying this logical world to analyze and improve workflows, the logical world (ontological space) and workflow implementation evolve synchronously during this process.

# Problems Solved

## 1. Complexity Control Issues in LLM Applications

Current LLMs often experience performance degradation or unstable outputs when processing complex tasks due to overly long contexts or deeply nested tasks. Traditional context/prompt engineering struggles to systematically manage task complexity.

## 2. Inexplicability of AI Systems

Most LLM-based systems lack clear reasoning paths, making it difficult to trace decision processes, which becomes a critical obstacle in applications requiring high reliability.

## 3. Disconnection Between Knowledge and Reasoning

There's a lack of effective bridges between LLMs' intuitive reasoning and formal logical systems, making it difficult to combine LLM capabilities with traditional knowledge engineering methods.

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