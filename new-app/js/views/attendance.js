// POSSE Dance Academy - Attendance View Module
// ES module for attendance recording and tracking

import { pricing, visitorRevenueOverrides } from '../config.js';
import { calculateVisitorRevenue, calculateDetailedRevenue, getAttendanceRate, sortStudentsByPlan, isRegularPlan } from '../utils.js';
import { planOrder } from '../config.js';

/**
 * Main attendance wrapper with subtabs
 * @param {Object} app - Application state
 * @returns {string} HTML string for attendance view
 */
export function renderAttendance(app) {
  const subtabs = ['概要', '出席記録', '練習会', 'イベント'];
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
      ${subtabs.map(tab => `
        <button class="tab-btn ${tab === currentSubtab ? 'active' : ''}"
                onclick="window.app.setAttendanceSubtab('${tab}')">
          ${tab}
        </button>
      `).join('')}
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
    <div style="display: flex; gap: 1rem; margin-bottom: 1.5rem;">
      <button class="btn btn-secondary" onclick="window.app.previousMonth()">前月</button>
      <button class="btn btn-secondary" onclick="window.app.nextMonth()">翌月</button>
    </div>

    <!-- Day Tabs -->
    <div class="tab-nav">
      ${daysOfWeek.map(day => `
        <button class="tab-btn ${day === currentDay ? 'active' : ''}"
                onclick="window.app.setAttendanceDay('${day}')">
          ${day}
        </button>
      `).join('')}
      <button class="tab-btn ${currentDay === 'イベント' ? 'active' : ''}"
              onclick="window.app.setAttendanceDay('イベント')">
        イベント
      </button>
    </div>

    <!-- Classes for Selected Day -->
    <div>
      ${schedule.map((cls, idx) => {
        const classHTML = `
        <div class="content-card" style="margin-bottom: 1.5rem;">
          <div class="card-header" style="background-color: ${cls.color || '#6b7280'}; color: white; border-radius: 0.5rem 0.5rem 0 0;">
            <h3 class="card-title" style="color: white; margin: 0;">${cls.name} - ${cls.location || cls.venue}</h3>
            <div style="font-size: 0.875rem; margin-top: 0.25rem;">${cls.time || ''}</div>
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
                  <div style="font-size: 0.875rem; color: var(--text-secondary);">${day}合計</div>
                  <div style="font-size: 1.5rem; font-weight: 600;">${total} 人</div>
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
  const eventData = app.scheduleData['イベント'] || [];

  return `
    <div class="content-card">
      <div class="card-header">
        <h3 class="card-title">イベント参加者</h3>
      </div>
      <div class="card-content">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem;">
          <div style="padding: 1rem; background-color: var(--bg-secondary); border-radius: 0.5rem;">
            <h4 style="margin-bottom: 1rem; font-weight: 600;">イベント参加者追加</h4>
            <div style="display: grid; gap: 0.75rem;">
              <div>
                <label class="form-label">姓</label>
                <input type="text" class="form-input" id="eventLastName" placeholder="姓">
              </div>
              <div>
                <label class="form-label">名</label>
                <input type="text" class="form-input" id="eventFirstName" placeholder="名">
              </div>
              <div>
                <label class="form-label">参加者区分</label>
                <select class="form-input" id="eventIsMember">
                  <option value="false">非会員</option>
                  <option value="true">会員</option>
                </select>
              </div>
              <button class="btn btn-primary" id="addEventParticipantBtn">参加者追加</button>
            </div>
          </div>
        </div>

        <div style="margin-top: 1.5rem; border-top: 1px solid var(--border-color); padding-top: 1.5rem;">
          <h4 style="margin-bottom: 1rem; font-weight: 600;">参加者一覧</h4>
          <div style="display: grid; gap: 1rem;">
            ${(app.eventAttendanceData || []).length > 0 ? `
              <div style="overflow-x: auto;">
                <table style="width: 100%; font-size: 0.875rem;">
                  <thead>
                    <tr style="border-bottom: 1px solid var(--border-color);">
                      <th style="padding: 0.5rem; text-align: left;">姓名</th>
                      <th style="padding: 0.5rem; text-align: left;">区分</th>
                      <th style="padding: 0.5rem;">Week1</th>
                      <th style="padding: 0.5rem;">Week2</th>
                      <th style="padding: 0.5rem;">Week3</th>
                      <th style="padding: 0.5rem;">料金</th>
                      <th style="padding: 0.5rem;">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${(app.eventAttendanceData || []).map((p, idx) => `
                      <tr style="border-bottom: 1px solid var(--border-color);">
                        <td style="padding: 0.5rem;">${p.lastName || ''} ${p.firstName || ''}</td>
                        <td style="padding: 0.5rem;">${p.isMember ? '会員' : '非会員'}</td>
                        <td style="padding: 0.5rem; text-align: center;">
                          <button class="event-attendance-btn" data-event-index="${idx}" data-event-week="week1" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">
                            ${p.week1 || '×'}
                          </button>
                        </td>
                        <td style="padding: 0.5rem; text-align: center;">
                          <button class="event-attendance-btn" data-event-index="${idx}" data-event-week="week2" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">
                            ${p.week2 || '×'}
                          </button>
                        </td>
                        <td style="padding: 0.5rem; text-align: center;">
                          <button class="event-attendance-btn" data-event-index="${idx}" data-event-week="week3" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">
                            ${p.week3 || '×'}
                          </button>
                        </td>
                        <td style="padding: 0.5rem;">
                          <input type="number" data-event-index="${idx}" data-event-field="fee" value="${p.fee || 0}" style="width: 60px; padding: 0.25rem;">
                        </td>
                        <td style="padding: 0.5rem;">
                          <button class="delete-event-participant-btn btn btn-danger" data-delete-event-index="${idx}" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">削除</button>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            ` : `
              <div style="text-align: center; color: var(--text-secondary); padding: 2rem;">
                参加者がまだ登録されていません
              </div>
            `}
          </div>
        </div>
      </div>
    </div>
  `;
}
