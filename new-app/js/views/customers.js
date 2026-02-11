import { pricing, planOrder } from '../config.js';
import { formatCurrency } from '../utils.js';

export function renderCustomers(app) {
  const customers = app.customers || {};
  let filtered = Object.entries(customers);

  // Filter by status
  if (app.statusFilter && app.statusFilter !== 'all') {
    filtered = filtered.filter(([_, c]) => c.status === app.statusFilter);
  }

  // Filter by search term
  if (app.searchTerm) {
    const term = app.searchTerm.toLowerCase();
    filtered = filtered.filter(([_, c]) => {
      const name = `${c.lastName || ''}${c.firstName || ''}`.toLowerCase();
      return name.includes(term);
    });
  }

  // Sort
  filtered.sort((a, b) => {
    const [, ca] = a;
    const [, cb] = b;
    if (app.sortField === 'plan') {
      return (planOrder[ca.plan] || 99) - (planOrder[cb.plan] || 99);
    }
    const nameA = `${ca.lastName || ''}${ca.firstName || ''}`;
    const nameB = `${cb.lastName || ''}${cb.firstName || ''}`;
    return app.sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
  });

  const statusBadge = (status) => {
    const map = {
      'å¥ä¼ä¸­': 'badge-active',
      'ä¼ä¼ä¸­': 'badge-paused',
      'éä¼æ¸ã¿': 'badge-withdrawn'
    };
    return `<span class="badge ${map[status] || ''}">${status || 'ä¸æ'}</span>`;
  };

  return `
    <div class="customers-view">
      <div class="page-header">
        <h1 class="page-title">é¡§å®¢ä¸è¦§</h1>
        <button class="btn btn-primary" onclick="app.showAddForm=true;app.render()">
          ï¼ æ°è¦ç»é²
        </button>
      </div>

      <!-- Filters -->
      <div class="card" style="margin-bottom: var(--spacing-6)">
        <div class="card-body" style="display:flex;gap:var(--spacing-4);align-items:center;flex-wrap:wrap">
          <input type="text" class="form-input" placeholder="ååã§æ¤ç´¢..."
            value="${app.searchTerm || ''}"
            oninput="app.searchTerm=this.value;app.render()"
            style="flex:1;min-width:200px">
          <select class="form-select" onchange="app.statusFilter=this.value;app.render()">
            <option value="all" ${app.statusFilter === 'all' ? 'selected' : ''}>å¨ã¦</option>
            <option value="å¥ä¼ä¸­" ${app.statusFilter === 'å¥ä¼ä¸­' ? 'selected' : ''}>å¥ä¼ä¸­</option>
            <option value="ä¼ä¼ä¸­" ${app.statusFilter === 'ä¼ä¼ä¸­' ? 'selected' : ''}>ä¼ä¼ä¸­</option>
            <option value="éä¼æ¸ã¿" ${app.statusFilter === 'éä¼æ¸ã¿' ? 'selected' : ''}>éä¼æ¸ã¿</option>
          </select>
          <span style="color:var(--color-text-secondary)">${filtered.length}ä»¶</span>
        </div>
      </div>

      ${app.showAddForm ? renderAddForm(app) : ''}

      <!-- Customer Table -->
      <div class="card">
        <div class="card-body" style="overflow-x:auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>No.</th>
                <th onclick="app.sortField='name';app.sortOrder=app.sortOrder==='asc'?'desc':'asc';app.render()" style="cursor:pointer">
                  åå ${app.sortField === 'name' ? (app.sortOrder === 'asc' ? 'â' : 'â') : ''}
                </th>
                <th onclick="app.sortField='plan';app.render()" style="cursor:pointer">
                  ãã©ã³ ${app.sortField === 'plan' ? 'â' : ''}
                </th>
                <th>ã¹ãã¼ã¿ã¹</th>
                <th>å¥ä¼æ¥</th>
                <th>æä½</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map(([id, c], i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td><strong>${c.lastName || ''} ${c.firstName || ''}</strong></td>
                  <td>${c.plan || '-'}</td>
                  <td>${statusBadge(c.status)}</td>
                  <td>${c.joinDate || '-'}</td>
                  <td>
                    <button class="btn btn-sm" onclick="app.startEdit('${id}')">ç·¨é</button>
                    <button class="btn btn-sm btn-danger" onclick="app.deleteCustomer('${id}')">åé¤</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          ${filtered.length === 0 ? '<p style="text-align:center;padding:var(--spacing-8);color:var(--color-text-secondary)">é¡§å®¢ãè¦ã¤ããã¾ãã</p>' : ''}
        </div>
      </div>
    </div>
  `;
}

function renderAddForm(app) {
  return `
    <div class="card" style="margin-bottom:var(--spacing-6);border-left:4px solid var(--color-primary)">
      <div class="card-header">
        <h3 class="card-title">${app.editingId ? 'é¡§å®¢ç·¨é' : 'æ°è¦é¡§å®¢ç»é²'}</h3>
        <button class="btn btn-sm" onclick="app.showAddForm=false;app.editingId=null;app.render()">â</button>
      </div>
      <div class="card-body">
        <form onsubmit="event.preventDefault();app.saveCustomerForm()" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:var(--spacing-4)">
          <div class="form-group">
            <label class="form-label">å§</label>
            <input type="text" class="form-input" id="form-lastName" value="${app.editForm?.lastName || ''}" required>
          </div>
          <div class="form-group">
            <label class="form-label">å</label>
            <input type="text" class="form-input" id="form-firstName" value="${app.editForm?.firstName || ''}">
          </div>
          <div class="form-group">
            <label class="form-label">ãã©ã³</label>
            <select class="form-select" id="form-plan">
              <option value="">é¸æãã¦ãã ãã</option>
              ${Object.keys(pricing).filter((v,i,a) => a.indexOf(v) === i).map(p =>
                `<option value="${p}" ${app.editForm?.plan === p ? 'selected' : ''}>${p}</option>`
              ).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">ã¹ãã¼ã¿ã¹</label>
            <select class="form-select" id="form-status">
              <option value="å¥ä¼ä¸­" ${app.editForm?.status === 'å¥ä¼ä¸­' ? 'selected' : ''}>å¥ä¼ä¸­</option>
              <option value="ä¼ä¼ä¸­" ${app.editForm?.status === 'ä¼ä¼ä¸­' ? 'selected' : ''}>ä¼ä¼ä¸­</option>
              <option value="éä¼æ¸ã¿" ${app.editForm?.status === 'éä¼æ¸ã¿' ? 'selected' : ''}>éä¼æ¸ã¿</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">å¥ä¼æ¥</label>
            <input type="date" class="form-input" id="form-joinDate" value="${app.editForm?.joinDate || ''}">
          </div>
          <div class="form-group">
            <label class="form-label">é»è©±çªå·</label>
            <input type="tel" class="form-input" id="form-phone" value="${app.editForm?.phone || ''}">
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label class="form-label">ã¡ã¢</label>
            <textarea class="form-input" id="form-notes" rows="2">${app.editForm?.notes || ''}</textarea>
          </div>
          <div style="grid-column:1/-1;display:flex;gap:var(--spacing-3);justify-content:flex-end">
            <button type="button" class="btn" onclick="app.showAddForm=false;app.editingId=null;app.render()">ã­ã£ã³ã»ã«</button>
            <button type="submit" class="btn btn-primary">${app.editingId ? 'æ´æ°' : 'ç»é²'}</button>
          </div>
        </form>
      </div>
    </div>
  `;
}
