# LogicAI <!-- omit in toc -->

**Evolving LLM from Intuition to Logic - A Logic-Driven Workflow Orchestration System that Automatically Creates Agents for Complex Task**

[![Stars](https://img.shields.io/github/stars/masol/logicai?style=social)](https://github.com/masol/logicai/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-0.0.1-green.svg)](https://github.com/masol/logicai/releases)


**English** | [中文](doc/README.cn.md)

**Tips: The English version is translated from the [Chinese version](doc/README.cn.md) by LLM.**



<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
## Table of Contents <!-- omit in toc -->

- [Project Overview](#project-overview)
- [Explanation of concepts](#explanation-of-concepts)
  - [Production Line Design Analogy:](#production-line-design-analogy)
    - [Design Layer Knowledge (Ontological Space):](#design-layer-knowledge-ontological-space)
    - [Execution Layer Knowledge (Workflow Usage):](#execution-layer-knowledge-workflow-usage)
  - [Difference from Chain of Thought (COT):](#difference-from-chain-of-thought-cot)
  - [Differences from Reasoning + Acting (ReAct):](#differences-from-reasoning--acting-react)
  - [Difference from Plan-and-Execute:](#difference-from-plan-and-execute)
  - [Differences from RAG:](#differences-from-rag)
- [Problems to Solve](#problems-to-solve)
  - [1. Complexity Control Issues in LLM Applications](#1-complexity-control-issues-in-llm-applications)
  - [2. Lack of Interpretability in AI Systems](#2-lack-of-interpretability-in-ai-systems)
  - [3. The Disconnect Between Logic and Intuition](#3-the-disconnect-between-logic-and-intuition)
- [System Overview](#system-overview)
  - [Core Technical Solutions](#core-technical-solutions)
    - [1. Idempotent Function-based LLM Calls](#1-idempotent-function-based-llm-calls)
    - [2. Ontology Space Construction and Maintenance](#2-ontology-space-construction-and-maintenance)
    - [3. Recursive Task Decomposition and Logic Construction](#3-recursive-task-decomposition-and-logic-construction)
    - [4. Workflow Persistence and Agent Generation](#4-workflow-persistence-and-agent-generation)
  - [System Architecture](#system-architecture)
    - [Global Components](#global-components)
    - [Task-Specific Variables](#task-specific-variables)
  - [Sequence Description](#sequence-description)
- [Long-term Vision: Self-Evolving LogicAI](#long-term-vision-self-evolving-logicai)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

---

# Project Overview

This project aims to build an intelligent task decomposition system based on logical reasoning. By treating Large Language Model (LLM) calls as idempotent functions, it achieves automated decomposition of complex tasks and workflow orchestration. The core innovation of the system lies in combining the intuitive reasoning capabilities of LLMs with formal logical systems, constructing and maintaining an ontological knowledge space to enable recursive task decomposition and automatic workflow generation and optimization.

In this framework, all inputs and outputs are treated as structured data, including prompt design which follows this principle. For example, when we ask an LLM to process information in a "more accessible" or "more professional" manner, these requirements are viewed by LogicAI as adding new dimensions to the data structure - specifically manifested as adding entries like "readability level" and "professionalism degree" to the structured data. These attribute names can be dynamically obtained through LLMs, equivalent to type elevation in logic - like asking "What is an apple?" -> "An apple is a fruit", then asking "What is a fruit?" -> "A fruit is a plant product", recursively obtaining the complete classification chain: apple → fruit → plant product → biological product → matter. This structured perspective enables the system to process and optimize various seemingly ambiguous human requirements in a logical manner.

The entire system combines formal logical systems with neuron-based LLMs (viewed as intuition), transferring system complexity from the LLM level to the architectural level, keeping each sub-task entering the LLM within a controllable complexity range, thereby improving the overall system's reliability and maintainability.

# Explanation of concepts

To better understand the design philosophy of this project, we can analogize it to the knowledge system of production line design:

## Production Line Design Analogy:

Imagine an engineer needs to design a production line to manufacture a specific product. In this analogy:

- **Engineer's knowledge system** = Ontological space (similar to Prolog knowledge base)
- **Specific production line** = Workflow
- **Storage of production line blueprints** = Agent
- **Operating manual for production line workers** = Knowledge required by workflow users

The engineer possesses professional knowledge about industrial design, process optimization, equipment selection, etc., which forms a logical system capable of answering questions like "how to design an efficient production line." When the engineer applies this knowledge to design a specific production line, production line operators only need to master the operating manual without understanding the entire design knowledge system.

Similarly, imagine a Prolog program with sufficient knowledge that can autonomously "design" production lines based on logical rules. In our system:

### Design Layer Knowledge (Ontological Space):

Taking coffee table floral selection as an example: designers filter suitable flowers in the flower market through dimensions such as "size," "color," and "maintenance requirements." Correspondingly, we can construct prompts to enable LLMs to make selections by progressively adding constraint conditions like "size is XXX" and "color is XXX," ultimately making the LLM's decisions converge with the designer's judgment.

This example demonstrates LogicAI's core philosophy: redefining prompts from semantic expressions to structured data of dimensional combinations. These dimensions are not arbitrarily determined, but derived through logical reasoning from the real-world constraints that the delivery target (flowers) must satisfy, such as coffee table compatibility and user preferences.

The key lies in clearly separating the logic system construction task: through specially designed meta-prompts, enabling the LLM to systematically explore decision dimensions, automatically derive constraint conditions and logical rules, and ultimately construct a complete rule base.

### Execution Layer Knowledge (Workflow Usage):

For residents, as long as the flowers can bring emotional pleasure, there is no need to master the aforementioned design layer knowledge. In other words, whether a solidified workflow (Agent) can meet requirements depends on functional implementation rather than implementation methods—regardless of whether it's manually designed or AI-generated.

However, when residents hope to achieve emotional tranquility through flowers due to insomnia, existing Agents need improvement. Such improvements rely on design layer knowledge and require Agent designers to update the system. Therefore, Agents designed with current context engineering are only suitable for relatively stable application scenarios, and struggle to meet dynamic demands in real-world domains with frequent changes, such as novel writing and programming development.

Further reflection reveals that in the real world, if flowers are merely one component in a resident's product offering to their users, the resident themselves becomes a designer and can adopt the same approach. This creates nested calling relationships between workflows—though the current version does not yet support this feature.

## Difference from Chain of Thought (COT):

- COT method: Guides LLM linear thinking through "step by step" prompts
- Our method: First obtains initial workflow by asking "what are the best practice steps to achieve XXX deliverables" (leveraging LLM intuition), then performs type analysis on inputs/outputs of each workflow step, builds classification trees, recursively explores processing rules, forming a logical world. By querying this logical world to analyze and improve workflows, the logical world (ontological space) and workflow implementation evolve synchronously during this process.

## Differences from Reasoning + Acting (ReAct):

- ReAct Method: The ReAct method adopts an AI problem-solving pattern of Reasoning + Acting + Observation, but its reasoning component relies on manual design and lacks a systematic design methodology.
- This Method: This method focuses on optimizing the reasoning component by replacing manual design with algorithmic approaches, achieving automated construction of the reasoning process.

## Difference from Plan-and-Execute:

- Plan-and-Execute is a classic pattern in the LangChain framework that decomposes complex tasks into two separate stages: planning and execution. This approach faces a fundamental contradiction between abstraction levels and execution precision—high-level planning may lose critical context, while detailed planning may sacrifice system flexibility. Current practices with automated development tools like claude-code and Cursor demonstrate this challenge: even when focusing the abstraction level on software development domains, issues such as inconsistent code architecture and module interface conflicts still arise due to context loss.
- This method adopts a different design philosophy: modeling LLM calls as idempotent functions and maintaining dimensional relationships between inputs and outputs through a logical system. In theory, this can ensure system flexibility while preserving context integrity, potentially avoiding the disconnect between abstraction and execution. This makes ultra-large-scale tasks such as complete novel creation and large-scale software development possible—refer to the long-term vision below for more possibilities.

## Differences from RAG:

- RAG is a technical architecture that enhances generation through vector retrieval of external documents, relying on semantic similarity matching. It faces a contradiction between retrieval precision and semantic understanding—vector retrieval may return semantically related but practically useless content, while keyword retrieval may miss semantically relevant information. Current enterprise applications of RAG in knowledge Q&A and document analysis demonstrate this challenge: even with advanced vector databases, issues persist such as inaccurate retrieval due to semantic drift and context understanding biases.
- This method adopts a different design approach: documents are preprocessed into structured dimensional data stored in relational databases. Through prompts, the system first identifies the information dimensions required for a question (this problem is similar to the logical escalation mentioned above—which can be completed by humans or AI), then constructs precise SQL query statements based on these dimensions. Theoretically, this can maintain retrieval precision while ensuring information completeness, potentially avoiding the ambiguity issues of semantic retrieval and making precise retrieval tasks such as complex conditional queries and multi-dimensional information matching possible. When dimensional decomposition is sufficiently detailed, it may even be possible to completely replace vector retrieval with relational queries, achieving higher-quality information matching. This method can be used as an independent document retrieval technology, with the core difference lying in how the dimensional system is maintained: it can be manually defined by domain experts or automatically learned and optimized through AI systems.

# Problems to Solve

## 1. Complexity Control Issues in LLM Applications

Existing LLMs suffer from decreased accuracy and logical confusion in complex tasks, while optimization methods such as prompt engineering remain constrained by the boundaries of model capabilities.

## 2. Lack of Interpretability in AI Systems

Most LLM-based systems lack clear reasoning paths, making it difficult to trace decision-making processes, which becomes a critical obstacle in applications requiring high reliability.

## 3. The Disconnect Between Logic and Intuition

There is a lack of effective bridge between LLM's intuitive reasoning and expert systems' formal logical reasoning. Intuitive reasoning excels at pattern recognition, while logical reasoning ensures rigor, but the two are difficult to integrate, limiting AI applications in complex scenarios.


# System Overview

The current version assumes delegating LogicAI to execute large-scale tasks, such as writing long novels or developing projects. All user interactions are fixed within a single task, with the goal of completing specified deliverables.

## Core Technical Solutions

### 1. Idempotent Function-based LLM Calls

Each LLM call is encapsulated as an idempotent function, ensuring that identical inputs always produce identical outputs, making system behavior predictable and reproducible. This design makes LLM calls similar to pure functions in traditional programming, facilitating composition and testing.

### 2. Ontology Space Construction and Maintenance

The system maintains a logical space similar to a Prolog knowledge base, containing core knowledge required for designing workflows:

- **Knowledge Tree (Classification Tree)**: All inputs and outputs are categorized into a classification tree, forming a hierarchical type system
- **Logical Rule Base**: Processing rules, constraint conditions, and transformation patterns for each type of data
- **Inference Engine**: Capable of deriving new workflow design solutions based on existing rules
- **Knowledge Update Mechanism**: Extracts new rules and patterns from workflow execution results

### 3. Recursive Task Decomposition and Logic Construction

Achieves evolution from intuition to logic through the following steps:

1. **Initial Intuition Acquisition**: Query LLM for best practices to obtain initial workflow
2. **Type Analysis**: Analyze input and output of each step to construct type classification tree
3. **Rule Extraction**: Recursively explore processing patterns of various types to form logical rules
4. **Logical Query**: Analyze workflow rationality by querying the logical world
5. **Synchronous Optimization**: Simultaneously improve workflow and logical rules based on analysis results

### 4. Workflow Persistence and Agent Generation

Persist validated workflows as Agents, with each Agent focusing on solving specific types of problems. Users need not understand the underlying design logic and only need to master Agent usage methods.

## System Architecture

### Global Components

LogicAI maintains the following global components across all tasks and interactions:

1. **Ontology Store (RDF Format)**: A shared RDF-format ontology Store for all tasks, storing concepts, class hierarchies, concept-level constraints, techniques, and processing procedures generated during runtime.

2. **Built-in Finite State Machines (FSM)**:
    - **Planning FSM**: Analyzes and decomposes deliverables, creates and initiates sub-FSMs.
    - **Coreference Resolution FSM**: Maintains synonyms and logical metaphors in RDF. Associates identical entities through **Equivalence Checking** and **Instance Checking** using DL reasoners.
3. **Reasoning Enhancement**: Utilizes DL reasoners such as Apache Jena to perform **Consistency Checking** and **Concept Satisfiability** verification to determine the input-output sets of Actions (functions) in FSMs. Implements custom OWL-based constraint mechanisms through SWI-Prolog's semweb library, constructing specialized constraint rules for adjectives and adverbs in the ontology, and validates and modifies FSM state transitions and their corresponding inputs and outputs based on these constraints.

### Task-Specific Variables

Each task initializes the following variables:

1. **Deliverable Knowledge Graph**: RDF-format knowledge graph storing knowledge describing deliverable requirements, constraints, and specifications, stored in this task's Named Graph.
2. **Task FSM**: Nested FSM responsible for specific task execution, created by built-in FSM and executed at appropriate times.

## Sequence Description

LogicAI's operational flow is illustrated through the following sequence description, showing the interactions from user input to task execution (the current version will postpone implementation of enhanced reasoning, so the accuracy of the ontology space relies on LLM; enhanced reasoning support will be added after achieving initial goals):

1. Receive user input statements, which may contain deliverable requirements or process descriptions.
2. Coreference Resolution FSM queries the ontology space (RDF), parses synonyms and logical metaphors, and re-expresses input to eliminate ambiguity.
3. Planning FSM executes the following operations:
    - Convert input to RDF, update deliverable knowledge graph, including requirements, constraints, and specifications for deliverables or sub-deliverables (imaginable as schema-less objects). If input involves processing procedures (such as sub-FSM steps or flows), handle them here and adjust corresponding sub-FSMs.
    - Plan deliverable creation process based on deliverable knowledge graph, generate or update task FSM.
    - Establish connections between deliverable knowledge graph and ontology space; if none exist, create new ones, including recursively querying LLM to construct related rules—with emphasis on completeness rules.
    - Traverse FSM states in reverse order; for each state with actions in the FSM, query its completeness rules through SPARQL and check completeness between inputs and outputs—if incomplete, add inputs and recursively use Planning FSM to update FSM.
    - For each state's output, recursively execute this Planning FSM to ensure the action's complexity is sufficiently low—through recursive decomposition.
    - Add fault tolerance and progress reporting to task FSM.
4. Execute task FSM—this may be a long-cycle action, using FSM persistence to pause/resume tasks.
5. Return task progress or deliverable output to the user.

# Long-term Vision: Self-Evolving LogicAI

**Core Insight**: Under our design framework, everything is a function, everything is a workflow. Goal determination itself, workflow design processes, system optimization decisions, etc., can all be modeled as functions, therefore can all be included in the continuous iterative improvement scope of this method.

**Self-bootstrapping Foundation Environment**: The initial system we provide is equivalent to a fixed point with self-updating capabilities - similar to the stable state described by the Banach fixed-point theorem in mathematics. The system can improve its own reasoning capabilities by applying its own logical reasoning capabilities on this foundation. This recursive self-improvement mechanism enables LogicAI to achieve unlimited growth potential with limited initial investment.

**Meta-level Workflows**: The system can not only decompose user tasks but also decompose the meta-task of "how to better decompose tasks," thereby achieving reflection and improvement of its own capabilities. The logical rules in the ontological space will also include meta-cognitive rules about knowledge acquisition, rule optimization, reasoning improvement, etc.

**Boundless Growth**: Through this design, LogicAI can theoretically break through the cognitive boundaries of initial designers, discover better problem-solving patterns in practice, and encode these discoveries as new logical rules, forming true autonomous evolution of artificial intelligence.

**Current Stage Focus**: Despite such ambitious long-term goals, limited by energy and practical constraints, the current version will focus on automatic decomposition of complex tasks and generation of practical Agents. I believe that even this relatively limited goal will lay the foundation for building more powerful self-evolving AI systems.

Through this approach, our goal is to achieve the transformation from LLM intuition to formal logic, constructing an intelligent system that can think and design like human engineers, while reserving possibilities for future autonomous evolution.