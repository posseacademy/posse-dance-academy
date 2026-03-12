import { pricing, coursePrices, courseColors, visitorRevenueOverrides } from '../config.js';
import { calculateVisitorRevenue, calculatePracticeRevenue } from '../utils.js';

export function renderDashboard(app) {
  // Calculate customer statistics
  const totalCustomers = app.customers.length;
  const activeCustomers = app.customers.filter(c => c.status === '入会中').length;
  const pausedCustomers = app.customers.filter(c => c.status === '休会中').length;
  const withdrawnCustomers = app.customers.filter(c => c.status === '退会済み').length;

  // Calculate course breakdown for active customers
  const courseCountsMap = {};
  app.customers
    .filter(c => c.status === '入会中')
    .forEach(c => {
      const course = c.course || '１';
      courseCountsMap[course] = (courseCountsMap[course] || 0) + 1;
    });

  // Sort courses in order: ４, ３, ２, １
  const courseOrder = ['４', '３', '２', '１'];
  const courseCounts = courseOrder
    .filter(course => courseCountsMap[course])
    .map(course => ({
      course,
      count: courseCountsMap[course],
      price: coursePrices[course] || 0,
      color: courseColors[course] || '#999999'
    }));

  // Calculate total monthly tuition
  const monthlyTuitionTotal = courseCounts.reduce((sum, item) => {
    return sum + (item.price * item.count);
  }, 0);

  // Calculate schedule statistics
  let totalClasses = 0;
  let totalStudents = 0;
  Object.entries(app.scheduleData || {}).forEach(([day, dayClasses]) => {
    if (day === 'イベント' || !Array.isArray(dayClasses)) return;
    dayClasses.forEach(cls => {
      totalClasses++;
      totalStudents += (cls.students || []).length;
    });
  });

  // Calculate visitor revenue
  const visitorRevenue = calculateVisitorRevenue(app.attendanceData, app.scheduleData, app.pricing, visitorRevenueOverrides, app.selectedMonth);

  // Calculate practice revenue
  const practiceData = calculatePracticeRevenue(app.attendanceData);
  const practiceRevenue = practiceData.revenue;

  // Parse selected month for display
  const [year, month] = app.selectedMonth.split('-');
  const monthDisplay = `${year}年${month}月`;

  return `
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h2>HOME</h2>
        <p class="subtitle">posse dance academy の概要</p>
      </div>
      <div class="date-badge">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        ${monthDisplay}
      </div>
    </div>

    <!-- Stat Grid -->
    <div class="stat-grid">
      <!-- Total Customers -->
      <div class="stat-card">
        <div class="stat-icon blue">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
        </div>
        <div class="stat-label">総顧客数</div>
        <div class="stat-value">${totalCustomers}</div>
      </div>

      <!-- Active Customers -->
      <div class="stat-card">
        <div class="stat-icon green">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        </div>
        <div class="stat-label">入会中</div>
        <div class="stat-value" style="color: #10b981;">${activeCustomers}</div>
      </div>

      <!-- Paused Customers -->
      <div class="stat-card">
        <div class="stat-icon orange">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="10" y1="15" x2="10" y2="9"/><line x1="14" y1="15" x2="14" y2="9"/></svg>
        </div>
        <div class="stat-label">休会中</div>
        <div class="stat-value" style="color: #f59e0b;">${pausedCustomers}</div>
      </div>

      <!-- Withdrawn Customers -->
      <div class="stat-card">
        <div class="stat-icon red">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        </div>
        <div class="stat-label">退会済み</div>
        <div class="stat-value" style="color: var(--text-secondary);">${withdrawnCustomers}</div>
      </div>
    </div>

    <!-- Content Grid -->
    <div class="content-grid">
      <!-- Left: Course Breakdown -->
      <div class="content-card">
        <div class="card-header">
          <h3 class="card-title">コース別内訳（入会中）</h3>
        </div>
        <div class="card-content">
          ${courseCounts.map(item => `
            <div class="revenue-row">
              <div class="rev-label">
                <span class="rev-dot" style="background-color: ${item.color};"></span>
                コース${item.course}
              </div>
              <div class="rev-amount">¥${(item.price * item.count).toLocaleString('ja-JP')}</div>
              <div class="rev-detail">${item.count}名</div>
            </div>
          `).join('')}
          <div class="revenue-total">
            <div class="rev-label" style="font-weight: 600;">月謝合計</div>
            <div class="rev-amount" style="font-weight: 600;">¥${monthlyTuitionTotal.toLocaleString('ja-JP')}</div>
          </div>
        </div>
      </div>

      <!-- Right: Visitor and Summary -->
      <div>
        <!-- Visitor Highlight Card -->
        <div class="content-card visitor-highlight">
          <div class="card-header">
            <h3 class="card-title">ビジター売上（今月）</h3>
          </div>
          <div class="card-content">
            <div class="vh-value">¥${visitorRevenue.toLocaleString('ja-JP')}</div>
            <div class="vh-detail">売上</div>
          </div>
        </div>

        <!-- Summary Card -->
        <div class="content-card" style="margin-top: 1rem;">
          <div class="card-header">
            <h3 class="card-title">今月の概要</h3>
          </div>
          <div class="card-content">
            <div class="revenue-row">
              <div class="rev-label">レッスン数</div>
              <div class="rev-amount">${totalClasses}</div>
            </div>
            <div class="revenue-row">
              <div class="rev-label">受講生数</div>
              <div class="rev-amount">${totalStudents}</div>
            </div>
            <div class="revenue-row">
              <div class="rev-label">練習会売上</div>
              <div class="rev-amount">¥${practiceRevenue.toLocaleString('ja-JP')}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}
