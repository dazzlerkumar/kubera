# LLM Connection Guide: Specter CLI

This document offers a simple guide for an AI agent or developer looking to replicate the LLM connectivity setup from the Specter CLI project into another project.

## Overview

The Specter CLI uses **Ollama** as a local LLM runtime, interacting with it directly through HTTP requests. It avoids heavy third-party SDKs, relying purely on the native `fetch` API.

The connection logic is isolated to the `src/utils/ollama.ts` file, making it simple, decoupled, and easy to reimplement in Javascript, TypeScript, or any other language that supports standard HTTP interactions.

### The Anatomy of the Request

Ollama runs an HTTP server on port `11434` by default. Specter CLI sends a POST request to `/api/generate`.

#### The Code Structure

```typescript
const response = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
    },
    body: JSON.stringify({
        model: "llama3", // The local model you want to use (must be pulled first)
        prompt: "Your system rules and user input string here",
        stream: false,   // Set to false to receive a single, combined response instead of chunks
    }),
});
```

#### Important Fields

- **`model`**: Typically retrieved from the user's config file (`config.model`), specifying the installed LLM (e.g., `llama3`, `mistral`).
- **`prompt`**: A meticulously formatted string sequence containing:
  - System-level instruction (e.g., "You are an expert developer...")
  - Specific Rules (e.g., formatting styles, character limits)
  - Data payload (in Specter's case, a git diff)
- **`stream: false`**: Specter avoids dealing with Server-Sent Events (SSE) stream processing by requesting a single, unified JSON response after inference wraps up.

### Handling the Response

When `stream: false` is supplied, Ollama returns a flat JSON object in this shape:

```json
{
  ...
  "response": "The generated commit message from the LLM.",
  "done": true,
  ...
}
```

#### Parsing

```typescript
// First, check for HTTP errors (e.g., Ollama is down, or model not found)
if (!response.ok) {
    throw new Error(`Ollama API error: ${response.statusText}`);
}

// Map it onto a known structure and extract the actual text payload
const data = (await response.json()) as { response: string };

// Process the output (Specter CLI removes flanking whitespace)
return data.response.trim();
```

### Error Handling

Specter CLI captures a few primary modes of failure:

1. **Connection Refused / Network Error**: Caught implicitly by the `try...catch` block surrounding the `fetch()` call. This happens often if Ollama isn't physically running.
2. **LLM Execution Errors (4xx/5xx)**: Handled gracefully via `!response.ok` check.
3. **Graceful Surfacing (`src/index.ts`)**: In the main entrypoint, Specter watches for throwing errors containing the string `"Ollama"`, allowing it to provide a highly targeted user resolution message:
   > `"Make sure Ollama is running (try 'ollama serve') and the model is pulled."`

## Implementation Checklist for New Projects

To replicate this LLM setup seamlessly:

- [ ] **1. Standalone HTTP Call**: Create a simple utility layer or service class that executes standard HTTP `POST` requests, ignoring heavy client wrappers.
- [ ] **2. Model Selection Context**: Allow configuration of the `model` identifier dynamically instead of hardcoding it.
- [ ] **3. Clear Templating Design**: Compose the `prompt` context utilizing ES6 Template Literals with distinct structural sections (Role `->` Rules `->` Context).
- [ ] **4. Error Parsing**: Catch connection failures distinctly. Without this, missing local infrastructure just throws a cryptic Javascript `ECONNREFUSED` exception. Provide the user friendly guidance text (e.g., "Is Ollama running?").
