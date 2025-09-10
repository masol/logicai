# LogicAI

LogicAI is a system designed around a central "Commander" component that processes user commands by invoking and coordinating AI workflows.

### Core Concepts

1.  **Persistent Workflows**
    Workflows are defined processes that are persisted after execution. They can be recalled and reused for subsequent, similar tasks. This design allows workflows to be versioned and iterated upon over time.

2.  **LLM Calls as Idempotent Functions**
    Large Language Model (LLM) interactions are treated as idempotent function calls. Both inputs (prompts) and outputs are structured data. This approach is used to promote predictable behavior and stability, which is necessary for creating reliable, persistent workflows.

3.  **Task Decomposition**
    For complex commands, the Commander decomposes the main task into a series of smaller sub-tasks. It then matches each sub-task with an appropriate persistent workflow for execution.

These concepts collectively form the `Logic AI` methodology.