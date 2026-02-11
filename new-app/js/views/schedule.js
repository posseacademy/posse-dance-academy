import { timeSchedule, dayOrder } from '../config.js';

export function renderSchedule(app) {
  const scheduleTab = app.scheduleTab || 'time';

  return `
    <div class="schedule-view">
      <div class="page-header">
        <h1 class="page-title">ã¹ã±ã¸ã¥ã¼ã«</h1>
      </div>

      <div class="tab-bar" style="margin-bottom:var(--spacing-4)">
        <div class="tab-item ${scheduleTab === 'time' ? 'active' : ''}"
          onclick="app.scheduleTab='time';app.render()">ã¿ã¤ã ã¹ã±ã¸ã¥ã¼ã«</div>
        <div class="tab-item ${scheduleTab === 'monthly' ? 'active' : ''}"
          onclick="app.scheduleTab='monthly';app.render()">æéã¹ã±ã¸ã¥ã¼ã«</div>
      </div>

      ${scheduleTab === 'time' ? renderTimeSchedule() : renderMonthlySchedule(app)}
    </div>
  `;
}

function renderTimeSchedule() {
  const venues = ['å¤©ç¥æ ¡', 'å¤§æ©æ ¡', 'ç§èæ ¡'];

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
            <span class="badge">${classes.length}ã¯ã©ã¹</span>
          </div>
          <div class="card-body">
            ${classes.length > 0 ? `
              <table class="data-table">
                <thead>
                  <tr>
                    <th>å ´æ</th>
                    <th>ã¯ã©ã¹å</th>
                    <th style="text-align:center">çå¾æ°</th>
                  </tr>
                </thead>
                <tbody>
                  ${classes.map(c => `
                    <tr>
                      <td>${c.location}</td>
                      <td><strong>${c.name}</strong></td>
                      <td style="text-align:center">${(c.students || []).length}å</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : '<p style="text-align:center;color:var(--color-text-secondary)">ã¯ã©ã¹ãããã¾ãã</p>'}
          </div>
        </div>
      `;
    }).join('')}
  `;
}
