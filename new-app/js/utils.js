import { pricing, visitorRevenueOverrides } from './config.js';

/**
 * Calculate visitor revenue for the selected month
 * CRITICAL: This is the corrected version - only counts visitor/trial/free/transfer/practice plans
 */
export function calculateVisitorRevenue(selectedMonth, attendanceData, scheduleData) {
  const _ovr = visitorRevenueOverrides?.[(selectedMonth || '').replace(/-/g, '')];
  if (_ovr) return _ovr.total;

  let revenue = 0;

  Object.keys(attendanceData).forEach(key => {
    const attendance = attendanceData[key];
    const weeks = ['week1', 'week2', 'week3', 'week4', 'week5'];

    weeks.forEach(week => {
      if (attendance[week] === '○') {
        const parts = key.split('_');
        const day = parts[0];
        const location = parts[1];
        const className = parts[2];
        const studentName = parts.slice(3).join('_');

        const classData = scheduleData[day]?.find(c => c.location === location && c.name === className);
        const student = classData?.students.find(s => `${s.lastName}${s.firstName}` === studentName);

        // Only count visitor/trial/free plans
        if (student && (student.plan.includes('ビジター') || student.plan.includes('体験') || student.plan.includes('無料'))) {
          if (pricing[student.plan]) {
            revenue += pricing[student.plan];
          }
        } else if (!student) {
          const attPlan = attendance._plan;
          const _isVT = attPlan && (
            attPlan.includes('ビジター') ||
            attPlan.includes('体験') ||
            attPlan.includes('無料') ||
            attPlan === '月謝クラス振替' ||
            attPlan === '練習会'
          );

          if (_isVT && pricing[attPlan]) {
            revenue += pricing[attPlan];
          } else if (!attPlan) {
            const pMap = {
              '初回体験': '初回体験',
              '初回無料': '初回無料',
              'ビジター会員': 'ビジター（会員）',
              'ビジター非会員': 'ビジター（非会員）',
              'ビジター1.5h会員': 'ビジター1.5h（会員）',
              'ビジター1.5h非会員': 'ビジター1.5h（非会員）',
              'ビジター（会員）': 'ビジター（会員）',
              'ビジター（非会員）': 'ビジター（非会員）',
              '月謝クラス振替': '月謝クラス振替'
            };
            const plan = pMap[studentName];
            if (plan && pricing[plan]) {
              revenue += pricing[plan];
            } else if (!plan && studentName) {
              let _m = false;
              ['月曜日', '火曜日', '水曜日', '木曜日', '金曜日'].forEach(d => {
                const dd = scheduleData?.[d];
                if (dd) {
                  // dd is an array of classes
                  dd.forEach(c => {
                    if (c.students?.some(s => (s.lastName + (s.firstName || '')).trim() === studentName)) {
                      _m = true;
                    }
                  });
                }
              });
              revenue += _m ? (pricing['月謝クラス振替'] || 1000) : (pricing['ビジター（会員）'] || 2000);
            }
          }
        }
      }
    });
  });

  return revenue;
}

/**
 * Calculate practice session revenue
 */
export function calculatePracticeRevenue(attendanceData) {
  let totalParticipants = 0;
  const weeks = ['week1', 'week2', 'week3', 'week4', 'week5'];
  const details = {};

  ['月曜日', '木曜日'].forEach(day => {
    const key = `練習会_${day}`;
    const data = attendanceData[key];
    let dayTotal = 0;
    if (data) {
      weeks.forEach(week => {
        const count = parseInt(data[week]) || 0;
        dayTotal += count;
      });
    }
    details[day] = dayTotal;
    totalParticipants += dayTotal;
  });

  return {
    participants: totalParticipants,
    revenue: totalParticipants * 500,
    details
  };
}

/**
 * Calculate detailed revenue breakdown by category
 */
export function calculateDetailedRevenue(selectedMonth, attendanceData, scheduleData) {
  const _ovr = visitorRevenueOverrides?.[(selectedMonth || '').replace(/-/g, '')];
  if (_ovr) {
    const r = {};
    ['練習会', 'ビジター（会員）', 'ビジター（非会員）', 'ビジター1.5h（会員）', 'ビジター1.5h（非会員）', '月謝クラス振替', '初回体験', '初回無料'].forEach(k => r[k] = { count: 0, revenue: 0 });
    if (_ovr.visitor > 0) r['ビジター（会員）'] = { count: Math.round(_ovr.visitor / 2000), revenue: _ovr.visitor };
    if (_ovr.trial > 0) r['初回体験'] = { count: Math.round(_ovr.trial / 1000), revenue: _ovr.trial };
    return r;
  }

  const categories = {
    '練習会': { count: 0, revenue: 0 },
    'ビジター（会員）': { count: 0, revenue: 0 },
    'ビジター（非会員）': { count: 0, revenue: 0 },
    'ビジター1.5h（会員）': { count: 0, revenue: 0 },
    'ビジター1.5h（非会員）': { count: 0, revenue: 0 },
    '月謝クラス振替': { count: 0, revenue: 0 },
    '初回体験': { count: 0, revenue: 0 },
    '初回無料': { count: 0, revenue: 0 }
  };

  // Practice revenue
  const practice = calculatePracticeRevenue(attendanceData);
  categories['練習会'] = { count: practice.participants, revenue: practice.revenue };

  // Visitor/trial revenue
  const weeks = ['week1', 'week2', 'week3', 'week4', 'week5'];
  Object.keys(attendanceData).forEach(key => {
    if (key.startsWith('練習会_')) return;

    const attendance = attendanceData[key];
    weeks.forEach(week => {
      if (attendance[week] === '○') {
        const parts = key.split('_');
        const day = parts[0];
        const location = parts[1];
        const className = parts[2];
        const studentName = parts.slice(3).join('_');

        const classData = scheduleData[day]?.find(c => c.location === location && c.name === className);
        const student = classData?.students.find(s => `${s.lastName}${s.firstName}` === studentName);

        let plan = student?.plan;
        if (!plan) {
          plan = attendance._plan;
        }
        if (!plan) {
          const pMap = {
            '初回体験': '初回体験',
            '初回無料': '初回無料',
            'ビジター会員': 'ビジター（会員）',
            'ビジター非会員': 'ビジター（非会員）',
            'ビジター1.5h会員': 'ビジター1.5h（会員）',
            'ビジター1.5h非会員': 'ビジター1.5h（非会員）',
            'ビジター（会員）': 'ビジター（会員）',
            'ビジター（非会員）': 'ビジター（非会員）',
            '月謝クラス振替': '月謝クラス振替'
          };
          plan = pMap[studentName] || (() => {
            let _m2 = false;
            ['月曜日', '火曜日', '水曜日', '木曜日', '金曜日'].forEach(d => {
              const dd = scheduleData?.[d];
              if (dd) {
                dd.forEach(c => {
                  if (c.students?.some(s => (s.lastName + (s.firstName || '')).trim() === studentName)) {
                    _m2 = true;
                  }
                });
              }
            });
            return _m2 ? '月謝クラス振替' : 'ビジター（会員）';
          })();
        }

        if (plan && categories[plan] !== undefined) {
          const price = pricing[plan] || 0;
          categories[plan].count++;
          categories[plan].revenue += price;
        }
      }
    });
  });

  return categories;
}

/**
 * Calculate monthly tuition summary by course type
 */
export function calculateTuitionSummary(customers) {
  const summary = {};
  const planCounts = {};

  Object.values(customers).forEach(c => {
    if (c.status === '入会中' && c.plan) {
      // Extract the number from the plan (e.g., "3クラス" -> "3")
      const match = c.plan.match(/([１２３４1234])/);
      if (match) {
        const num = match[1]
          .replace('１', '1').replace('２', '2')
          .replace('３', '3').replace('４', '4');
        const key = num;
        if (!planCounts[key]) planCounts[key] = 0;
        planCounts[key]++;
      }
    }
  });

  return planCounts;
}

/**
 * Format currency for display
 */
export function formatCurrency(amount) {
  return `¥${amount.toLocaleString()}`;
}

/**
 * Convert full-width numbers to half-width
 */
export function toHalfWidth(str) {
  return str.replace(/[０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
}

/**
 * Generate CSV from customer data
 */
export function generateCustomerCSV(customers) {
  const headers = ['ID', '姓', '名', 'プラン', 'ステータス', '入会日', '電話番号', 'メール'];
  const rows = Object.entries(customers).map(([id, c]) => [
    id, c.lastName || '', c.firstName || '', c.plan || '',
    c.status || '', c.joinDate || '', c.phone || '', c.email || ''
  ]);

  const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
  return csv;
}

/**
 * Download data as JSON file
 */
export function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Download data as CSV file
 */
export function downloadCSV(csvString, filename) {
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvString], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
