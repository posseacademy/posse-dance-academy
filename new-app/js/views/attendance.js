import { pricing, planOrder, dayOrder } from '../config.js';
import { calculateVisitorRevenue, calculateDetailedRevenue, calculatePracticeRevenue, formatCurrency } from '../utils.js';

export function renderAttendance(app) {
  const days = dayOrder;
  const selectedDay = app.selectedDay || days[0];
  const scheduleData = app.scheduleData || {};
  const dayClasses = Array.isArray(scheduleData[selectedDay]) ? scheduleData[selectedDay] : [];
  const attendanceData = app.attendanceData || {};
  const attendanceTab = app.attendanceTab || 'classes';

  // Revenue calculations for summary tab
  const visitorRevenue = calculateVisitorRevenue(app.selectedMonth, attendanceData, scheduleData);
  const detailed = calculateDetailedRevenue(app.selectedMonth, attendanceData, scheduleData);
  const practice = calculatePracticeRevenue(attendanceData);

  return `
    <div class="attendance-view">
      <div class="page-header">
        <h1 class="page-title">åºå¸­åç°¿</h1>
        <div style="display:flex;gap:var(--spacing-3);align-items:center">
          <input type="month" class="form-input" value="${app.selectedMonth || ''}"
            onchange="app.changeMonth(this.value)">
          <button class="btn btn-sm" onclick="app.downloadBackup()">ããã¯ã¢ãã</button>
        </div>
      </div>

      <!-- Top tabs: Classes / Summary / Practice -->
      <div class="tab-bar" style="margin-bottom:var(--spacing-4)">
        <div class="tab-item ${attendanceTab === 'classes' ? 'active' : ''}"
          onclick="app.attendanceTab='classes';app.render()">ã¯ã©ã¹å¥åºå¸­</div>
        <div class="tab-item ${attendanceTab === 'summary' ? 'active' : ''}"
          onclick="app.attendanceTab='summary';app.render()">å£²ä¸ãµããªã¼</div>
        <div class="tab-item ${attendanceTab === 'practice' ? 'active' : ''}"
          onclick="app.attendanceTab='practice';app.render()">ç·´ç¿ä¼</div>
      </div>

      ${attendanceTab === 'classes' ? renderClassesTab(app, days, selectedDay, dayClasses, attendanceData) : ''}
      ${attendanceTab === 'summary' ? renderSummaryTab(visitorRevenue, detailed, practice) : ''}
      ${attendanceTab === 'practice' ? renderPracticeTab(app, attendanceData) : ''}
    </div>
  `;
}

function renderClassesTab(app, days, selectedDay, dayClasses, attendanceData) {
  return `
    <!-- Day tabs -->
    <div class="tab-bar" style="margin-bottom:var(--spacing-4)">
      ${days.map(day => `
        <div class="tab-item ${day === selectedDay ? 'active' : ''}"
          onclick="app.selectedDay='${day}';app.render()">
          ${day.replace('ææ¥', '')}
        </div>
      `).join('')}
    </div>

    <!-- Classes for selected day -->
    ${dayClasses.map((cls, ci) => {
      const students = cls.students || [];
      return `
        <div class="card" style="margin-bottom:var(--spacing-4)">
          <div class="card-header" style="border-left:4px solid ${cls.color === 'red' ? '#DC2626' : cls.color === 'orange' ? '#EA580C' : cls.color === 'blue' ? '#2563EB' : cls.color === 'green' ? '#16A34A' : cls.color === 'purple' ? '#9333EA' : '#6B7280'}">
            <h3 class="card-title">${cls.location} - ${cls.name}</h3>
            <span class="badge">${students.length}å</span>
          </div>
          <div class="card-body" style="overflow-x:auto">
            <table class="data-table attendance-table">
              <thead>
                <tr>
                  <th>çå¾å</th>
                  <th>ãã©ã³</th>
                  <th style="text-align:center">W1</th>
                  <th style="text-align:center">W2</th>
                  <th style="text-align:center">W3</th>
                  <th style="text-align:center">W4</th>
                  <th style="text-align:center">W5</th>
                  <th style="text-align:center">åºå¸­ç</th>
                </tr>
              </thead>
              <tbody>
                ${students.sort((a, b) => (planOrder[a.plan] || 99) - (planOrder[b.plan] || 99)).map(s => {
                  const studentKey = \`\${selectedDay}_\${cls.location}_\${cls.name}_\${s.lastName}\${s.firstName}\`;
                  const att = attendanceData[studentKey] || {};
                  const weeks = ['week1', 'week2', 'week3', 'week4', 'week5'];
                  const attended = weeks.filter(w => att[w] === 'â').length;
                  const absent = weeks.filter(w => att[w] === 'Ã').length;
                  const total = attended + absent;
                  const rate = total > 0 ? Math.round((attended / total) * 100) : '-';

                  return \`
                    <tr>
                      <td><strong>\${s.lastName} \${s.firstName}</strong></td>
                      <td><span class="badge">\${s.plan}</span></td>
                      \${weeks.map(w => {
                        const val = att[w] || '-';
                        const cls2 = val === 'â' ? 'attendance-present' : val === 'Ã' ? 'attendance-absent' : val === 'ä¼è¬' ? 'attendance-cancel' : '';
                        return \`<td style="text-align:center">
                          <span class="attendance-mark \${cls2}"
                            onclick="app.toggleAttendance('\${studentKey}','\${w}')"
                            style="cursor:pointer">\${val}</span>
                        </td>\`;
                      }).join('')}
                      <td style="text-align:center">
                        <strong>\${rate === '-' ? '-' : rate + '%'}</strong>
                      </td>
                    </tr>
                  \`;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }).join('')}

    ${dayClasses.length === 0 ? '<div class="card"><div class="card-body" style="text-align:center;padding:var(--spacing-8);color:var(--color-text-secondary)">ãã®ææ¥ã«ã¯ã¯ã©ã¹ãããã¾ãã</div></div>' : ''}
  `;
}

function renderSummaryTab(visitorRevenue, detailed, practice) {
  return `
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">ãã¸ã¿ã¼ã»ä½é¨å£²ä¸</h2>
        <span class="card-badge">${formatCurrency(visitorRevenue)}</span>
      </div>
      <div class="card-body">
        <table class="data-table">
          <thead>
            <tr>
              <th>ã«ãã´ãª</th>
              <th style="text-align:center">åæ°</th>
              <th style="text-align:right">åä¾¡</th>
              <th style="text-align:right">å£²ä¸</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(detailed).map(([cat, data]) => {
              const price = pricing[cat] || 0;
              return \`
                <tr>
                  <td>\${cat}</td>
                  <td style="text-align:center">\${data.count}å</td>
                  <td style="text-align:right">\${formatCurrency(price)}</td>
                  <td style="text-align:right"><strong>\${formatCurrency(data.revenue)}</strong></td>
                </tr>
              \`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div class="card" style="margin-top:var(--spacing-4)">
      <div class="card-header">
        <h2 class="card-title">ç·´ç¿ä¼å£²ä¸</h2>
        <span class="card-badge">${formatCurrency(practice.revenue)}</span>
      </div>
      <div class="card-body">
        <p>åå èæ°: ${practice.participants}å Ã Â¥500 = ${formatCurrency(practice.revenue)}</p>
      </div>
    </div>
  `;
}

function renderPracticeTab(app, attendanceData) {
  const weeks = ['week1', 'week2', 'week3', 'week4', 'week5'];
  const practiceDays = ['æææ¥', 'æ¨ææ¥'];

  return \`
    \${practiceDays.map(day => {
      const key = \`ç·´ç¿ä¼_\${day}\`;
      const data = attendanceData[key] || {};
      return \`
        <div class="card" style="margin-bottom:var(--spacing-4)">
          <div class="card-header">
            <h3 class="card-title">\${day} ç·´ç¿ä¼</h3>
          </div>
          <div class="card-body">
            <table class="data-table">
              <thead>
                <tr>
                  <th></th>
                  \${weeks.map((_, i) => \`<th style="text-align:center">ç¬¬\${i+1}é±</th>\`).join('')}
                  <th style="text-align:center">åè¨</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>åå äººæ°</td>
                  \${weeks.map(w => {
                    const count = data[w] || 0;
                    return \`<td style="text-align:center">
                      <input type="number" class="form-input" style="width:60px;text-align:center"
                        value="\${count}" min="0"
                        onchange="app.updatePractice('\${key}','\${w}',parseInt(this.value)||0)">
                    </td>\`;
                  }).join('')}
                  <td style="text-align:center">
                    <strong>\${weeks.reduce((sum, w) => sum + (parseInt(data[w]) || 0), 0)}å</strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      \`;
    }).join('')}
  \`;
}
