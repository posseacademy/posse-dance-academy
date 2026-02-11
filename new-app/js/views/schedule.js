import { timeSchedule, dayOrder } from '../config.js';

export function renderSchedule(app) {
  const scheduleTab = app.scheduleTab || 'time';

  return `
    <div class="schedule-view">
      <div class="page-header">
        <h1 class="page-title">スケジュール</h1>
      </div>

      <div class="tab-bar" style="margin-bottom:var(--spacing-4)">
        <div class="tab-item ${scheduleTab === 'time' ? 'active' : ''}"
          onclick="app.scheduleTab='time';app.render()">タイムスケジュール</div>
        <div class="tab-item ${scheduleTab === 'monthly' ? 'active' : ''}"
          onclick="app.scheduleTab='monthly';app.render()">月間スケジュール</div>
      </div>

      ${scheduleTab === 'time' ? renderTimeSchedule() : renderMonthlySchedule(app)}
    </div>
  `;
}

function renderTimeSchedule() {
  const venues = ['天神校', '大橋校', '照葉校'];

  return `
    ${dayOrder.map(day => {
      const classes = timeSchedule[day] || [];
      if (classes.length === 0) return '';

      return `
        <div class="card" style="margin-bottom:var(--spacing-4)">
          <div class="card-header">
            <h3 class="card-title">${day}</h3>
          </div>
          <div class="card-body">
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:var(--spacing-3)">
              ${venues.map(venue => {
                const venueClasses = classes.filter(c => c.venue === venue);
                if (venueClasses.length === 0) return '';
                return `
                  <div>
                    <h4 style="margin-bottom:var(--spacing-2);color:var(--color-text-secondary);font-size:0.85rem">${venue}</h4>
                    ${venueClasses.map(c => `
                      <div class="schedule-card" style="border-left:4px solid ${c.color};margin-bottom:var(--spacing-2)">
                        <div style="font-weight:600;font-size:0.9rem">${c.name}</div>
                        <div style="color:var(--color-text-secondary);font-size:0.8rem">${c.time}</div>
                      </div>
                    `).join('')}
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      `;
    }).join('')}
  `;
}

function renderMonthlySchedule(app) {
  const scheduleData = app.scheduleData || {};

  return `
    ${dayOrder.map(day => {
      const classes = Array.isArray(scheduleData[day]) ? scheduleData[day] : [];
      return `
        <div class="card" style="margin-bottom:var(--spacing-4)">
          <div class="card-header">
            <h3 class="card-title">${day}</h3>
            <span class="badge">${classes.length}クラス</span>
          </div>
          <div class="card-body">
            ${classes.length > 0 ? `
              <table class="data-table">
                <thead>
                  <tr>
                    <th>場所</th>
                    <th>クラス名</th>
                    <th style="text-align:center">生徒数</th>
                  </tr>
                </thead>
                <tbody>
                  ${classes.map(c => `
                    <tr>
                      <td>${c.location}</td>
                      <td><strong>${c.name}</strong></td>
                      <td style="text-align:center">${(c.students || []).length}名</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : '<p style="text-align:center;color:var(--color-text-secondary)">クラスがありません</p>'}
          </div>
        </div>
      `;
    }).join('')}
  `;
}
