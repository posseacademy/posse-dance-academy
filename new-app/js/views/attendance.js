// POSSE Dance Academy - Attendance View Module
// ES module for attendance recording and tracking

import { timeSchedule, planOrder } from '../config.js?v=13';
import { getAttendanceRate, sortStudentsByPlan, isRegularPlan } from '../utils.js?v=8';

/**
 * Main attendance wrapper with subtabs
 * @param {Object} app - Application state
 * @returns {string} HTML string for attendance view
 */
export function renderAttendance(app) {
  const subtabs = ['出席記録', '練習会', 'イベント'];
  const currentSubtab = app.attendanceSubtab || '出席記録';

  let content = '';
  switch (currentSubtab) {
    case '出席記録':
      content = renderAttendanceRecord(app);
      break;
    case '練習会':
      content = renderPracticeSession(app);
      break;
    case 'イベント':
      content = renderEventRecord(app);
      break;
  }

  return `
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h2>出席管理</h2>
        <p class="subtitle">レッスン出席管理</p>
      </div>
      <div class="header-actions" style="gap:0.5rem;display:flex;align-items:center;flex-wrap:wrap;">
        <input type="month" class="form-input" value="${app.selectedMonth || ''}"
               onchange="window.app.setSelectedMonth(this.value)"
               style="width: 150px;">
        <button id="exportAttendanceMonthlyBtn" class="btn btn-secondary btn-sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          月別CSV
        </button>
        <button id="exportAttendanceYearlyBtn" class="btn btn-secondary btn-sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          年間CSV
        </button>
      </div>
    </div>

    <!-- Attendance Subtabs -->
    <div class="tab-nav">
      ${subtabs.map(tab => {
        const icons = {
          '出席記録': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 14l2 2 4-4"/></svg>',
          '練習会': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>',
          'イベント': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>'
        };
        return `
          <button class="tab-btn ${tab === currentSubtab ? 'active' : ''}"
                  onclick="window.app.setAttendanceSubtab('${tab}')">
            ${icons[tab] || ''}${tab}
          </button>
        `;
      }).join('')}
    </div>

    ${content}
  `;
}

/**
 * Detailed attendance recording with weekly ○/×/休講 buttons
 * @param {Object} app - Application state
 * @returns {string} HTML string for attendance record
 */
export function renderAttendanceRecord(app) {
  const daysOfWeek = ['月曜日', '火曜日', '水曜日', '木曜日', '金曜日'];
  const currentDay = app.selectedDay || '月曜日';
  const schedule = app.scheduleData[currentDay] || [];
  // 過去月判定（YYYY-MM 比較）
  const _now = new Date();
  const _currentYM = `${_now.getFullYear()}-${String(_now.getMonth()+1).padStart(2,'0')}`;
  const isPastMonth = (app.selectedMonth || '') < _currentYM;

  return `
    <!-- Day Tabs with Month Navigation -->
    <div class="att-day-nav">
      <div class="tab-nav att-day-tabs" style="margin-bottom:0;flex:1;">
        ${daysOfWeek.map(day => {
          const dayColors = {'月曜日':'#3b82f6','火曜日':'#ef4444','水曜日':'#10b981','木曜日':'#f59e0b','金曜日':'#8b5cf6'};
          const shortDay = day.charAt(0);
          return `
            <button class="tab-btn ${day === currentDay ? 'active' : ''}"
                    onclick="window.app.setAttendanceDay('${day}')">
              <span class="day-dot" style="background:${dayColors[day]};"></span>
              <span class="day-full">${day}</span>
              <span class="day-short">${shortDay}</span>
            </button>
          `;
        }).join('')}
      </div>
      <div class="att-month-nav">
        <button class="btn btn-secondary btn-sm" onclick="window.app.previousMonth()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
          <span class="month-nav-label">前月</span>
        </button>
        <button class="btn btn-secondary btn-sm" onclick="window.app.nextMonth()">
          <span class="month-nav-label">翌月</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
    </div>

    <!-- Classes for Selected Day (2-column grid) -->
    <div class="grid-2col attendance-grid">
      ${[...schedule].sort((a, b) => {
        const locA = a.location || a.venue || '';
        const locB = b.location || b.venue || '';
        const tsData = app.timeScheduleData || timeSchedule;
        const tA = (tsData[currentDay] || []).find(t => t.name === a.name && (t.venue === locA || t.venue === locA + '校' || t.venue?.replace('校','') === locA))
          || (tsData[currentDay] || []).find(t => t.name === a.name);
        const tB = (tsData[currentDay] || []).find(t => t.name === b.name && (t.venue === locB || t.venue === locB + '校' || t.venue?.replace('校','') === locB))
          || (tsData[currentDay] || []).find(t => t.name === b.name);
        const timeA = tA ? tA.time.split('-')[0].replace(':', '') : '9999';
        const timeB = tB ? tB.time.split('-')[0].replace(':', '') : '9999';
        return timeA.localeCompare(timeB);
      }).map((cls, idx) => {
        const loc = cls.location || cls.venue || '';
        const tsData2 = app.timeScheduleData || timeSchedule;
        const timeEntry = (tsData2[currentDay] || []).find(t => t.name === cls.name && (t.venue === loc || t.venue === loc + '校' || t.venue?.replace('校','') === loc))
          || (tsData2[currentDay] || []).find(t => t.name === cls.name);
        const timeStr = timeEntry ? timeEntry.time : '';
        const classHTML = `
        <div class="content-card" style="margin-bottom:0;display:flex;flex-direction:column;height:100%;">
          <div class="card-header" style="background-color: #1d1d1f; color: white; border-radius: 0.5rem 0.5rem 0 0; display: flex; align-items: center; justify-content: space-between;">
            <h3 class="card-title" style="color: white; margin: 0; font-size: 1rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${cls.name} - ${cls.location || cls.venue}</h3>
            ${timeStr ? `<span style="font-size: 0.875rem; color: rgba(255,255,255,0.9); background: rgba(0,0,0,0.2); padding: 0.2rem 0.6rem; border-radius: 0.25rem; white-space: nowrap;">${timeStr}</span>` : ''}
          </div>
          <div class="card-content" style="flex:1;">
            <div class="att-table-wrap">
              <table class="att-table">
                <thead>
                  <tr style="border-bottom: 1px solid var(--border-color);">
                    <th class="att-th-name"><span class="day-full">学生名</span><span class="day-short">名前</span></th>
                    <th class="att-th-plan"><span class="day-full">プラン</span><span class="day-short">P</span></th>
                    <th class="att-th-week">W1</th>
                    <th class="att-th-week">W2</th>
                    <th class="att-th-week">W3</th>
                    <th class="att-th-week">W4</th>
                    <th class="att-th-week">W5</th>
                    <th class="att-th-rate"><span class="day-full">出席率</span><span class="day-short">率</span></th>
                    <th class="att-th-actions"></th>
                  </tr>
                </thead>
                <tbody>
                  ${(() => {
                    // 表示ルール:
                    // - 当月/未来月: schedule.students を全員表示（記録なくても）+ attendance のビジター
                    // - 過去月: schedule.students は出席記録(○/×/休講)があるもののみ表示
                    //          + attendance に記録があるが schedule にない過去在籍生徒
                    //          + ビジター
                    const _hasMarkRec = (rec) => rec && ['week1','week2','week3','week4','week5'].some(w => ['○','×','休講'].includes(rec[w]));
                    const _markCheck = (lastName, firstName) => {
                      const key = `${currentDay}_${cls.location || cls.venue}_${cls.name}_${lastName}${firstName}`;
                      return _hasMarkRec(app.attendanceData?.[key]);
                    };
                    const allRegulars = (cls.students || []).filter(s => isRegularPlan(s.plan));
                    // 過去月は出席記録ありのみ
                    const regulars = isPastMonth
                      ? allRegulars.filter(s => _markCheck(s.lastName, s.firstName))
                      : allRegulars;
                    const seen = new Set(regulars.map(s => s.lastName + s.firstName));
                    const prefix = `${currentDay}_${cls.location || cls.venue}_${cls.name}_`;
                    const pastRegulars = [];
                    const visitors = [];

                    const splitName = (nameCombined) => {
                      // schedule内の同名から先取り
                      const fromSchedule = (cls.students || []).find(s => (s.lastName + s.firstName) === nameCombined);
                      if (fromSchedule) return { ln: fromSchedule.lastName, fn: fromSchedule.firstName };
                      // customers から
                      const c = (app.customers || []).find(c => (c.lastName + c.firstName) === nameCombined);
                      if (c) return { ln: c.lastName, fn: c.firstName };
                      return { ln: '', fn: nameCombined };
                    };

                    for (const key of Object.keys(app.attendanceData || {})) {
                      if (!key.startsWith(prefix)) continue;
                      if (key.startsWith('練習会_')) continue;
                      const rec = app.attendanceData[key];
                      if (!rec || typeof rec !== 'object') continue;
                      const nameCombined = key.slice(prefix.length);
                      if (seen.has(nameCombined)) continue;

                      const p = rec._plan;
                      const hasMark = ['week1','week2','week3','week4','week5'].some(w => ['○','×','休講'].includes(rec[w]));

                      if (p && !isRegularPlan(p)) {
                        // 明示的なビジター/体験プラン
                        seen.add(nameCombined);
                        const { ln, fn } = splitName(nameCombined);
                        visitors.push({ lastName: ln, firstName: fn, plan: p });
                      } else if (hasMark) {
                        // 出席記録あり (○/×/休講) で schedule から消えているレギュラー
                        // → 過去在籍として表示
                        seen.add(nameCombined);
                        const { ln, fn } = splitName(nameCombined);
                        // プラン: _plan が regular なら採用、無ければ customers.plan or デフォルト
                        let planLabel = (p && isRegularPlan(p)) ? p : null;
                        if (!planLabel) {
                          const c = (app.customers || []).find(c => (c.lastName + c.firstName) === nameCombined);
                          planLabel = c?.plan || '１クラス';
                        }
                        pastRegulars.push({ lastName: ln, firstName: fn, plan: planLabel });
                      }
                    }
                    return [...regulars, ...pastRegulars, ...visitors];
                  })().map(student => {
                    const classId = `${currentDay}_${cls.location || cls.venue}_${cls.name}_${student.lastName}${student.firstName}`;
                    const attData = app.attendanceData[classId] || {};
                    const rate = getAttendanceRate(app.attendanceData, classId);
                    // Short plan label for mobile
                    const planShortMap = {
                      'ビジター（会員）': 'V会',
                      'ビジター（非会員）': 'V非',
                      'ビジター（振替）': 'V振',
                      'ビジター（講師）': 'V講',
                      'ビジター1.5h（会員）': 'V1.5',
                      'ビジター1.5h（非会員）': 'V1.5',
                      '初回体験': '体験',
                      '初回無料': '無料',
                      '月謝クラス振替': '振替',
                      '1.5hクラス': '1.5h'
                    };
                    const displayPlan = attData._plan || student.plan;
                    const planShort = planShortMap[displayPlan] || displayPlan.replace('クラス', '');
                    return `
                      <tr class="att-row">
                        <td class="att-td-name">${student.lastName}${student.firstName}</td>
                        <td class="att-td-plan"><span class="plan-full">${displayPlan}</span><span class="plan-short">${planShort}</span></td>
                        ${['week1', 'week2', 'week3', 'week4', 'week5'].map(week => {
                          const current = attData[week] || '';
                          const cellClass = current === '○' ? 'att-present' : current === '×' ? 'att-absent' : current === '休講' ? 'att-cancelled' : 'att-empty';
                          const label = current === '休講' ? '休' : current || '−';
                          return `
                            <td class="att-td-week">
                              <button class="att-cell ${cellClass}"
                                      onclick="window.app.cycleAttendance('${classId}', '${week}')"
                                      title="${current === '' ? 'クリックで出席記録' : current === '○' ? '出席 → ×に変更' : current === '×' ? '欠席 → 休講に変更' : '休講 → 空白に変更'}">
                                ${label}
                              </button>
                            </td>
                          `;
                        }).join('')}
                        <td class="att-td-rate">${rate}%</td>
                        <td class="att-td-actions">
                          <div class="student-actions">
                            <button class="student-action-btn student-menu-btn"
                                    data-menu-day="${currentDay}"
                                    data-menu-location="${cls.location || cls.venue}"
                                    data-menu-class="${cls.name}"
                                    data-menu-lastname="${student.lastName}"
                                    data-menu-firstname="${student.firstName}"
                                    title="メニュー">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>

            <!-- Add Student Form -->
            <div style="margin-top: 1rem; border-top: 1px solid var(--border-color); padding-top: 1rem;">
              ${renderAddStudentForm(app, currentDay, cls.location || cls.venue, cls.name)}
            </div>
          </div>
        </div>
        `;
        return classHTML;
      }).join('')}
    </div>
  `;
}

/**
 * Practice session section with number inputs
 * @param {Object} app - Application state
 * @returns {string} HTML string for practice session
 */
export function renderPracticeSession(app) {
  const days = ['月曜日', '木曜日'];

  const practiceHTML = `
    <div class="content-card">
      <div class="card-header" style="background:#1d1d1f;border-radius:var(--border-radius-lg) var(--border-radius-lg) 0 0;">
        <h3 class="card-title" style="color:white;">練習会参加者記録</h3>
      </div>
      <div class="card-content">
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
          ${days.map(day => {
            const key = `練習会_${day}`;
            const data = app.attendanceData[key] || {};
            const weekInputsHTML = ['week1', 'week2', 'week3', 'week4', 'week5'].map(week => {
              const count = parseInt(data[week]) || 0;
              return `
                <div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem; align-items: center;">
                  <label style="width: 60px; font-size: 0.875rem;">${week}:</label>
                  <input type="number" min="0" value="${count}" class="practice-input"
                         data-practice-day="${day}" data-practice-week="${week}"
                         style="width: 60px; padding: 0.25rem; border: 1px solid var(--border-color); border-radius: 0.25rem;">
                  <span style="font-size: 0.75rem; color: var(--text-secondary);">人</span>
                </div>
              `;
            }).join('');
            return `
              <div style="padding: 1rem; background-color: var(--bg-secondary); border-radius: 0.5rem;">
                <h4 style="margin-bottom: 0.75rem; font-weight: 600;">${day} 練習会</h4>
                ${weekInputsHTML}
              </div>
            `;
          }).join('')}
        </div>

        <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">
          <div class="grid-2col" style="gap: 1rem;">
            ${days.map(day => {
              const key = `練習会_${day}`;
              const total = ['week1', 'week2', 'week3', 'week4', 'week5'].reduce((sum, w) => sum + (parseInt(app.attendanceData[key]?.[w]) || 0), 0);
              return `
                <div style="padding: 1rem; background-color: #f3f4f6; border-radius: 0.5rem;">
                  <div style="font-size: 0.875rem; color: #6b7280;">${day}合計</div>
                  <div style="font-size: 1.5rem; font-weight: 600; color: #111827;">${total} 人</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
  return practiceHTML;
}

/**
 * Form to add students to classes
 * @param {Object} app - Application state
 * @param {string} day - Day of week
 * @param {string} location - Class location
 * @param {string} className - Class name
 * @returns {string} HTML string for add student form
 */
export function renderAddStudentForm(app, day, location, className) {
  const isOpen = app.showAddStudentForm
    && app.selectedClassForAdd
    && app.selectedClassForAdd.day === day
    && app.selectedClassForAdd.location === location
    && app.selectedClassForAdd.className === className;

  if (!isOpen) {
    return `
      <button class="add-student-trigger add-student-btn"
              data-add-day="${day}"
              data-add-location="${location}"
              data-add-class="${className}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        生徒を追加
      </button>
    `;
  }

  const plans = ['１クラス', '２クラス', '３クラス', '４クラス', '1.5hクラス',
    'ビジター（会員）', 'ビジター（非会員）', 'ビジター（振替）', 'ビジター（講師）', '初回体験', '初回無料'];

  return `
    <div class="add-student-form">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;">
        <h4 style="margin:0;font-size:0.95rem;font-weight:600;color:var(--color-gray-800);">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px;margin-right:4px;"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
          生徒を追加
        </h4>
        <button id="cancelAddStudentBtn" class="btn btn-secondary btn-sm" style="font-size:0.75rem;">キャンセル</button>
      </div>

      <!-- Customer search -->
      <div style="margin-bottom:1rem;position:relative;">
        <label>氏名で検索（既存会員）</label>
        <input type="text" id="student_search_input"
               placeholder="姓名・読み・会員番号で検索..."
               value="${app.studentSearchTerm || ''}"
               autocomplete="off">
        <div id="searchResultsContainer"></div>
      </div>

      <!-- Selected customer info -->
      <div id="selectedCustomerInfo"></div>

      <!-- Manual name input (shown when no customer selected) -->
      <div id="nameInputContainer" class="${app.selectedCustomerForStudent ? 'hidden' : ''}" style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-bottom:1rem;">
        <div>
          <label>姓</label>
          <input type="text" id="new_student_lastName" placeholder="姓">
        </div>
        <div>
          <label>名</label>
          <input type="text" id="new_student_firstName" placeholder="名">
        </div>
      </div>

      <!-- Plan selection -->
      <div id="planSelectContainer" style="margin-bottom:1rem;">
        <label>プラン</label>
        <select id="new_student_plan">
          <option value="">プランを選択...</option>
          ${plans.map(p => `<option value="${p}">${p}</option>`).join('')}
        </select>
      </div>

      <!-- Save button -->
      <div style="display:flex;gap:0.5rem;justify-content:flex-end;">
        <button id="saveNewStudentBtn" class="btn btn-primary" style="padding:0.5rem 1.5rem;font-size:0.875rem;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px;margin-right:4px;"><polyline points="20 6 9 17 4 12"/></svg>
          追加する
        </button>
      </div>
    </div>
  `;
}

/**
 * Event attendance tracking
 * @param {Object} app - Application state
 * @returns {string} HTML string for event record
 */
export function renderEventRecord(app) {
  const eventsData = app.eventsData || {};
  const events = Object.entries(eventsData).sort((a, b) => (a[1].date || '').localeCompare(b[1].date || ''));
  const showAddForm = app.showAddEventForm || false;
  const addingParticipantTo = app.addingParticipantToEvent || null;

  const escapeAttr = (str) => String(str).replace(/'/g, '&#39;').replace(/"/g, '&quot;');
  const formatCurrency = (n) => `¥${Number(n).toLocaleString('ja-JP')}`;

  let totalRevenue = 0;
  events.forEach(([id, evt]) => {
    (evt.participants || []).forEach(p => {
      totalRevenue += parseInt(p.amount) || 0;
    });
  });

  return `
    <div class="content-card">
      <div class="card-content">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
          <div style="display:flex;align-items:center;gap:0.75rem">
            <span style="font-size:0.875rem;color:var(--text-secondary)">
              ${events.length}件のイベント
            </span>
            <span style="font-size:0.875rem;font-weight:600;color:#1d1d1f">
              合計: ${formatCurrency(totalRevenue)}
            </span>
          </div>
          <button onclick="app.toggleAddEventForm()"
            class="btn btn-primary" style="font-size:0.875rem">
            ${showAddForm ? 'キャンセル' : '+ 新規イベント追加'}
          </button>
        </div>

        ${showAddForm ? `
          <div style="background:#eff6ff;padding:1rem;border-radius:0.5rem;margin-bottom:1rem;border:1px solid #bfdbfe">
            <h3 style="font-size:1rem;font-weight:600;margin-bottom:0.75rem;color:#111827">新規イベント作成</h3>
            <div style="display:grid;grid-template-columns:2fr 1fr;gap:0.75rem;margin-bottom:0.75rem">
              <div>
                <label style="display:block;font-size:0.75rem;font-weight:500;margin-bottom:4px;color:#374151">イベント名 *</label>
                <input type="text" id="new_event_name" class="form-input" style="width:100%;font-size:0.875rem" placeholder="例: ワークショップ、発表会等">
              </div>
              <div>
                <label style="display:block;font-size:0.75rem;font-weight:500;margin-bottom:4px;color:#374151">開催日</label>
                <input type="date" id="new_event_date" class="form-input" style="width:100%;font-size:0.875rem">
              </div>
            </div>
            <button onclick="app.createEvent()" class="btn btn-primary" style="font-size:0.875rem">作成</button>
          </div>
        ` : ''}

        ${events.map(([eventId, evt]) => {
          const participants = evt.participants || [];
          const eventRevenue = participants.reduce((sum, p) => sum + (parseInt(p.amount) || 0), 0);
          const isAddingParticipant = addingParticipantTo === eventId;
          const editingEvent = app.editingEventId === eventId;
          const editingIdx = app.editingParticipantIndex;

          return `
            <div style="margin-bottom:1rem;border-radius:0.5rem;overflow:hidden;border:1px solid var(--border-color)">
              <div style="background:#7c3aed;color:white;padding:0.75rem 1rem;display:flex;justify-content:space-between;align-items:center">
                <div>
                  <h3 style="font-size:1rem;font-weight:700;margin:0;color:inherit">${evt.name || 'イベント'}</h3>
                  ${evt.date ? `<span style="font-size:0.75rem;opacity:0.8">${evt.date}</span>` : ''}
                </div>
                <div style="display:flex;gap:0.75rem;align-items:center">
                  <span style="font-size:0.75rem;opacity:0.9">${participants.length}名参加</span>
                  <span style="font-size:0.875rem;font-weight:600">${formatCurrency(eventRevenue)}</span>
                  <button onclick="app.startEditEvent('${escapeAttr(eventId)}')"
                    style="background:rgba(255,255,255,0.2);border:none;color:white;padding:4px 8px;border-radius:4px;font-size:0.75rem;cursor:pointer">
                    編集
                  </button>
                </div>
              </div>

              ${editingEvent && editingIdx === -1 ? `
                <div style="background:#faf5ff;padding:0.75rem 1rem;border-bottom:1px solid #ddd6fe">
                  <h4 style="font-size:0.8rem;font-weight:600;margin-bottom:0.5rem;color:#374151">イベント情報を編集</h4>
                  <div style="display:grid;grid-template-columns:2fr 1fr;gap:0.5rem;margin-bottom:0.5rem">
                    <div>
                      <label style="display:block;font-size:0.7rem;font-weight:500;margin-bottom:2px;color:#374151">イベント名</label>
                      <input type="text" id="edit_event_name" class="form-input" style="width:100%;font-size:0.8rem" value="${escapeAttr(evt.name || '')}">
                    </div>
                    <div>
                      <label style="display:block;font-size:0.7rem;font-weight:500;margin-bottom:2px;color:#374151">開催日</label>
                      <input type="date" id="edit_event_date" class="form-input" style="width:100%;font-size:0.8rem" value="${evt.date || ''}">
                    </div>
                  </div>
                  <div style="display:flex;gap:0.5rem">
                    <button onclick="app.saveEditEvent('${escapeAttr(eventId)}')"
                      class="btn btn-primary" style="font-size:0.75rem;padding:4px 12px">保存</button>
                    <button onclick="app.cancelEditEvent()"
                      class="btn btn-secondary" style="font-size:0.75rem;padding:4px 12px">キャンセル</button>
                    <button onclick="app.deleteEvent('${escapeAttr(eventId)}')"
                      style="background:none;border:1px solid #dc2626;color:#dc2626;padding:4px 12px;border-radius:4px;font-size:0.75rem;cursor:pointer;margin-left:auto">
                      このイベントを削除
                    </button>
                  </div>
                </div>
              ` : ''}

              <div style="padding:0.75rem;overflow-x:auto">
                <table style="width:100%;font-size:0.75rem;border-collapse:collapse">
                  <thead>
                    <tr>
                      <th style="padding:0.5rem;text-align:left;border-bottom:1px solid var(--border-color)">氏名</th>
                      <th style="padding:0.5rem;width:100px;text-align:center;border-bottom:1px solid var(--border-color)">会員区分</th>
                      <th style="padding:0.5rem;width:80px;text-align:center;border-bottom:1px solid var(--border-color)">プラン</th>
                      <th style="padding:0.5rem;width:100px;text-align:right;border-bottom:1px solid var(--border-color)">金額</th>
                      <th style="padding:0.5rem;width:50px;text-align:center;border-bottom:1px solid var(--border-color)">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${participants.map((p, idx) => {
                      const isEditingThis = editingEvent && editingIdx === idx;
                      if (isEditingThis) {
                        return `
                          <tr style="background:#faf5ff;border-bottom:1px solid #ddd6fe">
                            <td style="padding:0.5rem"><input type="text" id="edit_p_name" class="form-input" style="width:100%;font-size:0.75rem" value="${escapeAttr(p.name || '')}"></td>
                            <td style="padding:0.5rem">
                              <select id="edit_p_memberType" class="form-input" style="width:100%;font-size:0.75rem">
                                <option value="会員" ${p.memberType === '会員' ? 'selected' : ''}>会員</option>
                                <option value="非会員" ${p.memberType === '非会員' ? 'selected' : ''}>非会員</option>
                              </select>
                            </td>
                            <td style="padding:0.5rem">
                              <select id="edit_p_plan" class="form-input" style="width:100%;font-size:0.75rem">
                                <option value="" ${!p.plan ? 'selected' : ''}>-</option>
                                <option value="1" ${p.plan === '1' ? 'selected' : ''}>1</option>
                                <option value="2" ${p.plan === '2' ? 'selected' : ''}>2</option>
                                <option value="3" ${p.plan === '3' ? 'selected' : ''}>3</option>
                              </select>
                            </td>
                            <td style="padding:0.5rem"><input type="number" id="edit_p_amount" class="form-input" style="width:100%;font-size:0.75rem;text-align:right" value="${parseInt(p.amount) || 0}" min="0"></td>
                            <td style="padding:0.5rem;text-align:center">
                              <div style="display:flex;flex-direction:column;gap:2px">
                                <button onclick="app.saveEditParticipant('${escapeAttr(eventId)}',${idx})"
                                  style="background:#7c3aed;border:none;color:white;padding:2px 6px;border-radius:3px;font-size:0.7rem;cursor:pointer">保存</button>
                                <button onclick="app.cancelEditEvent()"
                                  style="background:none;border:1px solid var(--border-color);color:var(--text-secondary);padding:2px 6px;border-radius:3px;font-size:0.7rem;cursor:pointer">戻る</button>
                                <button onclick="app.deleteParticipant('${escapeAttr(eventId)}',${idx})"
                                  style="background:none;border:none;color:#dc2626;padding:2px 6px;font-size:0.65rem;cursor:pointer">削除</button>
                              </div>
                            </td>
                          </tr>
                        `;
                      }
                      return `
                        <tr style="border-bottom:1px solid var(--border-color)">
                          <td style="padding:0.5rem;font-size:0.75rem">${p.name || ''}</td>
                          <td style="padding:0.5rem;font-size:0.75rem;text-align:center">
                            <span style="padding:2px 8px;border-radius:9999px;font-size:0.7rem;font-weight:500;${p.memberType === '会員' ? 'background:#dcfce7;color:#166534' : 'background:#fee2e2;color:#991b1b'}">
                              ${p.memberType || ''}
                            </span>
                          </td>
                          <td style="padding:0.5rem;font-size:0.75rem;text-align:center">${p.plan || '-'}</td>
                          <td style="padding:0.5rem;font-size:0.75rem;text-align:right;font-weight:600">${formatCurrency(parseInt(p.amount) || 0)}</td>
                          <td style="text-align:center;padding:0.5rem">
                            <button onclick="app.startEditParticipant('${escapeAttr(eventId)}',${idx})"
                              style="background:none;border:none;color:#7c3aed;cursor:pointer;font-size:0.75rem">編集</button>
                          </td>
                        </tr>
                      `;
                    }).join('')}
                    ${participants.length === 0 ? `
                      <tr><td colspan="5" style="text-align:center;padding:1rem;color:var(--text-secondary);font-size:0.75rem">
                        参加者がまだ登録されていません
                      </td></tr>
                    ` : ''}
                  </tbody>
                </table>

                ${isAddingParticipant ? `
                  <div style="background:#f5f3ff;padding:0.75rem;border-radius:0.5rem;margin-top:0.75rem;border:1px solid #ddd6fe">
                    <div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:0.5rem;margin-bottom:0.5rem">
                      <div>
                        <label style="display:block;font-size:0.7rem;font-weight:500;margin-bottom:2px;color:#374151">氏名 *</label>
                        <input type="text" id="evt_participant_name" class="form-input" style="width:100%;font-size:0.8rem">
                      </div>
                      <div>
                        <label style="display:block;font-size:0.7rem;font-weight:500;margin-bottom:2px;color:#374151">会員区分 *</label>
                        <select id="evt_participant_memberType" class="form-input" style="width:100%;font-size:0.8rem">
                          <option value="会員">会員</option>
                          <option value="非会員">非会員</option>
                        </select>
                      </div>
                      <div>
                        <label style="display:block;font-size:0.7rem;font-weight:500;margin-bottom:2px;color:#374151">プラン</label>
                        <select id="evt_participant_plan" class="form-input" style="width:100%;font-size:0.8rem">
                          <option value="">-</option>
                          <option value="1">1</option>
                          <option value="2">2</option>
                          <option value="3">3</option>
                        </select>
                      </div>
                      <div>
                        <label style="display:block;font-size:0.7rem;font-weight:500;margin-bottom:2px;color:#374151">金額 *</label>
                        <input type="number" id="evt_participant_amount" class="form-input" style="width:100%;font-size:0.8rem" min="0">
                      </div>
                    </div>
                    <div style="display:flex;gap:0.5rem">
                      <button onclick="app.saveNewParticipant('${escapeAttr(eventId)}')"
                        class="btn btn-primary" style="font-size:0.75rem;padding:4px 12px">追加</button>
                      <button onclick="app.cancelAddParticipant()"
                        class="btn btn-secondary" style="font-size:0.75rem;padding:4px 12px">キャンセル</button>
                    </div>
                  </div>
                ` : `
                  <div style="margin-top:0.75rem">
                    <button onclick="app.showAddParticipant('${escapeAttr(eventId)}')"
                      style="background:none;border:1px dashed var(--border-color);color:#7c3aed;padding:0.5rem 0.75rem;border-radius:0.5rem;font-size:0.75rem;cursor:pointer;width:100%">
                      + 参加者追加
                    </button>
                  </div>
                `}
              </div>
            </div>
          `;
        }).join('')}

        ${events.length === 0 && !showAddForm ? `
          <div style="text-align:center;padding:2rem;color:var(--text-secondary)">
            <p style="margin-bottom:0.75rem">この月にはイベントがまだ登録されていません</p>
            <button onclick="app.toggleAddEventForm()" class="btn btn-primary" style="font-size:0.875rem">
              + 新規イベント追加
            </button>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}
