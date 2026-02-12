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

    <!-- Top tabs: HOME / åºå¸­è¨é² -->
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

    <!-- å£²ä¸åè¨³ -->
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">\u58F2\u4E0A\u5185\u8A33\uFF08\u54D7\u8B1B\u4EBA\u6570\u30FB\u58F2\u4E0A\uFF09</h2>
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
    Ý[OH^X[YÛYÚÙ]K][YHÈÝÛÈÝ[OHÛÛÜ\KXÛÛÜY[Ù\HÙÜX]Ý\[ÞJ]K][YJ_OÜÝÛÏ	ËIßOÝÝÂJKÚ[	ÉÊ_BÝ[OHÛ]ÙZYÚÌØÜ\]ÜÛÛY\KXÛÛÜYÜ^KLÌ
HMMNLÝÝÝÝ[OH^X[YÛYÚÙÜX]Ý\[ÞJ\Ú]Ü][YJ_OÝÝÝÙOÝXOÙ]Ù]KKH9íí9ïä¹/&KO]Û\ÜÏHØ\Ý[OHX\Ú[]Ü\K\ÜXÚ[ËM
H]Û\ÜÏHØ\ZXY\Û\ÜÏHØ\]]HMÑMÑMPOÚÜ[Û\ÜÏHØ\XYÙHÙÜX]Ý\[ÞJXÝXÙUÝ[
_OÜÜ[Ù]]Û\ÜÏHØ\XÙH	ÜXÝXÙQ^\ËX\
^HOÂÛÛÝÙ^HHMÑMÑMPWÉÙ^_XÂÛÛÝ]HH][[ÙQ]VÚÙ^WHßNÂ]\]Ý[OHX\Ú[XÝÛN\K\ÜXÚ[ËM
HÈÝ[OHÛ\Ú^N\[NÛX\Ú[XÝÛN\K\ÜXÚ[ËLHÙ^_HMÑMÑMPOÚÏXHÛ\ÜÏH]K]XHXYÝ	ÝÙYZÜËX\

ËJHOÝ[OH^X[YÛÙ[\MÐÉÚJÌ_WNLÌOÝ
KÚ[	ÉÊ_BÝ[OH^X[YÛÙ[\MMNLÝÝÝXYÙOMLÐÌMLLMPWMMÌÝ	ÝÙYZÜËX\
ÈOÂÛÛÝÛÝ[H]VÝ×HÂ]\Ý[OH^X[YÛÙ[\[]\OH[X\Û\ÜÏHÜKZ[]Ý[OHÚYÝ^X[YÛÙ[\[YOHØÛÝ[HZ[HÛÚ[ÙOH\\]TXÝXÙJ	ÉÚÙ^_IË	ÉÝßIË\ÙR[
\Ë[YJ_
HÝÂJKÚ[	ÉÊ_BÝ[="text-align:center">
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

function renderRecordTab(app, days, selectedDay, dayClasses, attendanceData, scheduleData) {
  const weeks = ['week1', 'week2', 'week3', 'week4', 'week5'];

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

    ${dayClasses.map(cls => {
      const students = cls.students || [];
      const location = cls.location || '';
      const className = cls.name || '';

      return `
        <div class="card" style="margin-bottom:var(--spacing-4)">
          <div class="card-header">
            <div>
              <h3 class="card-title">${location} - ${className} ${cls.instructor || ''}</h3>
              <span style="color:var(--color-text-secondary)">${students.length}\u540D</span>
            </div>
          </div>
          <div class="card-body">
            <table class="data-table">
              <thead>
                <tr>
                  <th>\u751F\u5F92\u540D</th>
                  <th>\u30D7\u30E9\u30F3</th>
                  ${weeks.map((_, i) => `<th style="text-align:center">W${i+1}</th>`).join('')}
                  <th style="text-align:center">\u51FA\u5E2D\u7387</th>
                </tr>
              </thead>
              <tbody>
                ${students.map(st => {
                  const studentName = (st.lastName || '') + (st.firstName || '');
                  const attKey = selectedDay + '_' + location + '_' + className + '_' + studentName;
                  const attData = attendanceData[attKey] || {};
                  const attended = weeks.filter(w => attData[w] === '\u25CB' || attData[w] === '\u4F11\u8B1B').length;
                  const totalWeeks = weeks.filter(w => attData[w] && attData[w] !== '-').length;
                  const rate = totalWeeks > 0 ? Math.round((attended / totalWeeks) * 100) + '%' : '-';
                  return `
                    <tr>
                      <td>${studentName}</td>
                      <td>${st.plan || '-'}</td>
                      ${weeks.map(w => {
                        const val = attData[w] || '-';
                        const style = val === '\u25CB' ? 'color:var(--color-primary)' :
                                      val === '\u4F11\u8B1B' ? 'background:var(--color-warning-light);color:var(--color-warning);border-radius:4px;padding:2px 6px;font-size:0.75rem' :
                                      'color:var(--color-text-secondary)';
                        return `<td style="text-align:center">
                          <span style="${style}">${val}</span>
                        </td>`;
                      }).join('')}
                      <td style="text-align:center;font-weight:600">${rate}</td>
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
