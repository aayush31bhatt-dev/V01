# NVIDIA and Nebius Integration in V01

## 1. Overview

V01 is an AI-native development environment built around agentic software engineering. It combines model-driven reasoning with repository understanding, intelligent context management, tool execution, code editing, and verification to create a more capable development workflow.

V01 integrates NVIDIA Nemotron models through Nebius Token Factory, using Nebius's OpenAI-compatible inference API to power AI-agent workflows. This integration connects open NVIDIA models to V01's existing orchestration architecture without requiring the application to manage model-serving infrastructure.

## 2. NVIDIA Nemotron Integration

NVIDIA Nemotron provides the model capabilities used by V01's agent runtime for reasoning and software-engineering tasks.

Within V01, the selected model supports applicable agent workflows, including:

- Understanding developer instructions and development objectives.
- Planning implementation steps.
- Reasoning about code and repository context.
- Supporting code generation and debugging.
- Analysing execution feedback and assisting with corrective actions.
- Participating in tool-driven workflows when the selected model and provider configuration support tool calling.

V01 connects model inference to its existing development environment, allowing model-generated decisions to be processed by the orchestrator and translated into authorised tool operations.

**Model configuration:** `nvidia/nemotron-3-super-120b-a12b`

The configured model should be selected from the current Nebius Token Factory catalog and validated against V01's requirements for reasoning, context capacity, and tool calling.

## 3. Nebius Token Factory Integration

Nebius Token Factory provides the inference infrastructure through which V01 accesses the selected NVIDIA model.

The integration uses an OpenAI-compatible API, allowing V01 to incorporate the provider into its existing model abstraction while retaining its established execution architecture.

### Configuration

- **Provider:** Nebius Token Factory
- **API endpoint:** `https://api.tokenfactory.nebius.com/v1/`
- **Authentication:** Nebius API key
- **Environment variable:** `NEBIUS_API_KEY`
- **Model:** `nvidia/nemotron-3-super-120b-a12b`
- **Integration point:** V01 model-provider interface and agent orchestration pipeline

The provider adapter is responsible for constructing requests, handling responses, reporting inference errors, and passing supported model tool calls through V01's existing validation and execution mechanisms.

### Request and Execution Flow

The integration follows this workflow:

1. A developer submits a task through V01.
2. The agent runtime prepares the task, relevant workspace context, and available tools.
3. V01 sends the inference request to Nebius Token Factory using the selected NVIDIA Nemotron model.
4. The model returns a response or supported tool calls.
5. V01 validates and executes authorised tool calls, such as repository search, file operations, or verification commands.
6. Execution results are returned to the model when another reasoning step is required.
7. The agent continues until the task is completed, blocked, cancelled, or reaches its defined stopping condition.
8. V01 presents the final response together with relevant execution and verification information.

This architecture combines open-model inference with V01's agent orchestration and software-engineering tools.

## 4. Integration with the V01 Agent Harness

The provider integration is designed to reuse V01's existing model abstraction instead of introducing a separate coding-agent implementation.

The architecture separates the responsibilities of the model and the runtime:

- **NVIDIA Nemotron:** Model reasoning and supported tool-call generation.
- **Nebius Token Factory:** Model inference API and serving infrastructure.
- **V01 Orchestrator:** Task management, model interaction, tool coordination, and execution state.
- **V01 Tools:** Repository access, code editing, terminal operations, and other supported actions.
- **Verification System:** Execution checks, test results, failure analysis, and correction workflows.

This separation allows V01 to integrate additional compatible model providers without duplicating the core development workflow.

## 5. Credential Security

The Nebius API key is supplied through secure configuration rather than being embedded in application source code.

The implementation follows these principles:

- API keys must not be committed to the public repository.
- Credentials must not be exposed to renderer code or model prompts.
- Sensitive values must be redacted from execution logs.
- Provider errors must not reveal credentials.
- Missing or invalid credentials must produce actionable error messages.
- The integration must respect V01's existing data-handling and provider-selection policies.

## 6. Validation and Reliability

The integration is intended to be validated through V01's actual runtime rather than through an isolated API example.

Validation covers:

- Successful authentication with Nebius Token Factory.
- A successful inference request using the configured NVIDIA model.
- Correct handling of model responses.
- Supported tool-call parsing and execution.
- Error handling for authentication, network, rate-limit, and model-availability failures.
- Verification that API credentials are protected.
- Confirmation that the configured provider is used in the actual V01 agent workflow.

V01 should distinguish successful model inference from successful task completion. A successful inference response alone does not establish that a coding task has been implemented correctly.

## 7. Conclusion

The NVIDIA and Nebius integration connects open NVIDIA Nemotron models to V01's agentic development environment through Nebius Token Factory.

It combines model inference infrastructure with V01's existing orchestration, repository interaction, tool execution, and verification capabilities.

The objective is to provide a flexible foundation for agentic software engineering, enabling V01 to use compatible open models while preserving a consistent development workflow.

### Official References

- Nebius Token Factory: https://nebius.com/services/token-factory
- NVIDIA Nemotron on Token Factory: https://nebius.com/services/token-factory/nemotron
- Token Factory API documentation: https://api.tokenfactory.nebius.com/docs
