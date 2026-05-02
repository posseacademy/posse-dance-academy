// Imports
import { planOrder, defaultSchedule, timeSchedule, getEmptyCustomer, courseColors } from './config.js?v=16';
import * as db from './firebase-service.js?v=8';
import { calculateAge, sortStudentsByPlan, isRegularPlan, searchCustomerByName, exportCustomersCSV, getCustomerCourseKey } from './utils.js?v=16';
import { renderDashboard } from './views/home.js?v=26';
import { renderCustomers, renderAddForm, renderCustomerRow } from './views/customers.js?v=18';
import { renderAttendance, renderAttendanceRecord, renderPracticeSession, renderAddStudentForm, renderEventRecord } from './views/attendance.js?v=47';
import { renderTimeSchedule, renderMonthlySchedule } from './views/schedule.js?v=26';
import { exportCustomersCSV as exportCustomersCSVNew, exportAttendanceMonthlyCSV, exportAttendanceYearlyCSV } from './csv-export.js?v=18';

// ===== プラン⇔コース 双方向マップ（デュアルライト用） =====
const PLAN_TO_COURSE = {
    '１クラス':'１','1クラス':'１',
    '２クラス':'２','2クラス':'２',
    '３クラス':'３','3クラス':'３',
    '４クラス':'４','4クラス':'４',
    '1.5hクラス':'１'
};
const COURSE_TO_PLAN = {
    '１':'１クラス','1':'１クラス',
    '２':'２クラス','2':'２クラス',
    '３':'３クラス','3':'３クラス',
    '４':'４クラス','4':'４クラス'
};
/**
 * 顧客フォームの plan と course を相互同期（保存直前に呼ぶ）
 * - plan 入力あり → course を上書き同期
 * - course 入力あり & plan 未入力 → plan を補完
 * 既存データ破壊を避けるため、片方が明示的に入力されている場合のみ他方を更新。
 */
function syncPlanCourse(form) {
    if (!form) return;
    if (form.plan && PLAN_TO_COURSE[form.plan]) {
        form.course = PLAN_TO_COURSE[form.plan];
    } else if (form.course && COURSE_TO_PLAN[form.course] && !form.plan) {
        form.plan = COURSE_TO_PLAN[form.course];
    }
}

// 22:25バックアップ（2026-04-30）の schedule から、入会中レギュラー生徒のみ抽出した復元データ
// cleanupAutoAddedStudents の過剰削除で消えた生徒を init() 時に復元する
const RESTORE_SCHEDULE = {
    '月曜日': [
        { name: 'アクロバット SOYA', loc: '天神', students: [
            { lastName: '中島', firstName: '竜吾', plan: '４クラス' },
            { lastName: '伊藤', firstName: '和馬', plan: '３クラス' },
            { lastName: '四井', firstName: '陽音', plan: '３クラス' },
            { lastName: '津留', firstName: '創真', plan: '２クラス' },
            { lastName: '三重野', firstName: '琉生', plan: '３クラス' },
            { lastName: '嶋川', firstName: '陽大', plan: '３クラス' },
            { lastName: '堤', firstName: '勇仁', plan: '４クラス' },
            { lastName: '森山', firstName: '晴太', plan: 'ハーフ' },
            { lastName: '森田', firstName: '翔真', plan: '２クラス' },
            { lastName: '樋渡', firstName: '皓太', plan: '２クラス' },
            { lastName: '首藤', firstName: '壱咲', plan: '２クラス' },
        ]},
        { name: 'ブレイキン入門 SOYA', loc: '天神', students: [
            { lastName: '津留', firstName: '創真', plan: '２クラス' },
            { lastName: '樋渡', firstName: '皓太', plan: '２クラス' },
            { lastName: '榊', firstName: '花梨', plan: '２クラス' },
        ]},
        { name: 'トップロック フットワーク DAZ', loc: '天神', students: [
            { lastName: '中島', firstName: '竜吾', plan: '４クラス' },
            { lastName: '四井', firstName: '陽音', plan: '３クラス' },
            { lastName: '伊藤', firstName: '和馬', plan: '３クラス' },
            { lastName: '三重野', firstName: '琉生', plan: '３クラス' },
            { lastName: '戸田', firstName: '唯斗', plan: '1クラス' },
            { lastName: '森脇', firstName: '鳳仁', plan: '1クラス' },
            { lastName: '嶋川', firstName: '陽大', plan: '２クラス' },
            { lastName: '上田', firstName: '大空', plan: '２クラス' },
            { lastName: '堤', firstName: '勇仁', plan: '４クラス' },
            { lastName: '豊福', firstName: '悠成', plan: '４クラス' },
            { lastName: '首藤', firstName: '壱咲', plan: '２クラス' },
        ]},
        { name: 'K-POP AI', loc: '天神', students: [
            { lastName: '平嶋', firstName: '彩佳', plan: '1クラス' },
            { lastName: '杉村', firstName: '早紀', plan: '1クラス' },
            { lastName: '石原', firstName: '美黎', plan: '１クラス' },
        ]},
        { name: 'hiphop HIMEKA', loc: '大橋', students: [
            { lastName: '清水', firstName: 'くるみ', plan: '1クラス' },
        ]},
    ],
    '火曜日': [
        { name: 'キッズダンス AYANO', loc: '大橋', students: [
            { lastName: '古賀', firstName: '文人', plan: '1クラス' },
            { lastName: '古賀', firstName: '卯月妃', plan: '1クラス' },
            { lastName: '富井', firstName: '藍', plan: '1クラス' },
            { lastName: '小山', firstName: '泰成', plan: '１クラス' },
        ]},
        { name: 'ブレイキン入門 AYANO HARUHIKO', loc: '大橋', students: [
            { lastName: '一色', firstName: '六花', plan: '１クラス' },
            { lastName: '渡邉', firstName: '創太', plan: '３クラス' },
            { lastName: '榊', firstName: '花梨', plan: '２クラス' },
            { lastName: '渡邉', firstName: '絃志', plan: '１クラス' },
            { lastName: '一色', firstName: '湊', plan: '１クラス' },
        ]},
        { name: 'ブレイキン入門 SOYA', loc: '照葉', students: [
            { lastName: '西園', firstName: '千晃', plan: '1クラス' },
            { lastName: '上井', firstName: '凰資', plan: '１クラス' },
        ]},
        { name: 'アクロ＆パワー SOYA', loc: '照葉', students: [
            { lastName: '堤', firstName: '勇仁', plan: '４クラス' },
            { lastName: '工藤', firstName: '大地', plan: '１クラス' },
        ]},
    ],
    '水曜日': [
        { name: 'ブレイキン初級 HARUHIKO', loc: '天神', students: [
            { lastName: '吉田', firstName: '智幸', plan: '1クラス' },
            { lastName: '本橋', firstName: '廉士', plan: '1クラス' },
            { lastName: '新藤', firstName: '大希', plan: '1クラス' },
            { lastName: '荒巻', firstName: '大和', plan: '1クラス' },
        ]},
        { name: 'ブレイキン中上級 HARUHIKO', loc: '天神', students: [
            { lastName: '中山', firstName: '結愛', plan: '1クラス' },
            { lastName: '上田', firstName: '大空', plan: '２クラス' },
            { lastName: '中島', firstName: '竜吾', plan: '４クラス' },
        ]},
    ],
    '木曜日': [
        { name: 'ブレイキン入門 SOYA', loc: '大橋', students: [
            { lastName: '吉村', firstName: '太壱', plan: '２クラス' },
            { lastName: '池田', firstName: '全', plan: '1クラス' },
            { lastName: '澤江', firstName: '悠', plan: '1クラス' },
            { lastName: '渡邉', firstName: '創太', plan: '２クラス' },
            { lastName: '藤田', firstName: '将舞', plan: '２クラス' },
            { lastName: '藤田', firstName: '凌羽', plan: '２クラス' },
            { lastName: '小柳', firstName: '友陽', plan: '２クラス' },
            { lastName: '山下', firstName: '幸四郎', plan: '1クラス' },
        ]},
        { name: 'アクロ＆パワー SOYA', loc: '大橋', students: [
            { lastName: '中山', firstName: '結愛', plan: '２クラス' },
            { lastName: '豊福', firstName: '悠成', plan: '４クラス' },
            { lastName: '吉村', firstName: '太壱', plan: '２クラス' },
            { lastName: '四井', firstName: '陽音', plan: '２クラス' },
            { lastName: '渡邉', firstName: '創太', plan: '２クラス' },
            { lastName: '萩原', firstName: '聖香', plan: '1クラス' },
            { lastName: '小柳', firstName: '友陽', plan: '２クラス' },
            { lastName: '澤江', firstName: '悠', plan: '1クラス' },
        ]},
        { name: 'ブレイキン入門 RYUSEI', loc: '照葉', students: [
            { lastName: '梅野', firstName: '絢音', plan: '２クラス' },
            { lastName: '執行', firstName: '堂真', plan: '１クラス' },
            { lastName: '執行', firstName: '悠真', plan: '１クラス' },
        ]},
        { name: 'アクロ＆パワー RYUSEI', loc: '照葉', students: [
            { lastName: '梅野', firstName: '絢音', plan: '２クラス' },
        ]},
    ],
    '金曜日': [
        { name: 'アクロ＆パワー SOYA', loc: '天神', students: [
            { lastName: '中島', firstName: '竜吾', plan: '４クラス' },
            { lastName: '伊藤', firstName: '和馬', plan: '３クラス' },
            { lastName: '三重野', firstName: '琉生', plan: '３クラス' },
            { lastName: '横山', firstName: '悠芽', plan: '２クラス' },
            { lastName: '豊福', firstName: '悠成', plan: '４クラス' },
        ]},
        { name: 'ブレイキン初中級 HARUHIKO', loc: '天神', students: [
            { lastName: '三重野', firstName: '琉生', plan: '３クラス' },
            { lastName: '横山', firstName: '悠芽', plan: '２クラス' },
        ]},
        { name: 'ブレイキン入門 HARUHIKO', loc: '大橋', students: [
            { lastName: '萩尾', firstName: '郁海', plan: '２クラス' },
            { lastName: '矢野', firstName: '新', plan: '1クラス' },
            { lastName: '伊豆永', firstName: '晄逢', plan: '２クラス' },
            { lastName: '藤川', firstName: '悠利', plan: '２クラス' },
            { lastName: '藤川', firstName: '柊利', plan: '２クラス' },
            { lastName: '久保田', firstName: '朱里', plan: '２クラス' },
        ]},
        { name: 'アクロ＆パワー RYUSEI', loc: '大橋', students: [
            { lastName: '萩尾', firstName: '郁海', plan: '２クラス' },
            { lastName: '藤川', firstName: '悠利', plan: '２クラス' },
            { lastName: '藤川', firstName: '柊利', plan: '２クラス' },
        ]},
    ],
};

class DanceStudioApp {
    constructor() {
        // Navigation & UI State
        this.currentTab = 'home';
        this.statusFilter = '入会中';
        this.customers = [];
        this.editingId = null;
        this.editForm = {};
        this.viewingCustomerId = null;
        this.showAddForm = false;
        this.searchTerm = '';
        this.sortField = 'memberNumber';
        this.sortOrder = 'asc';
        this.newCustomer = getEmptyCustomer();

        // Attendance
        this.attendanceSubtab = '出席記録';
        this.selectedMonth = new Date().toISOString().slice(0, 7);
        this.selectedDay = '月曜日';
        this.attendanceData = {};
        this.eventsData = {};
        this.showAddEventForm = false;
        this.addingParticipantToEvent = null;
        this.editingEventId = null;
        this.editingParticipantIndex = null;
        this.showAddStudentForm = false;
        this.selectedClassForAdd = null;
        this.isLoading = false;
        this.editingStudent = null;
        this.studentSearchTerm = '';
        this.studentSearchResults = [];
        this.selectedCustomerForStudent = null;

        // Config references
        this.planOrder = planOrder;
        this.courseColors = courseColors;
        this.scheduleData = JSON.parse(JSON.stringify(defaultSchedule));
        this.timeScheduleData = JSON.parse(JSON.stringify(timeSchedule));
        this.editingLessonDay = null;
        this.editingLessonIndex = null;

        // Calendar
        this.calendarData = {};
        this.selectedCalendarDate = null;
    }

    // ===== INITIALIZATION =====
    async init() {
        // Restore navigation state from URL hash (e.g. #attendance/出席記録/水曜日)
        this.restoreFromHash();

        // Load data with 15s timeout to prevent infinite loading
        const withTimeout = (promise, ms = 15000) =>
            Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))]);

        try {
            const results = await Promise.allSettled([
                withTimeout(db.loadCustomers()),
                withTimeout(db.loadScheduleData(this.scheduleData)),
                withTimeout(db.loadAttendance(this.selectedMonth)),
                withTimeout(db.loadEvents(this.selectedMonth)),
                withTimeout(db.loadCalendarData(this.selectedMonth)),
                withTimeout(db.loadTimeSchedule(this.timeScheduleData))
            ]);
            if (results[0].status === 'fulfilled') this.customers = results[0].value;
            if (results[1].status === 'fulfilled' && results[1].value) this.scheduleData = results[1].value;
            if (results[2].status === 'fulfilled') this.attendanceData = results[2].value;
            if (results[3].status === 'fulfilled') this.eventsData = results[3].value;
            if (results[4].status === 'fulfilled') this.calendarData = results[4].value;
            if (results[5].status === 'fulfilled' && results[5].value) this.timeScheduleData = results[5].value;
        } catch (error) {
            console.error('初期化エラー:', error);
        }

        // cleanupVisitorsFromSchedule は破壊的書き込みでデータ消失を引き起こしたため削除済み
        // ビジター/初回プランは renderAttendanceRecord() が attendance から表示マージする

        // disabled (2026-05-01): migrateOrphanRegulars が退会済み顧客を含む過去生徒を復活させるバグのため停止
        // try { await this.migrateOrphanRegulars(this.selectedMonth); } catch(e) { console.error('migrateOrphanRegulars error:', e); }

        // 一回限りクリーンアップ: migrateOrphanRegulars が誤追加した生徒（enrolledFrom < '2026-04'）を schedule から除去
        try { await this.cleanupAutoAddedStudents(); } catch(e) { console.error('cleanupAutoAddedStudents error:', e); }

        // 一回限り正規化: 過去スキーマ移行残骸 (plan=null + course=数字) の顧客 plan を補完
        try { await this.syncPlanFromCourseOnce(); } catch(e) { console.error('syncPlanFromCourseOnce error:', e); }

        // 一回限り復元: cleanup 過剰削除で消えた入会中レギュラー生徒を schedule に戻す
        try { await this.restoreRegularStudentsOnce(); } catch(e) { console.error('restoreRegularStudentsOnce error:', e); }

        // 一回限り場所移行: 5月以降の場所変更を schedule + timeSchedule に適用（過去月キーは保全）
        try { await this.applyLocationMigrationOnce(); } catch(e) { console.error('applyLocationMigrationOnce error:', e); }

        // 一回限り同期: schedule/attendance の plan スナップショットを customer.plan に揃える
        try { await this.syncSnapshotsToCustomerPlanOnce(); } catch(e) { console.error('syncSnapshotsToCustomerPlanOnce error:', e); }

        // 月別プランスナップショット初期化
        try { await this.ensureMonthlyPlanSnapshot(); } catch(e) { console.error('スナップショットエラー:', e); }

        this.render();
    }

    // Save current navigation state to URL hash
    updateHash() {
        let hash = this.currentTab;
        if (this.currentTab === 'attendance') {
            hash += '/' + encodeURIComponent(this.attendanceSubtab || '出席記録');
            if (this.attendanceSubtab === '出席記録') {
                hash += '/' + encodeURIComponent(this.selectedDay || '月曜日');
            }
        }
        const newHash = '#' + hash;
        if (window.location.hash !== newHash) {
            history.replaceState(null, '', newHash);
        }
    }

    // Restore navigation state from URL hash
    restoreFromHash() {
        const hash = decodeURIComponent(window.location.hash.slice(1));
        if (!hash) return;
        const parts = hash.split('/');
        const validTabs = ['home', 'customers', 'attendance', 'timeSchedule', 'monthlySchedule'];
        if (validTabs.includes(parts[0])) {
            this.currentTab = parts[0];
        }
        if (parts[0] === 'attendance') {
            if (parts[1]) this.attendanceSubtab = parts[1];
            if (parts[2]) this.selectedDay = parts[2];
        }
    }

    // Non-regular students are now filtered by attendance data in renderAttendanceRecord()
    // No cleanup needed — visitors only show for months where they have attendance records
    cleanupNonRegularStudents() {
        // No-op: display filtering replaces destructive cleanup
    }

    // 前月の出席記録から、scheduleData にいないレギュラー生徒（出席記録あり）を補完
    // 過去のコード/操作で scheduleData から消えた孤立データを回復する
    async migrateOrphanRegulars(targetMonth) {
        if (!targetMonth) return 0;
        const [y, m] = targetMonth.split('-').map(Number);
        let py = y, pm = m - 1;
        if (pm < 1) { pm = 12; py--; }
        const prevYM = `${py}-${String(pm).padStart(2, '0')}`;

        let prev;
        try { prev = await db.loadAttendance(prevYM); } catch (e) { return 0; }
        if (!prev || Object.keys(prev).length === 0) return 0;

        const normLoc = (loc) => (loc || '').replace(/校$/, '');
        let added = 0;

        Object.entries(prev).forEach(([key, rec]) => {
            if (!rec || typeof rec !== 'object') return;
            const p = rec._plan;
            if (!p || !isRegularPlan(p)) return;
            const hasMark = ['week1','week2','week3','week4','week5'].some(w => ['○','×','休講'].includes(rec[w]));
            if (!hasMark) return;

            const firstUs = key.indexOf('_');
            if (firstUs < 0) return;
            const day = key.slice(0, firstUs);
            if (!this.scheduleData[day]) return;

            const remainder = key.slice(firstUs + 1);
            let matched = null;
            for (const cls of this.scheduleData[day]) {
                const loc = cls.location || cls.venue || '';
                const prefix = `${loc}_${cls.name}_`;
                if (remainder.startsWith(prefix)) {
                    matched = { cls, fullName: remainder.slice(prefix.length) };
                    break;
                }
            }
            if (!matched) return;

            const exists = (matched.cls.students || []).some(s =>
                ((s.lastName || '') + (s.firstName || '')) === matched.fullName
            );
            if (exists) return;

            const customer = (this.customers || []).find(c =>
                ((c.lastName || '') + (c.firstName || '')) === matched.fullName
            );
            const lastName = customer?.lastName || '';
            const firstName = customer?.firstName || matched.fullName;

            matched.cls.students = matched.cls.students || [];
            matched.cls.students.push({ lastName, firstName, plan: p, enrolledFrom: prevYM });
            added++;
        });

        if (added > 0) {
            await db.saveScheduleData(this.scheduleData);
            console.log(`migrateOrphanRegulars: ${added}名を ${prevYM} の記録から名簿に補完`);
        }
        return added;
    }

    // 一回限りクリーンアップ: schedule に紛れ込んだ phantom 生徒を除去
    // 削除条件（OR）:
    //   A. enrolledFrom < '2026-04' → migrateOrphanRegulars 由来（enrolledFrom 機能は 2026-05-01 追加）
    //   B. customer.status === '退会済み' → 退会済みなのに schedule に残留
    //   C. customers にレコード無し AND 参照月マーク無し → 真の phantom（ひらがな重複登録など）
    //   D. 参照月マーク全0件 AND 参照月以降に登録された生徒ではない（過去レッスン受講者で現在は受けていない）
    //      参照月 = 直近の完了月（今日の前月）。selectedMonth に依存しない。
    // saveNewStudent/saveEditStudent 経由の正規追加（customer から選択）は customer に必ず存在するため保持
    async cleanupAutoAddedStudents() {
        let removedCount = 0;
        const removed = [];
        let scheduleChanged = false;

        // customers インデックス
        const custByName = new Map();
        for (const c of (this.customers || [])) {
            const fn = (c.lastName || '') + (c.firstName || '');
            custByName.set(fn, c);
        }

        // 参照月: 直近の完了月（今日の前月）。selectedMonth に依存しない。
        const today = new Date();
        const refDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const referenceMonth = `${refDate.getFullYear()}-${String(refDate.getMonth() + 1).padStart(2, '0')}`;

        // 参照月の attendance を直接ロード（this.attendanceData は selectedMonth 依存なので使わない）
        let refAttendance = {};
        try {
            refAttendance = await db.loadAttendance(referenceMonth);
        } catch (e) {
            console.warn('cleanupAutoAddedStudents: 参照月データ取得失敗', e);
        }

        const markedKeys = new Set();
        for (const [key, rec] of Object.entries(refAttendance || {})) {
            if (!rec || typeof rec !== 'object') continue;
            const hasMark = ['week1','week2','week3','week4','week5'].some(w => ['○','×','休講'].includes(rec[w]));
            if (hasMark) markedKeys.add(key);
        }

        for (const day of Object.keys(this.scheduleData)) {
            const classes = this.scheduleData[day];
            if (!Array.isArray(classes)) continue;
            for (const cls of classes) {
                if (!Array.isArray(cls.students)) continue;
                const before = cls.students.length;
                // 参照月時点での実効場所を解決（locationFrom 以前は prevLocation を使う）
                const refLoc = (cls.locationFrom && cls.prevLocation && referenceMonth < cls.locationFrom)
                    ? cls.prevLocation
                    : (cls.location || cls.venue || '');
                cls.students = cls.students.filter(s => {
                    const fn = (s.lastName || '') + (s.firstName || '');
                    const cust = custByName.get(fn);
                    const studentKey = `${day}_${refLoc}_${cls.name}_${fn}`;
                    const hasMarks = markedKeys.has(studentKey);
                    const isRecentlyAdded = s.enrolledFrom && s.enrolledFrom > referenceMonth;

                    // A: enrolledFrom < 2026-04 (migrateOrphanRegulars 由来)
                    if (s.enrolledFrom && s.enrolledFrom < '2026-04') {
                        removed.push(`${day}/${cls.name}: ${fn} (${s.plan}) reason=A:enrolledFrom<2026-04(${s.enrolledFrom})`);
                        removedCount++;
                        return false;
                    }
                    // B: 退会済み顧客
                    if (cust && cust.status === '退会済み') {
                        removed.push(`${day}/${cls.name}: ${fn} (${s.plan}) reason=B:退会済み`);
                        removedCount++;
                        return false;
                    }
                    // C: 顧客無し + 参照月マーク無し
                    if (!cust && !hasMarks) {
                        removed.push(`${day}/${cls.name}: ${fn} (${s.plan}) reason=C:no_customer+no_marks`);
                        removedCount++;
                        return false;
                    }
                    // D: 参照月マーク無し + 参照月より後に登録されていない + 顧客が休会中/退会済み
                    //    入会中の顧客は出席マークが無くても保持（5月以降の登録を保護）
                    if (!hasMarks && !isRecentlyAdded && cust && (cust.status === '休会中' || cust.status === '退会済み')) {
                        removed.push(`${day}/${cls.name}: ${fn} (${s.plan}) reason=D:${cust.status}+no_${referenceMonth}_marks`);
                        removedCount++;
                        return false;
                    }
                    return true;
                });
                if (cls.students.length !== before) scheduleChanged = true;
            }
        }

        if (scheduleChanged) {
            await db.saveScheduleData(this.scheduleData);
            console.log(`✓ cleanupAutoAddedStudents: ${removedCount}名を schedule から削除 (refMonth=${referenceMonth})`, removed);
        } else {
            console.log(`✓ cleanupAutoAddedStudents: 削除対象なし (refMonth=${referenceMonth})`);
        }
        return removedCount;
    }

    // 一回限り正規化: plan=null + course のレガシー顧客に対して plan を course から補完
    // 既存スキーマで customer.plan と customer.course は常に同じ意味を表すべきだが、
    // 過去の入力で plan が空のまま course だけ設定された顧客が大量に存在し、
    // HOME プラン別内訳の集計から漏れていた。これを一括補完する。
    // 自然な idempotency: c.plan が既に設定済みなら次回以降スキップ
    async syncPlanFromCourseOnce() {
        const COURSE_TO_PLAN = {
            '1':'１クラス','2':'２クラス','3':'３クラス','4':'４クラス',
            '１':'１クラス','２':'２クラス','３':'３クラス','４':'４クラス',
        };
        let updated = 0;
        const updatedList = [];
        for (const c of (this.customers || [])) {
            if (c.plan) continue;                          // plan 既設定はスキップ
            let planFromCourse = COURSE_TO_PLAN[c.course];
            // ビジター: status=入会中 なら ビジター（会員）として補完
            if (!planFromCourse && c.course === 'ビジター' && c.status === '入会中') {
                planFromCourse = 'ビジター（会員）';
            }
            if (!planFromCourse) continue;                 // ハーフ/未設定はスキップ
            c.plan = planFromCourse;
            try {
                await db.updateCustomer(c.id, { plan: planFromCourse });
                updated++;
                updatedList.push(`${c.lastName}${c.firstName}: course=${c.course} → plan=${planFromCourse}`);
            } catch (e) {
                console.error(`syncPlanFromCourseOnce: ${c.lastName}${c.firstName} 更新失敗`, e);
            }
        }
        if (updated > 0) {
            console.log(`✓ syncPlanFromCourseOnce: ${updated}名 の plan を course から補完`, updatedList);
        } else {
            console.log(`✓ syncPlanFromCourseOnce: 補完対象なし`);
        }
        return updated;
    }

    // 一回限り復元: cleanupAutoAddedStudents の過剰削除で消えたレギュラー生徒を schedule に戻す
    // RESTORE_SCHEDULE 定数 (22:25バックアップ抽出) と現 scheduleData を照合し、
    // 復元データに居て scheduleData に居ない 入会中レギュラー のみ追加する。
    // 自然な idempotency: 既に居れば skip → 二回目以降は no-op
    // 安全策:
    //   - 入会中 顧客のみ復元（退会済み/休会中/customer 未登録は対象外）
    //   - 既存生徒には触らない
    //   - location 比較は normLoc で末尾「校」除去
    async restoreRegularStudentsOnce() {
        const custByName = new Map();
        for (const c of (this.customers || [])) {
            const fn = (c.lastName || '') + (c.firstName || '');
            custByName.set(fn, c);
        }
        const normLoc = (loc) => (loc || '').replace(/校$/, '');

        let added = 0;
        let scheduleChanged = false;
        const log = [];

        for (const [day, restoreClasses] of Object.entries(RESTORE_SCHEDULE)) {
            const dayClasses = this.scheduleData[day];
            if (!Array.isArray(dayClasses)) continue;
            for (const restoreCls of restoreClasses) {
                // schedule から該当クラスを探す（name + location 一致）
                const targetCls = dayClasses.find(c =>
                    c.name === restoreCls.name &&
                    normLoc(c.location || c.venue || '') === normLoc(restoreCls.loc)
                );
                if (!targetCls) continue;
                targetCls.students = targetCls.students || [];

                for (const s of restoreCls.students) {
                    const fn = (s.lastName || '') + (s.firstName || '');
                    // 既に居れば skip
                    const exists = targetCls.students.some(x =>
                        ((x.lastName || '') + (x.firstName || '')) === fn
                    );
                    if (exists) continue;
                    // 顧客マスター存在 + 入会中 のみ復元
                    const cust = custByName.get(fn);
                    if (!cust || cust.status !== '入会中') continue;
                    // customer.plan を優先（一貫性確保）、無ければ復元データの plan
                    const plan = cust.plan || s.plan;
                    targetCls.students.push({
                        lastName: s.lastName,
                        firstName: s.firstName,
                        plan,
                    });
                    log.push(`${day}/${targetCls.name} ${fn} (${plan})`);
                    added++;
                    scheduleChanged = true;
                }
            }
        }

        if (scheduleChanged) {
            await db.saveScheduleData(this.scheduleData);
            console.log(`✓ restoreRegularStudentsOnce: ${added}名を schedule に復元`, log);
        } else {
            console.log(`✓ restoreRegularStudentsOnce: 復元対象なし`);
        }
        return added;
    }

    // 一回限り場所移行: 5月以降の場所変更を schedule + timeSchedule に適用
    // 過去月の attendance キー (_照葉_) は保全。effectiveLocation() ヘルパーが
    // selectedMonth に応じて旧/新場所を切り替えて表示・キー検索する。
    // 堅牢: location/prevLocation/locationFrom の3フィールドが常に整合するよう毎回チェック
    // （部分的に不整合な状態を自動修復）
    async applyLocationMigrationOnce() {
        const MIGRATIONS = [
            { day: '火曜日', name: 'ブレイキン入門 SOYA',   oldLoc: '照葉', newLoc: '千早',   from: '2026-05' },
            { day: '火曜日', name: 'アクロ＆パワー SOYA',   oldLoc: '照葉', newLoc: '千早',   from: '2026-05' },
            { day: '木曜日', name: 'ブレイキン入門 RYUSEI', oldLoc: '照葉', newLoc: '九産大前', from: '2026-05' },
            { day: '木曜日', name: 'アクロ＆パワー RYUSEI', oldLoc: '照葉', newLoc: '九産大前', from: '2026-05' },
        ];
        let scheduleChanged = false;
        const tsChangedDays = new Set();
        const log = [];

        for (const mig of MIGRATIONS) {
            // 1. scheduleData の3フィールド整合チェック
            const dayClasses = this.scheduleData[mig.day];
            if (Array.isArray(dayClasses)) {
                const cls = dayClasses.find(c => c.name === mig.name);
                if (cls) {
                    let fieldsChanged = false;
                    if (cls.location !== mig.newLoc) {
                        cls.location = mig.newLoc;
                        fieldsChanged = true;
                    }
                    if (cls.prevLocation !== mig.oldLoc) {
                        cls.prevLocation = mig.oldLoc;
                        fieldsChanged = true;
                    }
                    if (cls.locationFrom !== mig.from) {
                        cls.locationFrom = mig.from;
                        fieldsChanged = true;
                    }
                    if (fieldsChanged) {
                        log.push(`schedule ${mig.day}/${mig.name}: location=${mig.newLoc} prevLocation=${mig.oldLoc} locationFrom=${mig.from}`);
                        scheduleChanged = true;
                    }
                }
            }
            // 2. timeSchedule 更新（venue が old のまま残っていれば new に書き換え）
            const tsLessons = this.timeScheduleData[mig.day];
            if (Array.isArray(tsLessons)) {
                for (const lesson of tsLessons) {
                    if (lesson.name === mig.name) {
                        const v = (lesson.venue || '').replace(/校$/, '');
                        if (v === mig.oldLoc) {
                            lesson.venue = mig.newLoc;
                            log.push(`timeSchedule ${mig.day}/${mig.name}: venue ${mig.oldLoc} → ${mig.newLoc}`);
                            tsChangedDays.add(mig.day);
                        }
                    }
                }
            }
        }

        if (scheduleChanged) await db.saveScheduleData(this.scheduleData);
        for (const day of tsChangedDays) {
            try {
                await db.saveTimeScheduleDay(day, this.timeScheduleData[day]);
            } catch (e) {
                console.error(`applyLocationMigrationOnce: timeSchedule ${day} 保存失敗`, e);
            }
        }

        if (log.length > 0) {
            console.log(`✓ applyLocationMigrationOnce: ${log.length}件適用`, log);
        } else {
            console.log(`✓ applyLocationMigrationOnce: 適用済み（全フィールド整合）`);
        }

        // 診断ログ: 移行対象クラスの実際の状態を出力
        for (const mig of MIGRATIONS) {
            const cls = (this.scheduleData[mig.day] || []).find(c => c.name === mig.name);
            if (cls) {
                console.log(`  [${mig.day}/${mig.name}] location=${cls.location} prevLocation=${cls.prevLocation} locationFrom=${cls.locationFrom}`);
            } else {
                console.warn(`  [${mig.day}/${mig.name}] schedule に存在しません`);
            }
        }
    }

    // 同期: schedule.students[].plan と 当月以降の attendance._plan を customer.plan に揃える
    //
    // 設計方針 (2026-05-01 改定):
    //   - 過去月の attendance._plan は絶対に変更しない（履歴保全）
    //   - 当月（今日が属する月）以降のみ customer.plan に同期
    //   - schedule は全月共通の現在の名簿として常に最新化（個別月の履歴とは独立）
    //   - 顧客プラン変更時 (syncPlanToCurrentMonth) も同様に過去月は触らない
    //
    // 自然な idempotency: 値が一致する行はスキップ。
    // 安全策: レギュラー↔レギュラーの同期のみ。ビジター/ハーフは触らない。
    async syncSnapshotsToCustomerPlanOnce() {
        const custByName = new Map();
        for (const c of (this.customers || [])) {
            const fn = (c.lastName || '') + (c.firstName || '');
            custByName.set(fn, c);
        }

        let scheduleChanged = false;
        let attChanged = 0;
        const log = [];

        // 1. scheduleData[day][cls].students[].plan を customer.plan に同期（全月共通の現在状態）
        for (const day of Object.keys(this.scheduleData)) {
            const classes = this.scheduleData[day];
            if (!Array.isArray(classes)) continue;
            for (const cls of classes) {
                for (const s of (cls.students || [])) {
                    const fn = (s.lastName || '') + (s.firstName || '');
                    const cust = custByName.get(fn);
                    if (!cust || !cust.plan) continue;
                    if (!isRegularPlan(s.plan) || !isRegularPlan(cust.plan)) continue;
                    if (s.plan === cust.plan) continue;
                    log.push(`schedule ${day}/${cls.name} ${fn}: ${s.plan} → ${cust.plan}`);
                    s.plan = cust.plan;
                    scheduleChanged = true;
                }
            }
        }
        if (scheduleChanged) await db.saveScheduleData(this.scheduleData);

        // 2. 当月以降 attendance._plan を customer.plan に同期（過去月は触らない）
        //    対象月: 今日が属する月 〜 今日+6ヶ月
        const months = [];
        const today = new Date();
        const startY = today.getFullYear();
        const startM = today.getMonth() + 1;
        let y = startY, m = startM;
        for (let i = 0; i < 7; i++) {
            months.push(`${y}-${String(m).padStart(2, '0')}`);
            m++;
            if (m > 12) { m = 1; y++; }
        }

        for (const month of months) {
            let attData = {};
            try {
                attData = await db.loadAttendance(month);
            } catch (e) {
                continue;
            }
            if (!attData || Object.keys(attData).length === 0) continue;

            for (const [key, data] of Object.entries(attData)) {
                if (!data || typeof data !== 'object') continue;
                const att_plan = data._plan;
                if (!att_plan || !isRegularPlan(att_plan)) continue;
                const parts = key.split('_');
                if (parts.length < 4) continue;
                const fn = parts[parts.length - 1];
                const cust = custByName.get(fn);
                if (!cust || !cust.plan) continue;
                if (!isRegularPlan(cust.plan)) continue;
                if (att_plan === cust.plan) continue;
                log.push(`attendance ${month} ${key}: ${att_plan} → ${cust.plan}`);
                data._plan = cust.plan;
                try {
                    await db.saveAttendance(month, key, data);
                    attChanged++;
                } catch (e) {
                    console.error(`syncSnapshotsToCustomerPlanOnce: ${month}/${key} 更新失敗`, e);
                }
            }
        }

        // 3. 当月 this.attendanceData が現在月であれば in-memory も同期して画面再描画に反映
        const currentRealMonth = months[0];
        if (this.selectedMonth >= currentRealMonth) {
            for (const [key, data] of Object.entries(this.attendanceData || {})) {
                if (!data || typeof data !== 'object') continue;
                const att_plan = data._plan;
                if (!att_plan || !isRegularPlan(att_plan)) continue;
                const parts = key.split('_');
                if (parts.length < 4) continue;
                const fn = parts[parts.length - 1];
                const cust = custByName.get(fn);
                if (!cust || !cust.plan) continue;
                if (!isRegularPlan(cust.plan)) continue;
                if (att_plan !== cust.plan) data._plan = cust.plan;
            }
        }

        if (log.length > 0) {
            console.log(`✓ syncSnapshotsToCustomerPlanOnce: schedule=${scheduleChanged ? '更新' : '-'} attendance=${attChanged}件 (当月以降${months.length}ヶ月)`, log);
        } else {
            console.log(`✓ syncSnapshotsToCustomerPlanOnce: 同期対象なし (当月以降${months.length}ヶ月)`);
        }
        return { scheduleChanged, attChanged };
    }


    // ===== PLAN MANAGEMENT =====
    // 顧客のプラン変更を当月のattendance + scheduleに同期
    async syncPlanToCurrentMonth(customer) {
        const fullName = `${customer.lastName}${customer.firstName}`;
        const newPlan = customer.plan;
        if (!newPlan) return;

        // 1. scheduleの全曜日で該当生徒のplanを更新
        let scheduleChanged = false;
        for (const day of Object.keys(this.scheduleData)) {
            const classes = this.scheduleData[day];
            if (!Array.isArray(classes)) continue;
            for (const cls of classes) {
                for (const student of (cls.students || [])) {
                    if (`${student.lastName}${student.firstName}` === fullName && isRegularPlan(student.plan)) {
                        student.plan = newPlan;
                        scheduleChanged = true;
                    }
                }
            }
        }
        if (scheduleChanged) {
            await db.saveScheduleData(this.scheduleData);
        }

        // 2. attendance は selectedMonth が今日の月以降のときのみ更新（過去月の履歴保全）
        const today = new Date();
        const currentRealMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
        if (this.selectedMonth >= currentRealMonth) {
            for (const [key, data] of Object.entries(this.attendanceData)) {
                if (key.endsWith(`_${fullName}`)) {
                    data._plan = newPlan;
                    await db.saveAttendance(this.selectedMonth, key, data);
                }
            }
        } else {
            console.log(`syncPlanToCurrentMonth: 過去月 (${this.selectedMonth}) のため attendance は更新しない`);
        }
    }

    // 新月アクセス時にcustomers.planをattendance._planにスナップショット保存
    async ensureMonthlyPlanSnapshot() {
        // レギュラー生徒で_planが1つでもあれば初期化済みとみなす
        const hasAnyRegularPlan = Object.values(this.attendanceData).some(d =>
            d._plan && isRegularPlan(d._plan)
        );
        if (hasAnyRegularPlan) return;

        // scheduleの全生徒について、customers.planまたはschedule.planをattendanceに記録
        for (const day of Object.keys(this.scheduleData)) {
            const classes = this.scheduleData[day];
            if (!Array.isArray(classes)) continue;
            for (const cls of classes) {
                for (const student of (cls.students || [])) {
                    if (!isRegularPlan(student.plan)) continue;
                    const fullName = `${student.lastName}${student.firstName}`;
                    const loc = cls.location || cls.venue || '';
                    const studentKey = `${day}_${loc}_${cls.name}_${fullName}`;

                    // 既存の_planがあればスキップ
                    if (this.attendanceData[studentKey]?._plan) continue;

                    // customers.planを優先、なければschedule.planを使用
                    const customer = this.customers.find(c =>
                        `${c.lastName}${c.firstName}` === fullName
                    );
                    const plan = customer?.plan || student.plan;

                    if (!this.attendanceData[studentKey]) {
                        this.attendanceData[studentKey] = {};
                    }
                    this.attendanceData[studentKey]._plan = plan;
                    await db.saveAttendance(this.selectedMonth, studentKey, this.attendanceData[studentKey]);
                }
            }
        }
    }

    // ===== LESSON MANAGEMENT (TimeSchedule CRUD) =====
    getVenueColor(venue) {
        if (venue.includes('天神')) return '#3b82f6';
        if (venue.includes('大橋')) return '#ef4444';
        if (venue.includes('照葉')) return '#10b981';
        if (venue.includes('千早')) return '#8b5cf6';
        if (venue.includes('九産大前')) return '#f59e0b';
        return '#6b7280';
    }

    showLessonForm(day, index = null) {
        this.editingLessonDay = day;
        this.editingLessonIndex = index;
        this.render();
        // Scroll to form
        setTimeout(() => document.getElementById('lessonFormModal')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
    }

    cancelLessonForm() {
        this.editingLessonDay = null;
        this.editingLessonIndex = null;
        this.render();
    }

    async saveLessonForm() {
        const day = document.getElementById('lessonDay')?.value || this.editingLessonDay;
        const timeStart = document.getElementById('lessonTimeStart')?.value;
        const timeEnd = document.getElementById('lessonTimeEnd')?.value;
        const venue = document.getElementById('lessonVenue')?.value;
        const lessonName = document.getElementById('lessonName')?.value?.trim();
        const instructor = document.getElementById('lessonInstructor')?.value?.trim();

        if (!day || !timeStart || !timeEnd || !venue || !lessonName || !instructor) {
            alert('全ての項目を入力してください');
            return;
        }

        const fullName = `${lessonName} ${instructor}`;
        const time = `${timeStart}-${timeEnd}`;
        const color = this.getVenueColor(venue);
        const lessonData = { time, venue, name: fullName, color };

        if (!this.timeScheduleData[day]) this.timeScheduleData[day] = [];

        if (this.editingLessonIndex !== null) {
            // Edit existing
            const old = this.timeScheduleData[day][this.editingLessonIndex];
            this.timeScheduleData[day][this.editingLessonIndex] = lessonData;
            // Update scheduleData class name/location if changed
            if (old && this.scheduleData[day]) {
                const clsIdx = this.scheduleData[day].findIndex(c => c.name === old.name);
                if (clsIdx !== -1) {
                    this.scheduleData[day][clsIdx].name = fullName;
                    this.scheduleData[day][clsIdx].location = venue.replace(/校$|スタジオ$|クラス$/, '').trim();
                }
            }
        } else {
            // Add new
            this.timeScheduleData[day].push(lessonData);
            // Auto-create class in scheduleData for attendance
            if (!this.scheduleData[day]) this.scheduleData[day] = [];
            const exists = this.scheduleData[day].some(c => c.name === fullName);
            if (!exists) {
                this.scheduleData[day].push({
                    location: venue.replace(/校$|スタジオ$|クラス$/, '').trim(),
                    name: fullName,
                    students: []
                });
            }
        }

        try {
            await db.saveTimeScheduleDay(day, this.timeScheduleData[day]);
            await db.saveScheduleData(this.scheduleData);
        } catch (e) {
            console.error('レッスン保存エラー:', e);
            alert('保存に失敗しました');
        }

        this.editingLessonDay = null;
        this.editingLessonIndex = null;
        this.render();
    }

    async deleteLesson(day, index) {
        const lesson = this.timeScheduleData[day]?.[index];
        if (!lesson) return;

        // Check for students
        const cls = this.scheduleData[day]?.find(c => c.name === lesson.name);
        const studentCount = cls?.students?.length || 0;
        const msg = studentCount > 0
            ? `「${lesson.name}」を削除しますか？\n（${studentCount}名の生徒が登録されています）`
            : `「${lesson.name}」を削除しますか？`;
        if (!confirm(msg)) return;

        this.timeScheduleData[day].splice(index, 1);
        // Remove from scheduleData too
        if (this.scheduleData[day]) {
            this.scheduleData[day] = this.scheduleData[day].filter(c => c.name !== lesson.name);
        }

        try {
            await db.saveTimeScheduleDay(day, this.timeScheduleData[day]);
            await db.saveScheduleData(this.scheduleData);
        } catch (e) {
            console.error('レッスン削除エラー:', e);
        }
        this.render();
    }

    // ===== CUSTOMER MANAGEMENT =====
    getFilteredCustomers() {
        const s = this.searchTerm.toLowerCase();
        let filtered = this.customers.filter(c =>
            c.status === this.statusFilter &&
            ((c.lastName || '').toLowerCase().includes(s) ||
            (c.firstName || '').toLowerCase().includes(s) ||
            (c.reading || '').toLowerCase().includes(s) ||
            (c.course || '').toLowerCase().includes(s) ||
            (c.phone1 || '').includes(s) ||
            (c.email || '').toLowerCase().includes(s) ||
            (c.memberNumber || '').includes(s))
        );
        filtered.sort((a, b) => {
            let aVal = a[this.sortField] || '';
            let bVal = b[this.sortField] || '';
            return this.sortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
        });
        return filtered;
    }

    sortBy(field) {
        if (this.sortField === field) {
            this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortField = field;
            this.sortOrder = 'asc';
        }
        this.render();
    }

    setStatusFilter(status) {
        this.statusFilter = status;
        this.render();
    }

    setSearchTerm(term) {
        this.searchTerm = term;
        this.render();
    }

    setSortField(field) {
        this.sortBy(field);
    }

    updateNewCustomer(field, value) {
        this.newCustomer[field] = value;
    }

    saveNewCustomer() {
        this.addCustomer();
    }

    toggleAddForm() {
        this.showAddForm = !this.showAddForm;
        this.render();
    }

    editCustomer(id) {
        this.startEdit(id);
    }

    saveCustomer() {
        this.saveEdit();
    }

    updateEditForm(field, value) {
        this.updateEditField(field, value);
    }

    async addCustomer() {
        if (!this.newCustomer.lastName || !this.newCustomer.firstName) {
            alert('氏名を入力してください'); return;
        }
        if (!this.newCustomer.memberNumber) {
            alert('会員番号を入力してください'); return;
        }
        try {
            // プラン⇔コース 双方向同期（保存直前）
            syncPlanCourse(this.newCustomer);
            if (this.newCustomer.plan) {
                this.newCustomer.planUpdatedAt = this.selectedMonth;
            }
            await db.addCustomer(this.newCustomer);
            this.customers = await db.loadCustomers();
            this.newCustomer = getEmptyCustomer();
            this.showAddForm = false;
            this.render();
            alert('登録しました');
        } catch (error) {
            console.error('登録エラー:', error);
            alert('登録エラー: ' + error.message);
        }
    }

    startEdit(id) {
        this.editingId = id;
        const customer = this.customers.find(c => c.id === id);
        if (customer) {
            this.editForm = { ...customer };
            this.render();
        }
    }

    cancelEdit() {
        this.editingId = null;
        this.editForm = {};
        this.render();
    }

    updateEditField(field, value) {
        this.editForm[field] = value;
    }

    async saveEdit() {
        if (!this.editForm.id) { alert('保存エラー: IDが見つかりません'); return; }
        try {
            // プラン⇔コース 双方向同期（保存直前）
            syncPlanCourse(this.editForm);
            // プラン変更検出
            const oldCustomer = this.customers.find(c => c.id === this.editForm.id);
            const planChanged = oldCustomer && this.editForm.plan && this.editForm.plan !== oldCustomer.plan;
            if (planChanged) {
                this.editForm.planUpdatedAt = this.selectedMonth;
            }

            const { id, ...dataToSave } = this.editForm;
            await db.updateCustomer(id, dataToSave);

            // プラン変更時：schedule + 当月attendanceに同期
            if (planChanged) {
                await this.syncPlanToCurrentMonth(this.editForm);
            }

            this.customers = await db.loadCustomers();
            this.editingId = null;
            this.editForm = {};
            this.render();
            alert(planChanged ? 'プランを更新しました（出席記録にも反映済み）' : '更新しました');
        } catch (error) {
            console.error('更新エラー:', error);
            alert('更新エラー: ' + error.message);
        }
    }

    async deleteCustomer(id) {
        if (!confirm('この顧客を削除してもよろしいですか?')) return;
        try {
            await db.deleteCustomer(id);
            this.customers = await db.loadCustomers();
            this.render();
            alert('削除しました');
        } catch (error) {
            console.error('削除エラー:', error);
            alert('削除エラー: ' + error.message);
        }
    }

    viewCustomerDetail(id) {
        this.viewingCustomerId = id;
        this.render();
    }

    closeCustomerDetail() {
        this.viewingCustomerId = null;
        this.render();
    }

    editFromDetail() {
        const id = this.viewingCustomerId;
        this.viewingCustomerId = null;
        this.startEdit(id);
    }

    handleExport() {
        exportCustomersCSVNew(this.customers, this.scheduleData);
    }

    handleExportAttendanceMonthly() {
        exportAttendanceMonthlyCSV(this.scheduleData, this.attendanceData, this.selectedMonth, isRegularPlan);
    }

    async handleExportAttendanceYearly() {
        await exportAttendanceYearlyCSV(this.scheduleData, this.selectedMonth, isRegularPlan, db.loadAttendance);
    }

    // ===== CALENDAR =====
    selectCalendarDate(dateStr) {
        this.selectedCalendarDate = dateStr;
        this.render();
    }

    async toggleCalendarHoliday(dateStr) {
        const data = this.calendarData[dateStr] || {};
        data.holiday = !data.holiday;
        if (!data.holiday) delete data.holiday;
        await this._saveCalendarDay(dateStr, data);
    }

    async cancelLesson(dateStr, lessonKey) {
        const data = this.calendarData[dateStr] || {};
        if (!data.cancelledLessons) data.cancelledLessons = [];
        if (data.cancelledLessons.includes(lessonKey)) {
            data.cancelledLessons = data.cancelledLessons.filter(k => k !== lessonKey);
        } else {
            data.cancelledLessons.push(lessonKey);
        }
        if (!data.cancelledLessons.length) delete data.cancelledLessons;
        await this._saveCalendarDay(dateStr, data);
    }

    async addWorkshop(dateStr) {
        const name = document.getElementById('calWsName')?.value?.trim();
        const venue = document.getElementById('calWsVenue')?.value?.trim();
        const time = document.getElementById('calWsTime')?.value?.trim();
        if (!name) { alert('レッスン名を入力してください'); return; }
        const data = this.calendarData[dateStr] || {};
        if (!data.workshops) data.workshops = [];
        data.workshops.push({ name, venue: venue || '', time: time || '' });
        await this._saveCalendarDay(dateStr, data);
    }

    async removeWorkshop(dateStr, index) {
        const data = this.calendarData[dateStr] || {};
        if (data.workshops) {
            data.workshops.splice(index, 1);
            if (!data.workshops.length) delete data.workshops;
        }
        await this._saveCalendarDay(dateStr, data);
    }

    async saveCalendarNote(dateStr) {
        const note = document.getElementById('calNote')?.value?.trim() || '';
        const data = this.calendarData[dateStr] || {};
        if (note) data.note = note; else delete data.note;
        await this._saveCalendarDay(dateStr, data);
    }

    async _saveCalendarDay(dateStr, data) {
        // Clean empty overrides
        const isEmpty = !data.holiday && !data.cancelledLessons?.length && !data.workshops?.length && !data.note;
        if (isEmpty) {
            delete this.calendarData[dateStr];
            await db.deleteCalendarDay(this.selectedMonth, dateStr);
        } else {
            this.calendarData[dateStr] = data;
            await db.saveCalendarDay(this.selectedMonth, dateStr, data);
        }
        this.render();
    }

    // ===== ATTENDANCE =====
    calculateAge(birthDate) {
        return calculateAge(birthDate);
    }

    // Note: these methods are accessed by views and events
    toggleAttendance(classId, week) {
        const current = this.attendanceData[classId]?.[week] || '';
        const next = current === '○' ? '×' : current === '×' ? '休講' : current === '休講' ? '' : '○';
        if (!this.attendanceData[classId]) this.attendanceData[classId] = {};
        this.attendanceData[classId][week] = next;
        db.saveAttendance(this.selectedMonth, classId, this.attendanceData[classId]);
        this.render();
    }

    getAttendanceRate(classId) {
        const data = this.attendanceData[classId] || {};
        const weeks = ['week1', 'week2', 'week3', 'week4'];
        const attended = weeks.filter(w => data[w] === '○').length;
        const recorded = weeks.filter(w => data[w] === '○' || data[w] === '×').length;
        return recorded > 0 ? Math.round((attended / recorded) * 100) : 0;
    }

    setAttendanceSubtab(subtab) {
        this.attendanceSubtab = subtab;
        this.render();
    }

    setAttendanceDay(day) {
        this.selectedDay = day;
        this.render();
    }

    setSelectedMonth(month) {
        this.selectMonth(month);
    }

    previousMonth() {
        this.changeMonth(-1);
    }

    nextMonth() {
        this.changeMonth(1);
    }

    cycleAttendance(classId, week) {
        this.toggleAttendance(classId, week);
    }

    async changeMonth(direction) {
        this.cleanupNonRegularStudents();
        this.isLoading = true;
        this.render();
        try {
            const [y, m] = this.selectedMonth.split('-').map(Number);
            let newYear = y, newMonth = m + direction;
            if (newMonth > 12) { newMonth = 1; newYear++; }
            else if (newMonth < 1) { newMonth = 12; newYear--; }
            this.selectedMonth = `${newYear}-${String(newMonth).padStart(2, '0')}`;
            this.scheduleData = await db.loadScheduleData(defaultSchedule);
            this.attendanceData = await db.loadAttendance(this.selectedMonth);
            this.eventsData = await db.loadEvents(this.selectedMonth);
            this.calendarData = await db.loadCalendarData(this.selectedMonth);
            this.selectedCalendarDate = null;
            // disabled (2026-05-01): migrateOrphanRegulars 停止
            // await this.migrateOrphanRegulars(this.selectedMonth);
            await this.ensureMonthlyPlanSnapshot();
        } catch (error) {
            console.error('月切り替えエラー:', error);
        } finally {
            this.isLoading = false;
            this.render();
        }
    }

    async selectMonth(monthValue) {
        if (!monthValue) return;
        this.cleanupNonRegularStudents();
        this.isLoading = true;
        this.selectedMonth = monthValue;
        this.render();
        try {
            this.scheduleData = await db.loadScheduleData(defaultSchedule);
            this.attendanceData = await db.loadAttendance(this.selectedMonth);
            this.eventsData = await db.loadEvents(this.selectedMonth);
            // disabled (2026-05-01): migrateOrphanRegulars 停止
            // await this.migrateOrphanRegulars(this.selectedMonth);
            await this.ensureMonthlyPlanSnapshot();
        } catch (error) {
            console.error('月選択エラー:', error);
        } finally {
            this.isLoading = false;
            this.render();
        }
    }

    // ===== STUDENT MANAGEMENT =====
    async addStudentToClass(day, location, className) {
        this.selectedClassForAdd = { day, location, className };
        this.showAddStudentForm = true;
        this.selectedCustomerForStudent = null;
        this.studentSearchTerm = '';
        this.studentSearchResults = [];
        this.render();
    }

    async saveNewStudent() {
        // 二連打・非同期競合ガード
        if (this._savingNewStudent) return;
        this._savingNewStudent = true;
        try {
            let lastName, firstName, plan;
            if (this.selectedCustomerForStudent) {
                lastName = this.selectedCustomerForStudent.lastName;
                firstName = this.selectedCustomerForStudent.firstName;
                plan = document.getElementById('new_student_plan')?.value || '';
            } else {
                lastName = document.getElementById('new_student_lastName')?.value || '';
                firstName = document.getElementById('new_student_firstName')?.value || '';
                plan = document.getElementById('new_student_plan')?.value || '';
            }
            // 姓名の正規化: 前後空白・全角空白・ゼロ幅文字を除去
            const normName = (s) => (s || '').replace(/[\s\u3000\u200B-\u200D\uFEFF]/g, '');
            lastName = normName(lastName);
            firstName = normName(firstName);
            if (!lastName || !firstName || !plan) {
                alert('姓名とプランを入力してください'); return;
            }
            const { day, location, className } = this.selectedClassForAdd;
            // Location normalization: match with or without '校' suffix, and handle venue vs location
            const normLoc = (loc) => (loc || '').replace(/校$/, '');
            const classIndex = this.scheduleData[day].findIndex(c => {
                const cLoc = normLoc(c.location || c.venue || '');
                return cLoc === normLoc(location) && c.name === className;
            });
            if (classIndex === -1) {
                console.error('クラスが見つかりません:', day, location, className);
                alert('エラー: クラスが見つかりません。ページを再読み込みしてください。');
                this.showAddStudentForm = false;
                this.selectedClassForAdd = null;
                return;
            }
            const cls = this.scheduleData[day][classIndex];
            const classLoc = cls.location || cls.venue || location;
            const studentKey = `${day}_${classLoc}_${className}_${lastName}${firstName}`;

            if (isRegularPlan(plan)) {
                // レギュラー: schedule.students に追加（既存なら更新）
                const existing = cls.students.find(s =>
                    (s.lastName || '').trim() === lastName && (s.firstName || '').trim() === firstName
                );
                if (existing) {
                    // 既存生徒の再追加: 退会扱い(leftAt)があれば解除し再入会扱い
                    if (existing.leftAt) {
                        delete existing.leftAt;
                        existing.enrolledFrom = this.selectedMonth;
                        await db.saveScheduleData(this.scheduleData);
                    }
                } else {
                    cls.students.push({ lastName, firstName, plan, enrolledFrom: this.selectedMonth });
                    await db.saveScheduleData(this.scheduleData);
                }
            } else {
                // ビジター/初回: schedule には入れない (firestore-safety.md の不変条件)
                // 万一 schedule に残留があれば、このクラスの該当姓名をこの瞬間だけ除去
                const before = cls.students.length;
                cls.students = (cls.students || []).filter(s =>
                    !(((s.lastName || '').trim() === lastName) && ((s.firstName || '').trim() === firstName) && !isRegularPlan(s.plan))
                );
                if (cls.students.length !== before) {
                    await db.saveScheduleData(this.scheduleData);
                }
            }

            // attendance_YYYYMM に _plan を保存（全プラン共通）
            if (!this.attendanceData[studentKey]) this.attendanceData[studentKey] = {};
            this.attendanceData[studentKey]._plan = plan;
            await db.saveAttendance(this.selectedMonth, studentKey, this.attendanceData[studentKey]);

            this.showAddStudentForm = false;
            this.selectedClassForAdd = null;
            this.selectedCustomerForStudent = null;
            this.studentSearchTerm = '';
            this.studentSearchResults = [];
            alert('生徒を追加しました');
            this.render();
        } finally {
            this._savingNewStudent = false;
        }
    }

    startEditStudent(day, location, className, lastName, firstName) {
        this.editingStudent = { day, location, className, lastName, firstName };
        this.render();
    }

    async saveEditStudent() {
        const newPlan = document.getElementById('edit_student_plan')?.value;
        if (!newPlan) { alert('プランを選択してください'); return; }
        const { day, location, className, lastName, firstName } = this.editingStudent;
        const normLoc = (loc) => (loc || '').replace(/校$/, '');
        const classIndex = this.scheduleData[day].findIndex(c => normLoc(c.location || c.venue || '') === normLoc(location) && c.name === className);

        // レギュラー→レギュラーのプラン変更は顧客管理から行う
        if (classIndex !== -1) {
            const student = this.scheduleData[day][classIndex].students.find(s => s.lastName === lastName && s.firstName === firstName);
            if (student && isRegularPlan(student.plan) && isRegularPlan(newPlan) && student.plan !== newPlan) {
                alert('レギュラープランの変更は「顧客一覧」から行ってください。\n顧客一覧で変更すると全クラスに一括反映されます。');
                return;
            }
        }
        if (classIndex !== -1) {
            const cls = this.scheduleData[day][classIndex];
            const studentIndex = cls.students.findIndex(s => s.lastName === lastName && s.firstName === firstName);
            if (studentIndex !== -1) {
                cls.students[studentIndex].plan = newPlan;
                // ビジター→レギュラー昇格時、退会扱い(leftAt)があれば解除
                if (isRegularPlan(newPlan) && cls.students[studentIndex].leftAt) {
                    delete cls.students[studentIndex].leftAt;
                    cls.students[studentIndex].enrolledFrom = this.selectedMonth;
                }
                await db.saveScheduleData(this.scheduleData);
            } else if (isRegularPlan(newPlan)) {
                // ビジター→レギュラー昇格: scheduleDataに新規追加（プラン1〜5は必ずレギュラー名簿に保存）
                cls.students = cls.students || [];
                cls.students.push({ lastName, firstName, plan: newPlan, enrolledFrom: this.selectedMonth });
                await db.saveScheduleData(this.scheduleData);
            }
        }
        const classLoc = classIndex !== -1 ? (this.scheduleData[day][classIndex].location || this.scheduleData[day][classIndex].venue || location) : location;
        const studentKey = `${day}_${classLoc}_${className}_${lastName}${firstName}`;
        if (!this.attendanceData[studentKey]) this.attendanceData[studentKey] = {};
        this.attendanceData[studentKey]._plan = newPlan;
        await db.saveAttendance(this.selectedMonth, studentKey, this.attendanceData[studentKey]);
        this.editingStudent = null;
        alert('生徒情報を更新しました');
        this.render();
    }

    async deleteStudent(day, location, className, lastName, firstName) {
        if (!confirm(`${lastName} ${firstName} を削除してもよろしいですか？`)) return;
        const normLoc = (loc) => (loc || '').replace(/校$/, '');
        const classIndex = this.scheduleData[day].findIndex(c => normLoc(c.location || c.venue || '') === normLoc(location) && c.name === className);
        const classLoc = classIndex !== -1 ? (this.scheduleData[day][classIndex].location || this.scheduleData[day][classIndex].venue || location) : location;

        // Find student's plan to determine delete behavior
        const student = classIndex !== -1 ? this.scheduleData[day][classIndex].students.find(s => s.lastName === lastName && s.firstName === firstName) : null;
        const isRegular = student ? isRegularPlan(student.plan) : false;

        if (isRegular) {
            // レギュラー: schedule から削除せず leftAt を設定（退会扱い）
            // 過去月の出席記録を保護するため scheduleData も attendance も破壊しない
            if (classIndex !== -1) {
                const target = this.scheduleData[day][classIndex].students.find(
                    s => s.lastName === lastName && s.firstName === firstName
                );
                if (target) {
                    target.leftAt = this.selectedMonth;
                    await db.saveScheduleData(this.scheduleData);
                }
            }
            alert('生徒を退会扱いにしました（過去の記録は保持されます）');
            this.render();
            return;
        }
        // Non-regular (visitor/trial): only delete attendance for current month
        // Schedule entry preserved so other months are unaffected

        const studentKey = `${day}_${classLoc}_${className}_${lastName}${firstName}`;
        try {
            await db.deleteAttendanceRecord(this.selectedMonth, studentKey);
            delete this.attendanceData[studentKey];
        } catch (error) { console.log('出席データの削除エラー'); }
        alert('生徒を削除しました');
        this.render();
    }

    // Student search helpers
    selectCustomerForStudent(customer) {
        this.selectedCustomerForStudent = customer;
        this.studentSearchResults = [];
        this.studentSearchTerm = `${customer.lastName} ${customer.firstName}`;
        const searchInput = document.getElementById('student_search_input');
        if (searchInput) searchInput.value = this.studentSearchTerm;
        this.updateSearchResults();
        this.updateSelectedCustomerInfo();
    }

    updateSearchResults() {
        const resultsContainer = document.getElementById('searchResultsContainer');
        if (!resultsContainer) return;
        if (this.studentSearchResults.length > 0) {
            resultsContainer.innerHTML = `
                <div class="mt-2 border rounded bg-white student-search-results shadow-lg">
                    ${this.studentSearchResults.map(customer => `
                        <div data-select-customer-id="${customer.id}" class="select-customer-btn p-2 hover:bg-blue-50 cursor-pointer border-b last:border-b-0 text-sm transition">
                            <div class="font-medium text-blue-600">${customer.lastName} ${customer.firstName}${customer.memberNumber ? ` <span class="text-xs text-gray-500 ml-2">[${customer.memberNumber}]</span>` : ''}</div>
                            <div class="text-xs text-gray-600 mt-1">${customer.reading ? `読み: ${customer.reading}` : ''}${customer.reading && (customer.plan || customer.course) ? ' | ' : ''}${(customer.plan || customer.course) ? `プラン: ${customer.plan || (COURSE_TO_PLAN[customer.course] || customer.course)}` : ''}</div>
                        </div>
                    `).join('')}
                </div>
            `;
            resultsContainer.querySelectorAll('.select-customer-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const customerId = btn.getAttribute('data-select-customer-id');
                    const customer = this.customers.find(c => c.id === customerId);
                    if (customer) this.selectCustomerForStudent(customer);
                });
            });
        } else if (this.studentSearchTerm.trim()) {
            resultsContainer.innerHTML = `<div class="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">警告: 該当する顧客が見つかりませんでした</div>`;
        } else {
            resultsContainer.innerHTML = '';
        }
    }

    updateSelectedCustomerInfo() {
        const selectedInfoContainer = document.getElementById('selectedCustomerInfo');
        const planSelect = document.getElementById('new_student_plan');
        const nameInputContainer = document.getElementById('nameInputContainer');
        const planSelectContainer = document.getElementById('planSelectContainer');
        if (!selectedInfoContainer) return;

        if (this.selectedCustomerForStudent) {
            selectedInfoContainer.innerHTML = `
                <div class="mb-3 p-3 bg-green-50 border-2 border-green-400 rounded text-sm">
                    <div class="flex items-center justify-between">
                        <div>
                            <div class="font-bold text-green-800">チェック: 選択中: ${this.selectedCustomerForStudent.lastName} ${this.selectedCustomerForStudent.firstName}</div>
                            <div class="text-xs text-gray-700 mt-1">${this.selectedCustomerForStudent.memberNumber ? `会員番号: ${this.selectedCustomerForStudent.memberNumber} | ` : ''}${this.selectedCustomerForStudent.reading ? `読み: ${this.selectedCustomerForStudent.reading} | ` : ''}プラン: ${this.selectedCustomerForStudent.plan || (this.selectedCustomerForStudent.course ? (COURSE_TO_PLAN[this.selectedCustomerForStudent.course] || this.selectedCustomerForStudent.course) : 'なし')}</div>
                        </div>
                        <button id="clearSelectedCustomer" class="text-red-600 hover:text-red-800 text-xs underline">選択解除</button>
                    </div>
                </div>
            `;
            if (nameInputContainer) { nameInputContainer.classList.add('hidden'); nameInputContainer.classList.remove('col-span-2', 'grid', 'grid-cols-2', 'gap-3'); }
            if (planSelectContainer) planSelectContainer.classList.add('col-span-3');
            document.getElementById('clearSelectedCustomer')?.addEventListener('click', () => {
                this.selectedCustomerForStudent = null;
                this.studentSearchTerm = '';
                this.studentSearchResults = [];
                this.updateSelectedCustomerInfo();
                const searchInput = document.getElementById('student_search_input');
                if (searchInput) searchInput.value = '';
                this.updateSearchResults();
                if (planSelect) planSelect.value = '';
            });
            if (planSelect) {
                // plan 優先、未設定なら course から導出（COURSE_TO_PLAN を再利用）
                const planValue = this.selectedCustomerForStudent.plan || COURSE_TO_PLAN[this.selectedCustomerForStudent.course] || '';
                if (planValue) planSelect.value = planValue;
            }
        } else {
            selectedInfoContainer.innerHTML = '';
            if (nameInputContainer) { nameInputContainer.classList.remove('hidden'); nameInputContainer.classList.add('col-span-2', 'grid', 'grid-cols-2', 'gap-3'); }
            if (planSelectContainer) planSelectContainer.classList.remove('col-span-3');
        }
    }

    // ===== EVENT MANAGEMENT =====
    toggleAddEventForm() {
        this.showAddEventForm = !this.showAddEventForm;
        this.render();
    }

    async createEvent() {
        const name = document.getElementById('new_event_name')?.value?.trim();
        const date = document.getElementById('new_event_date')?.value || '';
        if (!name) { alert('イベント名を入力してください'); return; }
        const eventId = `event_${Date.now()}`;
        const eventData = { name, date, participants: [] };
        await db.saveEvent(this.selectedMonth, eventId, eventData);
        this.eventsData[eventId] = eventData;
        this.showAddEventForm = false;
        this.render();
    }

    async deleteEvent(eventId) {
        const evt = this.eventsData[eventId];
        if (!confirm(`「${evt?.name || 'イベント'}」を削除してもよろしいですか？`)) return;
        await db.deleteEvent(this.selectedMonth, eventId);
        delete this.eventsData[eventId];
        this.render();
    }

    showAddParticipant(eventId) {
        this.addingParticipantToEvent = eventId;
        this.render();
    }

    cancelAddParticipant() {
        this.addingParticipantToEvent = null;
        this.render();
    }

    async saveNewParticipant(eventId) {
        const name = document.getElementById('evt_participant_name')?.value?.trim();
        const memberType = document.getElementById('evt_participant_memberType')?.value || '会員';
        const plan = document.getElementById('evt_participant_plan')?.value || '';
        const amount = parseInt(document.getElementById('evt_participant_amount')?.value) || 0;
        if (!name) { alert('氏名を入力してください'); return; }
        if (!this.eventsData[eventId]) return;
        if (!this.eventsData[eventId].participants) {
            this.eventsData[eventId].participants = [];
        }
        this.eventsData[eventId].participants.push({ name, memberType, plan, amount });
        await db.saveEvent(this.selectedMonth, eventId, this.eventsData[eventId]);
        this.addingParticipantToEvent = null;
        this.render();
    }

    async deleteParticipant(eventId, index) {
        if (!this.eventsData[eventId]) return;
        const participants = this.eventsData[eventId].participants || [];
        if (!confirm(`${participants[index]?.name || ''} を削除してもよろしいですか？`)) return;
        participants.splice(index, 1);
        this.eventsData[eventId].participants = participants;
        await db.saveEvent(this.selectedMonth, eventId, this.eventsData[eventId]);
        this.editingEventId = null;
        this.editingParticipantIndex = null;
        this.render();
    }

    startEditEvent(eventId) {
        this.editingEventId = eventId;
        this.editingParticipantIndex = -1;
        this.render();
    }

    async saveEditEvent(eventId) {
        const name = document.getElementById('edit_event_name')?.value?.trim();
        const date = document.getElementById('edit_event_date')?.value || '';
        if (!name) { alert('イベント名を入力してください'); return; }
        if (!this.eventsData[eventId]) return;
        this.eventsData[eventId].name = name;
        this.eventsData[eventId].date = date;
        await db.saveEvent(this.selectedMonth, eventId, this.eventsData[eventId]);
        this.editingEventId = null;
        this.editingParticipantIndex = null;
        this.render();
    }

    cancelEditEvent() {
        this.editingEventId = null;
        this.editingParticipantIndex = null;
        this.render();
    }

    startEditParticipant(eventId, index) {
        this.editingEventId = eventId;
        this.editingParticipantIndex = index;
        this.render();
    }

    async saveEditParticipant(eventId, index) {
        const name = document.getElementById('edit_p_name')?.value?.trim();
        const memberType = document.getElementById('edit_p_memberType')?.value || '会員';
        const plan = document.getElementById('edit_p_plan')?.value || '';
        const amount = parseInt(document.getElementById('edit_p_amount')?.value) || 0;
        if (!name) { alert('氏名を入力してください'); return; }
        if (!this.eventsData[eventId]) return;
        this.eventsData[eventId].participants[index] = { name, memberType, plan, amount };
        await db.saveEvent(this.selectedMonth, eventId, this.eventsData[eventId]);
        this.editingEventId = null;
        this.editingParticipantIndex = null;
        this.render();
    }

    // ===== BACKUP =====
    async createBackup() {
        const statusEl = document.getElementById('backupStatus');
        if (statusEl) statusEl.textContent = 'バックアップ作成中...';
        try {
            await db.createBackup();
            if (statusEl) statusEl.textContent = `チェック バックアップ完了 (${new Date().toLocaleString('ja-JP')})`;
        } catch (error) {
            console.error('バックアップエラー:', error);
            if (statusEl) statusEl.textContent = `エラー バックアップ失敗: ${error.message}`;
        }
    }

    // ===== RENDERING =====
    render() {
        const filteredCustomers = this.getFilteredCustomers();
        const isMoreTab = ['timeSchedule', 'monthlySchedule'].includes(this.currentTab);
        document.getElementById('app').innerHTML = `
            <div style="display:flex;">
                <aside class="sidebar">
                    <div class="sidebar-logo">
                        <svg class="logo-image" viewBox="0 0 280 100" xmlns="http://www.w3.org/2000/svg"><text x="6" y="68" font-family="'Futura','Trebuchet MS','Arial Black',sans-serif" font-weight="900" font-size="76" fill="#ffffff" letter-spacing="-2">posse</text><text x="8" y="93" font-family="'Futura','Trebuchet MS',Arial,sans-serif" font-weight="300" font-size="24" fill="rgba(255,255,255,0.85)" letter-spacing="5.5">dance academy</text></svg>
                    </div>
                    <nav>
                        <button id="homeTab" class="nav-item ${this.currentTab === 'home' ? 'active' : ''}">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                            <span>HOME</span>
                        </button>
                        <button id="customersTab" class="nav-item ${this.currentTab === 'customers' ? 'active' : ''}">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
                            <span>顧客一覧</span>
                        </button>
                        <button id="attendanceTab" class="nav-item ${this.currentTab === 'attendance' ? 'active' : ''}">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14l2 2 4-4"/></svg>
                            <span>出席名簿</span>
                        </button>
                        <div class="nav-section-label">スケジュール</div>
                        <button id="timeScheduleTab" class="nav-item ${this.currentTab === 'timeSchedule' ? 'active' : ''}">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                            <span>タイムスケジュール</span>
                        </button>
                        <button id="monthlyScheduleTab" class="nav-item ${this.currentTab === 'monthlySchedule' ? 'active' : ''}">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                            <span>月間スケジュール</span>
                        </button>
                    </nav>
                </aside>
                <main class="main-content" style="min-width:0;overflow-x:hidden;flex:1;">
                    ${this.currentTab === 'home' ? renderDashboard(this) :
                      this.currentTab === 'customers' ? renderCustomers(this) :
                      this.currentTab === 'attendance' ? renderAttendance(this) :
                      this.currentTab === 'timeSchedule' ? renderTimeSchedule(this) :
                      this.currentTab === 'monthlySchedule' ? renderMonthlySchedule(this) :
                      renderDashboard(this)}
                </main>
            </div>
            <!-- Mobile Bottom Navigation -->
            <div class="mobile-more-overlay" id="mobileMoreOverlay"></div>
            <div class="mobile-more-menu" id="mobileMoreMenu">
                <button id="mobileTimeScheduleTab" class="mobile-more-menu-item ${this.currentTab === 'timeSchedule' ? 'active' : ''}">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    タイムスケジュール
                </button>
                <button id="mobileMonthlyScheduleTab" class="mobile-more-menu-item ${this.currentTab === 'monthlySchedule' ? 'active' : ''}">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    月間スケジュール
                </button>
            </div>
            <nav class="mobile-bottom-nav">
                <button id="mobileHomeTab" class="mobile-nav-item ${this.currentTab === 'home' ? 'active' : ''}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                    HOME
                </button>
                <button id="mobileCustomersTab" class="mobile-nav-item ${this.currentTab === 'customers' ? 'active' : ''}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
                    顧客
                </button>
                <button id="mobileAttendanceTab" class="mobile-nav-item ${this.currentTab === 'attendance' ? 'active' : ''}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14l2 2 4-4"/></svg>
                    出席
                </button>
                <button id="mobileMoreTab" class="mobile-nav-item ${isMoreTab ? 'active' : ''}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                    その他
                </button>
            </nav>
        `;

        // Setup navigation events (desktop sidebar)
        document.getElementById('homeTab')?.addEventListener('click', () => { this.currentTab = 'home'; this.render(); });
        document.getElementById('customersTab')?.addEventListener('click', () => { this.currentTab = 'customers'; this.render(); });
        document.getElementById('attendanceTab')?.addEventListener('click', () => { this.currentTab = 'attendance'; this.render(); });
        document.getElementById('timeScheduleTab')?.addEventListener('click', () => { this.currentTab = 'timeSchedule'; this.render(); });
        document.getElementById('monthlyScheduleTab')?.addEventListener('click', () => { this.currentTab = 'monthlySchedule'; this.render(); });

        // Setup mobile navigation events
        document.getElementById('mobileHomeTab')?.addEventListener('click', () => { this.currentTab = 'home'; this.render(); });
        document.getElementById('mobileCustomersTab')?.addEventListener('click', () => { this.currentTab = 'customers'; this.render(); });
        document.getElementById('mobileAttendanceTab')?.addEventListener('click', () => { this.currentTab = 'attendance'; this.render(); });
        // Mobile "More" menu toggle
        const moreTab = document.getElementById('mobileMoreTab');
        const moreMenu = document.getElementById('mobileMoreMenu');
        const moreOverlay = document.getElementById('mobileMoreOverlay');
        if (moreTab && moreMenu) {
            moreTab.addEventListener('click', () => {
                const isOpen = moreMenu.classList.contains('open');
                moreMenu.classList.toggle('open', !isOpen);
                moreOverlay?.classList.toggle('open', !isOpen);
            });
        }
        moreOverlay?.addEventListener('click', () => {
            moreMenu?.classList.remove('open');
            moreOverlay.classList.remove('open');
        });
        document.getElementById('mobileTimeScheduleTab')?.addEventListener('click', () => { this.currentTab = 'timeSchedule'; this.render(); });
        document.getElementById('mobileMonthlyScheduleTab')?.addEventListener('click', () => { this.currentTab = 'monthlySchedule'; this.render(); });

        // Setup page-specific events
        if (this.currentTab === 'customers') {
            this.setupCustomerPageEvents();
        } else if (this.currentTab === 'attendance') {
            this.setupAttendanceEvents();
        } else if (this.currentTab === 'monthlySchedule') {
            const sel = this.selectedCalendarDate;
            if (sel) {
                document.getElementById('calToggleHoliday')?.addEventListener('click', () => this.toggleCalendarHoliday(sel));
                document.querySelectorAll('.cal-cancel-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => { e.stopPropagation(); this.cancelLesson(sel, btn.dataset.lessonKey); });
                });
                document.querySelectorAll('.cal-remove-ws-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => { e.stopPropagation(); this.removeWorkshop(sel, parseInt(btn.dataset.wsIndex)); });
                });
                document.getElementById('calAddWsBtn')?.addEventListener('click', () => this.addWorkshop(sel));
                document.getElementById('calSaveNote')?.addEventListener('click', () => this.saveCalendarNote(sel));
            }
        }

        // Save navigation state to URL hash
        this.updateHash();
    }

    // ===== EVENT SETUP (CUSTOMERS) =====
    setupCustomerPageEvents() {
        document.getElementById('exportBtn')?.addEventListener('click', () => this.handleExport());
        document.getElementById('toggleAddFormBtn')?.addEventListener('click', () => { this.showAddForm = !this.showAddForm; this.render(); });
        // 顧客検索の入力ハンドラ
        // - input イベントで render() すると DOM が再構築されフォーカスが外れる
        // - さらに IME（日本語入力）合成中に render() すると合成状態が壊れて
        //   "なかやま" → "nあkあyあmあ" のように子音だけ生で残るバグになる
        // 対策: compositionstart/end で合成中フラグを立て、合成中は render() をスキップ
        const searchInputEl = document.getElementById('searchInput');
        if (searchInputEl) {
            this._isComposingSearch = false;
            const applySearch = (val, cursorPos) => {
                this.searchTerm = val;
                this.render();
                const newInput = document.getElementById('searchInput');
                if (newInput) {
                    newInput.focus();
                    if (cursorPos != null) newInput.setSelectionRange(cursorPos, cursorPos);
                }
            };
            searchInputEl.addEventListener('compositionstart', () => {
                this._isComposingSearch = true;
            });
            searchInputEl.addEventListener('compositionend', (e) => {
                this._isComposingSearch = false;
                applySearch(e.target.value, e.target.value.length);
            });
            searchInputEl.addEventListener('input', (e) => {
                if (this._isComposingSearch) return;  // IME合成中はスキップ
                applySearch(e.target.value, e.target.selectionStart);
            });
        }
        document.getElementById('addCustomerBtn')?.addEventListener('click', () => this.addCustomer());
        document.getElementById('cancelAddBtn')?.addEventListener('click', () => { this.showAddForm = false; this.render(); });

        ['入会中', '休会中', '退会済み'].forEach(status => {
            document.getElementById(`status-${status}`)?.addEventListener('click', () => { this.statusFilter = status; this.render(); });
        });

        document.querySelectorAll('.sortable-header').forEach(header => {
            header.addEventListener('click', () => { this.sortBy(header.getAttribute('data-field')); });
        });

        // Form field events
        const fields = ['memberNumber', 'status', 'course', 'plan', 'annualFee', 'lastName', 'firstName', 'reading', 'guardianName', 'hakomonoName', 'gender', 'birthDate', 'phone1', 'email', 'postalCode', 'prefecture', 'city', 'address', 'building', 'joinDate', 'memo', 'enrollmentFeeDate', 'annualFeeMonth'];
        fields.forEach(field => {
            const el = document.getElementById(`new_${field}`);
            if (el) {
                el.addEventListener('change', (e) => { this.newCustomer[field] = e.target.value; });
                el.addEventListener('input', (e) => { this.newCustomer[field] = e.target.value; });
            }
        });
        // Checkbox fields for add form
        ['isFamilyMember', 'has15hClass'].forEach(field => {
            const el = document.getElementById(`new_${field}`);
            if (el) el.addEventListener('change', (e) => { this.newCustomer[field] = e.target.checked; });
        });

        // Detail modal events
        document.querySelectorAll('[data-view-id]').forEach(btn => {
            btn.addEventListener('click', () => { this.viewCustomerDetail(btn.getAttribute('data-view-id')); });
        });
        document.getElementById('closeDetailBtn')?.addEventListener('click', () => this.closeCustomerDetail());
        document.getElementById('closeDetailBtn2')?.addEventListener('click', () => this.closeCustomerDetail());
        document.getElementById('editFromDetailBtn')?.addEventListener('click', () => this.editFromDetail());
        document.getElementById('detailOverlay')?.addEventListener('click', (e) => {
            if (e.target.id === 'detailOverlay') this.closeCustomerDetail();
        });

        // Edit events
        document.querySelectorAll('[data-edit-action="start"]').forEach(btn => {
            btn.addEventListener('click', () => { this.startEdit(btn.getAttribute('data-id')); });
        });
        document.querySelectorAll('[data-edit-action="delete"]').forEach(btn => {
            btn.addEventListener('click', () => { this.deleteCustomer(btn.getAttribute('data-id')); });
        });
        document.getElementById('saveEditBtn')?.addEventListener('click', () => this.saveEdit());
        document.getElementById('cancelEditBtn')?.addEventListener('click', () => this.cancelEdit());
        document.getElementById('cancelEditBtn2')?.addEventListener('click', () => this.cancelEdit());
        document.getElementById('editOverlay')?.addEventListener('click', (e) => {
            if (e.target.id === 'editOverlay') this.cancelEdit();
        });

        const editFields = ['memberNumber', 'status', 'course', 'plan', 'annualFee', 'reading', 'guardianName', 'hakomonoName', 'gender', 'birthDate', 'phone1', 'phone2', 'email', 'postalCode', 'prefecture', 'city', 'address', 'building', 'joinDate', 'memo', 'lastName', 'firstName', 'enrollmentFeeDate', 'annualFeeMonth'];
        editFields.forEach(field => {
            const el = document.getElementById(`edit_${field}`);
            if (el) {
                el.addEventListener('change', (e) => { this.updateEditField(field, e.target.value); });
                el.addEventListener('input', (e) => { this.updateEditField(field, e.target.value); });
            }
        });
        // Checkbox fields for edit form
        ['isFamilyMember', 'has15hClass'].forEach(field => {
            const el = document.getElementById(`edit_${field}`);
            if (el) el.addEventListener('change', (e) => { this.updateEditField(field, e.target.checked); });
        });
    }

    // ===== EVENT SETUP (ATTENDANCE) =====
    setupAttendanceEvents() {
        // CSV export buttons
        document.getElementById('exportAttendanceMonthlyBtn')?.addEventListener('click', () => this.handleExportAttendanceMonthly());
        document.getElementById('exportAttendanceYearlyBtn')?.addEventListener('click', () => this.handleExportAttendanceYearly());

        // Subtab navigation
        document.getElementById('attendanceOverviewTab')?.addEventListener('click', () => { this.attendanceSubtab = '概要'; this.render(); });
        document.getElementById('attendanceRecordTab')?.addEventListener('click', () => { this.attendanceSubtab = '出席記録'; this.render(); });

        // Month navigation
        const monthSelector = document.getElementById('monthSelector');
        if (monthSelector) monthSelector.addEventListener('change', (e) => this.selectMonth(e.target.value));
        const monthSelectorOverview = document.getElementById('monthSelectorOverview');
        if (monthSelectorOverview) monthSelectorOverview.addEventListener('change', (e) => this.selectMonth(e.target.value));

        const prevMonthBtn = document.getElementById('prevMonth');
        const nextMonthBtn = document.getElementById('nextMonth');
        const prevMonthRecordBtn = document.getElementById('prevMonthRecord');
        const nextMonthRecordBtn = document.getElementById('nextMonthRecord');
        if (prevMonthBtn) prevMonthBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); this.changeMonth(-1); });
        if (nextMonthBtn) nextMonthBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); this.changeMonth(1); });
        if (prevMonthRecordBtn) prevMonthRecordBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); this.changeMonth(-1); });
        if (nextMonthRecordBtn) nextMonthRecordBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); this.changeMonth(1); });

        // Day tabs
        ['月曜日', '火曜日', '水曜日', '木曜日', '金曜日', 'イベント'].forEach(day => {
            document.getElementById(`day-${day}`)?.addEventListener('click', () => { this.selectedDay = day; this.render(); });
        });

        // Attendance toggle buttons
        document.querySelectorAll('.attendance-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.toggleAttendance(btn.getAttribute('data-class'), btn.getAttribute('data-week'));
            });
        });

        // Add student buttons
        document.querySelectorAll('.add-student-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.addStudentToClass(btn.getAttribute('data-add-day'), btn.getAttribute('data-add-location'), btn.getAttribute('data-add-class'));
            });
        });

        // Student menu buttons (pencil icon → dropdown with edit/delete)
        document.querySelectorAll('.student-menu-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                document.querySelectorAll('.student-action-menu').forEach(m => m.remove());
                const day = btn.getAttribute('data-menu-day');
                const loc = btn.getAttribute('data-menu-location');
                const cls = btn.getAttribute('data-menu-class');
                const ln = btn.getAttribute('data-menu-lastname');
                const fn = btn.getAttribute('data-menu-firstname');
                const menu = document.createElement('div');
                menu.className = 'student-action-menu';
                menu.innerHTML = `
                    <button class="student-action-menu-item" data-action="edit">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        編集
                    </button>
                    <button class="student-action-menu-item danger" data-action="delete">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                        削除
                    </button>`;
                btn.closest('.student-actions').appendChild(menu);
                menu.querySelector('[data-action="edit"]').addEventListener('click', () => { menu.remove(); this.startEditStudent(day, loc, cls, ln, fn); });
                menu.querySelector('[data-action="delete"]').addEventListener('click', () => { menu.remove(); this.deleteStudent(day, loc, cls, ln, fn); });
                const closeMenu = (ev) => { if (!menu.contains(ev.target) && ev.target !== btn) { menu.remove(); document.removeEventListener('click', closeMenu); } };
                setTimeout(() => document.addEventListener('click', closeMenu), 0);
            });
        });

        // Save/cancel edit student
        document.getElementById('saveEditStudentBtn')?.addEventListener('click', () => this.saveEditStudent());
        document.getElementById('cancelEditStudentBtn')?.addEventListener('click', () => { this.editingStudent = null; this.render(); });

        // Student search
        const searchInput = document.getElementById('student_search_input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.studentSearchTerm = e.target.value;
                if (this.studentSearchTerm.trim()) {
                    this.studentSearchResults = searchCustomerByName(this.customers, this.studentSearchTerm);
                } else {
                    this.studentSearchResults = [];
                    this.selectedCustomerForStudent = null;
                }
                this.updateSearchResults();
            });
            searchInput.addEventListener('focus', (e) => {
                if (this.studentSearchTerm.trim()) {
                    this.studentSearchResults = searchCustomerByName(this.customers, this.studentSearchTerm);
                    this.updateSearchResults();
                }
            });
        }

        // Customer selection
        document.querySelectorAll('.select-customer-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const customerId = btn.getAttribute('data-select-customer-id');
                const customer = this.customers.find(c => c.id === customerId);
                if (customer) this.selectCustomerForStudent(customer);
            });
        });
        document.getElementById('clearSelectedCustomer')?.addEventListener('click', () => {
            this.selectedCustomerForStudent = null;
            this.studentSearchTerm = '';
            this.studentSearchResults = [];
            this.updateSelectedCustomerInfo();
            const si = document.getElementById('student_search_input');
            if (si) si.value = '';
            this.updateSearchResults();
            const ps = document.getElementById('new_student_plan');
            if (ps) ps.value = '';
        });

        // Event methods are now handled via onclick attributes in the rendered HTML

        // Save/cancel add student
        document.getElementById('saveNewStudentBtn')?.addEventListener('click', () => this.saveNewStudent());
        document.getElementById('cancelAddStudentBtn')?.addEventListener('click', () => {
            this.showAddStudentForm = false;
            this.selectedClassForAdd = null;
            this.selectedCustomerForStudent = null;
            this.studentSearchTerm = '';
            this.studentSearchResults = [];
            this.render();
        });

        // Practice session inputs
        document.querySelectorAll('.practice-input').forEach(input => {
            input.addEventListener('change', async (e) => {
                const day = e.target.getAttribute('data-practice-day');
                const week = e.target.getAttribute('data-practice-week');
                const value = parseInt(e.target.value) || 0;
                const practiceKey = `練習会_${day}`;
                if (!this.attendanceData[practiceKey]) this.attendanceData[practiceKey] = {};
                this.attendanceData[practiceKey][week] = value;
                await db.saveAttendance(this.selectedMonth, practiceKey, this.attendanceData[practiceKey]);
                this.render();
            });
        });

        // Backup button
        document.getElementById('backupBtn')?.addEventListener('click', async () => { await this.createBackup(); });
    }
}

// Initialize
const _app = new DanceStudioApp();
window.app = _app;
_app.init().catch(err => {
    console.error('Fatal init error:', err);
    _app.render(); // Render with whatever data is available
});
