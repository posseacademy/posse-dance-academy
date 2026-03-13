// POSSE Dance Academy - Customers View Module
// ES module for customer management page rendering

import { calculateAge } from '../utils.js';

/**
 * Main customer list page
 * @param {Object} app - Application state
 * @returns {string} HTML string for customer list view
 */
export function renderCustomers(app) {
  const statusOptions = ['入会中', '休会中', '退会済み'];

  // Filter by status and search
  let filtered = app.customers;
  if (app.statusFilter && app.statusFilter !== 'all') {
    filtered = filtered.filter(c => c.status === app.statusFilter);
  }
  if (app.searchTerm) {
    const term = app.searchTerm.toLowerCase();
    filtered = filtered.filter(c =>
      (c.lastName + c.firstName).toLowerCase().includes(term) ||
      (c.memberNumber || '').toLowerCase().includes(term) ||
      (c.reading || '').toLowerCase().includes(term)
    );
  }

  // Sort customers
  if (app.sortField) {
    filtered = [...filtered].sort((a, b) => {
      let aVal = a[app.sortField] || '';
      let bVal = b[app.sortField] || '';
      if (aVal < bVal) return app.sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return app.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // Count by status
  const statusCounts = {
    '入会中': app.customers.filter(c => c.status === '入会中').length,
    '休会中': app.customers.filter(c => c.status === '休会中').length,
    '退会済み': app.customers.filter(c => c.status === '退会済み').length
  };

  return `
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h2>顧客管理</h2>
        <p class="subtitle">会員情報の管理と編集</p>
      </div>
      <div class="header-actions">
        <button id="exportBtn" class="btn btn-secondary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          CSV エクスポート
        </button>
        <button id="toggleAddFormBtn" class="btn btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          新規登録
        </button>
      </div>
    </div>

    ${app.showAddForm ? renderAddForm(app) : ''}

    <!-- Tab Navigation -->
    <div class="tab-nav">
      ${statusOptions.map(status => {
        const icons = {
          '入会中': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
          '休会中': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="10" y1="15" x2="10" y2="9"/><line x1="14" y1="15" x2="14" y2="9"/></svg>',
          '退会済み': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>'
        };
        return `
          <button id="status-${status}" class="tab-btn ${app.statusFilter === status ? 'active' : ''}">
            ${icons[status] || ''}${status} <span class="tab-count">${statusCounts[status]}</span>
          </button>
        `;
      }).join('')}
    </div>

    <!-- Search Bar -->
    <div class="search-bar">
      <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <input type="text" id="searchInput" placeholder="氏名、会員番号、読みで検索..."
             value="${app.searchTerm || ''}">
    </div>

    <!-- Customers Table -->
    <div class="content-card">
      <div style="overflow-x: auto;">
        <table class="customers-table">
          <thead>
            <tr>
              <th class="sortable-header" data-field="no">
                No <span class="sort-icon">${app.sortField === 'no' ? (app.sortOrder === 'asc' ? '▲' : '▼') : ''}</span>
              </th>
              <th class="sortable-header" data-field="memberNumber">
                会員番号 <span class="sort-icon">${app.sortField === 'memberNumber' ? (app.sortOrder === 'asc' ? '▲' : '▼') : ''}</span>
              </th>
              <th class="sortable-header" data-field="status">
                ステータス <span class="sort-icon">${app.sortField === 'status' ? (app.sortOrder === 'asc' ? '▲' : '▼') : ''}</span>
              </th>
              <th class="sortable-header" data-field="course">
                コース <span class="sort-icon">${app.sortField === 'course' ? (app.sortOrder === 'asc' ? '▲' : '▼') : ''}</span>
              </th>
              <th class="sortable-header" data-field="annualFee">
                年会費更新日 <span class="sort-icon">${app.sortField === 'annualFee' ? (app.sortOrder === 'asc' ? '▲' : '▼') : ''}</span>
              </th>
              <th class="sortable-header" data-field="lastName">
                氏名 <span class="sort-icon">${app.sortField === 'lastName' ? (app.sortOrder === 'asc' ? '▲' : '▼') : ''}</span>
              </th>
              <th class="sortable-header" data-field="reading">
                読み <span class="sort-icon">${app.sortField === 'reading' ? (app.sortOrder === 'asc' ? '▲' : '▼') : ''}</span>
              </th>
              <th class="sortable-header" data-field="guardianName">
                保護者名 <span class="sort-icon">${app.sortField === 'guardianName' ? (app.sortOrder === 'asc' ? '▲' : '▼') : ''}</span>
              </th>
              <th class="sortable-header" data-field="hakomonoName">
                ハコモノ登録名 <span class="sort-icon">${app.sortField === 'hakomonoName' ? (app.sortOrder === 'asc' ? '▲' : '▼') : ''}</span>
              </th>
              <th class="sortable-header" data-field="gender">
                性別 <span class="sort-icon">${app.sortField === 'gender' ? (app.sortOrder === 'asc' ? '▲' : '▼') : ''}</span>
              </th>
              <th class="sortable-header" data-field="birthDate">
                生年月日 <span class="sort-icon">${app.sortField === 'birthDate' ? (app.sortOrder === 'asc' ? '▲' : '▼') : ''}</span>
              </th>
              <th>年齢</th>
              <th class="sortable-header" data-field="phone1">
                電話番号 <span class="sort-icon">${app.sortField === 'phone1' ? (app.sortOrder === 'asc' ? '▲' : '▼') : ''}</span>
              </th>
              <th class="sortable-header" data-field="email">
                メール <span class="sort-icon">${app.sortField === 'email' ? (app.sortOrder === 'asc' ? '▲' : '▼') : ''}</span>
              </th>
              <th class="sortable-header" data-field="joinDate">
                入会日 <span class="sort-icon">${app.sortField === 'joinDate' ? (app.sortOrder === 'asc' ? '▲' : '▼') : ''}</span>
              </th>
              <th>郵便番号</th>
              <th>都道府県</th>
              <th>市区町村</th>
              <th>番地</th>
              <th>建物・部屋番号</th>
              <th class="sortable-header" data-field="memo">
                備考 <span class="sort-icon">${app.sortField === 'memo' ? (app.sortOrder === 'asc' ? '▲' : '▼') : ''}</span>
              </th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map((customer, idx) => renderCustomerRow(app, customer, idx + 1)).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/**
 * New customer registration form
 * @param {Object} app - Application state
 * @returns {string} HTML string for add form
 */
export function renderAddForm(app) {
  const form = app.newCustomer || {};

  return `
    <div class="content-card" style="margin-bottom: 2rem;">
      <div class="card-header">
        <h3 class="card-title">新規会員登録</h3>
      </div>
      <div class="card-content">
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem;">
          <div>
            <label class="form-label">会員番号</label>
            <input type="text" class="form-input" id="new_memberNumber" value="${form.memberNumber || ''}">
          </div>
          <div>
            <label class="form-label">ステータス</label>
            <select class="form-input" id="new_status">
              <option value="入会中" ${form.status === '入会中' ? 'selected' : ''}>入会中</option>
              <option value="休会中" ${form.status === '休会中' ? 'selected' : ''}>休会中</option>
              <option value="退会済み" ${form.status === '退会済み' ? 'selected' : ''}>退会済み</option>
            </select>
          </div>
          <div>
            <label class="form-label">コース</label>
            <input type="text" class="form-input" id="new_course" placeholder="例: ４" value="${form.course || ''}">
          </div>
          <div>
            <label class="form-label">年会費更新日</label>
            <input type="date" class="form-input" id="new_annualFee" value="${form.annualFee || ''}">
          </div>

          <div>
            <label class="form-label">氏（姓）</label>
            <input type="text" class="form-input" id="new_lastName" value="${form.lastName || ''}">
          </div>
          <div>
            <label class="form-label">名（名前）</label>
            <input type="text" class="form-input" id="new_firstName" value="${form.firstName || ''}">
          </div>
          <div>
            <label class="form-label">読み</label>
            <input type="text" class="form-input" id="new_reading" value="${form.reading || ''}">
          </div>
          <div>
            <label class="form-label">保護者名</label>
            <input type="text" class="form-input" id="new_guardianName" value="${form.guardianName || ''}">
          </div>

          <div>
            <label class="form-label">ハコモノ登録名</label>
            <input type="text" class="form-input" id="new_hakomonoName" value="${form.hakomonoName || ''}">
          </div>
          <div>
            <label class="form-label">性別</label>
            <input type="text" class="form-input" id="new_gender" value="${form.gender || ''}">
          </div>
          <div>
            <label class="form-label">生年月日</label>
            <input type="date" class="form-input" id="new_birthDate" value="${form.birthDate || ''}">
          </div>
          <div>
            <label class="form-label">電話番号</label>
            <input type="tel" class="form-input" id="new_phone1" value="${form.phone1 || ''}">
          </div>

          <div>
            <label class="form-label">電話番号2</label>
            <input type="tel" class="form-input" id="new_phone2" value="${form.phone2 || ''}">
          </div>
          <div>
            <label class="form-label">メール</label>
            <input type="email" class="form-input" id="new_email" value="${form.email || ''}">
          </div>
          <div>
            <label class="form-label">入会日</label>
            <input type="date" class="form-input" id="new_joinDate" value="${form.joinDate || ''}">
          </div>
          <div>
            <label class="form-label">郵便番号</label>
            <input type="text" class="form-input" id="new_postalCode" value="${form.postalCode || ''}">
          </div>

          <div>
            <label class="form-label">都道府県</label>
            <input type="text" class="form-input" id="new_prefecture" value="${form.prefecture || ''}">
          </div>
          <div>
            <label class="form-label">市区町村</label>
            <input type="text" class="form-input" id="new_city" value="${form.city || ''}">
          </div>
          <div>
            <label class="form-label">番地</label>
            <input type="text" class="form-input" id="new_address" value="${form.address || ''}">
          </div>
          <div>
            <label class="form-label">建物・部屋番号</label>
            <input type="text" class="form-input" id="new_building" value="${form.building || ''}">
          </div>

          <div style="grid-column: span 4;">
            <label class="form-label">備考</label>
            <textarea class="form-input" id="new_memo">${form.memo || ''}</textarea>
          </div>
        </div>

        <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
          <button id="addCustomerBtn" class="btn btn-primary">登録</button>
          <button id="cancelAddBtn" class="btn btn-secondary">キャンセル</button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Single customer row (edit mode or display mode)
 * @param {Object} app - Application state
 * @param {Object} customer - Customer data
 * @param {number} no - Row number
 * @returns {string} HTML string for customer row
 */
export function renderCustomerRow(app, customer, no) {
  const isEditing = app.editingId === customer.id;
  const editForm = app.editForm || customer;
  const age = calculateAge(customer.birthDate);

  if (isEditing) {
    return `
      <tr>
        <td class="px-2 py-3 text-xs">${no}</td>
        <td class="px-2 py-3 text-xs">
          <input type="text" class="form-input" style="width: 80px;" value="${editForm.memberNumber || ''}"
                 onchange="window.app.updateEditForm('memberNumber', this.value)">
        </td>
        <td class="px-2 py-3 text-xs">
          <select class="form-input" style="width: 80px;" onchange="window.app.updateEditForm('status', this.value)">
            <option value="入会中" ${editForm.status === '入会中' ? 'selected' : ''}>入会中</option>
            <option value="休会中" ${editForm.status === '休会中' ? 'selected' : ''}>休会中</option>
            <option value="退会済み" ${editForm.status === '退会済み' ? 'selected' : ''}>退会済み</option>
          </select>
        </td>
        <td class="px-2 py-3 text-xs">
          <input type="text" class="form-input" style="width: 50px;" value="${editForm.course || ''}"
                 onchange="window.app.updateEditForm('course', this.value)">
        </td>
        <td class="px-2 py-3 text-xs">
          <input type="date" class="form-input" style="width: 120px;" value="${editForm.annualFee || ''}"
                 onchange="window.app.updateEditForm('annualFee', this.value)">
        </td>
        <td class="px-2 py-3 text-xs">
          <input type="text" class="form-input" style="width: 60px;" value="${editForm.lastName || ''}"
                 onchange="window.app.updateEditForm('lastName', this.value)">
          <input type="text" class="form-input" style="width: 60px;" value="${editForm.firstName || ''}"
                 onchange="window.app.updateEditForm('firstName', this.value)">
        </td>
        <td class="px-2 py-3 text-xs">
          <input type="text" class="form-input" style="width: 100px;" value="${editForm.reading || ''}"
                 onchange="window.app.updateEditForm('reading', this.value)">
        </td>
        <td class="px-2 py-3 text-xs">
          <input type="text" class="form-input" style="width: 100px;" value="${editForm.guardianName || ''}"
                 onchange="window.app.updateEditForm('guardianName', this.value)">
        </td>
        <td class="px-2 py-3 text-xs">
          <input type="text" class="form-input" style="width: 100px;" value="${editForm.hakomonoName || ''}"
                 onchange="window.app.updateEditForm('hakomonoName', this.value)">
        </td>
        <td class="px-2 py-3 text-xs">
          <input type="text" class="form-input" style="width: 50px;" value="${editForm.gender || ''}"
                 onchange="window.app.updateEditForm('gender', this.value)">
        </td>
        <td class="px-2 py-3 text-xs">
          <input type="date" class="form-input" style="width: 120px;" value="${editForm.birthDate || ''}"
                 onchange="window.app.updateEditForm('birthDate', this.value)">
        </td>
        <td class="px-2 py-3 text-xs">${age}</td>
        <td class="px-2 py-3 text-xs">
          <input type="tel" class="form-input" style="width: 120px;" value="${editForm.phone1 || ''}"
                 onchange="window.app.updateEditForm('phone1', this.value)">
        </td>
        <td class="px-2 py-3 text-xs">
          <input type="email" class="form-input" style="width: 150px;" value="${editForm.email || ''}"
                 onchange="window.app.updateEditForm('email', this.value)">
        </td>
        <td class="px-2 py-3 text-xs">
          <input type="date" class="form-input" style="width: 120px;" value="${editForm.joinDate || ''}"
                 onchange="window.app.updateEditForm('joinDate', this.value)">
        </td>
        <td class="px-2 py-3 text-xs">
          <input type="text" class="form-input" style="width: 80px;" value="${editForm.postalCode || ''}"
                 onchange="window.app.updateEditForm('postalCode', this.value)">
        </td>
        <td class="px-2 py-3 text-xs">
          <input type="text" class="form-input" style="width: 80px;" value="${editForm.prefecture || ''}"
                 onchange="window.app.updateEditForm('prefecture', this.value)">
        </td>
        <td class="px-2 py-3 text-xs">
          <input type="text" class="form-input" style="width: 100px;" value="${editForm.city || ''}"
                 onchange="window.app.updateEditForm('city', this.value)">
        </td>
        <td class="px-2 py-3 text-xs">
          <input type="text" class="form-input" style="width: 100px;" value="${editForm.address || ''}"
                 onchange="window.app.updateEditForm('address', this.value)">
        </td>
        <td class="px-2 py-3 text-xs">
          <input type="text" class="form-input" style="width: 100px;" value="${editForm.building || ''}"
                 onchange="window.app.updateEditForm('building', this.value)">
        </td>
        <td class="px-2 py-3 text-xs">
          <input type="text" class="form-input" style="width: 80px;" value="${editForm.memo || ''}"
                 onchange="window.app.updateEditForm('memo', this.value)">
        </td>
        <td class="px-2 py-3 text-xs">
          <button id="saveEditBtn" class="btn btn-primary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">保存</button>
          <button id="cancelEditBtn" class="btn btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; margin-left: 0.25rem;">キャンセル</button>
          <button data-edit-action="delete" data-id="${customer.id}" class="btn btn-danger" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; margin-left: 0.25rem;">削除</button>
        </td>
      </tr>
    `;
  }

  // Display mode
  const statusBadgeClass = customer.status === '入会中' ? 'status-badge-active' :
                          customer.status === '休会中' ? 'status-badge-paused' :
                          'status-badge-withdrawn';

  return `
    <tr>
      <td class="px-2 py-3 text-xs">${no}</td>
      <td class="px-2 py-3 text-xs">${customer.memberNumber || ''}</td>
      <td class="px-2 py-3 text-xs">
        <span class="status-badge ${statusBadgeClass}">${customer.status || ''}</span>
      </td>
      <td class="px-2 py-3 text-xs">${customer.course || ''}</td>
      <td class="px-2 py-3 text-xs">${customer.annualFee || ''}</td>
      <td class="px-2 py-3 text-xs">${customer.lastName || ''} ${customer.firstName || ''}</td>
      <td class="px-2 py-3 text-xs">${customer.reading || ''}</td>
      <td class="px-2 py-3 text-xs">${customer.guardianName || ''}</td>
      <td class="px-2 py-3 text-xs">${customer.hakomonoName || ''}</td>
      <td class="px-2 py-3 text-xs">${customer.gender || ''}</td>
      <td class="px-2 py-3 text-xs">${customer.birthDate || ''}</td>
      <td class="px-2 py-3 text-xs">${age}</td>
      <td class="px-2 py-3 text-xs">${customer.phone1 || ''}</td>
      <td class="px-2 py-3 text-xs">${customer.email || ''}</td>
      <td class="px-2 py-3 text-xs">${customer.joinDate || ''}</td>
      <td class="px-2 py-3 text-xs">${customer.postalCode || ''}</td>
      <td class="px-2 py-3 text-xs">${customer.prefecture || ''}</td>
      <td class="px-2 py-3 text-xs">${customer.city || ''}</td>
      <td class="px-2 py-3 text-xs">${customer.address || ''}</td>
      <td class="px-2 py-3 text-xs">${customer.building || ''}</td>
      <td class="px-2 py-3 text-xs">${customer.memo || ''}</td>
      <td class="px-2 py-3 text-xs">
        <button data-edit-action="start" data-id="${customer.id}" class="btn btn-primary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">編集</button>
      </td>
    </tr>
  `;
}
