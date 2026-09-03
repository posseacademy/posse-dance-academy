// POSSE Dance Academy - Schedule View Module
// ES module for schedule display and management

import { timeSchedule } from '../config.js?v=16';
import { isLessonActiveIn, escapeAttr } from '../utils.js?v=20';

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

  // Use app's editable timeScheduleData (loaded from Firestore or config fallback)
  const ts = app.timeScheduleData || timeSchedule;

  // 開催期間外のレッスンは選択中の月のグリッドに出さない。
  // 期間を持たない既存エントリは常時開催として通る（isLessonActiveIn の既定）。
  const _month = app.selectedMonth;

  // Determine time range from actual classes
  let minTime = 24 * 60, maxTime = 0;
  daysOfWeek.forEach(day => {
    (ts[day] || []).filter(c => !c.alias && c.time && isLessonActiveIn(c, _month)).forEach(cls => {
      const parts = cls.time.split('-');
      const start = timeToMinutes(parts[0].replace('〜', '').trim());
      const end = parts[1] ? timeToMinutes(parts[1].trim()) : start + 60;
      if (start < minTime) minTime = start;
      if (end > maxTime) maxTime = end;
    });
  });
  // その月に開催されるレッスンが1つも無いと minTime/maxTime が初期値のままになり、
  // totalHeight が負値（-2880px）の div が出る。月フィルタを入れる前は
  // 「全曜日の時間割が空」でしか起きなかったが、月移動だけで到達できるようになった。
  if (maxTime === 0) { minTime = 9 * 60; maxTime = 22 * 60; }

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
    const classes = (ts[day] || []).filter(c => !c.alias && c.time && isLessonActiveIn(c, _month));
    // allLessons は絶対にフィルタしないこと。
    // origIndex は saveLessonForm / deleteLesson / renderLessonForm が
    // timeScheduleData[day] の「生のインデックス」として使うため、
    // ここで絞ると別のレッスンを編集・削除してしまう。
    const allLessons = ts[day] || [];
    const blocks = classes.map(cls => {
      const origIndex = allLessons.indexOf(cls);
      const parts = cls.time.split('-');
      const start = timeToMinutes(parts[0].replace('〜', '').trim());
      const end = parts[1] ? timeToMinutes(parts[1].trim()) : start + 60;
      const top = (start - startHour * 60) * PX_PER_MIN;
      const height = (end - start) * PX_PER_MIN;
      const shortName = cls.name.replace(/\s+(SOYA|HARUHIKO|DAZU|AYANO|RYUSEI|AI|HIMEKA|SHIN|Key-lock|AYANO \/ HARUHIKO|AYANO HARUHIKO).*/i, '').trim();
      const instructor = cls.name.replace(shortName, '').trim();
      return { cls, top, height, shortName, instructor, startMin: start, endMin: end, col: 0, origIndex };
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

  // このグリッドは _month（＝ app.selectedMonth）で暗黙にフィルタされている。
  // 月を出さないと、最終開催月を過ぎたレッスンが消えた理由が分からず、
  // 編集・削除するために戻る手段（＝月を戻す操作）も画面に無い状態になる。
  const _hasHidden = daysOfWeek.some(day =>
    (ts[day] || []).some(c => !c.alias && c.time && !isLessonActiveIn(c, _month)));

  return `
    <div class="page-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;">
      <div>
        <h2>スケジュール</h2>
        <p class="subtitle">週間時間割</p>
      </div>
      <div style="display:flex;align-items:center;gap:0.5rem;">
        <div style="display:flex;align-items:center;gap:0.25rem;background:var(--bg-secondary,#f3f4f6);border-radius:6px;padding:0.15rem;">
          <button class="btn btn-sm" style="background:transparent;border:none;padding:0.25rem 0.5rem;" onclick="window.app.changeMonth(-1)" title="前の月">◀</button>
          <span style="font-size:0.85rem;font-weight:600;min-width:5.5rem;text-align:center;">${_month || ''} の時間割</span>
          <button class="btn btn-sm" style="background:transparent;border:none;padding:0.25rem 0.5rem;" onclick="window.app.changeMonth(1)" title="次の月">▶</button>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="window.app.toggleScheduleHelp()" style="white-space:nowrap;" title="レッスンの追加・差し替え・終了のしかた">
          ？ 使い方
        </button>
        <button class="btn btn-primary btn-sm" onclick="window.app.showLessonForm('月曜日')" style="white-space:nowrap;">
          ＋ レッスン追加
        </button>
      </div>
    </div>

    ${app.showScheduleHelp ? renderScheduleHelp() : ''}
    ${_hasHidden ? `<div style="background:#fffbeb;border-left:4px solid #f59e0b;padding:0.5rem 0.75rem;border-radius:4px;margin-bottom:0.75rem;font-size:0.8rem;color:#92400e;">
      この月に開催されないレッスンは表示していません。編集・削除するには ◀ ▶ で開催されている月に移動してください。
    </div>` : ''}

    ${app.editingLessonDay !== null ? renderLessonForm(app) : ''}

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
    <div class="ts-desktop-only content-card" style="padding:0;border:1px solid #d1d5db;border-radius:0.5rem;overflow:visible;">
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
              <div class="ts-block" style="position:absolute;top:${b.top}px;left:${left};right:${right};height:${b.height - 2}px;background:${getVenueColor(b.cls.venue)};color:white;border-radius:0.3rem;padding:0.2rem 0.3rem;font-size:0.65rem;line-height:1.25;overflow:hidden;cursor:pointer;margin:0 1px;" title="${escapeAttr(b.cls.name)}\n${escapeAttr(b.cls.time)}\n${escapeAttr(b.cls.venue)}" onclick="window.app.showLessonForm('${d.day}', ${b.origIndex})">
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
 * スケジュール設定マニュアル（画面内ヘルプ）
 *
 * 運用担当者が複数いるため、口頭伝達や別ファイルではなく操作画面の中に置く。
 * 特に「差し替えは削除ボタンではなく最終開催月」は、間違えると
 * 過去の出席記録が見えなくなる（名簿ごと削除）か、消したはずのクラスが
 * 翌月も出席名簿に残る（名簿に生徒がいるため）ので、最初に読ませる。
 */
function renderScheduleHelp() {
  const step = (n, title, body) => `
    <div style="display:flex;gap:0.75rem;margin-bottom:1rem;">
      <div style="flex-shrink:0;width:1.75rem;height:1.75rem;border-radius:50%;background:#111;color:#fff;display:flex;align-items:center;justify-content:center;font-size:0.8rem;font-weight:700;">${n}</div>
      <div style="flex:1;min-width:0;">
        <div style="font-weight:700;font-size:0.9rem;margin-bottom:0.2rem;">${title}</div>
        <div style="font-size:0.82rem;color:var(--text-secondary,#4b5563);line-height:1.7;">${body}</div>
      </div>
    </div>`;

  return `
    <div class="content-card" style="margin-bottom:1rem;border:2px solid #111;">
      <div class="card-header" style="margin-bottom:1rem;padding-bottom:0.75rem;display:flex;justify-content:space-between;align-items:center;">
        <h3 class="card-title">スケジュールの設定方法</h3>
        <button class="btn btn-secondary btn-sm" onclick="window.app.toggleScheduleHelp()">閉じる</button>
      </div>

      <div style="background:#f0f9ff;border-left:4px solid #0284c7;padding:0.75rem 1rem;border-radius:4px;margin-bottom:1.25rem;font-size:0.85rem;line-height:1.7;">
        時間割に登録した内容は、<b>月間スケジュール・出席名簿・HOME のレッスン一覧</b>に自動で反映されます。
        それぞれの画面で別々に登録する必要はありません。
      </div>

      <h4 style="font-size:0.9rem;margin:0 0 0.75rem;padding:0.35rem 0.7rem;background:#111;color:#fff;border-radius:4px;display:inline-block;">A. 新しいレッスンを追加する</h4>
      ${step(1, 'はじめる月を表示する', '画面上の <b>◀ ▶</b> で、そのレッスンを<b>始める月</b>を表示します。10月から始めるなら 2026-10 を表示してください。')}
      ${step(2, '「＋ レッスン追加」を押す', '曜日・スタジオ・開始/終了時間・レッスン名・講師名を入れます。')}
      ${step(3, '開始月を確認する', '<b>開始月</b>には、いま表示している月が自動で入ります。そのままで構いません。<br><span style="color:#b45309;">※ 過去にもやっていたクラスを登録し直すときだけ、開始月を空欄にしてください。</span>')}
      ${step(4, '保存する', '出席名簿に空のクラスができ、「生徒を追加」できるようになります。')}

      <h4 style="font-size:0.9rem;margin:1.5rem 0 0.75rem;padding:0.35rem 0.7rem;background:#111;color:#fff;border-radius:4px;display:inline-block;">B. レッスンを差し替える・終わりにする</h4>

      <div style="background:#fef2f2;border-left:4px solid #dc2626;padding:0.75rem 1rem;border-radius:4px;margin-bottom:1rem;font-size:0.85rem;line-height:1.7;">
        <b>⚠️ 「削除」ボタンは使わないでください。</b><br>
        削除しても、名簿に生徒が残っているレッスンは<b>翌月以降も出席名簿に出続けます</b>。
        さらに削除時に聞かれる「名簿からも完全に削除しますか？」で「OK」を選ぶと、
        <b>過去の出席記録も CSV も見えなくなります</b>。
      </div>

      ${step(1, '終わりにするレッスンをクリックする', '週間時間割の色つきブロックをクリックすると編集画面が開きます。')}
      ${step(2, '「最終開催月」に最後に開催する月を入れる', '8月いっぱいで終わりなら <b>2026年08月</b> と入れます。<b>その月までは開催</b>され、翌月から消えます。')}
      ${step(3, '保存する', '翌月の画面からレッスンが消えます。生徒ひとりずつを退会にする必要は<b>ありません</b>。')}
      ${step(4, '差し替えなら、続けて新しいレッスンを追加する', '<b>◀ ▶</b> で翌月を表示してから「＋ レッスン追加」。上の A の手順どおりです。')}

      <div style="background:#f0fdf4;border-left:4px solid #16a34a;padding:0.75rem 1rem;border-radius:4px;margin:1rem 0 1.5rem;font-size:0.85rem;line-height:1.7;">
        <b>この方法だと過去は一切変わりません。</b><br>
        8月までの出席名簿・出席記録・CSV は、そのレッスンも生徒もそのまま残ります。
        月を戻せばいつでも見られます。消えるのは<b>翌月から先の表示だけ</b>です。
      </div>

      <h4 style="font-size:0.9rem;margin:1.5rem 0 0.75rem;padding:0.35rem 0.7rem;background:#111;color:#fff;border-radius:4px;display:inline-block;">C. やってはいけないこと</h4>
      <ul style="font-size:0.83rem;line-height:1.9;padding-left:1.2rem;margin:0 0 1.5rem;color:var(--text-secondary,#4b5563);">
        <li><b>レッスン名・講師名を後から書き換えない</b><br>
            出席記録は「曜日・場所・クラス名・生徒名」で保存されているため、名前を変えると過去の記録とのつながりが切れます。
            名前を変えたいときは <b>B の手順で終わりにして、新しい名前で追加</b>してください。</li>
        <li><b>「名簿からも完全に削除」を選ばない</b><br>
            過去の記録ごと消えます。</li>
        <li><b>休講の設定に注意</b><br>
            休講はレッスン名と会場で紐づいています。名前が1文字でも違うと、前のレッスンに入れた休講設定は引き継がれません。
            新しいレッスンには月間スケジュールから入れ直してください。</li>
      </ul>

      <h4 style="font-size:0.9rem;margin:1.5rem 0 0.75rem;padding:0.35rem 0.7rem;background:#111;color:#fff;border-radius:4px;display:inline-block;">D. 困ったとき</h4>
      <table style="width:100%;border-collapse:collapse;font-size:0.82rem;">
        <tr><th style="border:1px solid #ddd;padding:0.4rem 0.6rem;background:#f9fafb;text-align:left;width:38%;">起きたこと</th><th style="border:1px solid #ddd;padding:0.4rem 0.6rem;background:#f9fafb;text-align:left;">どうするか</th></tr>
        <tr><td style="border:1px solid #ddd;padding:0.4rem 0.6rem;">登録したはずのレッスンが見当たらない</td><td style="border:1px solid #ddd;padding:0.4rem 0.6rem;"><b>◀ ▶</b> で月を動かしてください。その月に開催されないレッスンは表示されません。黄色い帯が出ているときは、隠れているレッスンがあります。</td></tr>
        <tr><td style="border:1px solid #ddd;padding:0.4rem 0.6rem;">終わりにしたレッスンを直したい／戻したい</td><td style="border:1px solid #ddd;padding:0.4rem 0.6rem;">開催していた月（例: 8月）に戻ればクリックできます。最終開催月を消せば元どおり続きます。</td></tr>
        <tr><td style="border:1px solid #ddd;padding:0.4rem 0.6rem;">出席名簿にクラスが出ない</td><td style="border:1px solid #ddd;padding:0.4rem 0.6rem;">開始月がその月より後になっていないか確認してください。</td></tr>
        <tr><td style="border:1px solid #ddd;padding:0.4rem 0.6rem;">保存できない・警告が出る</td><td style="border:1px solid #ddd;padding:0.4rem 0.6rem;">画面上部に赤い警告が出ているときはデータを読み込めていません。<b>保存せずに</b>ページを再読み込み（Cmd+Shift+R）してください。</td></tr>
      </table>

      <div style="margin-top:1.25rem;padding-top:0.75rem;border-top:1px solid var(--border-color,#e5e7eb);font-size:0.78rem;color:var(--text-secondary,#6b7280);">
        開始月・最終開催月を空欄にしたレッスンは、これまでどおり全ての月に表示されます。以前から登録されているレッスンは空欄のままなので、触る必要はありません。
      </div>
    </div>
  `;
}

/**
 * Lesson add/edit form
 */
function renderLessonForm(app) {
  const day = app.editingLessonDay;
  const idx = app.editingLessonIndex;
  const ts = app.timeScheduleData || timeSchedule;
  const existing = idx !== null ? (ts[day] || [])[idx] : null;

  // Parse existing data
  let timeStart = '', timeEnd = '', venue = '', lessonName = '', instructor = '';
  // 開催期間。新規は「選択中の月から」を既定にする（過去月の名簿に空のクラスを出さないため）。
  // 既存エントリは持っていれば表示し、無ければ空＝常時開催のまま据え置く。
  let activeFrom = existing ? (existing.activeFrom || '') : (app.selectedMonth || '');
  let activeThrough = existing ? (existing.activeThrough || '') : '';
  if (existing) {
    const parts = existing.time.split('-');
    timeStart = parts[0]?.replace('〜', '').trim() || '';
    timeEnd = parts[1]?.trim() || '';
    venue = existing.venue || '';
    const nameMatch = existing.name.match(/^(.+?)\s+(SOYA|HARUHIKO|DAZU|AYANO|RYUSEI|AI|HIMEKA|SHIN|Key-lock|AYANO \/ HARUHIKO|AYANO HARUHIKO|.+)$/i);
    if (nameMatch) {
      lessonName = nameMatch[1].trim();
      instructor = nameMatch[2].trim();
    } else {
      lessonName = existing.name;
    }
  }

  const venues = ['天神BUZZ校 2スタジオ', '天神BUZZ校 5スタジオ', '天神BUZZ校 11スタジオ', '大橋校', '照葉校', '千早クラス', '九産大前スタジオ'];
  const days = ['月曜日', '火曜日', '水曜日', '木曜日', '金曜日'];

  return `
    <div id="lessonFormModal" class="content-card" style="margin-bottom:1rem;border:2px solid #3b82f6;">
      <div class="card-header" style="margin-bottom:1rem;padding-bottom:0.75rem;">
        <h3 class="card-title">${existing ? 'レッスン編集' : 'レッスン追加'}</h3>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;">
        <div>
          <label style="font-size:0.75rem;font-weight:600;color:#6b7280;">曜日</label>
          <select id="lessonDay" class="input" style="margin-top:0.25rem;" ${existing ? 'disabled' : ''}>
            ${days.map(d => `<option value="${d}" ${d === day ? 'selected' : ''}>${d}</option>`).join('')}
          </select>
          ${existing ? '<div style="font-size:0.7rem;color:#6b7280;margin-top:0.2rem;">曜日を変える場合は、いったん削除して追加し直してください</div>' : ''}
        </div>
        <div>
          <label style="font-size:0.75rem;font-weight:600;color:#6b7280;">スタジオ</label>
          <select id="lessonVenue" class="input" style="margin-top:0.25rem;">
            ${venues.map(v => `<option value="${v}" ${v === venue ? 'selected' : ''}>${v}</option>`).join('')}
          </select>
        </div>
        <div>
          <label style="font-size:0.75rem;font-weight:600;color:#6b7280;">開始時間</label>
          <input type="time" id="lessonTimeStart" class="input" value="${timeStart}" style="margin-top:0.25rem;">
        </div>
        <div>
          <label style="font-size:0.75rem;font-weight:600;color:#6b7280;">終了時間</label>
          <input type="time" id="lessonTimeEnd" class="input" value="${timeEnd}" style="margin-top:0.25rem;">
        </div>
        <div>
          <label style="font-size:0.75rem;font-weight:600;color:#6b7280;">レッスン名</label>
          <input type="text" id="lessonName" class="input" value="${lessonName}" placeholder="例: ブレイキン入門" style="margin-top:0.25rem;">
        </div>
        <div>
          <label style="font-size:0.75rem;font-weight:600;color:#6b7280;">講師名</label>
          <input type="text" id="lessonInstructor" class="input" value="${instructor}" placeholder="例: SOYA" style="margin-top:0.25rem;">
        </div>
        <div>
          <label style="font-size:0.75rem;font-weight:600;color:#6b7280;">開始月</label>
          <input type="month" id="lessonActiveFrom" class="input" value="${activeFrom}" style="margin-top:0.25rem;">
          <div style="font-size:0.7rem;color:#6b7280;margin-top:0.2rem;">この月から時間割・出席名簿・HOME に出ます。空欄なら全ての月に出ます${existing ? '' : '<br><b>過去に開催していたクラスを登録し直すときは空欄にしてください</b>'}</div>
        </div>
        <div>
          <label style="font-size:0.75rem;font-weight:600;color:#6b7280;">最終開催月（任意）</label>
          <input type="month" id="lessonActiveThrough" class="input" value="${activeThrough}" style="margin-top:0.25rem;">
          <div style="font-size:0.7rem;color:#6b7280;margin-top:0.2rem;">差し替え・終了するときに入れます。<b>その月まで</b>開催され、翌月から消えます</div>
        </div>
      </div>
      <div style="display:flex;gap:0.5rem;margin-top:1rem;justify-content:flex-end;">
        ${existing ? `<button class="btn btn-sm" style="background:#ef4444;color:white;" onclick="window.app.deleteLesson('${day}', ${idx})">削除</button>` : ''}
        <button class="btn btn-secondary btn-sm" onclick="window.app.cancelLessonForm()">キャンセル</button>
        <button class="btn btn-primary btn-sm" onclick="window.app.saveLessonForm()">保存</button>
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
function getLessonsForDate(date, calendarData, app) {
  const ts = (app && app.timeScheduleData) || timeSchedule;
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
  // その日が属する月で開催期間を判定する（app.selectedMonth ではなく date 由来）。
  // カレンダーは月末に翌月の日を並べることがあり、選択月で判定すると
  // 「差し替え前後の月をまたぐ週」で誤ったレッスンが出る。
  const _dateMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  const regularLessons = (ts[dayOfWeek] || [])
    .filter(cls => !cls.alias && isLessonActiveIn(cls, _dateMonth))
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
    const info = getLessonsForDate(selDateObj, calendarData, app);
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
          const info = isCurrentMonth ? getLessonsForDate(date, calendarData, app) : null;

          // Build lesson name badges
          let badges = '';
          if (isCurrentMonth && info) {
            if (info.holiday && !info.workshops.length) {
              badges = '<div class="cal-tag" style="background:#e5e7eb;color:#6b7280;">休校</div>';
            } else {
              // Active regular lessons as colored tags
              badges = info.lessons.filter(l => !l.cancelled).map(cls => {
                const shortName = cls.name.replace(/\s+(SOYA|HARUHIKO|DAZU|AYANO|RYUSEI|AI|HIMEKA|SHIN|Key-lock|AYANO \/ HARUHIKO|AYANO HARUHIKO).*/i, '').trim();
                const bg = getVenueColor(cls.venue);
                return `<div class="cal-tag" style="background:${bg};color:white;">${shortName}</div>`;
              }).join('');
              // Cancelled lessons with strikethrough
              badges += info.lessons.filter(l => l.cancelled).map(cls => {
                const shortName = cls.name.replace(/\s+(SOYA|HARUHIKO|DAZU|AYANO|RYUSEI|AI|HIMEKA|SHIN|Key-lock|AYANO \/ HARUHIKO|AYANO HARUHIKO).*/i, '').trim();
                return `<div class="cal-tag cal-tag-cancelled">${shortName}</div>`;
              }).join('');
              // Workshops in orange
              badges += (info.workshops || []).map(ws =>
                `<div class="cal-tag" style="background:#1d1d1f;color:white;">${ws.name}</div>`
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
