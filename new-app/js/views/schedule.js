// POSSE Dance Academy - Schedule View Module
// ES module for schedule display and management

import { timeSchedule } from '../config.js?v=9';

/**
 * Weekly time grid view
 * @param {Object} app - Application state
 * @returns {string} HTML string for time schedule
 */
export function renderTimeSchedule(app) {
  const daysOfWeek = ['月曜日', '火曜日', '水曜日', '木曜日', '金曜日'];
  const hours = [16, 17, 18, 19, 20, 21, 22];

  // Build schedule by time slot
  const schedule = {};
  hours.forEach(hour => {
    schedule[hour] = {};
    daysOfWeek.forEach(day => {
      schedule[hour][day] = [];
    });
  });

  // Populate schedule with classes (skip alias entries used for attendance time lookup)
  daysOfWeek.forEach(day => {
    (timeSchedule[day] || []).filter(cls => !cls.alias).forEach(cls => {
      if (cls.time) {
        const startHour = parseInt(cls.time.split(':')[0]);
        if (schedule[startHour]) {
          schedule[startHour][day].push(cls);
        }
      }
    });
  });

  return `
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h2>スケジュール</h2>
        <p class="subtitle">週間時間割</p>
      </div>
    </div>

    <!-- Time Schedule Grid -->
    <div class="content-card">
      <div style="overflow-x: auto;">
        <table class="schedule-table" style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background:#1d1d1f;">
              <th style="padding: 0.75rem; text-align: left; border: 1px solid var(--border-color); font-weight: 600; color:white;">時刻</th>
              ${daysOfWeek.map(day => `
                <th style="padding: 0.75rem; text-align: center; border: 1px solid var(--border-color); font-weight: 600; width: 15%; color:white;">${day}</th>
              `).join('')}
            </tr>
          </thead>
          <tbody>
            ${hours.map(hour => `
              <tr>
                <td style="padding: 0.75rem; border: 1px solid var(--border-color); font-weight: 600; background-color: var(--bg-secondary); width: 10%;">${hour}:00</td>
                ${daysOfWeek.map(day => {
                  const classes = schedule[hour][day] || [];
                  return `
                    <td style="padding: 0.5rem; border: 1px solid var(--border-color); vertical-align: top; height: 120px;">
                      ${classes.map(cls => `
                        <div style="background-color: ${cls.color}; color: white; padding: 0.5rem; border-radius: 0.25rem; margin-bottom: 0.25rem; font-size: 0.75rem; line-height: 1.2;">
                          <div style="font-weight: 600;">${cls.name}</div>
                          <div>${cls.time}</div>
                          <div>${cls.venue}</div>
                        </div>
                      `).join('')}
                    </td>
                  `;
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/**
 * Calendar month view
 * @param {Object} app - Application state
 * @returns {string} HTML string for monthly schedule
 */
// Get lessons for a specific date, merging timeSchedule with calendar overrides
function getLessonsForDate(date, calendarData) {
  const dayNames = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];
  const dayOfWeek = dayNames[date.getDay()];
  const dateKey = String(date.getDate());
  const override = calendarData[dateKey] || {};
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;

  if (override.holiday) {
    return { holiday: true, lessons: [], workshops: override.workshops || [], note: override.note || '', cancelledCount: 0 };
  }
  if (isWeekend && !override.workshops?.length) {
    return { holiday: true, lessons: [], workshops: [], note: override.note || '', cancelledCount: 0 };
  }

  const cancelled = override.cancelledLessons || [];
  const regularLessons = (timeSchedule[dayOfWeek] || [])
    .filter(cls => !cls.alias)
    .map(cls => ({ ...cls, cancelled: cancelled.includes(`${cls.name}__${cls.venue}`) }));

  return {
    holiday: false,
    lessons: regularLessons,
    workshops: override.workshops || [],
    note: override.note || '',
    cancelledCount: cancelled.length
  };
}

// Unique venue colors for dots
function getVenueColor(venue) {
  if (venue.includes('天神')) return '#3b82f6';
  if (venue.includes('大橋')) return '#ef4444';
  if (venue.includes('照葉')) return '#10b981';
  if (venue.includes('千早')) return '#8b5cf6';
  if (venue.includes('九産大前')) return '#f59e0b';
  return '#6b7280';
}

export function renderMonthlySchedule(app) {
  const [selYear, selMonth] = (app.selectedMonth || new Date().toISOString().slice(0, 7)).split('-').map(Number);
  const year = selYear;
  const month = selMonth - 1;
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const today = new Date();
  const calendarData = app.calendarData || {};
  const selectedDate = app.selectedCalendarDate;

  // Monday-start week calculation
  const startDate = new Date(firstDay);
  const firstDow = (firstDay.getDay() + 6) % 7; // Mon=0, Sun=6
  startDate.setDate(startDate.getDate() - firstDow);

  const weeks = [];
  let cur = new Date(startDate);
  while (cur <= lastDay || cur.getDay() !== 1) {
    const week = [];
    for (let i = 0; i < 7; i++) {
      week.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    if (week.some(d => d.getMonth() === month)) weeks.push(week);
    if (cur > lastDay && cur.getDay() === 1) break;
  }

  const dayHeaders = ['月', '火', '水', '木', '金', '土', '日'];
  const dayColors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#9ca3af', '#9ca3af'];

  // Build detail panel if a date is selected
  let detailPanel = '';
  if (selectedDate) {
    const selDateObj = new Date(year, month, parseInt(selectedDate));
    const dayNames = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];
    const dayLabel = dayNames[selDateObj.getDay()];
    const info = getLessonsForDate(selDateObj, calendarData);
    const override = calendarData[selectedDate] || {};

    detailPanel = `
      <div class="content-card cal-detail-panel" style="margin-top:1rem;">
        <div class="card-header" style="background:#1d1d1f;color:white;display:flex;justify-content:space-between;align-items:center;">
          <h3 style="color:white;margin:0;font-size:1rem;">${month + 1}月${selectedDate}日（${dayLabel.charAt(0)}）</h3>
          <button class="btn btn-sm" style="color:white;border:1px solid rgba(255,255,255,0.3);background:none;" onclick="window.app.selectCalendarDate(null)">✕ 閉じる</button>
        </div>
        <div class="card-content" style="padding:1rem;">
          <!-- Holiday toggle -->
          <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1rem;padding-bottom:0.75rem;border-bottom:1px solid var(--border-color);">
            <label style="font-weight:600;font-size:0.875rem;">休校</label>
            <button class="btn btn-sm ${info.holiday && !override.workshops?.length ? 'btn-primary' : 'btn-secondary'}" id="calToggleHoliday">
              ${info.holiday ? '休校中' : '通常営業'}
            </button>
          </div>

          ${!info.holiday || info.lessons.length ? `
          <!-- Regular lessons -->
          <div style="margin-bottom:1rem;">
            <h4 style="font-size:0.8125rem;font-weight:600;color:var(--text-secondary);margin-bottom:0.5rem;">レギュラーレッスン</h4>
            ${info.lessons.length ? info.lessons.map(cls => {
              const key = `${cls.name}__${cls.venue}`;
              return `
              <div class="cal-lesson-row ${cls.cancelled ? 'cancelled' : ''}" style="display:flex;align-items:center;gap:0.5rem;padding:0.4rem 0;${cls.cancelled ? 'opacity:0.4;text-decoration:line-through;' : ''}">
                <span style="width:8px;height:8px;border-radius:50%;background:${getVenueColor(cls.venue)};flex-shrink:0;"></span>
                <span style="flex:1;font-size:0.8125rem;">${cls.name}</span>
                <span style="font-size:0.75rem;color:var(--text-secondary);">${cls.time}</span>
                <span style="font-size:0.75rem;color:var(--text-secondary);">${cls.venue.replace(/校$/, '').replace('BUZZ校', '').replace('スタジオ', '').trim()}</span>
                <button class="btn btn-sm btn-secondary cal-cancel-btn" data-lesson-key="${key}" style="font-size:0.7rem;padding:0.15rem 0.4rem;">
                  ${cls.cancelled ? '復元' : '休講'}
                </button>
              </div>`;
            }).join('') : '<div style="font-size:0.8125rem;color:var(--text-secondary);">この曜日のレッスンはありません</div>'}
          </div>
          ` : ''}

          <!-- Workshops -->
          <div style="margin-bottom:1rem;">
            <h4 style="font-size:0.8125rem;font-weight:600;color:var(--text-secondary);margin-bottom:0.5rem;">ワークショップ・特別レッスン</h4>
            ${(info.workshops || []).map((ws, i) => `
              <div style="display:flex;align-items:center;gap:0.5rem;padding:0.4rem 0;">
                <span style="width:8px;height:8px;border-radius:50%;background:#f59e0b;flex-shrink:0;"></span>
                <span style="flex:1;font-size:0.8125rem;color:#b45309;font-weight:500;">${ws.name}</span>
                <span style="font-size:0.75rem;color:var(--text-secondary);">${ws.time || ''}</span>
                <span style="font-size:0.75rem;color:var(--text-secondary);">${ws.venue || ''}</span>
                <button class="btn btn-sm cal-remove-ws-btn" data-ws-index="${i}" style="font-size:0.7rem;padding:0.15rem 0.4rem;color:#dc2626;">削除</button>
              </div>
            `).join('')}
            <div id="calWsForm" style="margin-top:0.5rem;display:flex;gap:0.5rem;flex-wrap:wrap;">
              <input id="calWsName" class="form-input" placeholder="レッスン名" style="flex:2;min-width:120px;font-size:0.8125rem;padding:0.3rem 0.5rem;">
              <input id="calWsVenue" class="form-input" placeholder="会場" style="flex:1;min-width:80px;font-size:0.8125rem;padding:0.3rem 0.5rem;">
              <input id="calWsTime" class="form-input" placeholder="時間" style="flex:1;min-width:80px;font-size:0.8125rem;padding:0.3rem 0.5rem;">
              <button id="calAddWsBtn" class="btn btn-sm btn-primary" style="font-size:0.8125rem;">追加</button>
            </div>
          </div>

          <!-- Note -->
          <div>
            <h4 style="font-size:0.8125rem;font-weight:600;color:var(--text-secondary);margin-bottom:0.5rem;">メモ</h4>
            <input id="calNote" class="form-input" value="${info.note}" placeholder="祝日名やメモを入力" style="width:100%;font-size:0.8125rem;padding:0.3rem 0.5rem;">
            <button id="calSaveNote" class="btn btn-sm btn-secondary" style="margin-top:0.5rem;font-size:0.8125rem;">メモ保存</button>
          </div>
        </div>
      </div>
    `;
  }

  return `
    <div class="page-header">
      <div>
        <h2>スケジュール</h2>
        <p class="subtitle">月間カレンダー</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-secondary" onclick="window.app.previousMonth()">前月</button>
        <span style="padding:0 1rem;line-height:2.5rem;font-weight:600;">${year}年${month + 1}月</span>
        <button class="btn btn-secondary" onclick="window.app.nextMonth()">翌月</button>
      </div>
    </div>

    <div class="content-card" style="padding:0;">
      <div class="calendar-grid">
        ${dayHeaders.map((d, i) => `
          <div class="cal-header" style="background:#1d1d1f;color:white;padding:0.5rem;text-align:center;font-weight:600;font-size:0.875rem;">
            <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${dayColors[i]};margin-right:4px;"></span>${d}
          </div>
        `).join('')}
        ${weeks.map(week => week.map(date => {
          const isCurrentMonth = date.getMonth() === month;
          const isToday = date.toDateString() === today.toDateString();
          const dateKey = String(date.getDate());
          const isSelected = selectedDate === dateKey && isCurrentMonth;
          const info = isCurrentMonth ? getLessonsForDate(date, calendarData) : null;
          const activeCount = info ? info.lessons.filter(l => !l.cancelled).length : 0;
          const wsCount = info ? info.workshops.length : 0;

          // Unique venue dots
          const venueDots = info && !info.holiday
            ? [...new Set(info.lessons.filter(l => !l.cancelled).map(l => l.venue))].map(v =>
                `<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${getVenueColor(v)};"></span>`
              ).join('')
            : '';

          return `
            <div class="cal-cell ${!isCurrentMonth ? 'outside' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${info?.holiday ? 'holiday' : ''}"
                 ${isCurrentMonth ? `onclick="window.app.selectCalendarDate('${dateKey}')"` : ''}>
              <div class="cal-date">${date.getDate()}</div>
              ${isCurrentMonth ? `
                <div class="cal-dots">${venueDots}${wsCount ? `<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#f59e0b;"></span>` : ''}</div>
                ${info.holiday ? '<div class="cal-badge-holiday">休</div>' : ''}
                ${info.cancelledCount > 0 ? `<div class="cal-badge-cancel">${info.cancelledCount}休講</div>` : ''}
                ${wsCount > 0 ? `<div class="cal-badge-ws">WS</div>` : ''}
                ${info.note ? `<div class="cal-note-indicator" title="${info.note}">📝</div>` : ''}
              ` : ''}
            </div>
          `;
        }).join('')).join('')}
      </div>
    </div>

    ${detailPanel}
  `;
}
