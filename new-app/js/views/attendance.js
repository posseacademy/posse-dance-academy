// POSSE Dance Academy - Attendance View Module
// ES module for attendance recording and tracking

import { pricing, visitorRevenueOverrides, timeSchedule } from '../config.js';
import { calculateVisitorRevenue, calculateDetailedRevenue, getAttendanceRate, sortStudentsByPlan, isRegularPlan } from '../utils.js';
import { planOrder } from '../config.js';

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
    case '概要':
      content = renderAttendanceOverview(app);
      break;
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
        <p class="subtitle">レッスン出席とレベニュー管理</p>
      </div>
      <div class="header-actions">
        <input type="month" class="form-input" value="${app.selectedMonth || ''}"
               onchange="window.app.setSelectedMonth(this.value)"
               style="width: 150px;">
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
 * Overview with stats, revenue breakdown, instructor stats
 * @param {Object} app - Application state
 * @returns {string} HTML string for overview
 */
export function renderAttendanceOverview(app) {
  const revenueData = calculateDetailedRevenue(app.attendanceData, app.scheduleData, pricing, visitorRevenueOverrides, app.selectedMonth);

  let totalRevenue = 0;
  let totalCount = 0;
  Object.values(revenueData).forEach(item => {
    totalRevenue += item.revenue;
    totalCount += item.count;
  });

  return `
    <div class="content-card">
      <div class="card-header">
        <h3 class="card-title">今月の売上概要</h3>
      </div>
      <div class="card-content">
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 2rem;">
          <div style="border-left: 4px solid #10b981; padding-left: 1rem;">
            <div style="font-size: 0.875rem; color: var(--text-secondary);">総売上</div>
            <div style="font-size: 1.875rem; font-weight: 600;">¥${totalRevenue.toLocaleString('ja-JP')}</div>
          </div>
          <div style="border-left: 4px solid #3b82f6; padding-left: 1rem;">
            <div style="font-size: 0.875rem; color: var(--text-secondary);">参加者数</div>
            <div style="font-size: 1.875rem; font-weight: 600;">${totalCount}</div>
          </div>
          <div style="border-left: 4px solid #f59e0b; padding-left: 1rem;">
            <div style="font-size: 0.875rem; color: var(--text-secondary);">平均単価</div>
            <div style="font-size: 1.875rem; font-weight: 600;">¥${totalCount > 0 ? Math.round(totalRevenue / totalCount).toLocaleString('ja-JP') : '0'}</div>
          </div>
          <div style="border-left: 4px solid #8b5cf6; padding-left: 1rem;">
            <div style="font-size: 0.875rem; color: var(--text-secondary);">記録件数</div>
            <div style="font-size: 1.875rem; font-weight: 600;">${Object.keys(app.attendanceData).length}</div>
          </div>
        </div>

        <div style="border-top: 1px solid var(--border-color); padding-top: 1.5rem;">
          <h4 style="margin-bottom: 1rem; font-weight: 600;">売上内訳</h4>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
            ${Object.entries(revenueData).map(([category, data]) => `
              <div style="padding: 1rem; background-color: var(--bg-secondary); border-radius: 0.5rem;">
                <div style="font-size: 0.875rem; color: var(--text-secondary);">${category}</div>
                <div style="font-weight: 600;">¥${data.revenue.toLocaleString('ja-JP')}</div>
                <div style="font-size: 0.75rem; color: var(--text-secondary);">${data.count}人</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
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

  return `
    <!-- Day Tabs with Month Navigation -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--spacing-6);">
      <div class="tab-nav" style="margin-bottom:0;flex:1;">
        ${daysOfWeek.map(day => {
          const dayColors = {'月曜日':'#3b82f6','火曜日':'#ef4444','水曜日':'#10b981','木曜日':'#f59e0b','金曜日':'#8b5cf6'};
          return `
            <button class="tab-btn ${day === currentDay ? 'active' : ''}"
                    onclick="window.app.setAttendanceDay('${day}')">
              <span class="day-dot" style="background:${dayColors[day]};"></span>${day}
            </button>
          `;
        }).join('')}
      </div>
      <div style="display:flex;gap:0.5rem;margin-left:1rem;flex-shrink:0;">
        <button class="btn btn-secondary btn-sm" onclick="window.app.previousMonth()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
          前月
        </button>
        <button class="btn btn-secondary btn-sm" onclick="window.app.nextMonth()">
          翌月
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
    </div>

    <!-- Classes for Selected Day -->
    <div>
      ${schedule.map((cls, idx) => {
        const loc = cls.location || cls.venue || '';
        const timeEntry = (timeSchedule[currentDay] || []).find(t => t.name === cls.name && (t.venue === loc || t.venue === loc + '校' || t.venue?.replace('校','') === loc))
          || (timeSchedule[currentDay] || []).find(t => t.name === cls.name);
        const timeStr = timeEntry ? timeEntry.time : '';
        const classHTML = `
        <div class="content-card" style="margin-bottom: 1.5rem;">
          <div class="card-header" style="background-color: ${cls.color || '#6b7280'}; color: white; border-radius: 0.5rem 0.5rem 0 0; display: flex; align-items: center; justify-content: space-between;">
            <h3 class="card-title" style="color: white; margin: 0; font-size: 1.1rem;">${cls.name} - ${cls.location || cls.venue}</h3>
            ${timeStr ? `<span style="font-size: 0.875rem; color: rgba(255,255,255,0.9); background: rgba(0,0,0,0.2); padding: 0.2rem 0.6rem; border-radius: 0.25rem; white-space: nowrap;">${timeStr}</span>` : ''}
          </div>
          <div class="card-content">
            <div style="overflow-x: auto;">
              <table style="width: 100%; font-size: 0.875rem;">
                <thead>
                  <tr style="border-bottom: 1px solid var(--border-color);">
                    <th style="text-align: left; padding: 0.5rem;">学生名</th>
                    <th style="padding: 0.5rem;">プラン</th>
                    <th style="padding: 0.5rem;">Week1</th>
                    <th style="padding: 0.5rem;">Week2</th>
                    <th style="padding: 0.5rem;">Week3</th>
                    <th style="padding: 0.5rem;">Week4</th>
                    <th style="padding: 0.5rem;">Week5</th>
                    <th style="padding: 0.5rem;">出席率</th>
                  </tr>
                </thead>
                <tbody>
                  ${(cls.students || []).map(student => {
                    const classId = `${currentDay}_${cls.location || cls.venue}_${cls.name}_${student.lastName}${student.firstName}`;
                    const attData = app.attendanceData[classId] || {};
                    const rate = getAttendanceRate(app.attendanceData, classId);
                    return `
                      <tr style="border-bottom: 1px solid var(--border-color);">
                        <td style="padding: 0.5rem;">${student.lastName}${student.firstName}</td>
                        <td style="padding: 0.5rem; font-size: 0.75rem;">${student.plan}</td>
                        ${['week1', 'week2', 'week3', 'week4', 'week5'].map(week => {
                          const current = attData[week] || '';
                          const bgColor = current === '○' ? '#10b981' : current === '×' ? '#ef4444' : current === '休講' ? '#6b7280' : 'var(--bg-secondary)';
                          const textColor = current === '○' || current === '×' || current === '休講' ? 'white' : 'black';
                          return `
                            <td style="padding: 0.5rem; text-align: center;">
                              <button class="btn" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; width: 50px; background-color: ${bgColor}; color: ${textColor};"
                                      onclick="window.app.cycleAttendance('${classId}', '${week}')">
                                ${current || ''}
                              </button>
                            </td>
                          `;
                        }).join('')}
                        <td style="padding: 0.5rem; text-align: center; font-weight: 600;">${rate}%</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>

            <!-- Add Student Form -->
            <div style="margin-top: 1rem; border-top: 1px solid var(--border-color); padding-top: 1rem;">
              ${renderAddStudentForm(app)}
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
      <div class="card-header">
        <h3 class="card-title">練習会参加者記録</h3>
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
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
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
 * @returns {string} HTML string for add student form
 */
export function renderAddStudentForm(app) {
  return `
    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
      <input type="text" placeholder="学生を追加..."
             id="addStudentSearch"
             style="flex: 1; min-width: 200px; padding: 0.5rem; border: 1px solid var(--border-color); border-radius: 0.25rem;"
             onkeyup="window.app.searchAddStudent(this.value)">
      <button class="btn btn-primary" style="padding: 0.5rem 1rem;"
              onclick="window.app.addStudentToClass()">
        追加
      </button>
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
            <span style="font-size:0.875rem;font-weight:600;color:#e42313">
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
