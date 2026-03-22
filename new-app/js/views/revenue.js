// POSSE Dance Academy - Revenue View Module
import { pricing, coursePrices, courseColors, visitorRevenueOverrides, coursePricesWithTransfer, combinedPrices15h, CLASS_15H, TRANSFER_FEE, ENROLLMENT_FEE, ANNUAL_FEE } from '../config.js?v=9';
import { calculateVisitorRevenue, calculateDetailedRevenue, calculatePracticeRevenue, calculateMonthlyTuition, calculateFeeRevenue } from '../utils.js?v=5';

export function renderRevenue(app) {
  const [year, month] = app.selectedMonth.split('-');
  const monthDisplay = `${year}年${month}月`;

  // 1. Monthly tuition (with transfer fee + 1.5h combined plan support)
  const tuitionResult = calculateMonthlyTuition(
    app.customers, app.scheduleData,
    coursePricesWithTransfer, combinedPrices15h, CLASS_15H
  );
  const tuitionTotal = tuitionResult.total;
  const courseCounts = tuitionResult.courseCounts;

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

  // 5. Enrollment & Annual fees
  const feeData = calculateFeeRevenue(app.customers, app.selectedMonth);
  const feeTotal = feeData.enrollment.total + feeData.annualFee.total;

  const grandTotal = tuitionTotal + visitorTotal + practiceTotal + eventTotal + feeTotal;

  return `
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h2>売上管理</h2>
        <p class="subtitle">月別売上の確認</p>
      </div>
      <div style="display:flex;align-items:center;gap:0.75rem;">
        <button class="btn btn-secondary" onclick="window.app.previousMonth()">前月</button>
        <button class="btn btn-secondary" onclick="window.app.nextMonth()">翌月</button>
        <input type="month" class="form-input" value="${app.selectedMonth || ''}"
               onchange="window.app.setSelectedMonth(this.value)"
               style="width:150px;">
      </div>
    </div>

    <!-- Grand Total Card -->
    <div class="content-card" style="margin-bottom:1.5rem;background:#1d1d1f;">
      <div class="card-content" style="padding:1.5rem;">
        <div style="font-size:0.875rem;color:rgba(255,255,255,0.6);margin-bottom:0.25rem;">総売上（${monthDisplay}）</div>
        <div style="font-size:2.25rem;font-weight:800;color:white;letter-spacing:-0.02em;margin-bottom:1rem;">¥${grandTotal.toLocaleString('ja-JP')}</div>
        <div class="grid-5col revenue-grand-grid">
          <div style="padding:0.75rem;background:rgba(255,255,255,0.1);border-radius:0.5rem;">
            <div style="font-size:0.75rem;color:rgba(255,255,255,0.6);">月謝</div>
            <div style="font-size:1.1rem;font-weight:700;color:white;">¥${tuitionTotal.toLocaleString('ja-JP')}</div>
          </div>
          <div style="padding:0.75rem;background:rgba(255,255,255,0.1);border-radius:0.5rem;">
            <div style="font-size:0.75rem;color:rgba(255,255,255,0.6);">ビジター</div>
            <div style="font-size:1.1rem;font-weight:700;color:white;">¥${visitorTotal.toLocaleString('ja-JP')}</div>
          </div>
          <div style="padding:0.75rem;background:rgba(255,255,255,0.1);border-radius:0.5rem;">
            <div style="font-size:0.75rem;color:rgba(255,255,255,0.6);">練習会</div>
            <div style="font-size:1.1rem;font-weight:700;color:white;">¥${practiceTotal.toLocaleString('ja-JP')}</div>
          </div>
          <div style="padding:0.75rem;background:rgba(255,255,255,0.1);border-radius:0.5rem;">
            <div style="font-size:0.75rem;color:rgba(255,255,255,0.6);">イベント</div>
            <div style="font-size:1.1rem;font-weight:700;color:white;">¥${eventTotal.toLocaleString('ja-JP')}</div>
          </div>
          <div style="padding:0.75rem;background:rgba(255,255,255,0.1);border-radius:0.5rem;">
            <div style="font-size:0.75rem;color:rgba(255,255,255,0.6);">入会・年会費</div>
            <div style="font-size:1.1rem;font-weight:700;color:white;">¥${feeTotal.toLocaleString('ja-JP')}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Detail Cards -->
    <div class="grid-2col">
      <!-- Tuition -->
      <div class="content-card">
        <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;background:#1d1d1f;border-radius:var(--border-radius-lg) var(--border-radius-lg) 0 0;">
          <h3 class="card-title" style="margin:0;color:white;">月謝売上</h3>
          <span style="font-size:1.1rem;font-weight:700;color:white;white-space:nowrap;">¥${tuitionTotal.toLocaleString('ja-JP')}</span>
        </div>
        <div class="card-content">
          <div style="font-size:0.7rem;color:var(--text-secondary);margin-bottom:0.5rem;">※振込手数料¥${TRANSFER_FEE}込み</div>
          ${courseCounts.map(item => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:0.6rem 0;border-bottom:1px solid var(--border-color);">
              <div style="display:flex;align-items:center;gap:0.5rem;">
                <span style="width:8px;height:8px;border-radius:50%;background:${item.color};flex-shrink:0;"></span>
                <span>コース${item.course}</span>
                ${item.count15h > 0 ? `<span style="font-size:0.65rem;background:#f3e8ff;color:#7c3aed;padding:1px 6px;border-radius:9999px;">1.5h込${item.count15h}名</span>` : ''}
              </div>
              <div style="text-align:right;">
                <span style="font-weight:600;">¥${item.price.toLocaleString('ja-JP')}</span>
                <span style="font-size:0.75rem;color:var(--text-secondary);margin-left:0.5rem;">${item.count}名</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Visitor -->
      <div class="content-card">
        <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;background:#1d1d1f;border-radius:var(--border-radius-lg) var(--border-radius-lg) 0 0;">
          <h3 class="card-title" style="margin:0;color:white;">ビジター売上</h3>
          <span style="font-size:1.1rem;font-weight:700;color:white;white-space:nowrap;">¥${visitorTotal.toLocaleString('ja-JP')}</span>
        </div>
        <div class="card-content">
          ${Object.entries(visitorDetail).filter(([cat, d]) => d.count > 0 && cat !== '練習会').map(([cat, data]) => `
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
        <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;background:#1d1d1f;border-radius:var(--border-radius-lg) var(--border-radius-lg) 0 0;">
          <h3 class="card-title" style="margin:0;color:white;">練習会売上</h3>
          <span style="font-size:1.1rem;font-weight:700;color:white;white-space:nowrap;">¥${practiceTotal.toLocaleString('ja-JP')}</span>
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
        <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;background:#1d1d1f;border-radius:var(--border-radius-lg) var(--border-radius-lg) 0 0;">
          <h3 class="card-title" style="margin:0;color:white;">イベント売上</h3>
          <span style="font-size:1.1rem;font-weight:700;color:white;white-space:nowrap;">¥${eventTotal.toLocaleString('ja-JP')}</span>
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

    <!-- Enrollment & Annual Fees Card -->
    ${feeTotal > 0 ? `
    <div class="content-card" style="margin-top:1.5rem;">
      <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;background:#1d1d1f;border-radius:var(--border-radius-lg) var(--border-radius-lg) 0 0;">
        <h3 class="card-title" style="margin:0;color:white;">入会金・年会費（${monthDisplay}）</h3>
        <span style="font-size:1.1rem;font-weight:700;color:white;white-space:nowrap;">¥${feeTotal.toLocaleString('ja-JP')}</span>
      </div>
      <div class="card-content">
        <div class="grid-2col" style="gap:1rem;">
          <div>
            <div style="font-weight:600;margin-bottom:0.5rem;">入会金（¥${ENROLLMENT_FEE.toLocaleString('ja-JP')}）</div>
            ${feeData.enrollment.list.length > 0 ? feeData.enrollment.list.map(f => `
              <div style="display:flex;justify-content:space-between;padding:0.4rem 0;border-bottom:1px solid var(--border-color);font-size:0.875rem;">
                <span>${f.name}</span>
                <span style="font-weight:600;">¥${f.amount.toLocaleString('ja-JP')}</span>
              </div>
            `).join('') : '<div style="color:var(--text-secondary);font-size:0.875rem;">なし</div>'}
          </div>
          <div>
            <div style="font-weight:600;margin-bottom:0.5rem;">年会費（¥${ANNUAL_FEE.toLocaleString('ja-JP')}）</div>
            ${feeData.annualFee.list.length > 0 ? feeData.annualFee.list.map(f => `
              <div style="display:flex;justify-content:space-between;padding:0.4rem 0;border-bottom:1px solid var(--border-color);font-size:0.875rem;">
                <span>${f.name}</span>
                <span style="font-weight:600;">¥${f.amount.toLocaleString('ja-JP')}</span>
              </div>
            `).join('') : '<div style="color:var(--text-secondary);font-size:0.875rem;">なし</div>'}
          </div>
        </div>
      </div>
    </div>
    ` : ''}

    <!-- Pricing Table -->
    <div class="content-card" style="margin-top:1.5rem;">
      <div class="card-header" style="background:#1d1d1f;border-radius:var(--border-radius-lg) var(--border-radius-lg) 0 0;">
        <h3 class="card-title" style="margin:0;color:white;">料金表</h3>
      </div>
      <div class="card-content" style="padding:1rem;">
        <table style="width:100%;border-collapse:collapse;font-size:0.875rem;">
          <thead>
            <tr style="border-bottom:2px solid var(--border-color);">
              <th style="text-align:left;padding:0.5rem 0.75rem;">プラン</th>
              <th style="text-align:right;padding:0.5rem 0.75rem;">基本料金</th>
              <th style="text-align:right;padding:0.5rem 0.75rem;">手数料</th>
              <th style="text-align:right;padding:0.5rem 0.75rem;">合計</th>
            </tr>
          </thead>
          <tbody>
            <tr style="background:#f9fafb;"><td colspan="4" style="padding:0.5rem 0.75rem;font-weight:700;font-size:0.8rem;color:#374151;">月謝プラン（固定クラス）</td></tr>
            <tr style="border-bottom:1px solid var(--border-color);">
              <td style="padding:0.5rem 0.75rem;">1クラス</td>
              <td style="text-align:right;padding:0.5rem 0.75rem;">¥6,000</td>
              <td style="text-align:right;padding:0.5rem 0.75rem;">¥200</td>
              <td style="text-align:right;padding:0.5rem 0.75rem;font-weight:600;">¥6,200</td>
            </tr>
            <tr style="border-bottom:1px solid var(--border-color);">
              <td style="padding:0.5rem 0.75rem;">2クラス</td>
              <td style="text-align:right;padding:0.5rem 0.75rem;">¥10,000</td>
              <td style="text-align:right;padding:0.5rem 0.75rem;">¥200</td>
              <td style="text-align:right;padding:0.5rem 0.75rem;font-weight:600;">¥10,200</td>
            </tr>
            <tr style="border-bottom:1px solid var(--border-color);">
              <td style="padding:0.5rem 0.75rem;">3クラス</td>
              <td style="text-align:right;padding:0.5rem 0.75rem;">¥14,400</td>
              <td style="text-align:right;padding:0.5rem 0.75rem;">¥200</td>
              <td style="text-align:right;padding:0.5rem 0.75rem;font-weight:600;">¥14,600</td>
            </tr>
            <tr style="border-bottom:1px solid var(--border-color);">
              <td style="padding:0.5rem 0.75rem;">4クラス</td>
              <td style="text-align:right;padding:0.5rem 0.75rem;">¥18,600</td>
              <td style="text-align:right;padding:0.5rem 0.75rem;">¥200</td>
              <td style="text-align:right;padding:0.5rem 0.75rem;font-weight:600;">¥18,800</td>
            </tr>
            <tr style="border-bottom:1px solid var(--border-color);">
              <td style="padding:0.5rem 0.75rem;">1.5hクラス（水曜ブレイキン中上級）</td>
              <td style="text-align:right;padding:0.5rem 0.75rem;">¥6,600</td>
              <td style="text-align:right;padding:0.5rem 0.75rem;">¥200</td>
              <td style="text-align:right;padding:0.5rem 0.75rem;font-weight:600;">¥6,800</td>
            </tr>

            <tr style="background:#f3e8ff;"><td colspan="4" style="padding:0.5rem 0.75rem;font-weight:700;font-size:0.8rem;color:#6d28d9;">1.5hクラス込みプラン</td></tr>
            <tr style="border-bottom:1px solid var(--border-color);">
              <td style="padding:0.5rem 0.75rem;">2クラス（1.5h含む）</td>
              <td style="text-align:right;padding:0.5rem 0.75rem;">¥5,000 + ¥6,600</td>
              <td style="text-align:right;padding:0.5rem 0.75rem;">¥200</td>
              <td style="text-align:right;padding:0.5rem 0.75rem;font-weight:600;">¥11,800</td>
            </tr>
            <tr style="border-bottom:1px solid var(--border-color);">
              <td style="padding:0.5rem 0.75rem;">3クラス（1.5h含む）</td>
              <td style="text-align:right;padding:0.5rem 0.75rem;">¥9,600 + ¥6,600</td>
              <td style="text-align:right;padding:0.5rem 0.75rem;">¥200</td>
              <td style="text-align:right;padding:0.5rem 0.75rem;font-weight:600;">¥16,400</td>
            </tr>
            <tr style="border-bottom:1px solid var(--border-color);">
              <td style="padding:0.5rem 0.75rem;">4クラス（1.5h含む）</td>
              <td style="text-align:right;padding:0.5rem 0.75rem;">¥13,950 + ¥6,600</td>
              <td style="text-align:right;padding:0.5rem 0.75rem;">¥200</td>
              <td style="text-align:right;padding:0.5rem 0.75rem;font-weight:600;">¥20,750</td>
            </tr>

            <tr style="background:#f9fafb;"><td colspan="4" style="padding:0.5rem 0.75rem;font-weight:700;font-size:0.8rem;color:#374151;">ビジター（単発受講）</td></tr>
            <tr style="border-bottom:1px solid var(--border-color);">
              <td style="padding:0.5rem 0.75rem;">会員</td>
              <td colspan="2"></td>
              <td style="text-align:right;padding:0.5rem 0.75rem;font-weight:600;">¥2,000</td>
            </tr>
            <tr style="border-bottom:1px solid var(--border-color);">
              <td style="padding:0.5rem 0.75rem;">非会員</td>
              <td colspan="2"></td>
              <td style="text-align:right;padding:0.5rem 0.75rem;font-weight:600;">¥2,300</td>
            </tr>
            <tr style="border-bottom:1px solid var(--border-color);">
              <td style="padding:0.5rem 0.75rem;">1.5hクラス（会員）</td>
              <td colspan="2"></td>
              <td style="text-align:right;padding:0.5rem 0.75rem;font-weight:600;">¥2,200</td>
            </tr>
            <tr style="border-bottom:1px solid var(--border-color);">
              <td style="padding:0.5rem 0.75rem;">1.5hクラス（非会員）</td>
              <td colspan="2"></td>
              <td style="text-align:right;padding:0.5rem 0.75rem;font-weight:600;">¥2,500</td>
            </tr>

            <tr style="background:#f9fafb;"><td colspan="4" style="padding:0.5rem 0.75rem;font-weight:700;font-size:0.8rem;color:#374151;">その他</td></tr>
            <tr style="border-bottom:1px solid var(--border-color);">
              <td style="padding:0.5rem 0.75rem;">振替（月1回のみ）</td>
              <td colspan="2"></td>
              <td style="text-align:right;padding:0.5rem 0.75rem;font-weight:600;">¥1,000</td>
            </tr>
            <tr style="border-bottom:1px solid var(--border-color);">
              <td style="padding:0.5rem 0.75rem;">初回体験（1回のみ）</td>
              <td colspan="2"></td>
              <td style="text-align:right;padding:0.5rem 0.75rem;font-weight:600;">¥1,000</td>
            </tr>
            <tr style="border-bottom:1px solid var(--border-color);">
              <td style="padding:0.5rem 0.75rem;">練習会</td>
              <td colspan="2"></td>
              <td style="text-align:right;padding:0.5rem 0.75rem;font-weight:600;">¥500</td>
            </tr>

            <tr style="background:#f9fafb;"><td colspan="4" style="padding:0.5rem 0.75rem;font-weight:700;font-size:0.8rem;color:#374151;">入会金・年会費</td></tr>
            <tr style="border-bottom:1px solid var(--border-color);">
              <td style="padding:0.5rem 0.75rem;">入会金（家族は無料）</td>
              <td colspan="2"></td>
              <td style="text-align:right;padding:0.5rem 0.75rem;font-weight:600;">¥5,500</td>
            </tr>
            <tr style="border-bottom:1px solid var(--border-color);">
              <td style="padding:0.5rem 0.75rem;">年会費（毎年4月更新・月割りあり）</td>
              <td colspan="2"></td>
              <td style="text-align:right;padding:0.5rem 0.75rem;font-weight:600;">¥4,800</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}
