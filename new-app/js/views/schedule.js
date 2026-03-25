// POSSE Dance Academy - Schedule View Module
// ES module for schedule display and management

import { timeSchedule } from '../config.js?v=9';

/**
 * Weekly time grid view
 * @param {Object} app - Application state
 * @returns {string} HTML string for time schedule
 */
// Parse time string "HH:MM" to minutes from midnight
function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + (m || 0);
}

export function renderTimeSchedule(app) {
  const daysOfWeek = ['月曜日', '火曜日', '水曜日', '木曜日', '金曜日'];
  const dayShort = ['月', '火', '水', '木', '金'];

  // Determine time range from actual classes
  let minTime = 24 * 60, maxTime = 0;
  daysOfWeek.forEach(day => {
    (timeSchedule[day] || []).filter(c => !c.alias && c.time).forEach(cls => {
      const parts = cls.time.split('-');
      const start = timeToMinutes(parts[0].replace('〜', '').trim());
      const end = parts[1] ? timeToMinutes(parts[1].trim()) : start + 60;
      if (start < minTime) minTime = start;
      if (end > maxTime) maxTime = end;
    });
  });
  // Round to full hours
  const startHour = Math.floor(minTime / 60);
  const endHour = Math.ceil(maxTime / 60);
  const totalMinutes = (endHour - startHour) * 60;
  const PX_PER_MIN = 2; // 2px per minute = 120px per hour
  const totalHeight = totalMinutes * PX_PER_MIN;

  // Build hour lines
  const hourLines = [];
  for (let h = startHour; h <= endHour; h++) {
    const top = (h - startHour) * 60 * PX_PER_MIN;
    hourLines.push({ hour: h, top });
  }

  // Build class blocks per day with column assignment for overlaps
  const dayColumns = daysOfWeek.map((day, di) => {
    const classes = (timeSchedule[day] || []).filter(c => !c.alias && c.time);
    const blocks = classes.map(cls => {
      const parts = cls.time.split('-');
      const start = timeToMinutes(parts[0].replace('〜', '').trim());
      const end = parts[1] ? timeToMinutes(parts[1].trim()) : start + 60;
      const top = (start - startHour * 60) * PX_PER_MIN;
      const height = (end - start) * PX_PER_MIN;
      const shortName = cls.name.replace(/\s+(SOYA|HARUHIKO|DAZU|AYANO|RYUSEI|AI|HIMEKA|AYANO \/ HARUHIKO|AYANO HARUHIKO).*/i, '').trim();
      const instructor = cls.name.replace(shortName, '').trim();
      return { cls, top, height, shortName, instructor, startMin: start, endMin: end, col: 0 };
    });
    // Assign columns: if a block overlaps with any block in col 0, put it in col 1
    blocks.forEach((b, i) => {
      const overlapsCol0 = blocks.some((other, j) => j < i && other.col === 0 && b.startMin < other.endMin && b.endMin > other.startMin);
      if (overlapsCol0) b.col = 1;
    });
    return { day, short: dayShort[di], blocks };
  });

  // Mobile: selected day for tab view
  const mobileDay = app.selectedDay || '月曜日';
  const mobileDayData = dayColumns.find(d => d.day === mobileDay) || dayColumns[0];
  const dayColors2 = {'月曜日':'#3b82f6','火曜日':'#ef4444','水曜日':'#10b981','木曜日':'#f59e0b','金曜日':'#8b5cf6'};

  return `
    <div class="page-header">
      <div>
        <h2>スケジュール</h2>
        <p class="subtitle">週間時間割</p>
      </div>
    </div>

    <!-- Venue Legend -->
    <div style="display:flex;gap:0.75rem;flex-wrap:wrap;margin-bottom:0.75rem;align-items:center;">
      ${[
        { name: '天神BUZZ校', color: '#3b82f6' },
        { name: '大橋校', color: '#ef4444' },
        { name: '照葉校', color: '#10b981' },
        { name: '千早クラス', color: '#8b5cf6' },
        { name: '九産大前', color: '#f59e0b' }
      ].map(v => `
        <div style="display:flex;align-items:center;gap:0.35rem;">
          <span style="display:inline-block;width:12px;height:12px;border-radius:0.15rem;background:${v.color};"></span>
          <span style="font-size:0.8125rem;font-weight:500;">${v.name}</span>
        </div>
      `).join('')}
    </div>

    <!-- Mobile: day tabs + vertical list -->
    <div class="ts-mobile-only">
      <div class="att-day-nav" style="margin-bottom:0.75rem;">
        <div class="tab-nav att-day-tabs" style="margin-bottom:0;flex:1;">
          ${daysOfWeek.map(day => `
            <button class="tab-btn ${day === mobileDay ? 'active' : ''}"
                    onclick="window.app.selectedDay='${day}';window.app.render();">
              <span class="day-dot" style="background:${dayColors2[day]};"></span>
              <span>${day.charAt(0)}</span>
            </button>
          `).join('')}
        </div>
      </div>
      <div class="content-card" style="padding:0.75rem;">
        ${mobileDayData.blocks.length === 0 ? '<div style="color:var(--text-secondary);font-size:0.875rem;text-align:center;padding:2rem 0;">この曜日のレッスンはありません</div>' :
          mobileDayData.blocks
            .sort((a, b) => a.startMin - b.startMin)
            .map(b => `
            <div style="display:flex;align-items:stretch;gap:0.5rem;margin-bottom:0.5rem;">
              <div style="width:4px;border-radius:2px;background:${getVenueColor(b.cls.venue)};flex-shrink:0;"></div>
              <div style="flex:1;padding:0.4rem 0;">
                <div style="font-weight:700;font-size:0.875rem;">${b.shortName}</div>
                <div style="font-size:0.75rem;color:var(--text-secondary);margin-top:0.15rem;">${b.instructor}</div>
                <div style="font-size:0.75rem;color:var(--text-secondary);">${b.cls.time} ｜ ${b.cls.venue}</div>
              </div>
            </div>
          `).join('')}
      </div>
    </div>

    <!-- Desktop: full grid -->
    <div class="ts-desktop-only content-card" style="padding:0;border:1px solid #d1d5db;border-radius:0.5rem;">
      <div class="ts-grid" style="display:grid;grid-template-columns:50px repeat(5,1fr);">
        <!-- Header row -->
        <div style="background:#1d1d1f;padding:0.5rem;text-align:center;color:white;font-weight:600;font-size:0.75rem;border-right:1px solid #4b5563;">時刻</div>
        ${dayColumns.map((d, i) => `
          <div style="background:#1d1d1f;padding:0.5rem;text-align:center;color:white;font-weight:600;font-size:0.8125rem;${i < dayColumns.length - 1 ? 'border-right:1px solid #4b5563;' : ''}">${d.short}</div>
        `).join('')}

        <!-- Time axis column -->
        <div style="position:relative;height:${totalHeight}px;background:#f9fafb;border-right:2px solid #d1d5db;">
          ${hourLines.map(l => `
            <div style="position:absolute;top:${l.top}px;left:0;right:0;border-top:1px solid #d1d5db;padding:2px 4px;font-size:0.6875rem;font-weight:600;color:#6b7280;">
              ${l.hour}:00
            </div>
          `).join('')}
        </div>

        <!-- Day columns with 2-column layout for overlaps -->
        ${dayColumns.map((d, di) => {
          const hasCol1 = d.blocks.some(b => b.col === 1);
          return `
          <div style="position:relative;height:${totalHeight}px;${di < dayColumns.length - 1 ? 'border-right:1px solid #e5e7eb;' : ''}">
            ${hourLines.map(l => `
              <div style="position:absolute;top:${l.top}px;left:0;right:0;border-top:1px solid #e5e7eb;${l.top === 0 ? 'border-top-color:transparent;' : ''}"></div>
            `).join('')}
            ${d.blocks.map(b => {
              const left = hasCol1 ? (b.col === 0 ? '1px' : '50%') : '2px';
              const right = hasCol1 ? (b.col === 0 ? '50%' : '1px') : '2px';
              return `
              <div style="position:absolute;top:${b.top}px;left:${left};right:${right};height:${b.height - 2}px;background:${getVenueColor(b.cls.venue)};color:white;border-radius:0.3rem;padding:0.2rem 0.3rem;font-size:0.65rem;line-height:1.25;overflow:hidden;cursor:default;margin:0 1px;" title="${b.cls.name}\n${b.cls.time}\n${b.cls.venue}">
                <div style="font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${b.shortName}</div>
                ${b.height >= 60 ? `<div style="font-size:0.55rem;opacity:0.9;margin-top:1px;">${b.instructor}</div>` : ''}
                <div style="font-size:0.55rem;opacity:0.85;margin-top:1px;">${b.cls.time}</div>
                ${b.height >= 90 ? `<div style="font-size:0.55rem;opacity:0.8;margin-top:1px;">${b.cls.venue}</div>` : ''}
              </div>`;
            }).join('')}
          </div>`;
        }).join('')}
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

  const dayHeaders = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
  const dayHeadersShort = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
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

    <!-- Venue Legend -->
    <div style="display:flex;gap:0.75rem;flex-wrap:wrap;margin-bottom:0.75rem;align-items:center;">
      ${[
        { name: '天神BUZZ校', color: '#3b82f6' },
        { name: '大橋校', color: '#ef4444' },
        { name: '照葉校', color: '#10b981' },
        { name: '千早クラス', color: '#8b5cf6' },
        { name: '九産大前', color: '#f59e0b' }
      ].map(v => `
        <div style="display:flex;align-items:center;gap:0.35rem;">
          <span style="display:inline-block;width:12px;height:12px;border-radius:0.15rem;background:${v.color};"></span>
          <span style="font-size:0.8125rem;font-weight:500;">${v.name}</span>
        </div>
      `).join('')}
    </div>

    <div class="content-card" style="padding:0;">
      <div class="calendar-grid">
        ${dayHeaders.map((d, i) => `
          <div class="cal-header" style="background:#1d1d1f;color:white;padding:0.6rem 0.25rem;text-align:center;font-weight:700;font-size:0.75rem;letter-spacing:0.05em;overflow:hidden;">
            <span class="day-full">${d}</span><span class="day-short">${dayHeadersShort[i]}</span>
          </div>
        `).join('')}
        ${weeks.map(week => week.map(date => {
          const isCurrentMonth = date.getMonth() === month;
          const isToday = date.toDateString() === today.toDateString();
          const dateKey = String(date.getDate());
          const isSelected = selectedDate === dateKey && isCurrentMonth;
          const info = isCurrentMonth ? getLessonsForDate(date, calendarData) : null;

          // Build lesson name badges
          let badges = '';
          if (isCurrentMonth && info) {
            if (info.holiday && !info.workshops.length) {
              badges = '<div class="cal-tag" style="background:#e5e7eb;color:#6b7280;">休校</div>';
            } else {
              // Active regular lessons as colored tags
              badges = info.lessons.filter(l => !l.cancelled).map(cls => {
                const shortName = cls.name.replace(/\s+(SOYA|HARUHIKO|DAZU|AYANO|RYUSEI|AI|HIMEKA|AYANO \/ HARUHIKO|AYANO HARUHIKO).*/i, '').trim();
                const bg = getVenueColor(cls.venue);
                return `<div class="cal-tag" style="background:${bg};color:white;">${shortName}</div>`;
              }).join('');
              // Cancelled lessons with strikethrough
              badges += info.lessons.filter(l => l.cancelled).map(cls => {
                const shortName = cls.name.replace(/\s+(SOYA|HARUHIKO|DAZU|AYANO|RYUSEI|AI|HIMEKA|AYANO \/ HARUHIKO|AYANO HARUHIKO).*/i, '').trim();
                return `<div class="cal-tag cal-tag-cancelled">${shortName}</div>`;
              }).join('');
              // Workshops in orange
              badges += (info.workshops || []).map(ws =>
                `<div class="cal-tag" style="background:#f59e0b;color:white;">${ws.name}</div>`
              ).join('');
            }
            if (info.note) {
              badges += `<div class="cal-tag" style="background:#fef3c7;color:#92400e;font-size:0.55rem;">📝 ${info.note}</div>`;
            }
          }

          return `
            <div class="cal-cell ${!isCurrentMonth ? 'outside' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}"
                 ${isCurrentMonth ? `onclick="window.app.selectCalendarDate('${dateKey}')"` : ''}>
              <div class="cal-date">${date.getDate()}</div>
              <div class="cal-tags">${badges}</div>
            </div>
          `;
        }).join('')).join('')}
      </div>
    </div>

    ${detailPanel}
  `;
}
