// POSSE Dance Academy - Revenue View Module
import { pricing, coursePrices, courseColors, visitorRevenueOverrides } from '../config.js';
import { calculateVisitorRevenue, calculateDetailedRevenue, calculatePracticeRevenue } from '../utils.js';

export function renderRevenue(app) {
  const [year, month] = app.selectedMonth.split('-');
  const monthDisplay = `${year}年${month}月`;

  // 1. Monthly tuition (regular plans)
  const courseCountsMap = {};
  Object.values(app.customers || {})
    .filter(c => c.status === '入会中')
    .forEach(c => {
      const course = c.course || '１';
      courseCountsMap[course] = (courseCountsMap[course] || 0) + 1;
    });
  const courseOrder = ['４', '３', '２', '１'];
  const courseCounts = courseOrder
    .filter(course => courseCountsMap[course])
    .map(course => ({
      course,
      count: courseCountsMap[course],
      price: coursePrices[course] || 0,
      color: courseColors[course] || '#999'
    }));
  const tuitionTotal = courseCounts.reduce((sum, item) => sum + item.price * item.count, 0);

  // 2. Visitor revenue
  const visitorTotal = calculateVisitorRevenue(app.attendanceData, app.scheduleData, app.pricing, visitorRevenueOverrides, app.selectedMonth);
  const visitorDetail = calculateDetailedRevenue(app.attendanceData, app.scheduleData, pricing, visitorRevenueOverrides, app.selectedMonth);

  // 3. Practice revenue
  const practiceData = calculatePracticeRevenue(app.attendanceData);
  const practiceTotal = practiceData.revenue;

  // 4. Event revenue
  let eventTotal = 0;
  const eventList = [];
  Object.entries(app.eventsData || {}).forEach(([id, ev]) => {
    const evRevenue = (ev.participants || []).reduce((sum, p) => sum + (parseInt(p.amount) || 0), 0);
    eventTotal += evRevenue;
    eventList.push({ name: ev.name, date: ev.date, count: (ev.participants || []).length, revenue: evRevenue });
  });

  const grandTotal = tuitionTotal + visitorTotal + practiceTotal + eventTotal;

  return `
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h2>売上管理</h2>
        <p class="subtitle">月別売上の確認</p>
      </div>
      <div style="display:flex;align-items:center;gap:0.75rem;">
        <button class="btn btn-secondary" onclick="(function(){const d=new Date(window.app.selectedMonth+'-01');d.setMonth(d.getMonth()-1);window.app.changeMonth(d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'))})()">前月</button>
        <button class="btn btn-secondary" onclick="(function(){const d=new Date(window.app.selectedMonth+'-01');d.setMonth(d.getMonth()+1);window.app.changeMonth(d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'))})()">翌月</button>
        <input type="month" class="form-input" value="${app.selectedMonth || ''}"
               onchange="window.app.changeMonth(this.value)"
               style="width:150px;">
      </div>
    </div>

    <!-- Grand Total Card -->
    <div class="content-card" style="margin-bottom:1.5rem;background:linear-gradient(135deg, rgba(16,185,129,0.08), rgba(59,130,246,0.08));">
      <div class="card-content" style="padding:1.5rem;">
        <div style="font-size:0.875rem;color:var(--text-secondary);margin-bottom:0.25rem;">総売上（${monthDisplay}）</div>
        <div style="font-size:2.25rem;font-weight:800;color:#10b981;letter-spacing:-0.02em;margin-bottom:1rem;">¥${grandTotal.toLocaleString('ja-JP')}</div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:0.75rem;">
          <div style="padding:0.75rem;background:rgba(0,0,0,0.2);border-radius:0.5rem;">
            <div style="font-size:0.75rem;color:var(--text-secondary);">月謝</div>
            <div style="font-size:1.1rem;font-weight:700;color:#3b82f6;">¥${tuitionTotal.toLocaleString('ja-JP')}</div>
          </div>
          <div style="padding:0.75rem;background:rgba(0,0,0,0.2);border-radius:0.5rem;">
            <div style="font-size:0.75rem;color:var(--text-secondary);">ビジター</div>
            <div style="font-size:1.1rem;font-weight:700;color:#f59e0b;">¥${visitorTotal.toLocaleString('ja-JP')}</div>
          </div>
          <div style="padding:0.75rem;background:rgba(0,0,0,0.2);border-radius:0.5rem;">
            <div style="font-size:0.75rem;color:var(--text-secondary);">練習会</div>
            <div style="font-size:1.1rem;font-weight:700;color:#8b5cf6;">¥${practiceTotal.toLocaleString('ja-JP')}</div>
          </div>
          <div style="padding:0.75rem;background:rgba(0,0,0,0.2);border-radius:0.5rem;">
            <div style="font-size:0.75rem;color:var(--text-secondary);">イベント</div>
            <div style="font-size:1.1rem;font-weight:700;color:#ec4899;">¥${eventTotal.toLocaleString('ja-JP')}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Detail Cards -->
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:1.5rem;">
      <!-- Tuition -->
      <div class="content-card">
        <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
          <h3 class="card-title" style="margin:0;">月謝売上</h3>
          <span style="font-size:1.1rem;font-weight:700;color:#3b82f6;white-space:nowrap;">¥${tuitionTotal.toLocaleString('ja-JP')}</span>
        </div>
        <div class="card-content">
          ${courseCounts.map(item => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:0.6rem 0;border-bottom:1px solid var(--border-color);">
              <div style="display:flex;align-items:center;gap:0.5rem;">
                <span style="width:8px;height:8px;border-radius:50%;background:${item.color};flex-shrink:0;"></span>
                <span>コース${item.course}</span>
              </div>
              <div style="text-align:right;">
                <span style="font-weight:600;">¥${(item.price * item.count).toLocaleString('ja-JP')}</span>
                <span style="font-size:0.75rem;color:var(--text-secondary);margin-left:0.5rem;">${item.count}名</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Visitor -->
      <div class="content-card">
        <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
          <h3 class="card-title" style="margin:0;">ビジター売上</h3>
          <span style="font-size:1.1rem;font-weight:700;color:#f59e0b;white-space:nowrap;">¥${visitorTotal.toLocaleString('ja-JP')}</span>
        </div>
        <div class="card-content">
          ${Object.entries(visitorDetail).filter(([, d]) => d.count > 0).map(([cat, data]) => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:0.6rem 0;border-bottom:1px solid var(--border-color);">
              <span>${cat}</span>
              <div style="text-align:right;">
                <span style="font-weight:600;">¥${data.revenue.toLocaleString('ja-JP')}</span>
                <span style="font-size:0.75rem;color:var(--text-secondary);margin-left:0.5rem;">${data.count}人</span>
              </div>
            </div>
          `).join('') || '<div style="color:var(--text-secondary);font-size:0.875rem;">データなし</div>'}
        </div>
      </div>

      <!-- Practice -->
      <div class="content-card">
        <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
          <h3 class="card-title" style="margin:0;">練習会売上</h3>
          <span style="font-size:1.1rem;font-weight:700;color:#8b5cf6;white-space:nowrap;">¥${practiceTotal.toLocaleString('ja-JP')}</span>
        </div>
        <div class="card-content">
          ${['月曜日', '木曜日'].map(day => {
            const key = `練習会_${day}`;
            const data = app.attendanceData[key] || {};
            const dayTotal = ['week1','week2','week3','week4','week5'].reduce((sum, w) => sum + (parseInt(data[w]) || 0), 0);
            return `
              <div style="display:flex;justify-content:space-between;align-items:center;padding:0.6rem 0;border-bottom:1px solid var(--border-color);">
                <span>${day}</span>
                <div style="text-align:right;">
                  <span style="font-weight:600;">¥${(dayTotal * 500).toLocaleString('ja-JP')}</span>
                  <span style="font-size:0.75rem;color:var(--text-secondary);margin-left:0.5rem;">${dayTotal}人</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Events -->
      <div class="content-card">
        <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
          <h3 class="card-title" style="margin:0;">イベント売上</h3>
          <span style="font-size:1.1rem;font-weight:700;color:#ec4899;white-space:nowrap;">¥${eventTotal.toLocaleString('ja-JP')}</span>
        </div>
        <div class="card-content">
          ${eventList.length > 0 ? eventList.map(ev => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:0.6rem 0;border-bottom:1px solid var(--border-color);">
              <div>
                <div>${ev.name}</div>
                <div style="font-size:0.75rem;color:var(--text-secondary);">${ev.date || ''} / ${ev.count}名</div>
              </div>
              <span style="font-weight:600;white-space:nowrap;">¥${ev.revenue.toLocaleString('ja-JP')}</span>
            </div>
          `).join('') : '<div style="color:var(--text-secondary);font-size:0.875rem;">データなし</div>'}
        </div>
      </div>
    </div>
  `;
}
