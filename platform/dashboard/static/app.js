// =============================================================================
// OpenTwin Dashboard — Client Application
// =============================================================================

const API = '';
let ws = null;

// --- Navigation ---

document.querySelectorAll('.nav-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`view-${btn.dataset.view}`).classList.add('active');

    const loaders = { twins: loadTwins, alerts: loadAlerts, workflows: loadWorkflows, ontology: loadOntology, bindings: loadBindings };
    const loader = loaders[btn.dataset.view];
    if (loader) loader();
  });
});

// --- WebSocket ---

function connectWebSocket() {
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  ws = new WebSocket(`${protocol}//${location.host}/ws`);

  ws.onopen = () => {
    document.getElementById('connection-status').textContent = 'Connected';
    document.getElementById('connection-status').className = 'status-connected';
  };

  ws.onclose = () => {
    document.getElementById('connection-status').textContent = 'Disconnected';
    document.getElementById('connection-status').className = 'status-disconnected';
    setTimeout(connectWebSocket, 3000);
  };

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.type === 'twin_update') {
      handleTwinUpdate(msg.data);
    }
  };
}

function handleTwinUpdate(event) {
  // Refresh twin list if currently viewing twins
  if (document.getElementById('view-twins').classList.contains('active')) {
    loadTwins();
  }
}

// --- API Helpers ---

async function apiFetch(path, options) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

// --- Twins ---

async function loadTwins() {
  const typeFilter = document.getElementById('type-filter').value;
  const query = typeFilter ? `?type_id=${typeFilter}` : '';
  const twins = await apiFetch(`/api/twins${query}`);

  document.getElementById('twin-count').textContent = `Twins: ${twins.length}`;

  const grid = document.getElementById('twin-list');
  grid.innerHTML = twins.map((t) => `
    <div class="card" data-id="${t.instance_id}">
      <span class="type-badge">${t.type_id}</span>
      <h4>${t.instance_id}</h4>
      <div class="props">
        ${Object.entries(t.properties).slice(0, 5).map(([k, v]) =>
          `<div class="prop-row"><span>${k}</span><span>${formatValue(v)}</span></div>`
        ).join('')}
        ${t.spatial && t.spatial.pose ? `<div class="prop-row"><span>pose</span><span>[${t.spatial.pose.position.map(n => n.toFixed(1)).join(', ')}]</span></div>` : ''}
      </div>
    </div>
  `).join('');

  grid.querySelectorAll('.card').forEach((card) => {
    card.addEventListener('click', () => showTwinDetail(card.dataset.id));
  });

  // Update type filter options
  const types = [...new Set(twins.map((t) => t.type_id))];
  const select = document.getElementById('type-filter');
  const currentVal = select.value;
  select.innerHTML = '<option value="">All Types</option>' +
    types.map((t) => `<option value="${t}">${t}</option>`).join('');
  select.value = currentVal;
}

async function showTwinDetail(id) {
  const twin = await apiFetch(`/api/twins/${id}`);
  const links = await apiFetch(`/api/twins/${id}/links`);
  const timeline = await apiFetch(`/api/twins/${id}/timeline`);

  const panel = document.getElementById('twin-detail');
  panel.classList.remove('hidden');
  document.getElementById('twin-detail-title').textContent = `${twin.instance_id} (${twin.type_id})`;

  document.getElementById('twin-detail-props').innerHTML = `
    <h4>Properties</h4>
    <table>${Object.entries(twin.properties).map(([k, v]) =>
      `<tr><td>${k}</td><td>${formatValue(v)}</td></tr>`
    ).join('')}</table>
  `;

  document.getElementById('twin-detail-spatial').innerHTML = twin.spatial && twin.spatial.pose
    ? `<h4>Spatial</h4><pre>${JSON.stringify(twin.spatial, null, 2)}</pre>` : '';

  document.getElementById('twin-detail-links').innerHTML = links.length > 0
    ? `<h4>Links</h4><table>
        <tr><th>Type</th><th>Source</th><th>Target</th></tr>
        ${links.map((l) => `<tr><td>${l.link_type_id}</td><td>${l.source_id}</td><td>${l.target_id}</td></tr>`).join('')}
       </table>` : '';

  document.getElementById('twin-detail-timeline').innerHTML = timeline.length > 0
    ? `<h4>Timeline (last 20)</h4><table>
        <tr><th>Time</th><th>Property</th><th>Value</th></tr>
        ${timeline.slice(-20).reverse().map((e) =>
          `<tr><td>${new Date(e.timestamp).toLocaleTimeString()}</td><td>${e.property_name}</td><td>${formatValue(e.value)}</td></tr>`
        ).join('')}
       </table>` : '';
}

document.getElementById('refresh-twins').addEventListener('click', loadTwins);
document.getElementById('type-filter').addEventListener('change', loadTwins);

// --- Alerts ---

async function loadAlerts() {
  const severity = document.getElementById('alert-severity-filter').value;
  const status = document.getElementById('alert-status-filter').value;
  const params = new URLSearchParams();
  if (severity) params.set('severity', severity);
  if (status) params.set('status', status);
  const query = params.toString() ? `?${params}` : '';

  const alerts = await apiFetch(`/api/alerts${query}`);
  document.getElementById('alert-count').textContent = `Alerts: ${alerts.filter((a) => a.status === 'active').length}`;

  document.getElementById('alert-body').innerHTML = alerts.map((a) => `
    <tr>
      <td class="severity-${a.severity}">${a.severity}</td>
      <td>${a.title}</td>
      <td>${a.message}</td>
      <td>${a.source_twin_id || '-'}</td>
      <td>${a.status}</td>
      <td>
        ${a.status === 'active' ? `<button class="btn-sm" onclick="ackAlert('${a.alert_id}')">Ack</button>` : ''}
        ${a.status !== 'resolved' ? `<button class="btn-sm" onclick="resolveAlert('${a.alert_id}')">Resolve</button>` : ''}
      </td>
    </tr>
  `).join('');
}

async function ackAlert(id) {
  await apiFetch(`/api/alerts/${id}/acknowledge`, { method: 'POST' });
  loadAlerts();
}

async function resolveAlert(id) {
  await apiFetch(`/api/alerts/${id}/resolve`, { method: 'POST' });
  loadAlerts();
}

// Make functions global for onclick handlers
window.ackAlert = ackAlert;
window.resolveAlert = resolveAlert;

document.getElementById('alert-severity-filter').addEventListener('change', loadAlerts);
document.getElementById('alert-status-filter').addEventListener('change', loadAlerts);

// --- Workflows ---

async function loadWorkflows() {
  const defs = await apiFetch('/api/workflows/definitions');
  const instances = await apiFetch('/api/workflows/instances');

  document.getElementById('workflow-defs').innerHTML = defs.length > 0
    ? defs.map((d) => `
        <div class="ontology-card">
          <h4>${d.display_name}</h4>
          <div class="prop-list">ID: ${d.workflow_id} | Steps: ${d.steps.length} | Target: ${d.target_type_id}</div>
        </div>
      `).join('')
    : '<p style="color: var(--text-muted)">No workflow definitions</p>';

  document.getElementById('workflow-instances').innerHTML = instances.length > 0
    ? instances.map((i) => `
        <div class="ontology-card">
          <h4>${i.instance_id}</h4>
          <div class="prop-list">
            Workflow: ${i.workflow_id} | Twin: ${i.target_twin_id} |
            Status: ${i.status} | Step: ${i.current_step_index}
          </div>
        </div>
      `).join('')
    : '<p style="color: var(--text-muted)">No running workflows</p>';
}

// --- Ontology ---

async function loadOntology() {
  const schema = await apiFetch('/api/ontology');

  document.getElementById('ontology-types').innerHTML = schema.object_types.map(([id, t]) => `
    <div class="ontology-card">
      <h4>${t.display_name} <span style="color: var(--text-muted)">(${id})</span></h4>
      <div class="prop-list">
        ${t.properties.map((p) => `${p.name}: ${p.type}${p.unit ? ' (' + p.unit + ')' : ''}`).join(' | ')}
      </div>
    </div>
  `).join('');

  document.getElementById('ontology-links').innerHTML = schema.link_types.map(([id, l]) => `
    <div class="ontology-card">
      <h4>${l.display_name}</h4>
      <div class="prop-list">${l.source_type_id} → ${l.target_type_id} (${l.cardinality})</div>
    </div>
  `).join('');
}

// --- Bindings ---

async function loadBindings() {
  const bindings = await apiFetch('/api/bindings');

  document.getElementById('bindings-list').innerHTML = bindings.map((b) => `
    <div class="binding-item">
      <span class="layer">[${b.layer}]</span>
      <span class="source">${b.source_type}:${b.source_id}</span>
      → <span>${b.binding_id}</span>
    </div>
  `).join('');
}

// --- Helpers ---

function formatValue(v) {
  if (v === null || v === undefined) return '-';
  if (typeof v === 'object') return JSON.stringify(v);
  if (typeof v === 'number') return Number.isInteger(v) ? v : v.toFixed(2);
  return String(v);
}

// --- Init ---

connectWebSocket();
loadTwins();
loadAlerts();
