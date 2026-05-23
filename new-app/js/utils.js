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
    const regularPlans = ['1クラス', '１クラス', '2クラス', '２クラス', '3クラス', '３クラス', '4クラス', '４クラス', '1.5hクラス', 'ハーフ'];
    return regularPlans.includes(plan);
}

/**
 * クラスの「実効場所」を月別に解決する
 * 場所変更の履歴を持つクラス (prevLocation + locationFrom) は、選択月によって旧/新を返す
 * @param {Object} cls - schedule のクラスエントリ
 * @param {string} month - 'YYYY-MM' 形式の選択月
 * @returns {string} その月における場所
 */
export function effectiveLocation(cls, month) {
    if (!cls) return '';
    const baseLoc = cls.location || cls.venue || '';
    if (cls.locationFrom && cls.prevLocation && month && month < cls.locationFrom) {
        return cls.prevLocation;
    }
    return baseLoc;
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
 * 入会中顧客をプラン別に集計（網羅型）
 * 「入会中」総数と必ず一致するように、すべてのプランを以下のいずれかにマップする：
 *   1〜4クラス / 1.5hクラス / ハーフ / ビジター（会員）/ その他
 * @param {Array} customers - 全顧客配列
 * @param {Object} courseColors - コースキー → 色のマップ
 * @returns {Array<{course, label, count, count15h, color, otherStudents?}>}
 *   人数0の行は含めない。1〜4クラス（４→１降順）→ 1.5hクラス → ハーフ → ビジター（会員）→ その他
 */
export function getCustomerCountByCourse(customers, courseColors) {
    const PLAN_MAP = {
        '１クラス':'１', '1クラス':'１',
        '２クラス':'２', '2クラス':'２',
        '３クラス':'３', '3クラス':'３',
        '４クラス':'４', '4クラス':'４'
    };
    const counts = {};
    const counts15h = {};
    let count15hPlan = 0;
    let countHalf = 0;
    let countVisitorMember = 0;
    const others = [];

    customers.filter(c => c.status === '入会中').forEach(c => {
        const k = PLAN_MAP[c.plan];
        if (k) {
            counts[k] = (counts[k] || 0) + 1;
            if (c.has15hClass) {
                counts15h[k] = (counts15h[k] || 0) + 1;
            }
            return;
        }
        if (c.plan === '1.5hクラス') {
            count15hPlan++;
            return;
        }
        // ハーフ: 月2回（隔週）の半額プラン。plan未設定でcourse='ハーフ'のレガシーも吸収
        if (c.plan === 'ハーフ' || (!c.plan && c.course === 'ハーフ')) {
            countHalf++;
            return;
        }
        if (c.plan === 'ビジター（会員）' || (!c.plan && c.course === 'ビジター')) {
            countVisitorMember++;
            return;
        }
        others.push(c);
    });

    const result = [];
    ['４','３','２','１'].forEach(course => {
        if (counts[course] > 0) {
            result.push({
                course,
                label: `プラン${course}`,
                count: counts[course],
                count15h: counts15h[course] || 0,
                color: (courseColors && courseColors[course]) || '#6b7280'
            });
        }
    });
    if (count15hPlan > 0) {
        result.push({ course: '1.5h', label: '1.5hクラス', count: count15hPlan, count15h: 0, color: '#a78bfa' });
    }
    if (countHalf > 0) {
        result.push({ course: 'HALF', label: 'ハーフ（月2回）', count: countHalf, count15h: 0, color: '#f59e0b' });
    }
    if (countVisitorMember > 0) {
        result.push({ course: 'V', label: 'ビジター（会員）', count: countVisitorMember, count15h: 0, color: '#9ca3af' });
    }
    if (others.length > 0) {
        result.push({
            course: 'OTHER',
            label: 'その他',
            count: others.length,
            count15h: 0,
            color: '#ef4444',
            otherStudents: others.map(c => ({
                name: `${c.lastName || ''}${c.firstName || ''}`.trim() || '(名前未設定)',
                plan: c.plan || '(プラン未設定)',
                course: c.course || '',
                memberNumber: c.memberNumber || ''
            }))
        });
    }
    return result;
}

/**
 * 当月のクラス出席対象者一覧を計算（attendance ビューと同じロジック）
 * - schedule.students のうち isRegularPlan + enrolledFrom/leftAt の在籍範囲内
 * - + attendance_YYYYMM 由来のビジター（_plan が non-regular で記録あり）
 * - + attendance_YYYYMM 由来の過去在籍レギュラー（schedule に居ないが記録あり）
 * @returns {{regulars, pastRegulars, visitors, total}}
 */
export function getClassStudentsForMonth(cls, day, attendanceData, customers, selectedMonth) {
    const effLoc = effectiveLocation(cls, selectedMonth);
    const _hasMark = (rec) => rec && ['week1','week2','week3','week4','week5'].some(w => ['○','×','休講'].includes(rec[w]));
    const _inRange = (s) => {
        if (s.enrolledFrom && s.enrolledFrom > selectedMonth) return false;
        if (s.leftAt && selectedMonth >= s.leftAt) return false;
        return true;
    };
    const regulars = (cls.students || [])
        .filter(s => isRegularPlan(s.plan))
        .filter(_inRange);
    const seen = new Set(regulars.map(s => s.lastName + s.firstName));
    const prefix = `${day}_${effLoc}_${cls.name}_`;
    const pastRegulars = [];
    const visitors = [];

    for (const key of Object.keys(attendanceData || {})) {
        if (!key.startsWith(prefix)) continue;
        if (key.startsWith('練習会_')) continue;
        const rec = attendanceData[key];
        if (!rec || typeof rec !== 'object') continue;
        const nameCombined = key.slice(prefix.length);
        if (seen.has(nameCombined)) continue;

        const p = rec._plan;
        if (p && !isRegularPlan(p)) {
            seen.add(nameCombined);
            visitors.push({ name: nameCombined, plan: p });
        } else if (_hasMark(rec)) {
            // schedule に登録があり leftAt で当月から除外されたレギュラーは
            // 過去在籍にも入れない（当月以降の集計から外す）
            const fromSchedule = (cls.students || []).find(s => (s.lastName + s.firstName) === nameCombined);
            if (fromSchedule && fromSchedule.leftAt && selectedMonth >= fromSchedule.leftAt) continue;
            seen.add(nameCombined);
            let planLabel = (p && isRegularPlan(p)) ? p : null;
            if (!planLabel) {
                const c = (customers || []).find(c => (c.lastName + c.firstName) === nameCombined);
                planLabel = c?.plan || '１クラス';
            }
            pastRegulars.push({ name: nameCombined, plan: planLabel });
        }
    }

    return {
        regulars,
        pastRegulars,
        visitors,
        total: regulars.length + pastRegulars.length + visitors.length
    };
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
