import { pricing, dayOrder } from '../config.js';
import { calculateVisitorRevenue, calculateDetailedRevenue, calculatePracticeRevenue, formatCurrency } from '../utils.js';

/**
 * Render the HOME dashboard (overview of attendance/revenue)
 * Moved from attendance.js overview tab
 */
export function renderHome(app) {
  const scheduleData = app.scheduleData || {};
  const attendanceData = app.attendanceData || {};
  const days = dayOrder;
  const weeks = ['week1', 'week2', 'week3', 'week4', 'week5'];
  const practiceDays = ['\u6708\u66DC\u65E5', '\u6728\u66DC\u65E5'];

  // Revenue calculations
  const visitorRevenue = calculateVisitorRevenue(app.selectedMonth, attendanceData, scheduleData);
  const detailed = calculateDetailedRevenue(app.selectedMonth, attendanceData, scheduleData);

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
    <div class="attendance-view">
      <div class="page-header">
        <h1 class="page-title">HOME</h1>
        <div style="display:flex;gap:var(--spacing-3);align-items:center">
          <input type="month" class="form-input" value="${app.selectedMonth || ''}"
            onchange="app.changeMonth(this.value)">
          <button class="btn btn-sm" onclick="app.downloadBackup()">\u30D0\u30C3\u30AF\u30A2\u30C3\u30D7</button>
        </div>
      </div>

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

    </div>
  `;
}
