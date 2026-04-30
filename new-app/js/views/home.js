import { courseColors, timeSchedule } from '../config.js?v=14';
import { isRegularPlan, getCustomerCountByCourse, getStudentNamesIn15hClasses } from '../utils.js?v=10';

export function renderDashboard(app) {
  // Calculate customer statistics
  const totalCustomers = app.customers.length;
  const activeCustomers = app.customers.filter(c => c.status === '入会中').length;
  const pausedCustomers = app.customers.filter(c => c.status === '休会中').length;
  const withdrawnCustomers = app.customers.filter(c => c.status === '退会済み').length;

  // プラン別人数集計（売上計算は廃止、人数のみ）
  const students15hSet = getStudentNamesIn15hClasses(app.scheduleData, app.timeScheduleData || timeSchedule);
  const courseCounts = getCustomerCountByCourse(app.customers, courseColors, students15hSet);

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

    <!-- プラン別内訳 + レッスン一覧（2列レイアウト） -->
    <div class="content-grid" style="margin-top:1.5rem;">
      <!-- 左: プラン別内訳 -->
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
              <div class="rev-detail">${item.count}名${item.count15h > 0 ? `<span style="color:#000;margin-left:0.5rem;font-size:var(--font-size-xs);font-weight:600;">(1.5h: ${item.count15h}名)</span>` : ''}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- 右: レッスン一覧 -->
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
