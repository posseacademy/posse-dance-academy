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
      if (attendance[week] === 'â') {
        const parts = key.split('_');
        const day = parts[0];
        const location = parts[1];
        const className = parts[2];
        const studentName = parts.slice(3).join('_');

        const classData = scheduleData[day]?.find(c => c.location === location && c.name === className);
        const student = classData?.students.find(s =>  ${s.lastName}${s.firstName}` === studentName);

        // Only count visitor/trial/free plans
        if (student && (student.plan.includes('ãã¸ã¿ã¼') || student.plan.includes('ä½é¨') || student.plan.includes('ç¡æ'))) {
          if (pricing[student.plan]) {
            revenue += pricing[student.plan];
          }
        } else if (!student) {
          const attPlan = attendance._plan;
          const _isVT = attPlan && (
            attPlan.includes('ãã¸ã¿ã¼') ||
            attPlan.includes('ä½é¨') ||
            attPlan.includes('ç¡æ') ||
            attPlan === 'æè¬ã¯ã©ã¹æ¯æ¿' ||
            attPlan === 'ç·´ç¿ä¼'
          );

          if (_isVT && pricing[attPlan]) {
            revenue += pricing[attPlan];
          } else if (!attPlan) {
            const pMap = {
              'ååä½é¨': 'ååä½é¨',
              'ååç¡æ': 'ååç¡æ',
              'ãã¸ã¿ã¼ä¼å¡': 'ãã¸ã¿ã¼ï¼ä¼å¡ï¼',
              'ãã¸ã¿ã¼éä¼å¡': 'ãã¸ã¿ã¼ï¼éä¼å¡ï¼',
              'ãã¸ã¿ã¼1.5hä¼å¡': 'ãã¸ã¿ã¼1.5hï¼ä¼å¡ï¼',
              'ãã¸ã¿ã¼1.5héä¼å¡': 'ãã¸ã¿ã¼1.5hï¼éä¼å¡ï¼',
              'ãã¸ã¿ã¼ï¼ä¼å¡ï¼': 'ãã¸ã¿ã¼ï¼ä¼å¡ï¼',
              'ãã¸ã¿ã¼ï¼éä¼å¡ï¼': 'ãã¸ã¿ã¼ï¼éä¼å¡ï¼',
              'æè¬ã¯ã©ã¹æ¯æ¿': 'æè¬ã¯ã©ã¹æ¯æ¿'
            };
            const plan = pMap[studentName];
            if (plan && pricing[plan]) {
              revenue += pricing[plan];
            } else if (!plan && studentName) {
              let _m = false;
              ['æææ¥', 'ç«ææ¥', 'æ°´ææ¥', 'æ¨ææ¥', 'éææ¥'].forEach(d => {
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
              revenue += _m ? (pricing['æè¬ã¯ã©ã¹æ¯æ¿'] || 1000) : (pricing['ãã¸ã¿ã¼ï¼ä¼å¡ï¼'] || 2000);
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

  ['æææ¥', 'æ¨ææ¥'].forEach(day => {
    const key = `ç·´ç¿ä¼_${day}`;
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
    ['ç·´ç¿ä¼', 'ãã¸ã¿ã¼ï¼ä¼å¡ï¼', 'ãã¸ã¿ã¼ï¼éä¼å¡ï¼', 'ãã¸ã¿ã¼1.5hï¼ä¼å¡ï¼', 'ãã¸ã¿ã¼1.5hï¼éä¼å¡ï¼', 'æè¬ã¯ã©ã¹æ¯æ¿', 'ååä½é¨', 'ååç¡æ'].forEach(k => r[k] = { count: 0, revenue: 0 });
    if (_ovr.visitor > 0) r['ãã¸ã¿ã¼ï¼ä¼å¡ï¼'] = { count: Math.round(_ovr.visitor / 2000), revenue: _ovr.visitor };
    if (_ovr.trial > 0) r['ååä½é¨'] = { count: Math.round(_ovr.trial / 1000), revenue: _ovr.trial };
    return r;
  }

  const categories = {
    'ç·´ç¿ä¼': { count: 0, revenue: 0 },
    'ãã¸ã¿ã¼ï¼ä¼å¡ï¼': { count: 0, revenue: 0 },
    'ãã¸ã¿ã¼ï¼éä¼å¡ï¼': { count: 0, revenue: 0 },
    'ãã¸ã¿ã¼1.5hï¼ä¼å¡ï¼': { count: 0, revenue: 0 },
    'ãã¸ã¿ã¼1.5hï¼éä¼å¡ï¼': { count: 0, revenue: 0 },
    'æè¬ã¯ã©ã¹æ¯æ¿': { count: 0, revenue: 0 },
    'ååä½é¨': { count: 0, revenue: 0 },
    'ååç¡æ': { count: 0, revenue: 0 }
  };

  // Practice revenue
  const practice = calculatePracticeRevenue(attendanceData);
  categories['ç·´ç¿ä¼'] = { count: practice.participants, revenue: practice.revenue };

  // Visitor/trial revenue
  const weeks = ['week1', 'week2', 'week3', 'week4', 'week5'];
  Object.keys(attendanceData).forEach(key => {
    if (key.startsWith('ç·´ç¿ä¼_')) return;

    const attendance = attendanceData[key];
    weeks.forEach(week => {
      if (attendance[week] === 'â') {
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
            'ååä½é¨': 'ååä½é¨',
            'ååç¡æ': 'ååç¡æ',
            'ãã¸ã¿ã¼ä¼å¡': 'ãã¸ã¿ã¼ï¼ä¼å¡ï¼',
            'ãã¸ã¿ã¼éä¼å¡': 'ãã¸ã¿ã¼ï¼éä¼å¡ï¼',
            'ãã¸ã¿ã¼1.5hä¼å¡': 'ãã¸ã¿ã¼1.5hï¼ä¼å¡ï¼',
            'ãã¸ã¿ã¼1.5héä¼å¡': 'ãã¸ã¿ã¼1.5hï¼éä¼å¡ï¼',
            'ãã¸ã¿ã¼ï¼ä¼å¡ï¼': 'ãã¸ã¿ã¼ï¼ä¼å¡ï¼',
            'ãã¸ã¿ã¼ï¼éä¼å¡ï¼': 'ãã¸ã¿ã¼ï¼éä¼å¡ï¼',
            'æè¬ã¯ã©ã¹æ¯æ¿': 'æè¬ã¯ã©ã¹æ¯æ¿'
          };
          plan = pMap[studentName] || (() => {
            let _m2 = false;
            ['æææ¥', 'ç«ææ¥', 'æ°´ææ¥', 'æ¨ææ¥', 'éææ¥'].forEach(d => {
              const dd = scheduleData?.[d];
              if (dd) {
                dd.forEach(c => {
                  if (c.students?.some(s => (s.lastName + (s.firstName || '')).trim() === studentName)) {
                    _m2 = true;
                  }
                });
              }
            });
            return _m2 ? 'æè¬ã¯ã©ã¹æ¯æ¿' : 'ãã¸ã¿ã¼ï¼ä¼å¡ï¼';
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
    if (c.status === 'å¥ä¼ä¸­' && c.plan) {
      // Extract the number from the plan (e.g., "3ã¯ã©ã¹" -> "3")
      const match = c.plan.match(/([ï¼ï¼ï¼ï¼1234])/);
      if (match) {
        const num = match[1]
          .replace('ï¼', '1').replace('ï¼', '2')
          .replace('ï¼', '3').replace('ï¼', '4');
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
  return `Â¥${amount.toLocaleString()}`;
}

/**
 * Convert full-width numbers to half-width
 */
export function toHalfWidth(str) {
  return str.replace(/[ï¼-ï¼]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
}

/**
 * Generate CSV from customer data
 */
export function generateCustomerCSV(customers) {
  const headers = ['ID', 'å§', 'å', 'ãã©ã³', 'ã¹ãã¼ã¿ã¹', 'å¥ä¼æ¥', 'é»è©±çªå·', 'ã¡ã¼ã«'];
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
