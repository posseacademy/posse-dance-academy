import { pricing, coursePrices, courseColors, visitorRevenueOverrides, coursePricesWithTransfer, combinedPrices15h, CLASS_15H, TRANSFER_FEE, timeSchedule } from '../config.js?v=9';
import { calculateVisitorRevenue, calculatePracticeRevenue, calculateMonthlyTuition, calculateFeeRevenue, isRegularPlan } from '../utils.js?v=5';

export function renderDashboard(app) {
  // Calculate customer statistics
  const totalCustomers = app.customers.length;
  const activeCustomers = app.customers.filter(c => c.status === '入会中').length;
  const pausedCustomers = app.customers.filter(c => c.status === '休会中').length;
  const withdrawnCustomers = app.customers.filter(c => c.status === '退会済み').length;

  // Calculate course breakdown with transfer fee + 1.5h combined plan support
  const tuitionResult = calculateMonthlyTuition(
    app.customers, app.scheduleData,
    coursePricesWithTransfer, combinedPrices15h, CLASS_15H
  );
  const courseCounts = tuitionResult.courseCounts;
  const monthlyTuitionTotal = tuitionResult.total;

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

  // Calculate event revenue
  let eventRevenue = 0;
  Object.values(app.eventsData || {}).forEach(ev => {
    eventRevenue += (ev.participants || []).reduce((sum, p) => sum + (parseInt(p.amount) || 0), 0);
  });

  // Calculate fee revenue
  const feeData = calculateFeeRevenue(app.customers, app.selectedMonth);
  const feeTotal = feeData.enrollment.total + feeData.annualFee.total;

  // Total revenue & goal
  const totalRevenue = monthlyTuitionTotal + visitorRevenue + practiceRevenue + eventRevenue + feeTotal;
  const revenueGoal = 1000000;
  const progressPct = Math.min(Math.round((totalRevenue / revenueGoal) * 100), 100);

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
        <div class="card-header" style="background:#1d1d1f;border-radius:var(--border-radius-lg) var(--border-radius-lg) 0 0;">
          <h3 class="card-title" style="color:white;">プラン別内訳（入会中）</h3>
        </div>
        <div class="card-content">
          ${courseCounts.map(item => `
            <div class="revenue-row">
              <div class="rev-label">
                <span class="rev-dot" style="background-color: ${item.color};"></span>
                プラン${item.course}
              </div>
              <div class="rev-amount">¥${item.price.toLocaleString('ja-JP')}</div>
              <div class="rev-detail">${item.count}名</div>
            </div>
          `).join('')}
          <div class="revenue-total">
            <div class="rev-label" style="font-weight: 600;">月謝合計</div>
            <div class="rev-amount" style="font-weight: 600;">¥${monthlyTuitionTotal.toLocaleString('ja-JP')}</div>
          </div>
        </div>
      </div>

      <!-- Right: Revenue Goal & Summary -->
      <div>
        <!-- Revenue Goal Card -->
        <div class="content-card revenue-goal-card">
          <div class="rg-header">
            <span class="rg-month">${monthDisplay}</span>
            <span class="rg-pct">${progressPct}%</span>
          </div>
          <div class="rg-amount">¥${totalRevenue.toLocaleString('ja-JP')}</div>
          <div class="rg-bar-track">
            <div class="rg-bar-fill" style="width:${progressPct}%;"></div>
          </div>
          <div class="rg-goal">目標 ¥${revenueGoal.toLocaleString('ja-JP')}</div>
          <div class="rg-remaining">${totalRevenue >= revenueGoal
            ? '目標達成!'
            : `あと ¥${(revenueGoal - totalRevenue).toLocaleString('ja-JP')}`}</div>
        </div>

        <!-- Breakdown Card -->
        <div class="content-card" style="margin-top: 1rem;">
          <div class="card-header" style="background:#1d1d1f;border-radius:var(--border-radius-lg) var(--border-radius-lg) 0 0;">
            <h3 class="card-title" style="color:white;">売上内訳</h3>
          </div>
          <div class="card-content">
            <div class="revenue-row">
              <div class="rev-label">月謝</div>
              <div class="rev-amount">¥${monthlyTuitionTotal.toLocaleString('ja-JP')}</div>
            </div>
            <div class="revenue-row">
              <div class="rev-label">ビジター</div>
              <div class="rev-amount">¥${visitorRevenue.toLocaleString('ja-JP')}</div>
            </div>
            <div class="revenue-row">
              <div class="rev-label">イベント</div>
              <div class="rev-amount">¥${eventRevenue.toLocaleString('ja-JP')}</div>
            </div>
            <div class="revenue-row">
              <div class="rev-label">練習会</div>
              <div class="rev-amount">¥${practiceRevenue.toLocaleString('ja-JP')}</div>
            </div>
            <div class="revenue-row" style="margin-top:0.5rem;">
              <div class="rev-label">レッスン数</div>
              <div class="rev-amount">${totalClasses}</div>
            </div>
            <div class="revenue-row">
              <div class="rev-label">受講生数</div>
              <div class="rev-amount">${totalStudents}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Lesson Overview (same width as コース別内訳) -->
    <div class="content-grid" style="margin-top:1.5rem;">
      <div class="content-card">
        <div class="card-header" style="background:#1d1d1f;border-radius:var(--border-radius-lg) var(--border-radius-lg) 0 0;">
          <h3 class="card-title" style="color:white;">レッスン一覧</h3>
        </div>
        <div class="card-content" style="padding:0;">
          ${['月曜日','火曜日','水曜日','木曜日','金曜日'].map(day => {
            const dayColors = {'月曜日':'#3b82f6','火曜日':'#ef4444','水曜日':'#10b981','木曜日':'#f59e0b','金曜日':'#8b5cf6'};
            const classes = (app.scheduleData[day] || []);
            if (!classes.length) return '';
            return `
              <div style="font-weight:600;font-size:0.9rem;padding:0.5rem 1rem;background:${dayColors[day]}15;border-left:4px solid ${dayColors[day]};color:${dayColors[day]};display:flex;align-items:center;gap:8px;">
                <span style="width:8px;height:8px;border-radius:50%;background:${dayColors[day]};display:inline-block;flex-shrink:0;"></span>
                ${day}
              </div>
              ${classes.map(cls => {
                const loc = cls.location || cls.venue || '';
                const tsH = app.timeScheduleData || timeSchedule;
                const te = (tsH[day] || []).find(t => t.name === cls.name && (t.venue === loc || t.venue === loc + '校' || t.venue?.replace('校','') === loc))
                  || (tsH[day] || []).find(t => t.name === cls.name && !t.alias);
                const time = te ? te.time : '';
                const regularCount = (cls.students || []).filter(s => isRegularPlan(s.plan)).length;
                return `
                  <div style="display:flex;align-items:center;padding:0.5rem 1rem;border-bottom:1px solid var(--border-color);">
                    <div style="flex:2;font-size:0.85rem;font-weight:500;">${cls.name}</div>
                    <div style="flex:0.8;font-size:0.8rem;color:var(--text-secondary);">${loc}</div>
                    <div style="flex:1;font-size:0.8rem;color:var(--text-secondary);text-align:center;">${time}</div>
                    <div style="flex:0.4;text-align:right;font-weight:600;font-size:0.85rem;">${regularCount}名</div>
                  </div>`;
              }).join('')}`;
          }).join('')}
        </div>
      </div>
    </div>
  `;
}
