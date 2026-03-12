// POSSE Dance Academy - Schedule View Module
// ES module for schedule display and management

import { timeSchedule } from '../config.js';

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

  // Populate schedule with classes
  daysOfWeek.forEach(day => {
    (timeSchedule[day] || []).forEach(cls => {
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
            <tr style="background-color: var(--bg-secondary);">
              <th style="padding: 0.75rem; text-align: left; border: 1px solid var(--border-color); font-weight: 600;">時刻</th>
              ${daysOfWeek.map(day => `
                <th style="padding: 0.75rem; text-align: center; border: 1px solid var(--border-color); font-weight: 600; width: 15%;">${day}</th>
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
export function renderMonthlySchedule(app) {
  const daysOfWeek = ['月曜日', '火曜日', '水曜日', '木曜日', '金曜日'];
  const venues = ['天神校', '大橋校', '照葉校'];

  // Parse selected month (use app.selectedMonth for prev/next navigation)
  const [selYear, selMonth] = (app.selectedMonth || new Date().toISOString().slice(0, 7)).split('-').map(Number);
  const year = selYear;
  const month = selMonth - 1;
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay() + (firstDay.getDay() === 0 ? -6 : 1));

  const weeks = [];
  let currentDate = new Date(startDate);
  while (currentDate <= lastDay) {
    const week = [];
    for (let i = 0; i < 7; i++) {
      week.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    if (week.some(d => d.getMonth() === month)) {
      weeks.push(week);
    }
  }

  // Determine which venues have classes on each day of week
  const venuesByDay = {};
  daysOfWeek.forEach(day => {
    venuesByDay[day] = new Set();
    (timeSchedule[day] || []).forEach(cls => {
      venuesByDay[day].add(cls.venue);
    });
  });

  return `
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h2>スケジュール</h2>
        <p class="subtitle">月間カレンダー</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-secondary" onclick="window.app.previousMonth()">前月</button>
        <span style="padding: 0 1rem; line-height: 2.5rem; font-weight: 600;">${year}年${month + 1}月</span>
        <button class="btn btn-secondary" onclick="window.app.nextMonth()">翌月</button>
      </div>
    </div>

    <!-- Monthly Calendar -->
    <div class="content-card">
      <div style="overflow-x: auto;">
        <table class="schedule-table" style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: var(--bg-secondary);">
              <th style="padding: 0.75rem; text-align: center; border: 1px solid var(--border-color); font-weight: 600;">日</th>
              <th style="padding: 0.75rem; text-align: center; border: 1px solid var(--border-color); font-weight: 600;">月</th>
              <th style="padding: 0.75rem; text-align: center; border: 1px solid var(--border-color); font-weight: 600;">火</th>
              <th style="padding: 0.75rem; text-align: center; border: 1px solid var(--border-color); font-weight: 600;">水</th>
              <th style="padding: 0.75rem; text-align: center; border: 1px solid var(--border-color); font-weight: 600;">木</th>
              <th style="padding: 0.75rem; text-align: center; border: 1px solid var(--border-color); font-weight: 600;">金</th>
              <th style="padding: 0.75rem; text-align: center; border: 1px solid var(--border-color); font-weight: 600;">土</th>
            </tr>
          </thead>
          <tbody>
            ${weeks.map((week, weekIdx) => {
              const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
              const dayJapanese = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];
              return `
                <tr>
                  ${week.map((date, dayIdx) => {
                    const isCurrentMonth = date.getMonth() === month;
                    const dayOfWeek = dayJapanese[date.getDay()];
                    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                    const dayVenues = venuesByDay[dayOfWeek] ? Array.from(venuesByDay[dayOfWeek]) : [];

                    return `
                      <td style="padding: 0.5rem; border: 1px solid var(--border-color); background-color: ${!isCurrentMonth ? 'var(--bg-secondary)' : isWeekend ? '#f9fafb' : 'white'}; height: 100px; vertical-align: top; ${isWeekend && isCurrentMonth ? 'color: var(--text-secondary);' : ''}">
                        <div style="font-weight: 600; margin-bottom: 0.25rem; font-size: 0.875rem;">${date.getDate()}</div>
                        ${isWeekend && isCurrentMonth ? `
                          <div style="font-size: 0.75rem; color: var(--text-secondary);">休校</div>
                        ` : `
                          <div style="font-size: 0.75rem;">
                            ${dayVenues.map(venue => `
                              <div style="display: flex; align-items: center; gap: 0.25rem;">
                                <span style="color: #10b981;">○</span>
                                <span>${venue}</span>
                              </div>
                            `).join('')}
                          </div>
                        `}
                      </td>
                    `;
                  }).join('')}
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>

      <!-- Venue Legend -->
      <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">
        <h4 style="margin-bottom: 0.75rem; font-weight: 600;">営業校舎</h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem;">
          ${venues.map(venue => `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="color: #10b981; font-weight: 600;">●</span>
              <span>${venue}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Schedule Notes -->
      <div style="margin-top: 1.5rem; padding: 1rem; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 0.25rem;">
        <div style="font-weight: 600; color: #92400e; margin-bottom: 0.5rem;">注意事項</div>
        <ul style="margin: 0; padding-left: 1.5rem; font-size: 0.875rem; color: #92400e;">
          <li>土日祝日は休校です</li>
          <li>表示されているのは定期的に開催されるクラスです</li>
          <li>イベント開催時は別途通知します</li>
        </ul>
      </div>
    </div>
  `;
}
