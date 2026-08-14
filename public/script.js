// App State
let activeSidebarTab = 'history';
let activeEnvTab = 'dev';
const email = localStorage.getItem("userEmail");
const name = localStorage.getItem("userName");

// Initialize application
window.onload = () => {
  if (!name || !email) {
    window.location.href = "/login.html";
    return;
  }

  const userDisplay = document.getElementById("userDisplay");
  if (userDisplay) {
    userDisplay.textContent = `Welcome, ${name}`;
  }

  // Load environments, history, and saved requests
  initEnvironments();
  loadHistory();
  loadSavedRequests();

  // Initialize header table with an empty row
  addHeaderRow();

  // Initialize Status Code list
  initStatusCodes();
};

// Toggle Sidebar Collapse
function toggleSidebar() {
  const sidebar = document.querySelector(".sidebar");
  sidebar.classList.toggle("collapsed");
}

// Switch Sidebar Tabs (History vs Saved Requests)
function switchSidebarTab(tab) {
  activeSidebarTab = tab;
  document.getElementById("tab-history-btn").classList.toggle("active", tab === 'history');
  document.getElementById("tab-saved-btn").classList.toggle("active", tab === 'saved');

  document.getElementById("historySection").style.display = tab === 'history' ? 'flex' : 'none';
  document.getElementById("savedSection").style.display = tab === 'saved' ? 'flex' : 'none';

  if (tab === 'history') loadHistory();
  else loadSavedRequests();
}

// ----------------------------------------------------
// ENVIRONMENT VARIABLES MANAGEMENT
// ----------------------------------------------------
const defaultEnvs = {
  dev: { base_url: "http://localhost:3000" },
  test: { base_url: "https://httpbin.org" },
  prod: { base_url: "https://api.github.com" }
};

function initEnvironments() {
  if (!localStorage.getItem("env_variables")) {
    localStorage.setItem("env_variables", JSON.stringify(defaultEnvs));
  }
  if (!localStorage.getItem("selected_env")) {
    localStorage.setItem("selected_env", "none");
  }

  // Set selector to match stored value
  const selectedEnv = localStorage.getItem("selected_env");
  document.getElementById("envSelector").value = selectedEnv;
}

function handleEnvChange() {
  const selectedEnv = document.getElementById("envSelector").value;
  localStorage.setItem("selected_env", selectedEnv);
}

function openEnvModal() {
  const modal = document.getElementById("envModal");
  modal.style.display = "flex";
  switchEnvTab(activeEnvTab);
}

function closeEnvModal() {
  document.getElementById("envModal").style.display = "none";
}

function switchEnvTab(env) {
  activeEnvTab = env;
  document.getElementById("env-tab-dev").classList.toggle("active", env === 'dev');
  document.getElementById("env-tab-test").classList.toggle("active", env === 'test');
  document.getElementById("env-tab-prod").classList.toggle("active", env === 'prod');

  const labelMap = { dev: "Development", test: "Testing", prod: "Production" };
  document.getElementById("activeEnvLabel").textContent = labelMap[env];

  renderEnvVarsGrid(env);
}

function renderEnvVarsGrid(env) {
  const envs = JSON.parse(localStorage.getItem("env_variables")) || defaultEnvs;
  const vars = envs[env] || {};
  const tbody = document.getElementById("envTableBody");
  tbody.innerHTML = "";

  Object.entries(vars).forEach(([key, val]) => {
    insertEnvRow(key, val);
  });

  // Always put an empty row if nothing
  if (Object.keys(vars).length === 0) {
    addEnvRow();
  }
}

function insertEnvRow(key = '', val = '') {
  const tbody = document.getElementById("envTableBody");
  const tr = document.createElement("tr");

  tr.innerHTML = `
    <td><input type="text" class="env-key" placeholder="Variable name" value="${key}" /></td>
    <td><input type="text" class="env-value" placeholder="Value" value="${val}" /></td>
    <td><button class="remove-row-btn" onclick="this.closest('tr').remove()">&times;</button></td>
  `;
  tbody.appendChild(tr);
}

function addEnvRow() {
  insertEnvRow();
}

function saveEnvironmentVars() {
  const envs = JSON.parse(localStorage.getItem("env_variables")) || defaultEnvs;
  const tbody = document.getElementById("envTableBody");
  const rows = tbody.querySelectorAll("tr");
  const updatedVars = {};

  rows.forEach(row => {
    const key = row.querySelector(".env-key").value.trim();
    const val = row.querySelector(".env-value").value;

    if (key) {
      updatedVars[key] = val;
    }
  });

  envs[activeEnvTab] = updatedVars;
  localStorage.setItem("env_variables", JSON.stringify(envs));
  alert(`Variables for environment "${activeEnvTab}" saved successfully!`);
}

// Variable Substituter Helper
function replaceVariables(text) {
  if (!text) return "";
  const selectedEnv = localStorage.getItem("selected_env");
  if (selectedEnv === "none") return text;

  const envs = JSON.parse(localStorage.getItem("env_variables")) || defaultEnvs;
  const vars = envs[selectedEnv] || {};

  let resolvedText = text;
  Object.entries(vars).forEach(([key, val]) => {
    const placeholder = `{{${key}}}`;
    resolvedText = resolvedText.split(placeholder).join(val);
  });

  return resolvedText;
}

// ----------------------------------------------------
// HEADERS GRID BUILDER
// ----------------------------------------------------
function addHeaderRow(key = '', value = '') {
  const tbody = document.getElementById("headersTableBody");
  const tr = document.createElement("tr");

  tr.innerHTML = `
    <td><input type="text" class="header-key" placeholder="Key" value="${key}" /></td>
    <td><input type="text" class="header-value" placeholder="Value" value="${value}" /></td>
    <td><button class="remove-row-btn" onclick="removeHeaderRow(this)">&times;</button></td>
  `;
  tbody.appendChild(tr);
}

function removeHeaderRow(btn) {
  const tbody = document.getElementById("headersTableBody");
  btn.closest('tr').remove();
  // Ensure we always have at least one row
  if (tbody.querySelectorAll("tr").length === 0) {
    addHeaderRow();
  }
}

function getHeadersObject() {
  const tbody = document.getElementById("headersTableBody");
  const rows = tbody.querySelectorAll("tr");
  const headers = {};

  rows.forEach(row => {
    const key = row.querySelector(".header-key").value.trim();
    const val = row.querySelector(".header-value").value;

    if (key) {
      // Resolve variables in keys and values
      headers[replaceVariables(key)] = replaceVariables(val);
    }
  });

  return headers;
}

function populateHeadersGrid(headersObj) {
  const tbody = document.getElementById("headersTableBody");
  tbody.innerHTML = "";

  if (!headersObj || Object.keys(headersObj).length === 0) {
    addHeaderRow();
    return;
  }

  Object.entries(headersObj).forEach(([key, val]) => {
    addHeaderRow(key, val);
  });
}

// ----------------------------------------------------
// API REQUEST & HISTORY
// ----------------------------------------------------
async function sendRequest() {
  const rawUrl = document.getElementById("apiUrl").value.trim();
  const method = document.getElementById("method").value;
  const rawBody = document.getElementById("body").value;

  if (!rawUrl) {
    alert("Please enter API URL");
    return;
  }

  // Resolve Environment variables
  const url = replaceVariables(rawUrl);
  const body = replaceVariables(rawBody);
  const headers = getHeadersObject();

  const statusElement = document.getElementById("status");
  const timeElement = document.getElementById("time");
  const responseElement = document.getElementById("response");

  statusElement.textContent = "Loading...";
  statusElement.className = "status-badge";
  timeElement.textContent = "-";
  responseElement.textContent = "Sending request...";

  try {
    const startTime = performance.now();

    const response = await fetch("/api/test-api", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        url,
        method,
        body: body ? JSON.parse(body) : undefined,
        headers
      })
    });

    const endTime = performance.now();
    const responseTime = (endTime - startTime).toFixed(2);
    const data = await response.json();

    // Check status code from test-api payload
    const finalStatus = data.status || 500;

    statusElement.textContent = finalStatus;
    statusElement.className = "status-badge " + getStatusClass(finalStatus);
    timeElement.textContent = responseTime + " ms";

    if (data.data) {
      responseElement.innerHTML = syntaxHighlight(JSON.stringify(data.data, null, 2));
    } else {
      responseElement.textContent = JSON.stringify(data, null, 2);
    }

    // Save this call in MySQL history
    await fetch("/api/save-history", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        method,
        url: rawUrl, // Save the raw templated URL
        headers,     // Save original headers
        body: rawBody,
        status: finalStatus,
        time: responseTime
      })
    });

    if (activeSidebarTab === 'history') loadHistory();

  } catch (error) {
    statusElement.textContent = "Error";
    statusElement.className = "status-badge danger";
    timeElement.textContent = "-";
    responseElement.textContent = error.message;
  }
}

function getStatusClass(code) {
  if (code >= 200 && code < 300) return "success";
  if (code >= 300 && code < 400) return "warning";
  return "danger";
}

async function loadHistory() {
  const historyList = document.getElementById("historyList");
  historyList.innerHTML = "<li>Loading history...</li>";

  try {
    const res = await fetch(`/api/history/${email}`);
    if (!res.ok) throw new Error("Failed to load history");

    const items = await res.json();
    historyList.innerHTML = "";

    if (items.length === 0) {
      historyList.innerHTML = "<li style='padding: 10px; color: #94a3b8; font-size:13px;'>No requests found</li>";
      return;
    }

    items.forEach(item => {
      const li = document.createElement("li");
      li.className = "history-item";
      li.innerHTML = `
        <div class="item-meta">
          <span class="method-badge ${item.method.toLowerCase()}">${item.method}</span>
          <span style="font-weight: bold; color: ${item.status_code >= 200 && item.status_code < 300 ? '#10b981' : '#ef4444'}">${item.status_code}</span>
        </div>
        <div class="item-url">${item.url}</div>
      `;

      li.onclick = () => {
        document.getElementById("apiUrl").value = item.url;
        document.getElementById("method").value = item.method;
        document.getElementById("body").value = item.request_body || "";
        
        let parsedHeaders = {};
        try {
          if (item.headers) parsedHeaders = JSON.parse(item.headers);
        } catch(e) {}
        populateHeadersGrid(parsedHeaders);
      };

      historyList.appendChild(li);
    });
  } catch (error) {
    console.error(error);
    historyList.innerHTML = "<li style='color:#ef4444;'>Failed to load history</li>";
  }
}

async function clearHistory() {
  if (!confirm("Are you sure you want to clear all history?")) return;

  try {
    await fetch(`/api/history/${email}`, { method: "DELETE" });
    loadHistory();
  } catch (error) {
    alert("Failed to clear history");
  }
}

// ----------------------------------------------------
// SAVED REQUESTS (COLLECTIONS)
// ----------------------------------------------------
async function promptSaveRequest() {
  const nameInput = prompt("Enter a name for this saved request:");
  if (!nameInput) return;

  const url = document.getElementById("apiUrl").value.trim();
  const method = document.getElementById("method").value;
  const body = document.getElementById("body").value;
  const headers = getHeadersObject();

  if (!url) {
    alert("Please enter API URL to save");
    return;
  }

  try {
    const res = await fetch("/api/saved-requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        name: nameInput,
        method,
        url,
        headers,
        body
      })
    });

    if (!res.ok) throw new Error("Failed to save request");

    alert("Request saved successfully!");
    if (activeSidebarTab === 'saved') loadSavedRequests();
  } catch (error) {
    alert(error.message);
  }
}

async function loadSavedRequests() {
  const savedList = document.getElementById("savedList");
  savedList.innerHTML = "<li>Loading collections...</li>";

  try {
    const res = await fetch(`/api/saved-requests/${email}`);
    if (!res.ok) throw new Error("Failed to load saved requests");

    const items = await res.json();
    savedList.innerHTML = "";

    if (items.length === 0) {
      savedList.innerHTML = "<li style='padding: 10px; color: #94a3b8; font-size:13px;'>No saved requests. Make one using 'Save Request'.</li>";
      return;
    }

    items.forEach(item => {
      const li = document.createElement("li");
      li.className = "saved-item";
      li.innerHTML = `
        <button class="delete-saved-btn" onclick="event.stopPropagation(); deleteSaved(${item.id})">&times;</button>
        <div class="item-name">${item.name}</div>
        <div class="item-meta">
          <span class="method-badge ${item.method.toLowerCase()}">${item.method}</span>
        </div>
        <div class="item-url">${item.url}</div>
      `;

      li.onclick = () => {
        document.getElementById("apiUrl").value = item.url;
        document.getElementById("method").value = item.method;
        document.getElementById("body").value = item.request_body || "";
        
        let parsedHeaders = {};
        try {
          if (item.headers) parsedHeaders = JSON.parse(item.headers);
        } catch(e) {}
        populateHeadersGrid(parsedHeaders);
      };

      savedList.appendChild(li);
    });
  } catch (error) {
    console.error(error);
    savedList.innerHTML = "<li style='color:#ef4444;'>Failed to load requests</li>";
  }
}

async function deleteSaved(id) {
  if (!confirm("Remove this request from saved items?")) return;

  try {
    const res = await fetch(`/api/saved-requests/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error();
    loadSavedRequests();
  } catch (error) {
    alert("Failed to delete request");
  }
}

// ----------------------------------------------------
// STATUS CODE VIEWER DRAWER
// ----------------------------------------------------
const statusCodesData = [
  { code: 200, name: "OK", desc: "The request succeeded. The response payload depends on the method." },
  { code: 201, name: "Created", desc: "The request succeeded, and a new resource was created as a result." },
  { code: 204, name: "No Content", desc: "The request succeeded, but there is no representation to return." },
  { code: 301, name: "Moved Permanently", desc: "The URL of the requested resource has been changed permanently." },
  { code: 302, name: "Found", desc: "The requested resource resides temporarily under a different URI." },
  { code: 400, name: "Bad Request", desc: "The server cannot process the request due to client error (e.g. malformed JSON)." },
  { code: 401, name: "Unauthorized", desc: "The request lacks valid authentication credentials for the target resource." },
  { code: 403, name: "Forbidden", desc: "The client does not have access rights to the content (authorization failure)." },
  { code: 404, name: "Not Found", desc: "The server cannot find the requested resource or path." },
  { code: 422, name: "Unprocessable Entity", desc: "The request was well-formed but was unable to be followed due to semantic errors." },
  { code: 500, name: "Internal Server Error", desc: "The server encountered an unexpected condition that prevented it from fulfilling the request." },
  { code: 502, name: "Bad Gateway", desc: "The server, while acting as a gateway or proxy, received an invalid response from the upstream server." },
  { code: 503, name: "Service Unavailable", desc: "The server is currently unable to handle the request due to temporary overloading or maintenance." }
];

function toggleStatusHelper() {
  const drawer = document.getElementById("statusHelper");
  drawer.classList.toggle("open");
}

function initStatusCodes() {
  const container = document.getElementById("statusCodeList");
  container.innerHTML = "";

  statusCodesData.forEach(sc => {
    let group = "sc-2xx";
    if (sc.code >= 300) group = "sc-3xx";
    if (sc.code >= 400) group = "sc-4xx";
    if (sc.code >= 500) group = "sc-5xx";

    const div = document.createElement("div");
    div.className = `status-info-card ${group}`;
    div.setAttribute("data-search", `${sc.code} ${sc.name.toLowerCase()} ${sc.desc.toLowerCase()}`);
    div.innerHTML = `
      <div class="status-info-code">${sc.code} - ${sc.name}</div>
      <div class="status-info-desc">${sc.desc}</div>
    `;
    container.appendChild(div);
  });
}

function filterStatusCodes() {
  const query = document.getElementById("statusSearch").value.toLowerCase().trim();
  const cards = document.querySelectorAll(".status-info-card");

  cards.forEach(card => {
    const text = card.getAttribute("data-search");
    if (text.includes(query)) {
      card.style.display = "block";
    } else {
      card.style.display = "none";
    }
  });
}

// ----------------------------------------------------
// UI UTILITIES
// ----------------------------------------------------
function clearFields() {
  document.getElementById("apiUrl").value = "";
  document.getElementById("body").value = "";
  document.getElementById("response").textContent = "";
  document.getElementById("status").textContent = "-";
  document.getElementById("status").className = "status-badge";
  document.getElementById("time").textContent = "-";
  populateHeadersGrid({});
}

function copyResponse() {
  const responseText = document.getElementById("response").textContent;
  if (!responseText || responseText === "Sending request...") {
    alert("No response to copy");
    return;
  }
  navigator.clipboard.writeText(responseText);
  alert("Response copied to clipboard!");
}

function logout() {
  localStorage.removeItem("userName");
  localStorage.removeItem("userEmail");
  window.location.href = "/login.html";
}

function syntaxHighlight(json) {
  json = json
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    function (match) {
      let cls = "number";
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = "key";
        } else {
          cls = "string";
        }
      } else if (/true|false/.test(match)) {
        cls = "boolean";
      } else if (/null/.test(match)) {
        cls = "null";
      }
      return '<span class="' + cls + '">' + match + '</span>';
    }
  );
}

// ----------------------------------------------------
// AI ASSISTANT — Main
// ----------------------------------------------------
async function generateAIInsights() {
  const url    = document.getElementById("apiUrl").value.trim();
  const method = document.getElementById("method").value;

  if (!url) {
    alert("Please enter an API URL first, then click AI Assistant.");
    return;
  }

  // Show panel
  const panel = document.getElementById("aiPanel");
  panel.style.display = "block";
  panel.scrollIntoView({ behavior: "smooth", block: "start" });

  // Reset states
  document.getElementById("aiLoading").style.display    = "flex";
  document.getElementById("aiError").style.display      = "none";
  document.getElementById("aiTabs").style.display       = "none";
  document.getElementById("aiTabContent").style.display = "none";

  // Gather current request body and response
  const bodyText = document.getElementById("body").value;
  let bodyJson = null;
  try { if (bodyText) bodyJson = JSON.parse(bodyText); } catch(e) {}

  const statusText = document.getElementById("status").textContent;
  const status = parseInt(statusText) || null;

  const responseText = document.getElementById("response").textContent;
  let responseData = null;
  // If we just sent a request and got a response, try to parse it
  if (responseText && responseText !== "Sending request..." && responseText !== "Loading...") {
    try { responseData = JSON.parse(responseText); } catch(e) { responseData = responseText; }
  }

  const payload = {
    method: method,
    url: url,
    headers: getHeadersObject(),
    body: bodyJson,
    status: status,
    response_data: responseData,
    error_message: (status && status >= 400) ? `HTTP ${status} error` : "",
    mode: "all"
  };

  const btn = document.getElementById("ai-assist-btn");
  btn.disabled = true;
  btn.textContent = "⏳ Analyzing…";

  try {
    const res  = await fetch("/api/ai-assist", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload)
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || data.error || "AI generation failed");
    }

    // Render results
    renderTestCases(data.test_cases   || []);
    renderPayloads(data.payloads      || []);
    renderEdgeCases(data.edge_cases   || []);
    renderDebug(data.debug            || null);

    document.getElementById("aiLoading").style.display    = "none";
    document.getElementById("aiTabs").style.display       = "flex";
    document.getElementById("aiTabContent").style.display = "block";
    switchAITab("tests");

  } catch (err) {
    document.getElementById("aiLoading").style.display = "none";
    document.getElementById("aiError").style.display   = "flex";
    document.getElementById("aiErrorMsg").textContent  = err.message;
  } finally {
    btn.disabled    = false;
    btn.textContent = "🤖 AI Assistant";
  }
}

function closeAIPanel() {
  document.getElementById("aiPanel").style.display = "none";
}

// ----------------------------------------------------
// AI ASSISTANT — Tab Switcher
// ----------------------------------------------------
function switchAITab(tab) {
  ["tests", "payloads", "edge", "debug"].forEach(t => {
    document.getElementById(`ai-tab-${t}`).classList.toggle("active", t === tab);
    document.getElementById(`ai-content-${t}`).style.display = t === tab ? "block" : "none";
  });
}

// ----------------------------------------------------
// AI ASSISTANT — Renderers
// ----------------------------------------------------
const categoryIcons = {
  happy_path: "✅", authentication: "🔐", validation: "📋",
  error_handling: "⚠️", performance: "⚡"
};
const riskColors = { low: "#10b981", medium: "#f59e0b", high: "#ef4444" };
const severityColors = { critical: "#ef4444", high: "#f97316", medium: "#f59e0b", low: "#10b981" };

function renderTestCases(cases) {
  const c = document.getElementById("testCasesContainer");
  if (!cases.length) { c.innerHTML = "<p class='ai-empty'>No test cases generated.</p>"; return; }
  c.innerHTML = cases.map(tc => `
    <div class="ai-card tc-card">
      <div class="ai-card-header">
        <span class="ai-card-icon">${categoryIcons[tc.category] || "🧪"}</span>
        <div>
          <div class="ai-card-id">${tc.id}</div>
          <div class="ai-card-name">${tc.name}</div>
        </div>
        <span class="ai-chip ai-chip-${tc.category?.replace('_','-')}">${tc.category?.replace(/_/g,' ')}</span>
      </div>
      <p class="ai-card-desc">${tc.description}</p>
      <div class="ai-card-meta">
        <span class="method-badge ${tc.method?.toLowerCase()}">${tc.method}</span>
        <code class="ai-url">${tc.url}</code>
        <span class="ai-expected">Expected: <strong>${tc.expected_status}</strong></span>
      </div>
      ${tc.body && Object.keys(tc.body).length ? `<pre class="ai-code">${JSON.stringify(tc.body, null, 2)}</pre>` : ''}
      <p class="ai-behavior"><em>${tc.expected_behavior}</em></p>
    </div>
  `).join("");
}

function renderPayloads(payloads) {
  const c = document.getElementById("payloadsContainer");
  if (!payloads.length) { c.innerHTML = "<p class='ai-empty'>No payloads generated.</p>"; return; }
  c.innerHTML = payloads.map((p, i) => `
    <div class="ai-card">
      <div class="ai-card-header">
        <span class="ai-card-icon">📦</span>
        <div>
          <div class="ai-card-id">Payload ${i + 1}</div>
          <div class="ai-card-name">${p.name}</div>
        </div>
        <button class="ai-copy-btn" onclick="copyAIPayload(${i})">Copy</button>
      </div>
      <p class="ai-card-desc">${p.description}</p>
      ${p.headers && Object.keys(p.headers).length ? `
        <div class="ai-sub-label">Headers</div>
        <pre class="ai-code">${JSON.stringify(p.headers, null, 2)}</pre>` : ''}
      ${p.body && Object.keys(p.body).length ? `
        <div class="ai-sub-label">Body</div>
        <pre class="ai-code" id="payload-body-${i}">${JSON.stringify(p.body, null, 2)}</pre>` : '<p class="ai-empty" style="margin:8px 0">No body (e.g. GET request)</p>'}
    </div>
  `).join("");

  // Store payloads for copy
  window._aiPayloads = payloads;
}

function copyAIPayload(i) {
  const p = (window._aiPayloads || [])[i];
  if (!p) return;
  navigator.clipboard.writeText(JSON.stringify(p.body || {}, null, 2));
  alert("Payload copied!");
}

function renderEdgeCases(cases) {
  const c = document.getElementById("edgeCasesContainer");
  if (!cases.length) { c.innerHTML = "<p class='ai-empty'>No edge cases generated.</p>"; return; }
  c.innerHTML = cases.map(ec => `
    <div class="ai-card ec-card" style="border-left: 3px solid ${riskColors[ec.risk_level] || '#6366f1'}">
      <div class="ai-card-header">
        <span class="ai-card-icon">⚡</span>
        <div>
          <div class="ai-card-id">${ec.id}</div>
          <div class="ai-card-name">${ec.type?.replace(/_/g,' ')}</div>
        </div>
        <span class="ai-risk-badge" style="color:${riskColors[ec.risk_level]}">
          ${ec.risk_level?.toUpperCase()} RISK
        </span>
      </div>
      <div class="ai-ec-field">Field: <code>${ec.field}</code></div>
      <div class="ai-ec-input">Input: <code class="ai-input-val">${String(ec.input)}</code></div>
      <p class="ai-card-desc">${ec.description}</p>
      <p class="ai-behavior">Expected: <em>${ec.expected_behavior}</em></p>
    </div>
  `).join("");
}

function renderDebug(debug) {
  const c = document.getElementById("debugContainer");
  if (!debug) { c.innerHTML = "<p class='ai-empty'>No debug data. Make an API call first.</p>"; return; }

  const sev = debug.severity || "medium";
  c.innerHTML = `
    <div class="ai-debug-root">
      <div class="ai-debug-cause" style="border-color: ${severityColors[sev]}">
        <span class="ai-debug-sev-badge" style="background:${severityColors[sev]}">${sev.toUpperCase()}</span>
        <p>${debug.root_cause}</p>
      </div>
    </div>

    <h3 class="ai-section-title">🔧 Suggestions</h3>
    ${(debug.suggestions || []).map(s => `
      <div class="ai-card suggestion-card">
        <div class="ai-card-header">
          <span class="ai-priority-badge">#${s.priority}</span>
          <div class="ai-card-name">${s.title}</div>
        </div>
        <p class="ai-card-desc">${s.description}</p>
        <div class="ai-action-box">💡 ${s.action}</div>
        ${s.code_example && s.code_example !== 'null' && s.code_example !== '' ? `<pre class="ai-code">${s.code_example}</pre>` : ''}
      </div>
    `).join("")}

    ${(debug.quick_fixes || []).length ? `
      <h3 class="ai-section-title">⚡ Quick Fixes</h3>
      <ul class="ai-quick-fixes">
        ${debug.quick_fixes.map(f => `<li>${f}</li>`).join("")}
      </ul>` : ''}

    ${(debug.prevention_tips || []).length ? `
      <h3 class="ai-section-title">🛡️ Prevention Tips</h3>
      <ul class="ai-prevention-tips">
        ${debug.prevention_tips.map(t => `<li>${t}</li>`).join("")}
      </ul>` : ''}
  `;
}

