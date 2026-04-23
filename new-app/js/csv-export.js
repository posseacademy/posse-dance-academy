// POSSE Dance Academy - CSV Export Module
// UTF-8 BOM付きCSVファイルのダウンロード

import { getCustomerClasses } from './utils.js?v=7';

/**
 * CSVファイルをダウンロード
 * @param {string} filename - ファイル名
 * @param {string[][]} rows - 行データ（1行目がヘッダー）
 */
export function downloadCSV(filename, rows) {
    const bom = '\uFEFF';
    const csv = rows.map(row =>
        row.map(cell => {
            const s = String(cell ?? '');
            return s.includes(',') || s.includes('"') || s.includes('\n')
                ? '"' + s.replace(/"/g, '""') + '"'
                : s;
        }).join(',')
    ).join('\n');
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * 顧客一覧CSV書き出し
 * getEmptyCustomer() の全フィールド＋計算年齢＋受講クラスを出力。
 * 列の追加・順序変更時は header と rows の対応を必ず合わせること。
 * @param {Array} customers - 顧客配列
 * @param {Object} [scheduleData] - 受講クラス列を出力する場合に必須。未指定時は空欄
 */
export function exportCustomersCSV(customers, scheduleData) {
    // 年齢計算（utils.js::calculateAge と同等、依存回避のためインライン実装）
    const calcAge = (birthDate) => {
        if (!birthDate) return '';
        const t = new Date();
        const b = new Date(birthDate);
        let age = t.getFullYear() - b.getFullYear();
        const m = t.getMonth() - b.getMonth();
        if (m < 0 || (m === 0 && t.getDate() < b.getDate())) age--;
        return isNaN(age) ? '' : String(age);
    };
    const yn = (v) => v === true ? '○' : v === false ? '' : (v || '');

    const header = [
        '会員番号', '会員ステータス', '家族会員', 'プラン', 'プラン更新月',
        '姓', '名', '読み', '保護者名', 'ハコモノ登録名', 'ハコモノ登録',
        '性別', '生年月日', '年齢',
        '電話番号1', '電話番号2', 'メール',
        '郵便番号', '都道府県', '市区町村', '番地', '建物・部屋番号',
        '入会日', '入会金支払済', '入会金支払日',
        '年会費更新日', '年会費支払済', '年会費支払月',
        '受講クラス',
        '備考'
    ];
    const dayShort = {'月曜日':'月','火曜日':'火','水曜日':'水','木曜日':'木','金曜日':'金'};
    const rows = [header];
    customers.forEach(c => {
        rows.push([
            c.memberNumber || '',
            c.status || '',
            yn(c.isFamilyMember),
            c.course || '',
            c.planUpdatedAt || '',
            c.lastName || '',
            c.firstName || '',
            c.reading || '',
            c.guardianName || '',
            c.hakomonoName || '',
            c.hakomonoRegistration || '',
            c.gender || '',
            c.birthDate || '',
            calcAge(c.birthDate),
            c.phone1 || '',
            c.phone2 || '',
            c.email || '',
            c.postalCode || '',
            c.prefecture || '',
            c.city || '',
            c.address || '',
            c.building || '',
            c.joinDate || '',
            yn(c.enrollmentFeePaid),
            c.enrollmentFeeDate || '',
            c.annualFee || '',
            yn(c.annualFeePaid),
            c.annualFeeMonth || '',
            (() => {
                if (!scheduleData) return '';
                const classes = getCustomerClasses(c, scheduleData);
                return classes.map(x => `${dayShort[x.day]||x.day[0]}/${x.location}/${x.name}`).join(' | ');
            })(),
            c.memo || ''
        ]);
    });
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    downloadCSV(`顧客一覧_${today}.csv`, rows);
}

/**
 * 出席名簿 月別CSV書き出し
 */
export function exportAttendanceMonthlyCSV(scheduleData, attendanceData, selectedMonth, isRegularPlan) {
    const header = ['曜日', '場所', 'クラス名', '生徒名', 'プラン', 'W1', 'W2', 'W3', 'W4', 'W5', '出席率'];
    const rows = [header];
    const days = ['月曜日', '火曜日', '水曜日', '木曜日', '金曜日'];
    days.forEach(day => {
        const classes = scheduleData[day] || [];
        classes.forEach(cls => {
            const students = cls.students || [];
            students.forEach(student => {
                const classId = `${day}_${cls.location || cls.venue}_${cls.name}_${student.lastName}${student.firstName}`;
                const att = attendanceData[classId];
                // Non-regular: only include if they have attendance data
                if (!isRegularPlan(student.plan) && !att) return;
                const attData = att || {};
                const weeks = ['week1', 'week2', 'week3', 'week4', 'week5'].map(w => attData[w] || '');
                const attended = weeks.filter(w => w === '○').length;
                const total = weeks.filter(w => w === '○' || w === '×').length;
                const rate = total > 0 ? Math.round((attended / total) * 100) + '%' : '0%';
                rows.push([
                    day, cls.location || cls.venue || '', cls.name,
                    `${student.lastName}${student.firstName}`, attData._plan || student.plan || '',
                    ...weeks, rate
                ]);
            });
        });
    });
    downloadCSV(`出席名簿_${selectedMonth.replace('-', '')}.csv`, rows);
}

/**
 * 出席名簿 年間CSV書き出し
 */
export async function exportAttendanceYearlyCSV(scheduleData, selectedMonth, isRegularPlan, loadAttendance) {
    const year = selectedMonth.slice(0, 4);
    const header = ['月', '曜日', '場所', 'クラス名', '生徒名', 'プラン', 'W1', 'W2', 'W3', 'W4', 'W5', '出席率'];
    const rows = [header];
    const days = ['月曜日', '火曜日', '水曜日', '木曜日', '金曜日'];
    for (let m = 1; m <= 12; m++) {
        const monthStr = `${year}-${String(m).padStart(2, '0')}`;
        let attData;
        try {
            attData = await loadAttendance(monthStr);
        } catch { attData = {}; }
        if (!attData || Object.keys(attData).length === 0) continue;
        days.forEach(day => {
            const classes = scheduleData[day] || [];
            classes.forEach(cls => {
                (cls.students || []).forEach(student => {
                    const classId = `${day}_${cls.location || cls.venue}_${cls.name}_${student.lastName}${student.firstName}`;
                    const att = attData[classId];
                    if (!isRegularPlan(student.plan) && !att) return;
                    const ad = att || {};
                    const weeks = ['week1', 'week2', 'week3', 'week4', 'week5'].map(w => ad[w] || '');
                    const attended = weeks.filter(w => w === '○').length;
                    const total = weeks.filter(w => w === '○' || w === '×').length;
                    const rate = total > 0 ? Math.round((attended / total) * 100) + '%' : '0%';
                    rows.push([
                        `${year}年${m}月`, day, cls.location || cls.venue || '', cls.name,
                        `${student.lastName}${student.firstName}`, attData._plan || student.plan || '',
                        ...weeks, rate
                    ]);
                });
            });
        });
    }
    downloadCSV(`出席名簿_${year}年間.csv`, rows);
}

/**
 * 売上 月別CSV書き出し
 */
export function exportRevenueMonthlyCSV(revenueData, selectedMonth) {
    const header = ['カテゴリ', '項目', '金額'];
    const rows = [header];
    if (revenueData.tuition) {
        rows.push(['月謝', '月謝合計', revenueData.tuition.total || 0]);
        if (revenueData.tuition.details) {
            revenueData.tuition.details.forEach(d => {
                rows.push(['月謝', d.name || d.course || '', d.amount || 0]);
            });
        }
    }
    if (revenueData.visitor) {
        rows.push(['ビジター', 'ビジター合計', revenueData.visitor.total || 0]);
        if (revenueData.visitor.details) {
            revenueData.visitor.details.forEach(d => {
                rows.push(['ビジター', `${d.name || ''} (${d.plan || ''})`, d.amount || 0]);
            });
        }
    }
    if (revenueData.event) {
        rows.push(['イベント', 'イベント合計', revenueData.event.total || 0]);
    }
    if (revenueData.practice) {
        rows.push(['練習会', '練習会合計', revenueData.practice.total || 0]);
    }
    if (revenueData.enrollment) {
        rows.push(['入会金', '入会金合計', revenueData.enrollment.total || 0]);
    }
    if (revenueData.annualFee) {
        rows.push(['年会費', '年会費合計', revenueData.annualFee.total || 0]);
    }
    rows.push(['', '総合計', revenueData.grandTotal || 0]);
    downloadCSV(`売上_${selectedMonth.replace('-', '')}.csv`, rows);
}

/**
 * 売上 年間CSV書き出し
 */
export function exportRevenueYearlyCSV(yearlyData, year) {
    const header = ['月', '月謝', 'ビジター', 'イベント', '練習会', '入会金', '年会費', '合計'];
    const rows = [header];
    let totals = { tuition: 0, visitor: 0, event: 0, practice: 0, enrollment: 0, annualFee: 0, grand: 0 };
    yearlyData.forEach(md => {
        const t = md.tuition || 0;
        const v = md.visitor || 0;
        const e = md.event || 0;
        const p = md.practice || 0;
        const en = md.enrollment || 0;
        const af = md.annualFee || 0;
        const g = t + v + e + p + en + af;
        totals.tuition += t; totals.visitor += v; totals.event += e; totals.practice += p; totals.enrollment += en; totals.annualFee += af; totals.grand += g;
        rows.push([md.month, t, v, e, p, en, af, g]);
    });
    rows.push(['年間合計', totals.tuition, totals.visitor, totals.event, totals.practice, totals.enrollment, totals.annualFee, totals.grand]);
    downloadCSV(`売上_${year}年間.csv`, rows);
}
