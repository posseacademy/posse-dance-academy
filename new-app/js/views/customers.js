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
      '入会中': 'badge-active',
      '休会中': 'badge-paused',
      '退会済み': 'badge-withdrawn'
    };
    return `<span class="badge ${map[status] || ''}">${status || '不明'}</span>`;
  };

  return `
    <div class="customers-view">
      <div class="page-header">
        <h1 class="page-title">顧客一覧</h1>
        <button class="btn btn-primary" onclick="app.showAddForm=true;app.render()">
          ＋ 新規登録
        </button>
      </div>

      <!-- Filters -->
      <div class="card" style="margin-bottom: var(--spacing-6)">
        <div class="card-body" style="display:flex;gap:var(--spacing-4);align-items:center;flex-wrap:wrap">
          <input type="text" class="form-input" placeholder="名前で検索..."
            value="${app.searchTerm || ''}"
            oninput="app.searchTerm=this.value;app.render()"
            style="flex:1;min-width:200px">
          <select class="form-select" onchange="app.statusFilter=this.value;app.render()">
            <option value="all" ${app.statusFilter === 'all' ? 'selected' : ''}>全て</option>
            <option value="入会中" ${app.statusFilter === '入会中' ? 'selected' : ''}>入会中</option>
            <option value="休会中" ${app.statusFilter === '休会中' ? 'selected' : ''}>休会中</option>
            <option value="退会済み" ${app.statusFilter === '退会済み' ? 'selected' : ''}>退会済み</option>
          </select>
          <span style="color:var(--color-text-secondary)">${filtered.length}件</span>
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
                  名前 ${app.sortField === 'name' ? (app.sortOrder === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th onclick="app.sortField='plan';app.render()" style="cursor:pointer">
                  プラン ${app.sortField === 'plan' ? '↓' : ''}
                </th>
                <th>ステータス</th>
                <th>入会日</th>
                <th>操作</th>
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
                    <button class="btn btn-sm" onclick="app.startEdit('${id}')">編集</button>
                    <button class="btn btn-sm btn-danger" onclick="app.deleteCustomer('${id}')">削除</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          ${filtered.length === 0 ? '<p style="text-align:center;padding:var(--spacing-8);color:var(--color-text-secondary)">顧客が見つかりません</p>' : ''}
        </div>
      </div>
    </div>
  `;
}

function renderAddForm(app) {
  return `
    <div class="card" style="margin-bottom:var(--spacing-6);border-left:4px solid var(--color-primary)">
      <div class="card-header">
        <h3 class="card-title">${app.editingId ? '顧客編集' : '新規顧客登録'}</h3>
        <button class="btn btn-sm" onclick="app.showAddForm=false;app.editingId=null;app.render()">✕</button>
      </div>
      <div class="card-body">
        <form onsubmit="event.preventDefault();app.saveCustomerForm()" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:var(--spacing-4)">
          <div class="form-group">
            <label class="form-label">姓</label>
            <input type="text" class="form-input" id="form-lastName" value="${app.editForm?.lastName || ''}" required>
          </div>
          <div class="form-group">
            <label class="form-label">名</label>
            <input type="text" class="form-input" id="form-firstName" value="${app.editForm?.firstName || ''}">
          </div>
          <div class="form-group">
            <label class="form-label">プラン</label>
            <select class="form-select" id="form-plan">
              <option value="">選択してください</option>
              ${Object.keys(pricing).filter((v,i,a) => a.indexOf(v) === i).map(p =>
                `<option value="${p}" ${app.editForm?.plan === p ? 'selected' : ''}>${p}</option>`
              ).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">ステータス</label>
            <select class="form-select" id="form-status">
              <option value="入会中" ${app.editForm?.status === '入会中' ? 'selected' : ''}>入会中</option>
              <option value="休会中" ${app.editForm?.status === '休会中' ? 'selected' : ''}>休会中</option>
              <option value="退会済み" ${app.editForm?.status === '退会済み' ? 'selected' : ''}>退会済み</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">入会日</label>
            <input type="date" class="form-input" id="form-joinDate" value="${app.editForm?.joinDate || ''}">
          </div>
          <div class="form-group">
            <label class="form-label">電話番号</label>
            <input type="tel" class="form-input" id="form-phone" value="${app.editForm?.phone || ''}">
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label class="form-label">メモ</label>
            <textarea class="form-input" id="form-notes" rows="2">${app.editForm?.notes || ''}</textarea>
          </div>
          <div style="grid-column:1/-1;display:flex;gap:var(--spacing-3);justify-content:flex-end">
            <button type="button" class="btn" onclick="app.showAddForm=false;app.editingId=null;app.render()">キャンセル</button>
            <button type="submit" class="btn btn-primary">${app.editingId ? '更新' : '登録'}</button>
          </div>
        </form>
      </div>
    </div>
  `;
}
