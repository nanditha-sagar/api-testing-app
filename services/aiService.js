/**
 * AI Service — LangChain.js + Groq
 * API Test Case & Debugging Assistant
 *
 * Uses the latest LangChain.js LCEL (pipe) syntax:
 *   prompt | llm | parser
 *
 * LLM is instantiated lazily (on first API call) so the server
 * can start even before GROQ_API_KEY is configured.
 */

"use strict";

const { ChatGroq }           = require("@langchain/groq");
const { ChatPromptTemplate } = require("@langchain/core/prompts");
const { StringOutputParser } = require("@langchain/core/output_parsers");

// ─── Shared System Prompt ─────────────────────────────────────────────────────
const SYSTEM_BASE = `You are an expert API testing engineer and senior backend developer.
You analyze API request/response details and produce precise, actionable outputs.
Always respond with valid JSON only — no markdown fences, no extra text.`;

// ─── Prompt Templates (defined at module level — no API key required) ─────────
const testCasesPrompt = ChatPromptTemplate.fromMessages([
  ["system", SYSTEM_BASE],
  ["human", `Generate comprehensive test cases for the following API endpoint.

API Details:
- Method: {method}
- URL: {url}
- Headers: {headers}
- Request Body: {body}
- Response Status: {status}
- Response Data: {response_data}

Return a JSON object with this exact structure:
{{
  "test_cases": [
    {{
      "id": "TC001",
      "name": "Test case name",
      "category": "happy_path | authentication | validation | error_handling | performance",
      "description": "What this test verifies",
      "method": "HTTP method",
      "url": "endpoint URL",
      "headers": {{}},
      "body": {{}},
      "expected_status": 200,
      "expected_behavior": "What the response should contain"
    }}
  ]
}}

Generate at least 5 diverse test cases covering: happy path, authentication, validation errors, edge cases, and error scenarios.`],
]);

const payloadsPrompt = ChatPromptTemplate.fromMessages([
  ["system", SYSTEM_BASE],
  ["human", `Generate realistic sample request payloads for the following API endpoint.

API Details:
- Method: {method}
- URL: {url}
- Headers: {headers}
- Current Body: {body}
- Response Status: {status}
- Response Data: {response_data}

Return a JSON object with this exact structure:
{{
  "payloads": [
    {{
      "name": "Payload name (e.g. Minimal Valid Payload)",
      "description": "When to use this payload",
      "headers": {{}},
      "body": {{}}
    }}
  ]
}}

Generate 4 payloads: minimal valid, full valid, with optional fields, and a common real-world scenario.`],
]);

const edgeCasesPrompt = ChatPromptTemplate.fromMessages([
  ["system", SYSTEM_BASE],
  ["human", `Identify edge case inputs for the following API endpoint.

API Details:
- Method: {method}
- URL: {url}
- Headers: {headers}
- Request Body: {body}
- Response Status: {status}
- Response Data: {response_data}

Return a JSON object with this exact structure:
{{
  "edge_cases": [
    {{
      "id": "EC001",
      "type": "boundary | null_empty | special_chars | overflow | injection | format",
      "field": "Field or parameter being tested",
      "input": "The edge case input value",
      "description": "Why this edge case matters",
      "expected_behavior": "How the API should handle it",
      "risk_level": "low | medium | high"
    }}
  ]
}}

Generate at least 6 edge cases covering: null/empty values, boundary conditions, special characters, large payloads, malformed data, and injection attempts.`],
]);

const debugPrompt = ChatPromptTemplate.fromMessages([
  ["system", SYSTEM_BASE],
  ["human", `Analyze the following failed API request and provide debugging suggestions.

API Details:
- Method: {method}
- URL: {url}
- Headers: {headers}
- Request Body: {body}
- Response Status: {status}
- Response Data: {response_data}
- Error Message: {error_message}

Return a JSON object with this exact structure:
{{
  "root_cause": "Primary cause of the failure in one sentence",
  "severity": "critical | high | medium | low",
  "suggestions": [
    {{
      "priority": 1,
      "title": "Fix title",
      "description": "Detailed explanation of the issue",
      "action": "Specific actionable step to fix it",
      "code_example": "Optional code/config snippet if applicable"
    }}
  ],
  "quick_fixes": ["One-liner fix 1", "One-liner fix 2"],
  "prevention_tips": ["How to prevent this in future 1", "tip 2"]
}}

Provide at least 3 prioritized suggestions.`],
]);

// ─── Lazy chain initialisation ────────────────────────────────────────────────
// ChatGroq validates the API key on construction, so we defer until first call.
let _chains = null;

function getChains() {
  if (_chains) return _chains;

  const llm    = new ChatGroq({
    model:     "openai/gpt-oss-120b",
    apiKey:    process.env.GROQ_API_KEY,
    temperature: 0.3,
    maxTokens: 1500,
  });
  const parser = new StringOutputParser();

  // LCEL pipe: prompt | llm | parser
  _chains = {
    testCases:  testCasesPrompt.pipe(llm).pipe(parser),
    payloads:   payloadsPrompt.pipe(llm).pipe(parser),
    edgeCases:  edgeCasesPrompt.pipe(llm).pipe(parser),
    debug:      debugPrompt.pipe(llm).pipe(parser),
  };
  return _chains;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function safeParseJSON(raw) {
  let text = raw.trim();

  // Strip <think>...</think> blocks if present
  if (text.includes("<think>")) {
    const thinkEnd = text.indexOf("</think>");
    if (thinkEnd !== -1) {
      text = text.substring(thinkEnd + 8).trim();
    } else {
      // Fallback: if <think> exists but </think> is missing or cut off
      text = text.replace(/<think>[\s\S]*$/, "").trim();
    }
  }

  if (text.startsWith("```")) {
    text = text
      .split("\n")
      .filter(line => !line.trim().startsWith("```"))
      .join("\n")
      .trim();
  }
  return JSON.parse(text);
}

function buildInputs({ method, url, headers, body, status, response_data, error_message }) {
  return {
    method:        method || "GET",
    url:           url || "",
    headers:       JSON.stringify(headers || {}).slice(0, 300),
    body:          body ? JSON.stringify(body).slice(0, 500) : "None",
    status:        status != null ? String(status) : "N/A",
    response_data: response_data
      ? JSON.stringify(response_data).slice(0, 500)
      : "None",
    error_message: error_message ? String(error_message).slice(0, 300) : "None",
  };
}

// ─── Main Export ──────────────────────────────────────────────────────────────
/**
 * Generate AI insights for an API request.
 * @param {object} ctx   - { method, url, headers, body, status, response_data, error_message }
 * @param {string} mode  - "test_cases" | "payloads" | "edge_cases" | "debug" | "all"
 * @returns {Promise<object>}
 */
async function generateInsights(ctx, mode = "all") {
  const chains = getChains(); // instantiates LLM once, reuses after
  const inputs = buildInputs(ctx);
  const result = {};

  if (mode === "test_cases" || mode === "all") {
    const raw = await chains.testCases.invoke(inputs);
    result.test_cases = safeParseJSON(raw).test_cases || [];
  }
  if (mode === "payloads" || mode === "all") {
    const raw = await chains.payloads.invoke(inputs);
    result.payloads = safeParseJSON(raw).payloads || [];
  }
  if (mode === "edge_cases" || mode === "all") {
    const raw = await chains.edgeCases.invoke(inputs);
    result.edge_cases = safeParseJSON(raw).edge_cases || [];
  }
  if (mode === "debug" || mode === "all") {
    const raw = await chains.debug.invoke(inputs);
    result.debug = safeParseJSON(raw);
  }

  return result;
}

module.exports = { generateInsights };
