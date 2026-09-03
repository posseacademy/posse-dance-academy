import { courseColors, timeSchedule } from '../config.js?v=16';
import { isRegularPlan, getCustomerCountByCourse, getClassStudentsForMonth, isClassInTimeSchedule, isClassOutOfPeriod } from '../utils.js?v=19';

export function renderDashboard(app) {
  // Calculate customer statistics
  const totalCustomers = app.customers.length;
  const activeCustomers = app.customers.filter(c => c.status === '入会中').length;
  const pausedCustomers = app.customers.filter(c => c.status === '休会中').length;
  const withdrawnCustomers = app.customers.filter(c => c.status === '退会済み').length;

  // プラン別人数集計（網羅型 — 入会中合計と必ず一致）
  const courseCounts = getCustomerCountByCourse(app.customers, courseColors);
  const courseCountsTotal = courseCounts.reduce((sum, item) => sum + item.count, 0);

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
              <div class="rev-label" style="color:#000;font-weight:700;">
                <span class="rev-dot" style="background-color: ${item.color};"></span>
                ${item.label}
              </div>
              <div class="rev-detail" style="color:#000;font-weight:700;font-size:var(--font-size-sm);">${item.count}名${
                ['１','２','３','４'].includes(item.course)
                  ? `<span style="color:#000;margin-left:0.5rem;font-weight:700;">(1.5h: ${item.count15h}名)</span>`
                  : ''
              }</div>
            </div>
            ${item.course === 'OTHER' && item.otherStudents ? `
              <div style="padding:0.4rem 1rem 0.6rem 2.2rem;font-size:0.75rem;color:#dc2626;">
                ${item.otherStudents.map(s => `${s.memberNumber ? '#'+s.memberNumber+' ' : ''}${s.name}（plan: ${s.plan} / course: ${s.course || '-'}）`).join('<br>')}
              </div>
            ` : ''}
          `).join('')}
          <div style="margin-top:0.5rem;padding-top:0.5rem;border-top:1px dashed #ddd;font-size:0.75rem;color:${courseCountsTotal === activeCustomers ? '#10b981' : '#ef4444'};text-align:right;">
            ${courseCountsTotal === activeCustomers
              ? `✓ 合計 ${courseCountsTotal}名 / 入会中 ${activeCustomers}名`
              : `⚠ 合計 ${courseCountsTotal}名 / 入会中 ${activeCustomers}名（差 ${activeCustomers - courseCountsTotal}名）`}
          </div>
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
            // 出席名簿と同じ基準で、終了したクラス（時間割に無く当月0名）を隠す
            const _tsDay = (app.timeScheduleData || timeSchedule)[day];
            const classes = (app.scheduleData[day] || []).filter(cls => {
              if (app.timeScheduleLoaded !== true) return true;   // 未確定(undefined)も表示側に倒す
              if (isClassInTimeSchedule(cls, _tsDay, app.selectedMonth)) return true;
              // 出席名簿と同じ基準（開催期間で終了させたクラスは受講者数で覆さない）
              if (isClassOutOfPeriod(cls, _tsDay, app.selectedMonth)) return false;
              return getClassStudentsForMonth(cls, day, app.attendanceData, app.customers, app.selectedMonth).total > 0;
            });
            if (!classes.length) return '';
            return `
              <div style="font-weight:600;font-size:0.9rem;padding:0.5rem 1rem;background:${dayColors[day]}15;border-left:4px solid ${dayColors[day]};color:${dayColors[day]};display:flex;align-items:center;gap:8px;">
                <span style="width:8px;height:8px;border-radius:50%;background:${dayColors[day]};display:inline-block;flex-shrink:0;"></span>
                ${day}
              </div>
              ${classes.map(cls => {
                const loc = cls.location || cls.venue || '';
                const tsH = app.timeScheduleData || timeSchedule;
                // 時間割の照合は scheduleName を優先する（attendance.js と同じ理由。
                // 表示名を変更したクラスは name が名簿名と一致しなくなり時刻が空欄になる）
                const te = (tsH[day] || []).find(t => (t.scheduleName || t.name) === cls.name && (t.venue === loc || t.venue === loc + '校' || t.venue?.replace('校','') === loc))
                  || (tsH[day] || []).find(t => (t.scheduleName || t.name) === cls.name && !t.alias);
                const time = te ? te.time : '';
                // 出席名簿と同じロジックで当月の対象者数を計算
                const { total: studentCount } = getClassStudentsForMonth(cls, day, app.attendanceData, app.customers, app.selectedMonth);
                return `
                  <div style="display:flex;align-items:center;padding:0.5rem 1rem;border-bottom:1px solid var(--border-color);">
                    <div style="flex:2;font-size:0.85rem;font-weight:500;">${cls.name}</div>
                    <div style="flex:0.8;font-size:0.8rem;color:var(--text-secondary);">${loc}</div>
                    <div style="flex:1;font-size:0.8rem;color:var(--text-secondary);text-align:center;">${time}</div>
                    <div style="flex:0.4;text-align:right;font-weight:600;font-size:0.85rem;">${studentCount}名</div>
                  </div>`;
              }).join('')}`;
          }).join('')}
        </div>
      </div>
    </div>
  `;
}
