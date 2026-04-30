// POSSE Dance Academy - Utility Functions Module
// All calculation and utility functions exported as ES module

/**
 * Calculate age from birth date
 * @param {string} birthDate - Birth date in YYYY-MM-DD format
 * @returns {string} Age with Japanese year suffix (e.g., "25歳")
 */
export function calculateAge(birthDate) {
    if (!birthDate) return '';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age + '歳';
}

/**
 * Convert Hiragana to Katakana
 */
export function hiraganaToKatakana(str) {
    return str.replace(/[ぁ-ゖ]/g, (match) => String.fromCharCode(match.charCodeAt(0) + 0x60));
}

/**
 * Convert Katakana to Hiragana
 */
export function katakanaToHiragana(str) {
    return str.replace(/[ァ-ヶ]/g, (match) => String.fromCharCode(match.charCodeAt(0) - 0x60));
}

/**
 * Sort students by plan priority
 */
export function sortStudentsByPlan(students, planOrder) {
    return [...students].sort((a, b) => {
        const normalizePlan = (plan) => plan.replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
        const planA = normalizePlan(a.plan);
        const planB = normalizePlan(b.plan);
        const orderA = planOrder[planA] || 999;
        const orderB = planOrder[planB] || 999;
        return orderA - orderB;
    });
}

/**
 * Check if plan is regular (monthly) vs visitor/trial
 */
export function isRegularPlan(plan) {
    const regularPlans = ['1クラス', '１クラス', '2クラス', '２クラス', '3クラス', '３クラス', '4クラス', '４クラス', '1.5hクラス'];
    return regularPlans.includes(plan);
}

/**
 * Get attendance rate for a class
 */
export function getAttendanceRate(attendanceData, classId) {
    const data = attendanceData[classId] || {};
    const weeks = ['week1', 'week2', 'week3', 'week4'];
    const attended = weeks.filter(w => data[w] === '○').length;
    const recorded = weeks.filter(w => data[w] === '○' || data[w] === '×').length;
    return recorded > 0 ? Math.round((attended / recorded) * 100) : 0;
}

/**
 * Search customers by name with hiragana/katakana support
 */
export function searchCustomerByName(customers, searchTerm) {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return [];

    const termHiragana = katakanaToHiragana(term);
    const termKatakana = hiraganaToKatakana(term);

    return customers.filter(c => {
        const lastName = (c.lastName || '').toLowerCase();
        const firstName = (c.firstName || '').toLowerCase();
        const fullName = `${lastName}${firstName}`;
        const fullNameWithSpace = `${lastName} ${firstName}`;
        const reading = (c.reading || '').toLowerCase();
        const readingHiragana = katakanaToHiragana(reading);
        const readingKatakana = hiraganaToKatakana(reading);
        const memberNumber = (c.memberNumber || '').toLowerCase();

        return lastName.includes(term) ||
               firstName.includes(term) ||
               fullName.includes(term) ||
               fullNameWithSpace.includes(term) ||
               reading.includes(term) ||
               reading.includes(termHiragana) ||
               reading.includes(termKatakana) ||
               readingHiragana.includes(term) ||
               readingHiragana.includes(termHiragana) ||
               readingKatakana.includes(term) ||
               readingKatakana.includes(termKatakana) ||
               memberNumber.includes(term);
    }).slice(0, 10);
}

/**
 * Export customers to CSV file with Japanese formatting (legacy, kept for compatibility)
 */
export function exportCustomersCSV(customers) {
    const headers = ['No', '会員番号', '会員ステータス', 'プラン', '年会費更新日', '氏名', '読み', '保護者名', 'ハコモノ登録名', '性別', '生年月日', '年齢', '電話番号', 'メール', '入会日', '郵便番号', '都道府県', '市区町村', '番地', '建物・部屋番号', '備考'];
    const rows = customers.map((c, i) => [
        i + 1, c.memberNumber || '', c.status, c.course, c.annualFee,
        `${c.lastName} ${c.firstName}`, c.reading, c.guardianName, c.hakomonoName, c.gender,
        c.birthDate, calculateAge(c.birthDate), c.phone1, c.email, c.joinDate,
        c.postalCode, c.prefecture, c.city, c.address, c.building, c.memo
    ].map(f => `"${f || ''}"`).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `顧客一覧_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

/**
 * 顧客のコースキー取得（plan / course 両対応の互換レイヤー）
 * @param {Object} customer
 * @returns {string} コースキー ('１'/'２'/'３'/'４' 等)
 */
export function getCustomerCourseKey(customer) {
    const PLAN_TO_COURSE = {
        '１クラス':'１','1クラス':'１',
        '２クラス':'２','2クラス':'２',
        '３クラス':'３','3クラス':'３',
        '４クラス':'４','4クラス':'４',
        '1.5hクラス':'１'
    };
    return customer.course || PLAN_TO_COURSE[customer.plan] || '１';
}

/**
 * 当月のattendance_YYYYMMから「90分授業に出席記録がある生徒」の氏名Setを構築
 * 出席記録あり = week1〜week5のいずれかが '○' / '×' / '休講'
 * @param {Object} attendanceData - { '曜日_場所_クラス名_姓名': { _plan, week1..week5 } }
 * @param {Object} timeSchedule - { 曜日: [{ time: 'HH:MM-HH:MM', name }] }
 * @returns {Set<string>} `lastName + firstName` の集合
 */
export function getStudentNamesIn15hClasses(attendanceData, timeSchedule) {
    const result = new Set();
    if (!attendanceData || !timeSchedule) return result;
    const toMin = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + (m || 0); };
    const namesByDay = {};
    Object.entries(timeSchedule).forEach(([day, classes]) => {
        const set = new Set();
        (classes || []).forEach(cls => {
            if (!cls.time || !cls.name) return;
            const [start, end] = cls.time.split('-');
            if (!start || !end) return;
            if (toMin(end) - toMin(start) === 90) set.add(cls.name);
        });
        namesByDay[day] = set;
    });
    const hasMark = (rec) => rec && ['week1','week2','week3','week4','week5'].some(w => ['○','×','休講'].includes(rec[w]));
    Object.entries(attendanceData).forEach(([key, record]) => {
        if (!hasMark(record)) return;
        const firstUs = key.indexOf('_');
        if (firstUs < 0) return;
        const day = key.slice(0, firstUs);
        const dayNames = namesByDay[day];
        if (!dayNames || dayNames.size === 0) return;
        for (const cn of dayNames) {
            const sep = `_${cn}_`;
            const idx = key.indexOf(sep, firstUs + 1);
            if (idx > 0) {
                const name = key.slice(idx + sep.length);
                if (name) result.add(name);
                break;
            }
        }
    });
    return result;
}

/**
 * 入会中顧客をプラン別（コース1-4）に集計
 * @param {Array} customers - 全顧客配列
 * @param {Object} courseColors - コースキー → 色のマップ
 * @param {Set<string>} students15hSet - 1.5h授業在籍生徒の氏名Set（getStudentNamesIn15hClassesの戻り値）
 * @returns {Array<{course, count, count15h, color}>} 人数0のコースは含めない（４→１の降順）
 */
export function getCustomerCountByCourse(customers, courseColors, students15hSet) {
    const counts = {};
    const counts15h = {};
    const set15h = students15hSet || new Set();
    customers.filter(c => c.status === '入会中').forEach(c => {
        const k = getCustomerCourseKey(c);
        counts[k] = (counts[k] || 0) + 1;
        const fullName = (c.lastName || '') + (c.firstName || '');
        if (set15h.has(fullName)) {
            counts15h[k] = (counts15h[k] || 0) + 1;
        }
    });
    const order = ['４','３','２','１'];
    return order
        .filter(c => counts[c] > 0)
        .map(course => ({
            course,
            count: counts[course],
            count15h: counts15h[course] || 0,
            color: (courseColors && courseColors[course]) || '#6b7280'
        }));
}

/**
 * 顧客が受講中のクラス一覧を scheduleData から抽出
 * @param {Object} customer - { lastName, firstName }
 * @param {Object} scheduleData
 * @returns {Array<{day, location, name, teacher, color}>}
 */
export function getCustomerClasses(customer, scheduleData) {
    if (!customer || !scheduleData) return [];
    const fullName = (customer.lastName || '') + (customer.firstName || '');
    if (!fullName) return [];
    const days = ['月曜日','火曜日','水曜日','木曜日','金曜日'];
    const out = [];
    days.forEach(day => {
        const classes = scheduleData[day] || [];
        classes.forEach(cls => {
            const hit = (cls.students || []).some(s => ((s.lastName||'') + (s.firstName||'')) === fullName);
            if (hit) {
                const m = (cls.name || '').match(/[A-Z]+$/);
                const teacher = m ? m[0] : '';
                out.push({
                    day,
                    location: cls.location || cls.venue || '',
                    name: cls.name || '',
                    teacher,
                    color: cls.color || ''
                });
            }
        });
    });
    return out;
}
