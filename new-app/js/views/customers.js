// POSSE Dance Academy - Customers View Module
// ES module for customer management page rendering

import { calculateAge, getCustomerClasses } from '../utils.js?v=11';

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

  const sortIcon = (field) => app.sortField === field ? (app.sortOrder === 'asc' ? ' ▲' : ' ▼') : '';

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
    <div class="tab-nav" style="background:#1d1d1f;border-bottom-color:#1d1d1f;">
      ${statusOptions.map(status => {
        const icons = {
          '入会中': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
          '休会中': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="10" y1="15" x2="10" y2="9"/><line x1="14" y1="15" x2="14" y2="9"/></svg>',
          '退会済み': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>'
        };
        const isActive = app.statusFilter === status;
        return `
          <button id="status-${status}" class="tab-btn ${isActive ? 'active' : ''}" style="color:${isActive ? 'white' : 'rgba(255,255,255,0.6)'};">
            ${icons[status] || ''}${status} <span class="tab-count" style="background:${isActive ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)'};color:white;">${statusCounts[status]}</span>
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

    <!-- Customers Table (Simplified) -->
    <div class="content-card">
      <div style="overflow-x: auto;">
        <table class="customer-table">
          <thead>
            <tr style="background:#1d1d1f;">
              <th class="sortable-header" data-field="memberNumber" style="color:white;">会員番号${sortIcon('memberNumber')}</th>
              <th class="sortable-header" data-field="lastName" style="color:white;">氏名${sortIcon('lastName')}</th>
              <th class="sortable-header" data-field="course" style="color:white;">プラン${sortIcon('course')}</th>
              <th class="sortable-header" data-field="phone1" style="color:white;">電話番号${sortIcon('phone1')}</th>
              <th class="sortable-header" data-field="email" style="color:white;">メール${sortIcon('email')}</th>
              <th class="sortable-header" data-field="joinDate" style="color:white;">入会日${sortIcon('joinDate')}</th>
              <th style="width:120px;color:white;">操作</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map((customer) => renderCustomerRow(app, customer)).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Detail Modal -->
    ${app.viewingCustomerId ? renderCustomerDetailModal(app) : ''}

    <!-- Edit Modal -->
    ${app.editingId ? renderEditModal(app) : ''}
  `;
}

/**
 * New customer registration form
 */
export function renderAddForm(app) {
  const form = app.newCustomer || {};

  return `
    <div class="content-card" style="margin-bottom: 2rem;">
      <div class="card-header" style="background:#1d1d1f;border-radius:var(--border-radius-lg) var(--border-radius-lg) 0 0;">
        <h3 class="card-title" style="color:white;">新規会員登録</h3>
      </div>
      <div class="card-content">
        <div class="grid-4col">
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
            <label class="form-label">プラン</label>
            <select class="form-input" id="new_plan">
              <option value="">未設定</option>
              <option value="１クラス" ${form.plan === '１クラス' ? 'selected' : ''}>１クラス</option>
              <option value="２クラス" ${form.plan === '２クラス' ? 'selected' : ''}>２クラス</option>
              <option value="３クラス" ${form.plan === '３クラス' ? 'selected' : ''}>３クラス</option>
              <option value="４クラス" ${form.plan === '４クラス' ? 'selected' : ''}>４クラス</option>
              <option value="1.5hクラス" ${form.plan === '1.5hクラス' ? 'selected' : ''}>1.5hクラス</option>
              <option value="ビジター（会員）" ${form.plan === 'ビジター（会員）' ? 'selected' : ''}>ビジター（会員）</option>
              <option value="ビジター（非会員）" ${form.plan === 'ビジター（非会員）' ? 'selected' : ''}>ビジター（非会員）</option>
              <option value="初回体験" ${form.plan === '初回体験' ? 'selected' : ''}>初回体験</option>
              <option value="ハーフ" ${form.plan === 'ハーフ' ? 'selected' : ''}>ハーフ</option>
            </select>
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

          <!-- Fee Fields -->
          <div style="grid-column: span 4; border-top: 1px solid var(--border-color); padding-top: 1rem; margin-top: 0.5rem;">
            <div style="font-weight:600;margin-bottom:0.75rem;font-size:0.9rem;">入会金・年会費・オプション</div>
            <div class="grid-4col">
              <div>
                <label class="form-label">入会金支払日</label>
                <input type="date" class="form-input" id="new_enrollmentFeeDate" value="${form.enrollmentFeeDate || ''}">
              </div>
              <div style="display:flex;align-items:center;gap:0.5rem;padding-top:1.5rem;">
                <input type="checkbox" id="new_isFamilyMember" ${form.isFamilyMember ? 'checked' : ''}>
                <label for="new_isFamilyMember" style="font-size:0.875rem;">家族割（入会金免除）</label>
              </div>
              <div>
                <label class="form-label">年会費支払月</label>
                <input type="month" class="form-input" id="new_annualFeeMonth" value="${form.annualFeeMonth || ''}">
              </div>
            </div>
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
 * Simplified customer row
 */
export function renderCustomerRow(app, customer) {
  const age = calculateAge(customer.birthDate);
  // プラン優先表示（plan 未設定時は course から導出 or course 値をそのまま表示）
  const COURSE_TO_PLAN_LABEL = {'１':'１クラス','1':'１クラス','２':'２クラス','2':'２クラス','３':'３クラス','3':'３クラス','４':'４クラス','4':'４クラス'};
  const planLabel = customer.plan || COURSE_TO_PLAN_LABEL[customer.course] || customer.course || '—';

  return `
    <tr>
      <td>${customer.memberNumber || ''}</td>
      <td class="customer-name-cell">
        ${customer.lastName || ''} ${customer.firstName || ''}
        ${customer.reading ? `<span class="reading">${customer.reading}</span>` : ''}
      </td>
      <td>${planLabel}</td>
      <td>${customer.phone1 || ''}</td>
      <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${customer.email || ''}</td>
      <td>${customer.joinDate || ''}</td>
      <td>
        <div class="customer-action-btns">
          <button class="btn-detail" data-view-id="${customer.id}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            詳細
          </button>
          <button class="btn-edit-icon" data-edit-action="start" data-id="${customer.id}" title="編集">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
        </div>
      </td>
    </tr>
  `;
}

/**
 * Customer detail modal (view-only)
 */
function renderCustomerDetailModal(app) {
  const customer = app.customers.find(c => c.id === app.viewingCustomerId);
  if (!customer) return '';
  const age = calculateAge(customer.birthDate);
  const statusBadgeClass = customer.status === '入会中' ? 'status-badge-active' :
                           customer.status === '休会中' ? 'status-badge-paused' : 'status-badge-withdrawn';

  const val = (v) => v || '—';

  return `
    <div class="customer-detail-overlay" id="detailOverlay">
      <div class="customer-detail-modal">
        <div class="modal-header">
          <h3>${customer.lastName} ${customer.firstName}</h3>
          <button class="modal-close" id="closeDetailBtn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div class="modal-body">
          <!-- Basic Info -->
          <div class="detail-section">
            <div class="detail-section-title">基本情報</div>
            <div class="detail-grid">
              <div class="detail-item">
                <label>会員番号</label>
                <div class="detail-value">${val(customer.memberNumber)}</div>
              </div>
              <div class="detail-item">
                <label>ステータス</label>
                <div class="detail-value"><span class="status-badge ${statusBadgeClass}">${val(customer.status)}</span></div>
              </div>
              <div class="detail-item">
                <label>氏名</label>
                <div class="detail-value">${val(customer.lastName)} ${val(customer.firstName)}</div>
              </div>
              <div class="detail-item">
                <label>読み</label>
                <div class="detail-value">${val(customer.reading)}</div>
              </div>
              <div class="detail-item">
                <label>プラン</label>
                <div class="detail-value">${(() => {
                  const M = {'１':'１クラス','1':'１クラス','２':'２クラス','2':'２クラス','３':'３クラス','3':'３クラス','４':'４クラス','4':'４クラス'};
                  return customer.plan || M[customer.course] || customer.course || '—';
                })()}</div>
              </div>
              <div class="detail-item">
                <label>性別</label>
                <div class="detail-value">${val(customer.gender)}</div>
              </div>
              <div class="detail-item">
                <label>生年月日</label>
                <div class="detail-value">${val(customer.birthDate)}${age ? ` (${age}歳)` : ''}</div>
              </div>
              <div class="detail-item">
                <label>入会日</label>
                <div class="detail-value">${val(customer.joinDate)}</div>
              </div>
              <div class="detail-item">
                <label>年会費更新日</label>
                <div class="detail-value">${val(customer.annualFee)}</div>
              </div>
            </div>
          </div>

          <!-- Fees -->
          <div class="detail-section">
            <div class="detail-section-title">入会金・年会費</div>
            <div class="detail-grid">
              <div class="detail-item">
                <label>入会金</label>
                <div class="detail-value">${customer.isFamilyMember
                  ? '<span class="status-badge status-badge-paused">家族割（免除）</span>'
                  : customer.enrollmentFeeDate
                    ? '<span class="status-badge status-badge-active">支払済 ' + customer.enrollmentFeeDate + '</span>'
                    : '<span class="status-badge status-badge-withdrawn">未払い</span>'}</div>
              </div>
              <div class="detail-item">
                <label>年会費</label>
                <div class="detail-value">${customer.annualFeeMonth
                  ? '<span class="status-badge status-badge-active">支払済 ' + customer.annualFeeMonth + '</span>'
                  : '<span class="status-badge status-badge-withdrawn">未払い</span>'}</div>
              </div>
            </div>
          </div>

          <!-- Contact -->
          <div class="detail-section">
            <div class="detail-section-title">連絡先</div>
            <div class="detail-grid">
              <div class="detail-item">
                <label>電話番号</label>
                <div class="detail-value">${val(customer.phone1)}</div>
              </div>
              <div class="detail-item">
                <label>電話番号2</label>
                <div class="detail-value">${val(customer.phone2)}</div>
              </div>
              <div class="detail-item full-width">
                <label>メール</label>
                <div class="detail-value">${val(customer.email)}</div>
              </div>
            </div>
          </div>

          <!-- Address -->
          <div class="detail-section">
            <div class="detail-section-title">住所</div>
            <div class="detail-grid">
              <div class="detail-item">
                <label>郵便番号</label>
                <div class="detail-value">${val(customer.postalCode)}</div>
              </div>
              <div class="detail-item">
                <label>都道府県</label>
                <div class="detail-value">${val(customer.prefecture)}</div>
              </div>
              <div class="detail-item">
                <label>市区町村</label>
                <div class="detail-value">${val(customer.city)}</div>
              </div>
              <div class="detail-item">
                <label>番地</label>
                <div class="detail-value">${val(customer.address)}</div>
              </div>
              <div class="detail-item full-width">
                <label>建物・部屋番号</label>
                <div class="detail-value">${val(customer.building)}</div>
              </div>
            </div>
          </div>

          <!-- 受講クラス -->
          <div class="detail-section">
            <div class="detail-section-title">受講クラス</div>
            ${(() => {
              const classes = getCustomerClasses(customer, app.scheduleData);
              if (classes.length === 0) {
                return '<div class="detail-value" style="color:var(--text-secondary);padding:0.5rem 0;">受講中のクラスなし</div>';
              }
              const dayShort = {'月曜日':'月','火曜日':'火','水曜日':'水','木曜日':'木','金曜日':'金'};
              return `
                <div style="display:flex;flex-direction:column;gap:0.5rem;">
                  ${classes.map(c => `
                    <div style="display:flex;align-items:center;gap:0.75rem;padding:0.6rem 0.75rem;background:#f5f5f7;border-radius:8px;">
                      <span style="display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;background:#1d1d1f;color:white;font-size:0.75rem;font-weight:600;flex-shrink:0;">${dayShort[c.day] || c.day[0]}</span>
                      <div style="flex:1;min-width:0;">
                        <div style="font-weight:500;font-size:0.9rem;">${c.name.replace(/\s+[A-Z]+$/, '')}</div>
                        <div style="font-size:0.75rem;color:var(--text-secondary);">${c.location}${c.teacher ? ` ・ ${c.teacher}先生` : ''}</div>
                      </div>
                    </div>
                  `).join('')}
                </div>
                <div style="margin-top:0.5rem;font-size:0.75rem;color:var(--text-secondary);">計 ${classes.length} クラス</div>
              `;
            })()}
          </div>

          <!-- Other -->
          <div class="detail-section">
            <div class="detail-section-title">その他</div>
            <div class="detail-grid">
              <div class="detail-item">
                <label>保護者名</label>
                <div class="detail-value">${val(customer.guardianName)}</div>
              </div>
              <div class="detail-item">
                <label>ハコモノ登録名</label>
                <div class="detail-value">${val(customer.hakomonoName)}</div>
              </div>
              <div class="detail-item full-width">
                <label>備考</label>
                <div class="detail-value">${val(customer.memo)}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" id="closeDetailBtn2">閉じる</button>
          <button class="btn btn-primary" id="editFromDetailBtn" data-id="${customer.id}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px;margin-right:4px;"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            編集
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Edit modal
 */
function renderEditModal(app) {
  const customer = app.customers.find(c => c.id === app.editingId);
  if (!customer) return '';
  const ef = app.editForm || customer;

  return `
    <div class="customer-detail-overlay" id="editOverlay">
      <div class="customer-detail-modal">
        <div class="modal-header">
          <h3>${ef.lastName || ''} ${ef.firstName || ''} — 編集</h3>
          <button class="modal-close" id="cancelEditBtn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div class="modal-body">
          <!-- Basic Info -->
          <div class="detail-section">
            <div class="detail-section-title">基本情報</div>
            <div class="detail-grid">
              <div class="detail-item">
                <label>会員番号</label>
                <input type="text" class="form-input" id="edit_memberNumber" value="${ef.memberNumber || ''}">
              </div>
              <div class="detail-item">
                <label>ステータス</label>
                <select class="form-input" id="edit_status">
                  <option value="入会中" ${ef.status === '入会中' ? 'selected' : ''}>入会中</option>
                  <option value="休会中" ${ef.status === '休会中' ? 'selected' : ''}>休会中</option>
                  <option value="退会済み" ${ef.status === '退会済み' ? 'selected' : ''}>退会済み</option>
                </select>
              </div>
              <div class="detail-item">
                <label>姓</label>
                <input type="text" class="form-input" id="edit_lastName" value="${ef.lastName || ''}" onchange="window.app.updateEditField('lastName', this.value)">
              </div>
              <div class="detail-item">
                <label>名</label>
                <input type="text" class="form-input" id="edit_firstName" value="${ef.firstName || ''}" onchange="window.app.updateEditField('firstName', this.value)">
              </div>
              <div class="detail-item">
                <label>読み</label>
                <input type="text" class="form-input" id="edit_reading" value="${ef.reading || ''}">
              </div>
              <div class="detail-item">
                <label>プラン</label>
                ${(() => {
                  // plan 未設定時は course から表示用プランを導出してプルダウンに反映
                  const M = {'１':'１クラス','1':'１クラス','２':'２クラス','2':'２クラス','３':'３クラス','3':'３クラス','４':'４クラス','4':'４クラス','ビジター':'ビジター（会員）','ハーフ':'ハーフ'};
                  const currentPlan = ef.plan || M[ef.course] || '';
                  const isSel = (v) => currentPlan === v ? 'selected' : '';
                  return `
                <select class="form-input" id="edit_plan">
                  <option value="">未設定</option>
                  <option value="１クラス" ${isSel('１クラス')}>１クラス</option>
                  <option value="２クラス" ${isSel('２クラス')}>２クラス</option>
                  <option value="３クラス" ${isSel('３クラス')}>３クラス</option>
                  <option value="４クラス" ${isSel('４クラス')}>４クラス</option>
                  <option value="1.5hクラス" ${isSel('1.5hクラス')}>1.5hクラス</option>
                  <option value="ビジター（会員）" ${isSel('ビジター（会員）')}>ビジター（会員）</option>
                  <option value="ビジター（非会員）" ${isSel('ビジター（非会員）')}>ビジター（非会員）</option>
                  <option value="初回体験" ${isSel('初回体験')}>初回体験</option>
                  <option value="ハーフ" ${isSel('ハーフ')}>ハーフ</option>
                </select>`;
                })()}
              </div>
              <div class="detail-item">
                <label>性別</label>
                <input type="text" class="form-input" id="edit_gender" value="${ef.gender || ''}">
              </div>
              <div class="detail-item">
                <label>生年月日</label>
                <input type="date" class="form-input" id="edit_birthDate" value="${ef.birthDate || ''}">
              </div>
              <div class="detail-item">
                <label>入会日</label>
                <input type="date" class="form-input" id="edit_joinDate" value="${ef.joinDate || ''}">
              </div>
              <div class="detail-item">
                <label>年会費更新日</label>
                <input type="date" class="form-input" id="edit_annualFee" value="${ef.annualFee || ''}">
              </div>
            </div>
          </div>

          <!-- Fees -->
          <div class="detail-section">
            <div class="detail-section-title">入会金・年会費</div>
            <div class="detail-grid">
              <div class="detail-item">
                <label>入会金支払日</label>
                <input type="date" class="form-input" id="edit_enrollmentFeeDate" value="${ef.enrollmentFeeDate || ''}">
              </div>
              <div class="detail-item" style="display:flex;align-items:center;gap:0.5rem;padding-top:1.5rem;">
                <input type="checkbox" id="edit_isFamilyMember" ${ef.isFamilyMember ? 'checked' : ''}>
                <label for="edit_isFamilyMember" style="margin:0;">家族割（入会金免除）</label>
              </div>
              <div class="detail-item">
                <label>年会費支払月</label>
                <input type="month" class="form-input" id="edit_annualFeeMonth" value="${ef.annualFeeMonth || ''}">
              </div>
            </div>
          </div>

          <!-- Contact -->
          <div class="detail-section">
            <div class="detail-section-title">連絡先</div>
            <div class="detail-grid">
              <div class="detail-item">
                <label>電話番号</label>
                <input type="tel" class="form-input" id="edit_phone1" value="${ef.phone1 || ''}">
              </div>
              <div class="detail-item">
                <label>電話番号2</label>
                <input type="tel" class="form-input" id="edit_phone2" value="${ef.phone2 || ''}">
              </div>
              <div class="detail-item full-width">
                <label>メール</label>
                <input type="email" class="form-input" id="edit_email" value="${ef.email || ''}">
              </div>
            </div>
          </div>

          <!-- Address -->
          <div class="detail-section">
            <div class="detail-section-title">住所</div>
            <div class="detail-grid">
              <div class="detail-item">
                <label>郵便番号</label>
                <input type="text" class="form-input" id="edit_postalCode" value="${ef.postalCode || ''}">
              </div>
              <div class="detail-item">
                <label>都道府県</label>
                <input type="text" class="form-input" id="edit_prefecture" value="${ef.prefecture || ''}">
              </div>
              <div class="detail-item">
                <label>市区町村</label>
                <input type="text" class="form-input" id="edit_city" value="${ef.city || ''}">
              </div>
              <div class="detail-item">
                <label>番地</label>
                <input type="text" class="form-input" id="edit_address" value="${ef.address || ''}">
              </div>
              <div class="detail-item full-width">
                <label>建物・部屋番号</label>
                <input type="text" class="form-input" id="edit_building" value="${ef.building || ''}">
              </div>
            </div>
          </div>

          <!-- Other -->
          <div class="detail-section">
            <div class="detail-section-title">その他</div>
            <div class="detail-grid">
              <div class="detail-item">
                <label>保護者名</label>
                <input type="text" class="form-input" id="edit_guardianName" value="${ef.guardianName || ''}">
              </div>
              <div class="detail-item">
                <label>ハコモノ登録名</label>
                <input type="text" class="form-input" id="edit_hakomonoName" value="${ef.hakomonoName || ''}">
              </div>
              <div class="detail-item full-width">
                <label>備考</label>
                <textarea class="form-input" id="edit_memo" rows="3">${ef.memo || ''}</textarea>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button data-edit-action="delete" data-id="${app.editingId}" class="btn btn-danger" style="margin-right:auto;">削除</button>
          <button id="cancelEditBtn2" class="btn btn-secondary">キャンセル</button>
          <button id="saveEditBtn" class="btn btn-primary">保存</button>
        </div>
      </div>
    </div>
  `;
}
