// POSSE Dance Academy - Instructors View Module
// ES module for instructor profile display

import { instructors } from '../config.js?v=11';

/**
 * Instructor profile cards
 * @param {Object} app - Application state
 * @returns {string} HTML string for instructors view
 */
export function renderInstructors(app) {
  return `
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h2>講師紹介</h2>
        <p class="subtitle">POSSE Dance Academy の講師陣</p>
      </div>
    </div>

    <!-- Instructors Grid -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(500px, 1fr)); gap: 2rem;">
      ${instructors.map(instructor => `
        <div class="instructor-card" style="background-color: white; border: 1px solid var(--border-color); border-radius: 0.75rem; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
          <!-- Card Header -->
          <div class="instructor-header" style="padding: 1.5rem; background:#1d1d1f; border-bottom: 1px solid var(--border-color);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                <h3 class="instructor-name" style="margin: 0; font-size: 1.5rem; font-weight: 700; color: white;">${instructor.name}</h3>
                <div class="instructor-stage" style="margin-top: 0.5rem; font-size: 0.875rem; color: rgba(255,255,255,0.7); font-style: italic;">${instructor.stageName}</div>
              </div>
              <div style="text-align: right;">
                <span class="badge badge-blue" style="display: inline-block; background-color: #3b82f6; color: white; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600;">${instructor.genre}</span>
              </div>
            </div>

            <!-- Birth Date & Career -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem;">
              <div>
                <div style="font-size: 0.75rem; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">生年月日</div>
                <div style="font-size: 0.875rem; font-weight: 500; margin-top: 0.25rem; color:white;">${instructor.birthDate}</div>
              </div>
              <div>
                <div style="font-size: 0.75rem; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">キャリア開始</div>
                <div style="font-size: 0.875rem; font-weight: 500; margin-top: 0.25rem; color:white;">${instructor.careerStart}</div>
              </div>
            </div>
          </div>

          <!-- Card Body -->
          <div class="instructor-body" style="padding: 1.5rem;">
            <!-- Profile Section -->
            ${instructor.profile ? `
              <div class="instructor-section" style="margin-bottom: 1.5rem;">
                <h4 class="instructor-section-title" style="margin: 0 0 0.75rem 0; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; color: #6b7280;">プロフィール</h4>
                <p style="margin: 0; color: #374151; line-height: 1.6; font-size: 0.875rem;">${instructor.profile}</p>
              </div>
            ` : ''}

            <!-- Message Section -->
            ${instructor.message ? `
              <div class="instructor-section" style="margin-bottom: 1.5rem;">
                <h4 class="instructor-section-title" style="margin: 0 0 0.75rem 0; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; color: #6b7280;">メッセージ</h4>
                <p style="margin: 0; color: #374151; line-height: 1.6; font-size: 0.875rem;">${instructor.message}</p>
              </div>
            ` : ''}

            <!-- Awards Section -->
            ${instructor.awards && instructor.awards.length > 0 ? `
              <div class="instructor-section" style="margin-bottom: 1.5rem;">
                <h4 class="instructor-section-title" style="margin: 0 0 0.75rem 0; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; color: #6b7280;">受賞歴</h4>
                <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                  ${instructor.awards.map(award => `
                    <span class="badge badge-blue" style="background-color: #dbeafe; color: #1e40af; padding: 0.5rem 0.75rem; border-radius: 0.25rem; font-size: 0.75rem; line-height: 1.2;">${award}</span>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            <!-- Other Experience Section -->
            ${instructor.otherExperience && instructor.otherExperience.length > 0 ? `
              <div class="instructor-section" style="margin-bottom: 1.5rem;">
                <h4 class="instructor-section-title" style="margin: 0 0 0.75rem 0; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; color: #6b7280;">その他の経歴</h4>
                <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                  ${instructor.otherExperience.map(exp => `
                    <span class="badge" style="background-color: #3b82f6; color: white; padding: 0.5rem 0.75rem; border-radius: 0.25rem; font-size: 0.75rem; line-height: 1.2;">${exp}</span>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            <!-- Lesson History Section -->
            ${instructor.lessons && instructor.lessons.length > 0 ? `
              <div class="instructor-section">
                <h4 class="instructor-section-title" style="margin: 0 0 0.75rem 0; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; color: #6b7280;">指導歴</h4>
                <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                  ${instructor.lessons.map(lesson => `
                    <span class="badge" style="background-color: #10b981; color: white; padding: 0.5rem 0.75rem; border-radius: 0.25rem; font-size: 0.75rem; line-height: 1.2;">${lesson}</span>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      `).join('')}
    </div>

    <!-- Instructor Statistics -->
    <div class="content-card" style="margin-top: 3rem;">
      <div class="card-header" style="background:#1d1d1f;border-radius:var(--border-radius-lg) var(--border-radius-lg) 0 0;">
        <h3 class="card-title" style="color:white;">講師統計</h3>
      </div>
      <div class="card-content">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem;">
          <div style="padding: 1rem; background-color: var(--bg-secondary); border-radius: 0.5rem;">
            <div style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.5rem;">総講師数</div>
            <div style="font-size: 2rem; font-weight: 700; color: #3b82f6;">${instructors.length}</div>
          </div>

          <div style="padding: 1rem; background-color: var(--bg-secondary); border-radius: 0.5rem;">
            <div style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.5rem;">ジャンル</div>
            <div style="font-size: 2rem; font-weight: 700; color: #10b981;">${new Set(instructors.map(i => i.genre)).size}</div>
          </div>

          <div style="padding: 1rem; background-color: var(--bg-secondary); border-radius: 0.5rem;">
            <div style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.5rem;">平均キャリア年数</div>
            <div style="font-size: 2rem; font-weight: 700; color: #f59e0b;">
              ${Math.round(instructors.reduce((sum, i) => {
                const match = i.careerStart.match(/(\d{4})/);
                return sum + (match ? new Date().getFullYear() - parseInt(match[1]) : 0);
              }, 0) / instructors.length)} 年
            </div>
          </div>
        </div>

        <!-- Genre Breakdown -->
        <div style="margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid var(--border-color);">
          <h4 style="margin-bottom: 1rem; font-weight: 600;">ジャンル別内訳</h4>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
            ${Array.from(new Set(instructors.map(i => i.genre))).map(genre => {
              const count = instructors.filter(i => i.genre === genre).length;
              return `
                <div style="padding: 1rem; background-color: var(--bg-secondary); border-radius: 0.5rem; border-left: 4px solid #3b82f6;">
                  <div style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.5rem;">${genre}</div>
                  <div style="font-size: 1.5rem; font-weight: 600;">${count}名</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}
