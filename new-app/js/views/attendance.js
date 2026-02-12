import { pricing, planOrder, dayOrder } from '../config.js';
import { calculateVisitorRevenue, calculateDetailedRevenue, calculatePracticeRevenue, formatCurrency } from '../utils.js';

export function renderAttendance(app) {
  const days = dayOrder;
  const selectedDay = app.selectedDay || days[0];
  const scheduleData = app.scheduleData || {};
  const dayClasses = Array.isArray(scheduleData[selectedDay]) ? scheduleData[selectedDay] : [];
  const attendanceData = app.attendanceData || {};
  const attendanceTab = app.attendanceTab || 'overview';

  // Revenue calculations
  const visitorRevenue = calculateVisitorRevenue(app.selectedMonth, attendanceData, scheduleData);
  const detailed = calculateDetailedRevenue(app.selectedMonth, attendanceData, scheduleData);
  const practice = calculatePracticeRevenue(attendanceData);

  // Calculate total classes and total students from scheduleData
  let totalClasses = 0;
  let totalStudents = 0;
  days.forEach(day => {
    const dc = Array.isArray(scheduleData[day]) ? scheduleData[day] : [];
    totalClasses += dc.length;
    dc.forEach(cls => {
      const students = cls.students || [];
      totalStudents += students.length;
    });
  });

  return `
   <div class="attendance-view">
    <div class="page-header">
      <h1 class="page-title">\u51FA\u5E2D\u540D\u7C3F</h1>
      <div style="display:flex;gap:var(--spacing-3);align-items:center">
        <input type="month" class="form-input" value="${app.selectedMonth || ''}"
          onchange="app.changeMonth(this.value)">
        <button class="btn btn-sm" onclick="app.downloadBackup()">\u30D0\u30C3\u30AF\u30A2\u30C3\u30D7</button>
      </div>
    </div>

    <!-- Top tabs -->
    <div class="tab-bar" style="margin-bottom:var(--spacing-4)">
      <div class="tab-item ${attendanceTab === 'overview' ? 'active' : ''}"
        onclick="app.attendanceTab='overview';app.render()">HOME</div>
      <div class="tab-item ${attendanceTab === 'record' ? 'active' : ''}"
        onclick="app.attendanceTab='record';app.render()">\u51FA\u5E2D\u8A18\u9332</div>
    </div>

    ${attendanceTab === 'overview' ? renderOverviewTab(app, days, scheduleData, attendanceData, visitorRevenue, detailed, practice, totalClasses, totalStudents) : ''}
    ${attendanceTab === 'record' ? renderRecordTab(app, days, selectedDay, dayClasses, attendanceData, scheduleData) : ''}
   </div>
  `;
}

function renderOverviewTab(app, days, scheduleData, attendanceData, visitorRevenue, detailed, practice, totalClasses, totalStudents) {
  const weeks = ['week1', 'week2', 'week3', 'week4', 'week5'];
  const practiceDays = ['\u6708\u66DC\u65E5', '\u6728\u66DC\u65E5'];

  // Calculate practice revenue
  let practiceTotal = 0;
  practiceDays.forEach(day => {
    const key = `\u7DF4\u7FD2\u4F1A_${day}`;
    const data = attendanceData[key] || {};
    weeks.forEach(w => {
      practiceTotal += (parseInt(data[w]) || 0) * (pricing['\u7DF4\u7FD2\u4F1A'] || 500);
    });
  });

  return `
    <!-- Summary Cards -->
    <div class="stat-grid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:var(--spacing-4);margin-bottom:var(--spacing-6)">
      <div class="stat-card" style="background:white;border-radius:var(--radius-lg);padding:var(--spacing-4);box-shadow:var(--shadow-sm)">
        <div style="display:flex;align-items:center;gap:var(--spacing-2);margin-bottom:var(--spacing-2)">
          <span style="font-size:1.5rem">\uD83D\uDCC5</span>
          <span style="color:var(--color-text-secondary);font-size:0.875rem">\u7DCF\u30AF\u30E9\u30B9\u6570</span>
        </div>
        <div style="font-size:2rem;font-weight:700">${totalClasses}</div>
        <div style="color:var(--color-text-secondary);font-size:0.875rem">\u30AF\u30E9\u30B9</div>
      </div>
      <div class="stat-card" style="background:white;border-radius:var(--radius-lg);padding:var(--spacing-4);box-shadow:var(--shadow-sm)">
        <div style="display:flex;align-items:center;gap:var(--spacing-2);margin-bottom:var(--spacing-2)">
          <span style="font-size:1.5rem">\uD83D\uDC65</span>
          <span style="color:var(--color-text-secondary);font-size:0.875rem">\u7DCF\u751F\u5F92\u6570\uFF08\u5EF6\u3079\uFF09</span>
        </div>
        <div style="font-size:2rem;font-weight:700;color:var(--color-primary)">${totalStudents}</div>
        <div style="color:var(--color-text-secondary);font-size:0.875rem">\u540D</div>
      </div>
      <div class="stat-card" style="background:white;border-radius:var(--radius-lg);padding:var(--spacing-4);box-shadow:var(--shadow-sm)">
        <div style="display:flex;align-items:center;gap:var(--spacing-2);margin-bottom:var(--spacing-2)">
          <span style="font-size:1.5rem">\uD83D\uDCB0</span>
          <span style="color:var(--color-text-secondary);font-size:0.875rem">\u30D3\u30B8\u30BF\u30FC\u58F2\u4E0A</span>
        </div>
        <div style="font-size:2rem;font-weight:700;color:var(--color-danger)">${formatCurrency(visitorRevenue)}</div>
      </div>
      <div class="stat-card" style="background:white;border-radius:var(--radius-lg);padding:var(--spacing-4);box-shadow:var(--shadow-sm)">
        <div style="display:flex;align-items:center;gap:var(--spacing-2);margin-bottom:var(--spacing-2)">
          <span style="font-size:1.5rem">\u23F0</span>
          <span style="color:var(--color-text-secondary);font-size:0.875rem">\u7DF4\u7FD2\u4F1A\u58F2\u4E0A</span>
        </div>
        <div style="font-size:2rem;font-weight:700">${formatCurrency(practiceTotal)}</div>
        <div style="color:var(--color-text-secondary);font-size:0.875rem">${practiceDays.reduce((sum, day) => {
          const key = `\u7DF4\u7FD2\u4F1A_${day}`;
          const data = attendanceData[key] || {};
          return sum + weeks.reduce((s, w) => s + (parseInt(data[w]) || 0), 0);
        }, 0)}\u540D\u53C2\u52A0</div>
      </div>
    </div>

    <!-- Revenue breakdown -->
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">\u58F2\u4E0A\u5185\u8A33\uFF08\u53D7\u8B1B\u4EBA\u6570\u30FB\u58F2\u4E0A\uFF09</h2>
      </div>
      <div class="card-body">
        <table class="data-table">
          <thead>
            <tr>
              <th>\u30AB\u30C6\u30B4\u30EA</th>
              <th style="text-align:center">\u53D7\u8B1B\u4EBA\u6570</th>
              <th style="text-align:right">\u5358\u4FA1</th>
              <th style="text-align:right">\u58F2\u4E0A</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(detailed).map(([cat, data]) => {
              const price = pricing[cat] || 0;
              return `
                <tr>
                  <td>${cat}</td>
                  <td style="text-align:center">${data.count > 0 ? `<span class="badge badge-green">${data.count}\u56DE</span>` : '-'}</td>
                  <td style="text-align:right">${formatCurrency(price)}</td>
                  <td style="text-align:right">${data.revenue > 0 ? `<strong style="color:var(--color-danger)">${formatCurrency(data.revenue)}</strong>` : '-'}</td>
                </tr>
              `;
            }).join('')}
            <tr style="font-weight:700;border-top:2px solid var(--color-gray-300)">
              <td>\u5408\u8A08</td>
              <td></td>
              <td></td>
              <td style="text-align:right">${formatCurrency(visitorRevenue)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Practice sessions -->
    <div class="card" style="margin-top:var(--spacing-4)">
      <div class="card-header">
        <h2 class="card-title">\u7DF4\u7FD2\u4F1A</h2>
        <span class="card-badge">${formatCurrency(practiceTotal)}</span>
      </div>
      <div class="card-body">
        ${practiceDays.map(day => {
          const key = `\u7DF4\u7FD2\u4F1A_${day}`;
          const data = attendanceData[key] || {};
          return `
            <div style="margin-bottom:var(--spacing-4)">
              <h3 style="font-size:1rem;margin-bottom:var(--spacing-2)">${day} \u7DF4\u7FD2\u4F1A</h3>
              <table class="data-table">
                <thead>
                  <tr>
                    <th></th>
                    ${weeks.map((_, i) => `<th style="text-align:center">\u7B2C${i+1}\u9031</th>`).join('')}
                    <th style="text-align:center">\u5408\u8A08</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>\u53C2\u52A0\u4EBA\u6570</td>
                    ${weeks.map(w => {
                      const count = data[w] || 0;
                      return `<td style="text-align:center">
                        <input type="number" class="form-input" style="width:60px;text-align:center"
                          value="${count}" min="0"
                          onchange="app.updatePractice('${key}','${w}',parseInt(this.value)||0)">
                      </td>`;
                    }).join('')}
                    <td style="text-align:center">
                      <strong>${weeks.reduce((sum, w) => sum + (parseInt(data[w]) || 0), 0)}\u540D</strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function isRegularPlan(plan) {
  const regularPlans = ['1\u30AF\u30E9\u30B9', '\uFF11\u30AF\u30E9\u30B9', '2\u30AF\u30E9\u30B9', '\uFF12\u30AF\u30E9\u30B9', '3\u30AF\u30E9\u30B9', '\uFF13\u30AF\u30E9\u30B9', '4\u30AF\u30E9\u30B9', '\uFF14\u30AF\u30E9\u30B9', '1.5h\u30AF\u30E9\u30B9'];
  return regularPlans.includes(plan);
}

function sortStudentsByPlan(students) {
  return [...students].sort((a, b) => {
    const normalizePlan = (plan) => {
      return plan.replace(/[\uFF10-\uFF19]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
    };
    const planA = normalizePlan(a.plan || '');
    const planB = normalizePlan(b.plan || '');
    const orderA = planOrder[planA] || 999;
    const orderB = planOrder[planB] || 999;
    return orderA - orderB;
  });
}

function getAttendanceRate(attendanceData, studentKey) {
  const data = attendanceData[studentKey] || {};
  const weeks = ['week1', 'week2', 'week3', 'week4'];
  const attended = weeks.filter(w => data[w] === '\u25CB').length;
  const recorded = weeks.filter(w => data[w] === '\u25CB' || data[w] === '\u00D7' || data[w] === '\u2715' || data[w] === 'x' || data[w] === 'X').length;
  return recorded > 0 ? Math.round((attended / recorded) * 100) : 0;
}

function getAttBtnStyle(val) {
  if (val === '\u25CB') return 'background:#22c55e;border-color:#16a34a;color:white;';
  if (val === '\u00D7' || val === '\u2715' || val === 'x' || val === 'X') return 'background:#ef4444;border-color:#dc2626;color:white;';
  if (val === '\u4F11\u8B1B') return 'background:#6b7280;border-color:#4b5563;color:white;';
  return 'background:#f3f4f6;border-color:#d1d5db;color:#9ca3af;';
}

function getAttDisplay(val) {
  if (val === '\u4F11\u8B1B') return '\u4F11';
  return val || '-';
}

function getRateBadgeStyle(rate) {
  if (rate >= 80) return 'background:#dcfce7;color:#166534;';
  if (rate >= 50) return 'background:#fef9c3;color:#854d0e;';
  if (rate > 0) return 'background:#fee2e2;color:#991b1b;';
  return 'background:#f3f4f6;color:#4b5563;';
}

function escapeAttr(str) {
  return (str || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

function renderRecordTab(app, days, selectedDay, dayClasses, attendanceData, scheduleData) {
  const weeks = ['week1', 'week2', 'week3', 'week4', 'week5'];
  const weekLabels = ['\u7B2C1\u9031', '\u7B2C2\u9031', '\u7B2C3\u9031', '\u7B2C4\u9031', '\u4E88\u5099'];
  const editingStudent = app.editingStudent || null;
  const showAddForm = app.showAddStudentForm || false;
  const selectedClassForAdd = app.selectedClassForAdd || null;

  return `
    <!-- Day tabs -->
    <div class="tab-bar" style="margin-bottom:var(--spacing-4)">
      ${days.map(day => `
        <div class="tab-item ${day === selectedDay ? 'active' : ''}"
          onclick="app.selectedDay='${day}';app.render()">
          ${day}
        </div>
      `).join('')}
    </div>

    <!-- Add student form -->
    ${showAddForm && selectedClassForAdd && selectedClassForAdd.day === selectedDay ? renderAddStudentForm(app, selectedClassForAdd) : ''}

    ${dayClasses.map((cls, classIdx) => {
      const students = cls.students || [];
      const location = cls.location || '';
      const className = cls.name || '';
      const classColor = cls.color || 'blue';

      // Sort students by plan
      const sortedStudents = sortStudentsByPlan(students);

      // Filter: regular plan students always show; visitors only if they have attendance data this month
      const filteredStudents = sortedStudents.filter(student => {
        if (isRegularPlan(student.plan)) return true;
        const key = selectedDay + '_' + location + '_' + className + '_' + (student.lastName || '') + (student.firstName || '');
        return attendanceData.hasOwnProperty(key);
      });

      // Also add attendance-only entries (visitors/trial added via attendance data)
      const classPrefix = selectedDay + '_' + location + '_' + className + '_';
      const existingNames = new Set(filteredStudents.map(s => (s.lastName || '') + (s.firstName || '')));

      Object.keys(attendanceData).forEach(key => {
        if (key.startsWith(classPrefix)) {
          const studentName = key.substring(classPrefix.length);
          if (!existingNames.has(studentName)) {
            const attEntry = attendanceData[key] || {};
            const plan = attEntry._plan || '\u30D3\u30B8\u30BF\u30FC\uFF08\u4F1A\u54E1\uFF09';
            filteredStudents.push({lastName: studentName, firstName: '', plan: plan});
            existingNames.add(studentName);
          }
        }
      });

      const colorMap = {
        red: '#dc2626', orange: '#ea580c', blue: '#2563eb',
        green: '#16a34a', purple: '#9333ea', yellow: '#eab308'
      };
      const headerBg = colorMap[classColor] || '#2563eb';

      return `
        <div class="card" style="margin-bottom:var(--spacing-4);overflow:hidden">
          <div style="background:${headerBg};color:white;padding:var(--spacing-3) var(--spacing-4);display:flex;justify-content:space-between;align-items:center">
            <h3 style="font-size:1rem;font-weight:700;margin:0">${location} - ${className}</h3>
            <div style="display:flex;gap:var(--spacing-2);align-items:center">
              <span style="font-size:0.75rem;opacity:0.9">${filteredStudents.length}\u540D</span>
              <button onclick="app.addStudentToClass('${escapeAttr(selectedDay)}','${escapeAttr(location)}','${escapeAttr(className)}')"
                style="background:rgba(255,255,255,0.2);border:none;color:white;padding:4px 8px;border-radius:4px;font-size:0.75rem;cursor:pointer">
                + \u751F\u5F92\u8FFD\u52A0
              </button>
            </div>
          </div>
          <div class="card-body" style="padding:var(--spacing-3);overflow-x:auto">
            <table class="data-table" style="font-size:0.75rem">
              <thead>
                <tr>
                  <th style="width:100px;padding:var(--spacing-2)">\u6C0F\u540D</th>
                  <th style="width:100px;padding:var(--spacing-2)">\u30D7\u30E9\u30F3</th>
                  ${weekLabels.map(label => `<th style="text-align:center;width:50px;padding:var(--spacing-2)">${label}</th>`).join('')}
                  <th style="text-align:center;width:60px;padding:var(--spacing-2)">\u51FA\u5E2D\u7387</th>
                  <th style="text-align:center;width:50px;padding:var(--spacing-2)">\u7DE8\u96C6</th>
                </tr>
              </thead>
              <tbody>
                ${filteredStudents.map(student => {
                  const studentName = (student.lastName || '') + (student.firstName || '');
                  const studentKey = selectedDay + '_' + location + '_' + className + '_' + studentName;
                  const attData = attendanceData[studentKey] || {};
                  const rate = getAttendanceRate(attendanceData, studentKey);
                  const isEditing = editingStudent &&
                    editingStudent.day === selectedDay &&
                    editingStudent.location === location &&
                    editingStudent.className === className &&
                    editingStudent.lastName === student.lastName &&
                    editingStudent.firstName === student.firstName;

                  if (isEditing) {
                    return renderEditingRow(app, student, studentKey, attData, rate, weeks, selectedDay, location, className);
                  }

                  return `
                    <tr style="border-bottom:1px solid var(--color-gray-200)">
                      <td style="padding:var(--spacing-2);font-size:0.75rem">${student.lastName} ${student.firstName}</td>
                      <td style="padding:var(--spacing-2);font-size:0.75rem">${student.plan || '-'}</td>
                      ${weeks.map(w => {
                        const val = attData[w] || '';
                        return `<td style="text-align:center;padding:var(--spacing-2)">
                          <button onclick="app.toggleAttendance('${escapeAttr(studentKey)}','${w}')"
                            style="width:32px;height:32px;border-radius:4px;border:1px solid;font-size:0.75rem;font-weight:700;cursor:pointer;${getAttBtnStyle(val)}">
                            ${getAttDisplay(val)}
                          </button>
                        </td>`;
                      }).join('')}
                      <td style="text-align:center;padding:var(--spacing-2)">
                        <span style="padding:2px 8px;border-radius:9999px;font-size:0.75rem;font-weight:600;${getRateBadgeStyle(rate)}">
                          ${rate > 0 ? rate + '%' : '-'}
                        </span>
                      </td>
                      <td style="text-align:center;padding:var(--spacing-2)">
                        <button onclick="app.startEditStudent('${escapeAttr(selectedDay)}','${escapeAttr(location)}','${escapeAttr(className)}','${escapeAttr(student.lastName)}','${escapeAttr(student.firstName)}')"
                          style="background:none;border:none;color:var(--color-primary);cursor:pointer;font-size:0.75rem">
                          \u7DE8\u96C6
                        </button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }).join('')}

    ${dayClasses.length === 0 ? '<div class="card"><div class="card-body" style="text-align:center;padding:var(--spacing-8);color:var(--color-text-secondary)">\u3053\u306E\u66DC\u65E5\u306B\u306F\u30AF\u30E9\u30B9\u304C\u3042\u308A\u307E\u305B\u3093</div></div>' : ''}
  `;
}

function renderEditingRow(app, student, studentKey, attData, rate, weeks, selectedDay, location, className) {
  const planOptions = [
    '\uFF14\u30AF\u30E9\u30B9', '\uFF13\u30AF\u30E9\u30B9', '\uFF12\u30AF\u30E9\u30B9', '\uFF11\u30AF\u30E9\u30B9',
    '\u30D3\u30B8\u30BF\u30FC\uFF08\u4F1A\u54E1\uFF09', '\u30D3\u30B8\u30BF\u30FC\uFF08\u975E\u4F1A\u54E1\uFF09',
    '\u30D3\u30B8\u30BF\u30FC\uFF08\u632F\u66FF\uFF09', '\u521D\u56DE\u4F53\u9A13', '\u521D\u56DE\u7121\u6599'
  ];

  return `
    <tr style="border-bottom:1px solid var(--color-gray-200);background:#eff6ff">
      <td style="padding:var(--spacing-2);font-size:0.75rem">${student.lastName} ${student.firstName}</td>
      <td style="padding:var(--spacing-2);font-size:0.75rem">
        <select id="edit_student_plan" class="form-input" style="font-size:0.75rem;padding:2px 4px">
          ${planOptions.map(p => `<option value="${p}" ${student.plan === p ? 'selected' : ''}>${p}</option>`).join('')}
        </select>
      </td>
      ${weeks.map(w => {
        const val = attData[w] || '';
        return `<td style="text-align:center;padding:var(--spacing-2)">
          <button onclick="app.toggleAttendance('${escapeAttr(studentKey)}','${w}')"
            style="width:32px;height:32px;border-radius:4px;border:1px solid;font-size:0.75rem;font-weight:700;cursor:pointer;${getAttBtnStyle(val)}">
            ${getAttDisplay(val)}
          </button>
        </td>`;
      }).join('')}
      <td style="text-align:center;padding:var(--spacing-2)">
        <span style="padding:2px 8px;border-radius:9999px;font-size:0.75rem;font-weight:600;${getRateBadgeStyle(rate)}">
          ${rate > 0 ? rate + '%' : '-'}
        </span>
      </td>
      <td style="text-align:center;padding:var(--spacing-2)">
        <div style="display:flex;flex-direction:column;gap:4px">
          <button onclick="app.saveEditStudent()"
            style="background:none;border:none;color:#16a34a;cursor:pointer;font-size:0.75rem">\u4FDD\u5B58</button>
          <button onclick="app.cancelEditStudent()"
            style="background:none;border:none;color:#6b7280;cursor:pointer;font-size:0.75rem">\u30AD\u30E3\u30F3\u30BB\u30EB</button>
          <button onclick="app.deleteStudent('${escapeAttr(selectedDay)}','${escapeAttr(location)}','${escapeAttr(className)}','${escapeAttr(student.lastName)}','${escapeAttr(student.firstName)}')"
            style="background:none;border:none;color:#dc2626;cursor:pointer;font-size:0.75rem">\u524A\u9664</button>
        </div>
      </td>
    </tr>
  `;
}

function renderAddStudentForm(app, classInfo) {
  const planOptions = [
    {value: '', label: '\u9078\u629E\u3057\u3066\u304F\u3060\u3055\u3044'},
    {value: '\uFF14\u30AF\u30E9\u30B9', label: '\uFF14\u30AF\u30E9\u30B9'},
    {value: '\uFF13\u30AF\u30E9\u30B9', label: '\uFF13\u30AF\u30E9\u30B9'},
    {value: '\uFF12\u30AF\u30E9\u30B9', label: '\uFF12\u30AF\u30E9\u30B9'},
    {value: '\uFF11\u30AF\u30E9\u30B9', label: '\uFF11\u30AF\u30E9\u30B9'},
    {value: '\u30D3\u30B8\u30BF\u30FC\uFF08\u4F1A\u54E1\uFF09', label: '\u30D3\u30B8\u30BF\u30FC\uFF08\u4F1A\u54E1\uFF09'},
    {value: '\u30D3\u30B8\u30BF\u30FC\uFF08\u975E\u4F1A\u54E1\uFF09', label: '\u30D3\u30B8\u30BF\u30FC\uFF08\u975E\u4F1A\u54E1\uFF09'},
    {value: '\u30D3\u30B8\u30BF\u30FC\uFF08\u632F\u66FF\uFF09', label: '\u30D3\u30B8\u30BF\u30FC\uFF08\u632F\u66FF\uFF09'},
    {value: '\u521D\u56DE\u4F53\u9A13', label: '\u521D\u56DE\u4F53\u9A13'},
    {value: '\u521D\u56DE\u7121\u6599', label: '\u521D\u56DE\u7121\u6599'}
  ];

  return `
    <div style="background:#eff6ff;padding:var(--spacing-4);border-radius:var(--radius-lg);margin-bottom:var(--spacing-4);border:1px solid #bfdbfe">
      <h3 style="font-size:1rem;font-weight:600;margin-bottom:var(--spacing-3)">\u751F\u5F92\u8FFD\u52A0 - ${classInfo.location} ${classInfo.className}</h3>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:var(--spacing-3);margin-bottom:var(--spacing-3)">
        <div>
          <label style="display:block;font-size:0.75rem;font-weight:500;margin-bottom:4px">\u59D3 *</label>
          <input type="text" id="new_student_lastName" class="form-input" style="width:100%;font-size:0.875rem">
        </div>
        <div>
          <label style="display:block;font-size:0.75rem;font-weight:500;margin-bottom:4px">\u540D *</label>
          <input type="text" id="new_student_firstName" class="form-input" style="width:100%;font-size:0.875rem">
        </div>
        <div>
          <label style="display:block;font-size:0.75rem;font-weight:500;margin-bottom:4px">\u30D7\u30E9\u30F3 *</label>
          <select id="new_student_plan" class="form-input" style="width:100%;font-size:0.875rem">
            ${planOptions.map(p => `<option value="${p.value}">${p.label}</option>`).join('')}
          </select>
        </div>
      </div>
      <div style="font-size:0.75rem;color:var(--color-text-secondary);margin-bottom:var(--spacing-3)">
        \u203B \u30D3\u30B8\u30BF\u30FC\u3084\u521D\u56DE\u4F53\u9A13\u306E\u65B9\u306F\u9069\u5207\u306A\u30D7\u30E9\u30F3\u3092\u9078\u629E\u3057\u3066\u304F\u3060\u3055\u3044'
      </div>
      <div style="display:flex;gap:var(--spacing-2)">
        <button onclick="app.saveNewStudent()"
          class="btn btn-primary" style="font-size:0.875rem">\u8FFD\u52A0</button>
        <button onclick="app.cancelAddStudent()"
          class="btn btn-secondary" style="font-size:0.875rem">\u30AD\u30E3\u30F3\u30BB\u30EB</button>
      </div>
    </div>
  `;
}
