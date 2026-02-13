import { pricing, planOrder } from '../config.js';
import { formatCurrency } from '../utils.js';

function calculateAge(birthDate) {
  if (!birthDate) return '';
  const today = new Date();
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return '';
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age >= 0 ? age : '';
}

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
      const name = ((c.lastName || '') + (c.firstName || '')).toLowerCase();
      const mn = (c.memberNumber || '').toLowerCase();
      const course = (c.course || '').toLowerCase();
      const phone = (c.phone1 || c.phone || '').toLowerCase();
      const email = (c.email || '').toLowerCase();
      const reading = (c.reading || '').toLowerCase();
      return name.includes(term) || mn.includes(term) || course.includes(term) || phone.includes(term) || email.includes(term) || reading.includes(term);
    });
  }

  // Sort
  filtered.sort((a, b) => {
    const [, ca] = a;
    const [, cb] = b;
    const field = app.sortField || 'memberNumber';
    const order = app.sortOrder === 'desc' ? -1 : 1;

    if (field === 'memberNumber') {
      return ((ca.memberNumber || '9999').localeCompare(cb.memberNumber || '9999')) * order;
    }
    if (field === 'name') {
      const nameA = (ca.lastName || '') + (ca.firstName || '');
      const nameB = (cb.lastName || '') + (cb.firstName || '');
      return nameA.localeCompare(nameB) * order;
    }
    if (field === 'plan') {
      return ((planOrder[ca.course] || 99) - (planOrder[cb.course] || 99)) * order;
    }
    const va = ca[field] || '';
    const vb = cb[field] || '';
    return va.localeCompare(vb) * order;
  });

  // Status counts
  const allEntries = Object.values(customers);
  const activeCount = allEntries.filter(c => c.status === '\u5165\u4F1A\u4E2D').length;
  const pausedCount = allEntries.filter(c => c.status === '\u4F11\u4F1A\u4E2D').length;
  const withdrawnCount = allEntries.filter(c => c.status === '\u9000\u4F1A\u6E08\u307F').length;
  const statusBadge = (status) => {
    const map = {
      '\u5165\u4F1A\u4E2D': 'badge-active',
      '\u4F11\u4F1A\u4E2D': 'badge-paused',
      '\u9000\u4F1A\u6E08\u307F': 'badge-withdrawn'
    };
    return '<span class="badge ' + (map[status] || '') + '">' + (status || '\u4E0D\u660E') + '</span>';
  };

  const sortIcon = (field) => {
    if (app.sortField === field) return app.sortOrder === 'asc' ? ' \u25B2' : ' \u25BC';
    return '';
  };

  const sortClick = (field) => {
    return 'app.sortField=\x27' + field + '\x27;app.sortOrder=app.sortField===\x27' + field + '\x27&&app.sortOrder===\x27asc\x27?\x27desc\x27:\x27asc\x27;app.render()';
  };

  const genderClass = (gender) => {
    if (gender === '\u7537') return 'color:#4A90D9';
    if (gender === '\u5973') return 'color:#E91E8C';
    return '';
  };

  const statusTabClass = (status) => {
    if (app.statusFilter === status) return 'btn btn-primary';
    return 'btn';
  };

  return '\
    <div class="customers-view">\
      <div class="page-header">\
        <h1 class="page-title">\u9867\u5BA2\u4E00\u89A7</h1>\
        <div style="display:flex;gap:8px">\
          <button class="btn" onclick="app.exportCSV()">\u{1F4E5} CSV</button>\
          <button class="btn btn-primary" onclick="app.showAddForm=true;app.editingId=null;app.editForm={};app.render()">\uFF0B \u65B0\u898F\u767B\u9332</button>\
        </div>\
      </div>\
\
      <div style="display:flex;gap:8px;margin-bottom:16px">\
        <button class="' + statusTabClass('all') + '" onclick="app.statusFilter=\x27all\x27;app.render()">\u5168\u3066 (' + allEntries.length + ')</button>\
        <button class="' + statusTabClass('\u5165\u4F1A\u4E2D') + '" onclick="app.statusFilter=\x27\u5165\u4F1A\u4E2D\x27;app.render()">\u5165\u4F1A\u4E2D (' + activeCount + ')</button>\
        <button class="' + statusTabClass('\u4F11\u4F1A\u4E2D') + '" onclick="app.statusFilter=\x27\u4F11\u4F1A\u4E2D\x27;app.render()">\u4F11\u4F1A\u4E2D (' + pausedCount + ')</button>\
        <button class="' + statusTabClass('\u9000\u4F1A\u6E08\u307F') + '" onclick="app.statusFilter=\x27\u9000\u4F1A\u6E08\u307F\x27;app.render()">\u9000\u4F1A\u6E08\u307F (' + withdrawnCount + ')</button>\
      </div>\
\
      <div class="card" style="margin-bottom:16px">\
        <div class="card-body" style="padding:12px">\
          <input type="text" class="form-input" placeholder="\u4F1A\u54E1\u756A\u53F7\u3001\u6C0F\u540D\u3001\u30B3\u30FC\u30B9\u3001\u96FB\u8A71\u756A\u53F7\u3001\u30E1\u30FC\u30EB\u3067\u691C\u7D22..."\
            value="' + (app.searchTerm || '') + '"\
            oninput="app.searchTerm=this.value;app.render()"\
            style="width:100%">\
        </div>\
      </div>\
\
      ' + (app.showAddForm ? renderAddForm(app) : '') + '\\
      <div class="card">\
        <div class="card-body" style="overflow-x:auto;padding:0">\
          <table class="data-table" style="font-size:12px;white-space:nowrap">\
            <thead>\
              <tr>\
                <th style="width:40px;padding:8px 4px">No</th>\
                <th style="cursor:pointer;width:70px;padding:8px 4px" onclick="' + sortClick('memberNumber') + '">\u4F1A\u54E1\u756A\u53F7' + sortIcon('memberNumber') + '</th>\
                <th style="cursor:pointer;width:80px;padding:8px 4px" onclick="' + sortClick('status') + '">\u30B9\u30C6\u30FC\u30BF\u30B9' + sortIcon('status') + '</th>\
                <th style="cursor:pointer;width:60px;padding:8px 4px" onclick="' + sortClick('course') + '">\u30B3\u30FC\u30B9' + sortIcon('course') + '</th>\
                <th style="cursor:pointer;width:100px;padding:8px 4px" onclick="' + sortClick('annualFee') + '">\u5E74\u4F1A\u8CBB\u66F4\u65B0\u65E5' + sortIcon('annualFee') + '</th>\
                <th style="cursor:pointer;width:120px;padding:8px 4px" onclick="' + sortClick('name') + '">\u6C0F\u540D' + sortIcon('name') + '</th>\
                <th style="cursor:pointer;width:120px;padding:8px 4px" onclick="' + sortClick('reading') + '">\u8AAD\u307F' + sortIcon('reading') + '</th>\
                <th style="cursor:pointer;width:100px;padding:8px 4px" onclick="' + sortClick('guardianName') + '">\u4FDD\u8B77\u8005\u540D' + sortIcon('guardianName') + '</th>\
                <th style="cursor:pointer;width:100px;padding:8px 4px" onclick="' + sortClick('hakomonoName') + '">\u30CF\u30B3\u30E2\u30CE\u767B\u9332\u540D' + sortIcon('hakomonoName') + '</th>\
                <th style="cursor:pointer;width:50px;padding:8px 4px" onclick="' + sortClick('gender') + '">\u6027\u5225' + sortIcon('gender') + '</th>\
                <th style="cursor:pointer;width:100px;padding:8px 4px" onclick="' + sortClick('birthDate') + '">\u751F\u5E74\u6708\u65E5' + sortIcon('birthDate') + '</th>\
                <th style="width:50px;padding:8px 4px">\u5E74\u9F62</th>\
                <th style="cursor:pointer;width:120px;padding:8px 4px" onclick="' + sortClick('phone1') + '">\u96FB\u8A71\u756A\u53F7' + sortIcon('phone1') + '</th>\
                <th style="cursor:pointer;width:180px;padding:8px 4px" onclick="' + sortClick('email') + '">\u30E1\u30FC\u30EB' + sortIcon('email') + '</th>\
                <th style="cursor:pointer;width:100px;padding:8px 4px" onclick="' + sortClick('joinDate') + '">\u5165\u4F1A\u65E5' + sortIcon('joinDate') + '</th>\
                <th style="cursor:pointer;width:80px;padding:8px 4px" onclick="' + sortClick('postalCode') + '">\u90F5\u4FBF\u756A\u53F7' + sortIcon('postalCode') + '</th>\
                <th style="cursor:pointer;width:80px;padding:8px 4px" onclick="' + sortClick('prefecture') + '">\u90FD\u9053\u5E9C\u770C' + sortIcon('prefecture') + '</th>\
                <th style="cursor:pointer;width:120px;padding:8px 4px" onclick="' + sortClick('city') + '">\u5E02\u533A\u753A\u6751' + sortIcon('city') + '</th>\
                <th style="cursor:pointer;width:120px;padding:8px 4px" onclick="' + sortClick('address') + '">\u756A\u5730' + sortIcon('address') + '</th>\
                <th style="cursor:pointer;width:120px;padding:8px 4px" onclick="' + sortClick('building') + '">\u5EFA\u7269\u30FB\u90E8\u5C4B\u756A\u53F7' + sortIcon('building') + '</th>\
                <th style="width:200px;padding:8px 4px">\u5099\u8003</th>\
                <th style="width:80px;padding:8px 4px">\u64CD\u4F5C</th>\
              </tr>\
            </thead>\
            <tbody>\
              ' + filtered.map(([id, c], i) => '\
                <tr>\
                  <td style="padding:6px 4px">' + (i + 1) + '</td>\
                  <td style="padding:6px 4px;font-family:monospace">' + (c.memberNumber || '') + '</td>\
                  <td style="padding:6px 4px">' + statusBadge(c.status) + '</td>\
                  <td style="padding:6px 4px">' + (c.course || '') + '</td>\
                  <td style="padding:6px 4px">' + (c.annualFee || '') + '</td>\
                  <td style="padding:6px 4px;font-weight:500">' + (c.lastName || '') + ' ' + (c.firstName || '') + '</td>\
                  <td style="padding:6px 4px">' + (c.reading || '') + '</td>\
                  <td style="padding:6px 4px">' + (c.guardianName || '') + '</td>\
                  <td style="padding:6px 4px">' + (c.hakomonoName || '') + '</td>\
                  <td style="padding:6px 4px;text-align:center;' + genderClass(c.gender) + '">' + (c.gender || '') + '</td>\
                  <td style="padding:6px 4px">' + (c.birthDate || '') + '</td>\
                  <td style="padding:6px 4px;text-align:center">' + calculateAge(c.birthDate) + '</td>\
                  <td style="padding:6px 4px">' + (c.phone1 || c.phone || '') + '</td>\
                  <td style="padding:6px 4px;font-size:11px">' + (c.email || '') + '</td>\
                  <td style="padding:6px 4px">' + (c.joinDate || '') + '</td>\
                  <td style="padding:6px 4px">' + (c.postalCode || '') + '</td>\
                  <td style="padding:6px 4px">' + (c.prefecture || '') + '</td>\
                  <td style="padding:6px 4px">' + (c.city || '') + '</td>\
                  <td style="padding:6px 4px">' + (c.address || '') + '</td>\
                  <td style="padding:6px 4px">' + (c.building || '') + '</td>\
                  <td style="padding:6px 4px;font-size:11px;white-space:normal;max-width:200px">' + (c.memo || '') + '</td>\
                  <td style="padding:6px 4px">\
                    <button class="btn btn-sm" onclick="app.startEdit(\x27' + id + '\x27)">\u7DE8Uõ96C6</button>\
                    <button class="btn btn-sm btn-danger" onclick="app.deleteCustomer(\x27' + id + '\x27)">\u524A\u9664</button>\
                  </td>\
                </tr>\
              ').join('') + '\
            </tbody>\
          </table>\
          ' + (filtered.length === 0 ? '<p style="text-align:center;padding:32px;color:var(--color-text-secondary)">\u9867\u5BA2\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093</p>' : '') + '\
          <div style="padding:12px 16px;font-size:13px;color:var(--color-text-secondary);border-top:1px solid var(--color-border)">\
            ' + (app.statusFilter === 'all' ? '\u5168\u3066' : app.statusFilter) + ': ' + filtered.length + '\u540D\
          </div>\
        </div>\
      </div>\
    </div>\
  ';
}

function renderAddForm(app) {
  const ef = app.editForm || {};
  return '\
    <div class="card" style="margin-bottom:16px;border-left:4px solid var(--color-primary)">\
      <div class="card-header">\
        <h3 class="card-title">' + (app.editingId? '\u9867\u5BA2\u7DE8\u96C6' : '\u65B0\u898F\u9867\u5BA2\u767B\u9332') + '</h3>\
        <button class="btn btn-sm" onclick="app.showAddForm=false;app.editingId=null;app.editForm={};app.render()">\u2715</button>\
      </div>\
      <div class="card-body">\
        <form onsubmit="event.preventDefault();app.saveCustomerForm()" style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px">\
          <div class="form-group">\
            <label class="form-label">\u4F1A\u54E1\u756A\u53F7 *</label>\
            <input type="text" class="form-input" id="form-memberNumber" value="' + (ef.memberNumber || '') + '" placeholder="\u4F8B: 0001" required>\
          </div>\
          <div class="form-group">\
            <label class="form-label">\u4F1A\u54E1\u30B9\u30C6\u30FC\u30BF\u30B9</label>\
            <select class="form-select" id="form-status">\
              <option value="\u5165\u4F1A\u4E2D"' + (ef.status === '\u5165\u4F1A\u4E2D' || !ef.status ? ' selected' : '') + '>\u5165\u4F1A\u4E2D</option>\
              <option value="\u4F11\u4F1A\u4E2D"' + (ef.status === '\u4F11\u4F1A\u4E2D' ? ' selected' : '') + '>\u4F11\u4F1A\u4E2D</option>\
              <option value="\u9000\u4F1A\u6E08\u307F"' + (ef.status === '\u9000\u4F1A\u6E08\u307F' ? ' selected' : '') + '>\u9000\u4F1A\u6E08\u307F</option>\
            </select>\
          </div>\
          <div class="form-group">\
            <label class="form-label">\u30B3\u30FC\u30B9</label>\
            <select class="form-select" id="form-course">\
              <option value="">\u9078\u629E\u3057\u3066\u304F\u3060\u3055\u3044</option>\
              <option value="\u30D3\u30B8\u30BF\u30FC"' + (ef.course === '\u30D3\u30B8\u30BF\u30FC' ? ' selected' : '') + '>\u30D3\u30B8\u30BF\u30FC</option>\
              <option value="\uFF11"' + (ef.course === '\uFF11' ? ' selected' : '') + '>\uFF11</option>\
              <option value="\uFF12"' + (ef.course === '\uFF12' ? ' selected' : '') + '>\uFF12</option>\
              <option value="\uFF13"' + (ef.course === '\uFF13' ? ' selected' : '') + '>\uFF13</option>\
              <option value="\uFF14"' + (ef.course === '\uFF14' ? ' selected' : '') + '>\uFF14</option>\
            </select>\
          </div>\
          <div class="form-group">\
            <label class="form-label">\u5E74\u4F1A\u8CBB\u66F4\u65B0\u65E5</label>\
            <input type="date" class="form-input" id="form-annualFee" value="' + (ef.annualFee || '') + '">\
          </div>\
          <div class="form-group">\
            <label class="form-label">\u6C0F\u540D(\u59D3) *</label>\
            <input type="text" class="form-input" id="form-lastName" value="' + (ef.lastName || '') + '" required>\
          </div>\
          <div class="form-group">\
            <label class="form-label">\u6C0F\u540D(\u540D) *</label>\
            <input type="text" class="form-input" id="form-firstName" value="' + (ef.firstName || '') + '">\
          </div>\
          <div class="form-group">\
            <label class="form-label">\u8AAD\u307F</label>\
            <input type="text" class="form-input" id="form-reading" value="' + (ef.reading || '') + '">\
          </div>\
          <div class="form-group">\
            <label class="form-label">\u4FDD\u8B77\u8005\u540D</label>\
            <input type="text" class="form-input" id="form-guardianName" value="' + (ef.guardianName || '') + '">\
          </div>\
          <div class="form-group">\
            <label class="form-label">\u30CF\u30B3\u30E2\u30CE\u767B\u9332\u540D</label>\
            <input type="text" class="form-input" id="form-hakomonoName" value="' + (ef.hakomonoName || '') + '">\
          </div>\
          <div class="form-group">\
            <label class="form-label">\u6027\u5225</label>\
            <select class="form-select" id="form-gender">\
              <option value="">\u9078\u629E</option>\
              <option value="\u7537"' + (ef.gender === '\u7537' ? ' selected' : '') + '>\u7537</option>\
              <option value="\u5973"' + (ef.gender === '\u5973' ? ' selected' : '') + '>\u5973</option>\
            </select>\
          </div>\
          <div class="form-group">\
            <label class="form-label">\u751F\u5E74\u6708\u65E5</label>\
            <input type="date" class="form-input" id="form-birthDate" value="' + (ef.birthDate || '') + '">\
          </div>\
          <div class="form-group">\
            <label class="form-label">\u96FB\u8A71\u756A\u53F7</label>\
            <input type="tel" class="form-input" id="form-phone1" value="' + (ef.phone1 || ef.phone || '') + '">\
          </div>\
          <div class="form-group" style="grid-column:span 2">\
            <label class="form-label">\u30E1\u30FC\u30EB</label>\
            <input type="email" class="form-input" id="form-email" value="' + (ef.email || '') + '">\
          </div>\
          <div class="form-group">\
            <label class="form-label">\u5165\u4F1A\u65E5</label>\
            <input type="date" class="form-input" id="form-joinDate" value="' + (ef.joinDate || '') + '">\
          </div>\
          <div class="form-group">\
            <label class="form-label">\u90F5\u4FBF\u756A\u53F7</label>\
            <input type="text" class="form-input" id="form-postalCode" value="' + (ef.postalCode || '') + '">\
          </div>\
          <div class="form-group">\
            <label class="form-label">\u90FD\u9053\u5E9C\u770C</label>\
            <input type="text" class="form-input" id="form-prefecture" value="' + (ef.prefecture || '') + '">\
          </div>\
          <div class="form-group">\
            <label class="form-label">\u5E02\u533A\u753A\u6751</label>\
            <input type="text" class="form-input" id="form-city" value="' + (ef.city || '') + '">\
          </div>\
          <div class="form-group">\
            <label class="form-label">\u756A\u5730</label>\
            <input type="text" class="form-input" id="form-address" value="' + (ef.address || '') + '">\
          </div>\
          <div class="form-group">\
            <label class="form-label">\u5EFA\u7269\u30FB\u90E8\u5C4B\u756A\u53F7</label>\
            <input type="text" class="form-input" id="form-building" value="' + (ef.building || '') + '">\
          </div>\
          <div class="form-group" style="grid-column:span 3">\
            <label class="form-label">\u5099\u8003</label>\
            <input type="text" class="form-input" id="form-memo" value="' + (ef.memo || '') + '">\
          </div>\
          <div style="grid-column:1/-1;display:flex;gap:8px;justify-content:flex-end">\
            <button type="button" class="btn" onclick="app.showAddForm=false;app.editingId=null;app.editForm={};app.render()">\u30AD\u30E3\u30F3\u30BB\u30EB</button>\
            <button type="submit" class="btn btn-primary">' + (app.editingId ? '\u66F4\u65B0' : '\u767B\u9332') + '</button>\
          </div>\
        </form>\
      </div>\
    </div>\
  ';
}
