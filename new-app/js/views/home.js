import { pricing, coursePrices, courseColors } from '../config.js';
import { calculateVisitorRevenue, calculateDetailedRevenue, calculatePracticeRevenue, calculateTuitionSummary, formatCurrency } from '../utils.js';

/**
 * Render the HOME dashboard
 * @param {Object} app - The main app instance with customers, scheduleData, attendanceData, selectedMonth
 * @returns {string} HTML string
 */
export function renderHome(app) {
  const customers = app.customers || {};
  const allCustomers = Object.values(customers);
  const activeCount = allCustomers.filter(c => c.status === 'å¥ä¼ä¸­').length;
  const pausedCount = allCustomers.filter(c => c.status === 'ä¼ä¼ä¸­').length;
  const withdrawnCount = allCustomers.filter(c => c.status === 'éä¼æ¸ã¿').length;
  const totalCount = allCustomers.length;

  // Count total classes and students from schedule
  let totalClasses = 0;
  let totalStudents = 0;
  const scheduleData = app.scheduleData || {};
  Object.entries(scheduleData).forEach(([day, classes]) => {
    if (day === 'ã¤ãã³ã') return;
    if (Array.isArray(classes)) {
      totalClasses += classes.length;
      classes.forEach(c => {
        totalStudents += (c.students || []).length;
      });
    }
  });

  // Revenue calculations
  const visitorRevenue = calculateVisitorRevenue(app.selectedMonth, app.attendanceData || {}, scheduleData);
  const detailed = calculateDetailedRevenue(app.selectedMonth, app.attendanceData || {}, scheduleData);
  const practice = calculatePracticeRevenue(app.attendanceData || {});

  // Monthly tuition
  const planCounts = calculateTuitionSummary(customers);
  let tuitionTotal = 0;
  const tuitionRows = Object.entries(coursePrices).map(([num, price]) => {
    const count = planCounts[num] || 0;
    const subtotal = count * price;
    tuitionTotal += subtotal;
    const color = courseColors[num] || '#6B7280';
    return { num, price, count, subtotal, color };
  });

  return `
    <div class="dashboard">
      <div class="page-header">
        <h1 class="page-title">ããã·ã¥ãã¼ã</h1>
        <div class="page-subtitle">${app.selectedMonth || ''}</div>
      </div>

      <!-- Stat Cards -->
      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-label">ç·é¡§å®¢æ°</div>
          <div class="stat-value">${totalCount}</div>
          <div class="stat-detail">å</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">å¥ä¼ä¸­</div>
          <div class="stat-value" style="color: var(--color-success)">${activeCount}</div>
          <div class="stat-detail">å</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">ä¼ä¼ä¸­</div>
          <div class="stat-value" style="color: var(--color-warning)">${pausedCount}</div>
          <div class="stat-detail">å</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">éä¼æ¸ã¿</div>
          <div class="stat-value" style="color: var(--color-text-secondary)">${withdrawnCount}</div>
          <div class="stat-detail">å</div>
        </div>
      </div>

      <!-- Revenue Section -->
      <div class="card-grid">
        <!-- Monthly Tuition -->
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">æè¬å£²ä¸</h2>
            <span class="card-badge">${formatCurrency(tuitionTotal)}</span>
          </div>
          <div class="card-body">
            <table class="data-table">
              <thead>
                <tr>
                  <th>ã³ã¼ã¹</th>
                  <th style="text-align:right">åä¾¡</th>
                  <th style="text-align:center">äººæ°</th>
                  <th style="text-align:right">å°è¨</th>
                </tr>
              </thead>
              <tbody>
                ${tuitionRows.map(r => `
                  <tr>
                    <td><span class="badge" style="background:${r.color};color:white">${r.num}ã¯ã©ã¹</span></td>
                    <td style="text-align:right">${formatCurrency(r.price)}</td>
                    <td style="text-align:center">${r.count}å</td>
                    <td style="text-align:right"><strong>${formatCurrency(r.subtotal)}</strong></td>
                  </tr>
                `).join('')}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3"><strong>åè¨</strong></td>
                  <td style="text-align:right"><strong>${formatCurrency(tuitionTotal)}</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <!-- Visitor Revenue -->
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
                  <th style="text-align:right">å£²ä¸</th>
                </tr>
              </thead>
              <tbody>
                ${Object.entries(detailed)
                  .filter(([_, v]) => v.count > 0 || v.revenue > 0)
                  .map(([category, data]) => `
                    <tr>
                      <td>${category}</td>
                      <td style="text-align:center">${data.count}å</td>
                      <td style="text-align:right">${formatCurrency(data.revenue)}</td>
                    </tr>
                  `).join('') || '<tr><td colspan="3" style="text-align:center;color:var(--color-text-secondary)">ãã¼ã¿ãããã¾ãã</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Practice Revenue -->
      <div class="card" style="margin-top: var(--spacing-6)">
        <div class="card-header">
          <h2 class="card-title">ç·´ç¿ä¼</h2>
          <span class="card-badge">${formatCurrency(practice.revenue)}</span>
        </div>
        <div class="card-body">
          <div class="stat-grid" style="grid-template-columns: repeat(3, 1fr)">
            <div class="stat-card" style="text-align:center">
              <div class="stat-label">ç·åå è</div>
              <div class="stat-value">${practice.participants}</div>
              <div class="stat-detail">å</div>
            </div>
            ${Object.entries(practice.details || {}).map(([day, count]) => `
              <div class="stat-card" style="text-align:center">
                <div class="stat-label">${day}</div>
                <div class="stat-value">${count}</div>
                <div class="stat-detail">å</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Schedule Summary -->
      <div class="card" style="margin-top: var(--spacing-6)">
        <div class="card-header">
          <h2 class="card-title">ã¯ã©ã¹æ¦è¦</h2>
        </div>
        <div class="card-body">
          <div class="stat-grid" style="grid-template-columns: repeat(2, 1fr)">
            <div class="stat-card" style="text-align:center">
              <div class="stat-label">ç·ã¯ã©ã¹æ°</div>
              <div class="stat-value">${totalClasses}</div>
            </div>
            <div class="stat-card" style="text-align:center">
              <div class="stat-label">ç·çå¾æ°</div>
              <div class="stat-value">${totalStudents}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}
