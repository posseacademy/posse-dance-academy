import { planOrder, dayOrder, pricing } from '../config.js';
import { formatCurrency } from '../utils.js';

export function renderAttendance(app) {
  const days = dayOrder;
  const selectedDay = app.selectedDay || days[0];
  const scheduleData = app.scheduleData || {};
  const dayClasses = Array.isArray(scheduleData[selectedDay]) ? scheduleData[selectedDay] : [];
  const attendanceData = app.attendanceData || {};

  return `
   <div class="attendance-view">
    <div class="page-header">
      <h1 class="page-title">åºå¸­è¨é</h1>
      <div style="display:flex;gap:var(--spacing-3);align-items:center">
        <input type="month" class="form-input" value="${app.selectedMonth || ''}"
          onchange="app.changeMonth(this.value)">
      </div>
    </div>

    ${renderRecordTab(app, days, selectedDay, dayClasses, attendanceData, scheduleData)}
   </div>
  `;
}

function isRegularPlan(plan) {
  const regularPlans = ['1ã¯ã©ã¹', 'ï¼ã¯ã©ã¹', '2ã¯ã©ã¹', 'ï¼ã¯ã©ã¹', '3ã¯ã©ã¹', 'ï¼ã¯ã©ã¹', '4ã¯ã©ã¹', 'ï¼ã¯ã©ã¹', '1.5hã¯ã©ã¹'];
  return regularPlans.includes(plan);
}

function sortStudentsByPlan(students) {
  return [...students].sort((a, b) => {
    const normalizePlan = (plan) => {
      return plan.replace(/[ï¼-¾ï½]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
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
  const attended = weeks.filter(w => data[w] === 'â').length;
  const recorded = weeks.filter(w => data[w] === 'â' || data[w] === 'Ã' || data[w] === 'â' || data[w] === 'x' || data[w] === 'X').length;
  return recorded > 0 ? Math.round((attended / recorded) * 100) : 0;
}

function getAttBtnStyle(val) {
  if (val === 'â') return 'background:#22c55e;border-color:#16a34a;color:white;';
  if (val === 'Ã' || val === 'â' || val === 'x' || val === 'X') return 'background:#ef4444;border-color:#dc2626;color:white;';
  if (val === 'ä¼è­»') return 'background:#6b7280;border-color:#4b5563;color:white;';
  return 'background:#f3f4f6;border-color:#d1d5db;color:#9ca3af;';
}

function getAttDisplay(val) {
  if (val === 'ä¼è«') return 'ä¼';
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
  const weekLabels = ['ç¬¬1é±', 'ç¬¬2é±', 'ç¬¬3é±', 'ç¬¬4é±', 'äºå'];
  const editingStudent = app.editingStudent || null;
  const showAddForm = app.showAddStudentForm || false;
  const selectedClassForAdd = app.selectedClassForAdd || null;

  const isPracticeTab = selectedDay === 'ç·´ç´¢ä¼';

  return `
    <!-- Day tabs -->
    <div class="tab-bar" style="margin-bottom:var(--spacing-4)">
      ${days.map(day => `
        <div class="tab-item ${day === selectedDay ? 'active' : ''}"
          onclick="app.selectedDay='${day}';app.render()">
          ${day}
        </div>
      `).join('')}
      <div class="tab-item ${isPracticeTab ? 'active' : ''}"
        onclick="app.selectedDay='ç·´ç´¢ä¼';app.render()">
        ç·´ç¿ä¼
      </div>
    </div>

    ${isPracticeTab ? renderPracticeTab(app, attendanceData, weeks, weekLabels) : `

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
            const plan = attEntry._plan || 'ãã¸ã¿ã¼ï¼ä¼å¡ï¼';
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
            <h3 style="font-size:1rem;font-weight:700;margin:0;color:inherit">${location} - ${className}</h3>
            <div style="display:flex;gap:var(--spacing-2);align-items:center">
              <span style="font-size:0.75rem;opacity:0.9">${filteredStudents.length}å</span>
              <button onclick="app.addStudentToClass('${escapeAttr(selectedDay)}','${escapeAttr(location)}','${escapeAttr(className)}')"
                style="background:rgba(255,255,255,0.2);border:none;color:white;padding:4px 8px;border-radius:4px;font-size:0.75rem;cursor:pointer">
                + çå¾è¿½å 
              </button>
            </div>
          </div>
          <div class="card-body" style="padding:var(--spacing-3);overflow-x:auto">
            <table class="data-table" style="font-size:0.75rem">
              <thead>
                <tr>
                  <th style="width:100px;padding:var(--spacing-2)">æ°å</th>
                  <th style="width:100px;padding:var(--spacing-2)">ãã©ã³</th>
                  ${weekLabels.map(label => `<th style="text-align:center;width:50px;padding:var(--spacing-2)">${label}</th>`).join('')}
                  <th style="text-align:center;width:60px;padding:var(--spacing-2)">åºå¸­ç</th>
                  <th style="text-align:center;width:50px;padding:var(--spacing-2)">ç·¨é</th>
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
                          ç·¨é
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

    ${dayClasses.length === 0 ? '<div class="card"><div class="card-body" style="text-align:center;padding:var(--spacing-8);color:var(--color-text-secondary)">ãã®ææ¥ã«ã¯ã¯ã©ã¹ãããã¾ãã</div></div>' : ''}
    `}
  `;
}

function renderEditingRow(app, student, studentKey, attData, rate, weeks, selectedDay, location, className) {
  const planOptions = [
    'ï¼ã¯ã©ã¹', 'ï¼ã¯ã©ã¹', 'ï¼ã¯ã©ã¹', 'ï¼ã¯ã©ã¹',
    'ãã¸ã¿ã¼ï¼ä¼å¡ï¼', 'ãã¸ã¿ã¼ï¼éä¼å¡ï¼',
    'ãã¸ã¿ã¼ï¼æ¯æ¿ï¼', 'ååä½é©', 'ååç¡æ'
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
            style="background:none;border:none;color:#16a34a;cursor:pointer;font-size:0.75rem">ä¿å­</button>
          <button onclick="app.cancelEditStudent()"
            style="background:none;border:none;color:#6b7280;cursor:pointer;font-size:0.75rem">ã­ã£ã³ã»ã«</button>
          <button onclick="app.deleteStudent('${escapeAttr(selectedDay)}','${escapeAttr(location)}','${escapeAttr(className)}','${escapeAttr(student.lastName)}','${escapeAttr(student.firstName)}')"
            style="background:none;border:none;color:#dc2626;cursor:pointer;font-size:0.75rem">åé©</button>
        </div>
      </td>
    </tr>
  `;
}

function renderAddStudentForm(app, classInfo) {
  const planOptions = [
    {value: '', label: 'é¸æãã¦ãã ãã'},
    {value: 'ï¼ã¯ã©ã¹', label: 'ï¼ã¯ã©ã¹'},
    {value: '¾üã¯ã©ã¹', label: 'ï¼ã¯ã©ã¹'},
    {value: 'ï¼ã¯ã©ã¹', label: 'ï¼ã¯ã©ã¹'},
    {value: 'ï¼ã¯ã©ã¹', label: 'ï¼ã¯ã©ã¹'},
    {value: 'ãã¸ã¿ã¼ï¼ä¼å¡ï¼', label: 'ãã¸ã¿ã¼ï¼ä¼å¡ï¼'},
    {value: 'ãã¸ã¿ã¼ï¼éä¼å¡ï¼', label: 'ãã¸ã¿ã¼ï¼éä¼å¡ï¼'},
    {value: 'ãã¸ã¿ã¼ï¼æ¯æ¿ï¼', label: 'ãã¸ã¿ã¼ï¼æ¯æ¿ï¼'},
    {value: 'ååä½é©', label: 'ååä½é©3'},
    {value: 'ååç¡æ', label: 'ååç¡æ'}
  ];

  return `
    <div style="background:#eff6ff;padding:var(--spacing-4);border-radius:var(--radius-lg);margin-bottom:var(--spacing-4);border:1px solid #bfdbfe">
      <h3 style="font-size:1rem;font-weight:600;margin-bottom:var(--spacing-3)">çå¾è¿½å  - ${classInfo.location} ${classInfo.className}</h3>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:var(--spacing-3);margin-bottom:var(--spacing-3)">
        <div>
          <label style="display:block;font-size:0.75rem;font-weight:500;margin-bottom:4px">å§ *</label>
          <input type="text" id="new_student_lastName" class="form-input" style="width:100%;font-size:0.875rem">
        </div>
        <div>
          <label style="display:block;font-size:0.75rem;font-weight:500;margin-bottom:4px">å *</label>
          <input type="text" id="new_student_firstName" class="form-input" style="width:100%;font-size:0.875rem">
        </div>
        <div>
          <label style="display:block;font-size:0.75rem;font-weight:500;margin-bottom:4px">ãã©ã³ *</label>
          <select id="new_student_plan" class="form-input" style="width:100%;font-size:0.875rem">
            ${planOptions.map(p => `<option value="${p.value}">${p.label}</option>`).join('')}
          </select>
        </div>
      </div>
      <div style="font-size:0.75rem;color:var(--color-text-secondary);margin-bottom:var(--spacing-3)">
        â» ãã¸ã¿ã¼ãååä½é©3ã®æ¹ã¯é©åãªãã©ã³ãé¸æãã¦ãã ãã
      </div>
      <div style="display:flex;gap:var(--spacing-2)">
        <button onclick="app.saveNewStudent()"
          class="btn btn-primary" style="font-size:0.875rem">è¿½å </button>
        <button onclick="app.cancelAddStudent()"
          class="btn btn-secondary" style="font-size:0.875rem">ã­ã£ã³ã»ã«</button>
      </div>
    </div>
  `;
}

function renderPracticeCard(app, dayLabel, attendanceData, weeks, weekLabels) {
  const key = 'ç·´ç¿ä¼_' + dayLabel;
  const data = attendanceData[key] || {};
  const totalParticipants = weeks.reduce((sum, w) => sum + (parseInt(data[w]) || 0), 0);
  const practicePrice = pricing['ç·´ç¿ä¼'] || 500;
  const practiceRevenue = totalParticipants * practicePrice;

  return `
    <div class="card" style="margin-bottom:var(--spacing-4);overflow:hidden">
      <div style="background:#6b7280;color:white;padding:var(--spacing-3) var(--spacing-4);display:flex;justify-content:space-between;align-items:center">
        <h3 style="font-size:1rem;font-weight:700;margin:0;color:inherit">${dayLabel} ç·´ç¿ä¼</h3>
        <div style="display:flex;gap:var(--spacing-3);align-items:center">
          <span style="font-size:0.75rem;opacity:0.9">${totalParticipants}ååå </span>
          <span style="font-size:0.875rem;font-weight:600">${formatCurrency(practiceRevenue)}</span>
        </div>
      </div>
      <div class="card-body" style="padding:var(--spacing-3)">
        <table class="data-table" style="font-size:0.75rem">
          <thead>
            <tr>
              <th style="padding:var(--spacing-2)"></th>
              ${weekLabels.map(label => '<th style="text-align:center;width:70px;padding:var(--spacing-2)">' + label + '</th>').join('')}
              <th style="text-align:center;width:70px;padding:var(--spacing-2)">åè¨</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding:var(--spacing-2);font-weight:600">åå äººæ°</td>
              ${weeks.map(w => {
                const count = data[w] || 0;
                return '<td style="text-align:center;padding:var(--spacing-2)"><input type="number" class="form-input" style="width:60px;text-align:center" value="' + count + '" min="0" onchange="app.updatePractice(\x27' + key + '\x27,\x27' + w + '\x27,parseInt(this.value)||0)"></td>';
              }).join('')}
              <td style="text-align:center;padding:var(--spacing-2)">
                <strong>${totalParticipants}å</strong>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderPracticeTab(app, attendanceData, weeks, weekLabels) {
  const practiceDays = ['æææ¥', 'æ¨ææ¥'];
  return practiceDays.map(day => renderPracticeCard(app, day, attendanceData, weeks, weekLabels)).join('');
}
