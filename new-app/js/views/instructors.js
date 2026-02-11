import { instructors } from '../config.js';

export function renderInstructors(app) {
  return `
    <div class="instructors-view">
      <div class="page-header">
        <h1 class="page-title">講師プロフィール</h1>
      </div>

      <div style="display:grid;gap:var(--spacing-6)">
        ${instructors.map(inst => `
          <div class="card instructor-card">
            <div class="card-body" style="padding:var(--spacing-6)">
              <div style="display:flex;gap:var(--spacing-6);align-items:flex-start;flex-wrap:wrap">
                <!-- Photo placeholder -->
                <div style="width:120px;height:120px;border-radius:50%;background:var(--color-gray-200);display:flex;align-items:center;justify-content:center;font-size:2rem;color:var(--color-text-secondary);flex-shrink:0">
                  ${inst.stageName?.charAt(0) || inst.name?.charAt(0) || '?'}
                </div>

                <div style="flex:1;min-width:250px">
                  <h2 style="margin:0 0 var(--spacing-1) 0;font-size:1.5rem">${inst.name}</h2>
                  <p style="margin:0 0 var(--spacing-1) 0;color:var(--color-primary);font-weight:600;font-size:1.1rem">${inst.stageName || ''}</p>
                  <p style="margin:0 0 var(--spacing-3) 0;color:var(--color-text-secondary)">
                    ${inst.genre || ''} | ${inst.birthDate || ''} | ${inst.careerStart || ''}
                  </p>

                  ${inst.profile ? `<p style="margin:0 0 var(--spacing-3) 0;line-height:1.6">${inst.profile}</p>` : ''}
                  ${inst.message ? `
                    <div style="background:var(--color-gray-50);padding:var(--spacing-4);border-radius:var(--radius-md);margin-bottom:var(--spacing-3);border-left:3px solid var(--color-primary)">
                      <p style="margin:0;font-style:italic;line-height:1.6">${inst.message}</p>
                    </div>
                  ` : ''}
                </div>
              </div>

              <!-- Awards -->
              ${inst.awards && inst.awards.length > 0 ? `
                <div style="margin-top:var(--spacing-4)">
                  <h3 style="font-size:1rem;margin-bottom:var(--spacing-2);color:var(--color-text-secondary)">受賞歴・実績</h3>
                  <div style="display:flex;flex-wrap:wrap;gap:var(--spacing-2)">
                    ${inst.awards.map(a => `
                      <span class="badge" style="background:var(--color-gray-100);color:var(--color-text-primary);font-size:0.8rem">${a}</span>
                    `).join('')}
                  </div>
                </div>
              ` : ''}

              <!-- Other Experience -->
              ${inst.otherExperience && inst.otherExperience.length > 0 ? `
                <div style="margin-top:var(--spacing-3)">
                  <h3 style="font-size:1rem;margin-bottom:var(--spacing-2);color:var(--color-text-secondary)">出演・活動</h3>
                  <div style="display:flex;flex-wrap:wrap;gap:var(--spacing-2)">
                    ${inst.otherExperience.map(e => `
                      <span class="badge" style="background:var(--color-gray-100);color:var(--color-text-primary);font-size:0.8rem">${e}</span>
                    `).join('')}
                  </div>
                </div>
              ` : ''}

              <!-- Lessons -->
              ${inst.lessons && inst.lessons.length > 0 ? `
                <div style="margin-top:var(--spacing-3)">
                  <h3 style="font-size:1rem;margin-bottom:var(--spacing-2);color:var(--color-text-secondary)">指導歴</h3>
                  <div style="display:flex;flex-wrap:wrap;gap:var(--spacing-2)">
                    ${inst.lessons.map(l => `
                      <span class="badge" style="background:var(--color-primary-light, #FEE2E2);color:var(--color-primary);font-size:0.8rem">${l}</span>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}
