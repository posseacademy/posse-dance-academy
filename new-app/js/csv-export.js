// POSSE Dance Academy - CSV Export Module
// UTF-8 BOM付きCSVファイルのダウンロード

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
 */
export function exportCustomersCSV(customers) {
    const header = ['会員番号', '姓', '名', '読み', '性別', '生年月日', '電話番号', 'メール', 'コース', 'プラン', 'ステータス', '入会日', '備考'];
    const rows = [header];
    customers.forEach(c => {
        rows.push([
            c.memberNumber || '',
            c.lastName || '',
            c.firstName || '',
            c.reading || '',
            c.gender || '',
            c.birthDate || '',
            c.phone || '',
            c.email || '',
            c.course || '',
            c.plan || '',
            c.status || '',
            c.joinDate || '',
            c.notes || ''
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
                    `${student.lastName}${student.firstName}`, student.plan || '',
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
                        `${student.lastName}${student.firstName}`, student.plan || '',
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
    rows.push(['', '総合計', revenueData.grandTotal || 0]);
    downloadCSV(`売上_${selectedMonth.replace('-', '')}.csv`, rows);
}

/**
 * 売上 年間CSV書き出し
 */
export function exportRevenueYearlyCSV(yearlyData, year) {
    const header = ['月', '月謝', 'ビジター', 'イベント', '練習会', '合計'];
    const rows = [header];
    let totals = { tuition: 0, visitor: 0, event: 0, practice: 0, grand: 0 };
    yearlyData.forEach(md => {
        const t = md.tuition || 0;
        const v = md.visitor || 0;
        const e = md.event || 0;
        const p = md.practice || 0;
        const g = t + v + e + p;
        totals.tuition += t; totals.visitor += v; totals.event += e; totals.practice += p; totals.grand += g;
        rows.push([md.month, t, v, e, p, g]);
    });
    rows.push(['年間合計', totals.tuition, totals.visitor, totals.event, totals.practice, totals.grand]);
    downloadCSV(`売上_${year}年間.csv`, rows);
}
