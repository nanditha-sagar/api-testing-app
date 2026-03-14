async function sendRequest(fromHistory = false) {
  const url = document.getElementById("apiUrl").value;
  const method = document.getElementById("method").value;
  const body = document.getElementById("body").value;

  const statusElement = document.getElementById("status");
  const timeElement = document.getElementById("time");
  const responseElement = document.getElementById("response");

  if (!url) {
    alert("Please enter API URL");
    return;
  }

  // add history only if request is new
  if (!fromHistory) {
    addToHistory(url, method);
  }

  let requestOptions = {
    method: method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (method !== "GET" && body) {
    requestOptions.body = body;
  }

  try {
    const startTime = performance.now();

    const response = await fetch(url, requestOptions);

    const endTime = performance.now();

    const data = await response.json();

    const responseTime = (endTime - startTime).toFixed(2);

    statusElement.textContent = response.status + " " + response.statusText;

    timeElement.textContent = responseTime + " ms";

    responseElement.textContent = JSON.stringify(data, null, 2);
  } catch (error) {
    statusElement.textContent = "Error";

    timeElement.textContent = "-";

    responseElement.textContent = error.message;
  }
}

function addToHistory(url, method) {
  const historyList = document.getElementById("historyList");

  const li = document.createElement("li");
  li.className = "history-item";

  const methodSpan = document.createElement("span");
  methodSpan.className = "method " + method.toLowerCase();
  methodSpan.textContent = method;

  const urlSpan = document.createElement("span");
  urlSpan.textContent = url;

  li.appendChild(methodSpan);
  li.appendChild(urlSpan);

  li.onclick = async () => {
    document.getElementById("apiUrl").value = url;
    document.getElementById("method").value = method;

    await sendRequest(true);
  };

  historyList.prepend(li);
}

function clearFields() {
  document.getElementById("apiUrl").value = "";
  document.getElementById("body").value = "";
  document.getElementById("response").textContent = "";
  document.getElementById("status").textContent = "-";
  document.getElementById("time").textContent = "-";
}

function clearHistory() {
  document.getElementById("historyList").innerHTML = "";
}

function copyResponse() {
  const responseText = document.getElementById("response").textContent;

  if (!responseText) {
    alert("No response to copy");
    return;
  }

  navigator.clipboard.writeText(responseText);

  alert("Response copied to clipboard!");
}
