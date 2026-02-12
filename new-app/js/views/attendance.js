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
        <h1 class="page-title">出席名簿</h1>
        <div style="display:flex;gap:var(--spacing-3);align-items:center">
          <input type="month" class="form-input" value="${app.selectedMonth || ''}"
            onchange="app.changeMonth(this.value)">
          <button class="btn btn-sm" onclick="app.downloadBackup()">バックアップ</button>
        </div>
      </div>

      <!-- Top tabs: Classes / Summary / Practice -->
      <div class="tab-bar" style="margin-bottom:var(--spacing-4)">
        <div class="tab-item ${attendanceTab === 'classes' ? 'active' : ''}"
          onclick="app.attendanceTab='classes';app.render()">クラス別出席</div>
        <div class="tab-item ${attendanceTab === 'summary' ? 'active' : ''}"
          onclick="app.attendanceTab='summary';app.render()">売上サマリー</div>
        <div class="tab-item ${attendanceTab === 'practice' ? 'active' : ''}"
          onclick="app.attendanceTab='practice';app.render()">練習会</div>
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
          ${day.replace('曜日', '')}
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
            <span class="badge">${students.length}名</span>
          </div>
          <div class="card-body" style="overflow-x:auto">
            <table class="data-table attendance-table">
              <thead>
                <tr>
                  <th>生徒名</th>
                  <th>プラン</th>
                  <th style="text-align:center">W1</th>
                  <th style="text-align:center">W2</th>
                  <th style="text-align:center">W3</th>
                  <th style="text-align:center">W4</th>
                  <th style="text-align:center">W5</th>
                  <th style="text-align:center">出席率</th>
                </tr>
              </thead>
              <tbody>
                ${students.sort((a, b) => (planOrder[a.plan] || 99) - (planOrder[b.plan] || 99)).map(s => {
                  const studentKey = `${selectedDay}_${cls.location}_${cls.name}_${s.lastName}${s.firstName}`;
                  const att = attendanceData[studentKey] || {};
                  const weeks = ['week1', 'week2', 'week3', 'week4', 'week5'];
                  const attended = weeks.filter(w => att[w] === '○').length;
                  const absent = weeks.filter(w => att[w] === '×').length;
                  const total = attended + absent;
                  const rate = total > 0 ? Math.round((attended / total) * 100) : '-';

                  return `
                    <tr>
                      <td><strong>${s.lastName} ${s.firstName}</strong></td>
                      <td><span class="badge">${s.plan}</span></td>
                      ${weeks.map(w => {
                        const val = att[w] || '-';
                        const cls2 = val === '○' ? 'attendance-present' : val === '×' ? 'attendance-absent' : val === '休講' ? 'attendance-cancel' : '';
                        return `<td style="text-align:center">
                          <span class="attendance-mark ${cls2}"
                            onclick="app.toggleAttendance('${studentKey}','${w}')"
                            style="cursor:pointer">${val}</span>
                        </td>`;
                      }).join('')}
                      <td style="text-align:center">
                        <strong>${rate === '-' ? '-' : rate + '%'}</strong>
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

    ${dayClasses.length === 0 ? '<div class="card"><div class="card-body" style="text-align:center;padding:var(--spacing-8);color:var(--color-text-secondary)">この曜日にはクラスがありません</div></div>' : ''}
  `;
}

function renderSummaryTab(visitorRevenue, detailed, practice) {
  return `
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">ビジター・体験売上</h2>
        <span class="card-badge">${formatCurrency(visitorRevenue)}</span>
      </div>
      <div class="card-body">
        <table class="data-table">
          <thead>
            <tr>
              <th>カテゴリ</th>
              <th style="text-align:center">回数</th>
              <th style="text-align:right">単価</th>
              <th style="text-align:right">売上</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(detailed).map(([cat, data]) => {
              const price = pricing[cat] || 0;
              return `
                <tr>
                  <td>${cat}</td>
                  <td style="text-align:center">${data.count}回</td>
                  <td style="text-align:right">${formatCurrency(price)}</td>
                  <td style="text-align:right"><strong>${formatCurrency(data.revenue)}</strong></td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div class="card" style="margin-top:var(--spacing-4)">
      <div class="card-header">
        <h2 class="card-title">練習会売上</h2>
        <span class="card-badge">${formatCurrency(practice.revenue)}</span>
      </div>
      <div class="card-body">
        <p>参加者数: ${practice.participants}名 × ¥500 = ${formatCurrency(practice.revenue)}</p>
      </div>
    </div>
  `;
}

function renderPracticeTab(app, attendanceData) {
  const weeks = ['week1', 'week2', 'week3', 'week4', 'week5'];
  const practiceDays = ['月曜日', '木曜日'];

  return `
    ${practiceDays.map(day => {
      const key = `練習会_${day}`;
      const data = attendanceData[key] || {};
      return `
        <div class="card" style="margin-bottom:var(--spacing-4)">
          <div class="card-header">
            <h3 class="card-title">${day} 練習会</h3>
          </div>
          <div class="card-body">
            <table class="data-table">
              <thead>
                <tr>
                  <th></th>
                  ${weeks.map((_, i) => `<th style="text-align:center">第${i+1}週</th>`).join('')}
                  <th style="text-align:center">合計</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>参加人数</td>
                  ${weeks.map(w => {
                    const count = data[w] || 0;
                    return `<td style="text-align:center">
                      <input type="number" class="form-input" style="width:60px;text-align:center"
                        value="${count}" min="0"
                        onchange="app.updatePractice('${key}','${w}',parseInt(this.value)||0)">
                    </td>`;
                  }).join('')}
                  <td style="text-align:center">
                    <strong>${weeks.reduce((sum, w) => sum + (parseInt(data[w]) || 0), 0)}名</strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      `;
    }).join('')}
  `;
}
