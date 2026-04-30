// POSSE Dance Academy - CSV Export Module
// UTF-8 BOM付きCSVファイルのダウンロード

import { getCustomerClasses } from './utils.js?v=9';

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
        'プラン1', '講師', 'プラン2', '講師', 'プラン3', '講師', 'プラン4', '講師', 'プラン5', '講師',
        '備考'
    ];
    const dayShort = {'月曜日':'月','火曜日':'火','水曜日':'水','木曜日':'木','金曜日':'金'};
    // クラスを2列表記に分割: クラス列「曜日/場所/クラス名(先生除去)」、講師列「先生名」
    const formatClassName = (x) => {
        const nameWithoutTeacher = (x.name || '').replace(/\s+[A-Z]+$/, '').trim();
        return `${dayShort[x.day]||x.day[0]}/${x.location}/${nameWithoutTeacher}`;
    };
    // 6クラス以上のオーバーフロー用（コンパクト・1行表記、クラス間はパイプ）
    const formatClassCompact = (x) => `${dayShort[x.day]||x.day[0]}/${x.location}/${x.name}`;
    const rows = [header];
    customers.forEach(c => {
        const classes = scheduleData ? getCustomerClasses(c, scheduleData) : [];
        // 5スロット × (クラス, 講師) の10要素
        const planCells = ['', '', '', '', '', '', '', '', '', ''];
        classes.forEach((x, i) => {
            if (i < 5) {
                planCells[i * 2] = formatClassName(x);       // プラン列
                planCells[i * 2 + 1] = x.teacher || '';     // 講師列
            } else {
                // 6クラス目以降は5列目(プラン5)にコンパクト1行で連結、講師列も | で連結
                planCells[8] = `${planCells[8]} | ${formatClassCompact(x)}`;
                planCells[9] = planCells[9] ? `${planCells[9]} | ${x.teacher || ''}` : (x.teacher || '');
            }
        });
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
            ...planCells,
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

