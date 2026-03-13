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
 * @param {string} str - String containing Hiragana characters
 * @returns {string} String with Hiragana converted to Katakana
 */
export function hiraganaToKatakana(str) {
    return str.replace(/[\u3041-\u3096]/g, (match) => {
        return String.fromCharCode(match.charCodeAt(0) + 0x60);
    });
}

/**
 * Convert Katakana to Hiragana
 * @param {string} str - String containing Katakana characters
 * @returns {string} String with Katakana converted to Hiragana
 */
export function katakanaToHiragana(str) {
    return str.replace(/[\u30a1-\u30f6]/g, (match) => {
        return String.fromCharCode(match.charCodeAt(0) - 0x60);
    });
}

/**
 * Sort students by plan priority
 * @param {Array} students - Array of student objects with plan property
 * @param {Object} planOrder - Object mapping plan names to priority order
 * @returns {Array} Sorted array of students (original array not mutated)
 */
export function sortStudentsByPlan(students, planOrder) {
    return [...students].sort((a, b) => {
        const normalizePlan = (plan) => {
            return plan.replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
        };
        const planA = normalizePlan(a.plan);
        const planB = normalizePlan(b.plan);
        const orderA = planOrder[planA] || 999;
        const orderB = planOrder[planB] || 999;
        return orderA - orderB;
    });
}

/**
 * Check if plan is regular (monthly) vs visitor/trial
 * @param {string} plan - Plan name to check
 * @returns {boolean} True if plan is a regular monthly plan
 */
export function isRegularPlan(plan) {
    const regularPlans = ['1クラス', '１クラス', '2クラス', '２クラス', '3クラス', '３クラス', '4クラス', '４クラス', '1.5hクラス'];
    return regularPlans.includes(plan);
}

/**
 * Calculate visitor revenue
 * Complex calculation considering attendance data, schedule, pricing, and overrides
 * @param {Object} attendanceData - Attendance records keyed by class identifier
 * @param {Object} scheduleData - Schedule data keyed by day of week
 * @param {Object} pricing - Pricing map for different plan types
 * @param {Object} visitorRevenueOverrides - Month-specific overrides for visitor revenue
 * @param {string} selectedMonth - Currently selected month in YYYY-MM format
 * @returns {number} Total visitor revenue for the month
 */
export function calculateVisitorRevenue(attendanceData, scheduleData, pricing, visitorRevenueOverrides, selectedMonth) {
    const monthKey = (selectedMonth || '').replace(/-/g, '');
    const _ovr = visitorRevenueOverrides?.[monthKey];
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

                if (student && (student.plan.includes('ビジター') || student.plan.includes('体験') || student.plan.includes('無料'))) {
                    if (pricing[student.plan]) {
                        revenue += pricing[student.plan];
                    }
                } else if (!student) {
                    const attPlan = attendance._plan;
                    const _isVT = attPlan && (attPlan.includes('ビジター') || attPlan.includes('体験') || attPlan.includes('無料') || attPlan === '月謝クラス振替' || attPlan === '練習会');
                    if (_isVT && pricing[attPlan]) {
                        revenue += pricing[attPlan];
                    } else if (!attPlan) {
                        const pMap = {'初回体験':'初回体験','初回無料':'初回無料','ビジター会員':'ビジター（会員）','ビジター非会員':'ビジター（非会員）','ビジター1.5h会員':'ビジター1.5h（会員）','ビジター1.5h非会員':'ビジター1.5h（非会員）','ビジター（会員）':'ビジター（会員）','ビジター（非会員）':'ビジター（非会員）','月謝クラス振替':'月謝クラス振替'};
                        const plan = pMap[studentName];
                        if (plan && pricing[plan]) {
                            revenue += pricing[plan];
                        } else if (!plan && studentName) {
                            let _m = false;
                            ['月曜日','火曜日','水曜日','木曜日','金曜日'].forEach(d => {
                                const dd = scheduleData?.[d];
                                if (dd) Object.values(dd).forEach(c => {
                                    if (c.students?.some(s => (s.lastName + (s.firstName || '')).trim() === studentName)) _m = true;
                                });
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
 * @param {Object} attendanceData - Attendance records including practice session data
 * @returns {Object} Object with participants count, revenue, and day-by-day breakdown
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
    return { participants: totalParticipants, revenue: totalParticipants * 500, details };
}

/**
 * Calculate detailed revenue by category
 * Breaks down revenue by visitor type, trial, and other categories
 * @param {Object} attendanceData - Attendance records keyed by class identifier
 * @param {Object} scheduleData - Schedule data keyed by day of week
 * @param {Object} pricing - Pricing map for different plan types
 * @param {Object} visitorRevenueOverrides - Month-specific overrides for visitor revenue
 * @param {string} selectedMonth - Currently selected month in YYYY-MM format
 * @returns {Object} Revenue breakdown with count and revenue for each category
 */
export function calculateDetailedRevenue(attendanceData, scheduleData, pricing, visitorRevenueOverrides, selectedMonth) {
    const monthKey = (selectedMonth || '').replace(/-/g, '');
    const _ovr = visitorRevenueOverrides?.[monthKey];
    if (_ovr) {
        const r = {};
        ['練習会','ビジター（会員）','ビジター（非会員）','ビジター1.5h（会員）','ビジター1.5h（非会員）','月謝クラス振替','初回体験','初回無料'].forEach(k => r[k] = { count: 0, revenue: 0 });
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

    const practice = calculatePracticeRevenue(attendanceData);
    categories['練習会'] = { count: practice.participants, revenue: practice.revenue };

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
                if (!plan) plan = attendance._plan;
                if (!plan) {
                    const pMap = {'初回体験':'初回体験','初回無料':'初回無料','ビジター会員':'ビジター（会員）','ビジター非会員':'ビジター（非会員）','ビジター1.5h会員':'ビジター1.5h（会員）','ビジター1.5h非会員':'ビジター1.5h（非会員）','ビジター（会員）':'ビジター（会員）','ビジター（非会員）':'ビジター（非会員）','月謝クラス振替':'月謝クラス振替'};
                    plan = pMap[studentName] || (() => {
                        let _m2 = false;
                        ['月曜日','火曜日','水曜日','木曜日','金曜日'].forEach(d => {
                            const dd = scheduleData?.[d];
                            if (dd) Object.values(dd).forEach(c => {
                                if (c.students?.some(s => (s.lastName + (s.firstName || '')).trim() === studentName)) _m2 = true;
                            });
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
 * Get attendance rate for a class
 * @param {Object} attendanceData - Attendance records for the class
 * @param {string} classId - Class identifier key
 * @returns {number} Attendance percentage (0-100)
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
 * Searches across lastName, firstName, reading, and member number
 * @param {Array} customers - Array of customer objects
 * @param {string} searchTerm - Search query
 * @returns {Array} Matching customers (max 10 results)
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
 * Export customers to CSV file with Japanese formatting
 * Generates and downloads a CSV file with BOM for proper encoding in Excel
 * @param {Array} customers - Array of customer objects to export
 * @returns {void} Downloads CSV file to user's computer
 */
export function exportCustomersCSV(customers) {
    const headers = ['No', '会員番号', '会員ステータス', 'コース', '年会費更新日', '氏名', '読み', '保護者名', 'ハコモノ登録名', '性別', '生年月日', '年齢', '電話番号', 'メール', '入会日', '郵便番号', '都道府県', '市区町村', '番地', '建物・部屋番号', '備考'];
    const rows = customers.map((c, i) => [
        i + 1, c.memberNumber || '', c.status, c.course, c.annualFee,
        `${c.lastName} ${c.firstName}`, c.reading, c.guardianName, c.hakomonoName, c.gender,
        c.birthDate, calculateAge(c.birthDate), c.phone1, c.email, c.joinDate,
        c.postalCode, c.prefecture, c.city, c.address, c.building, c.memo
    ].map(f => `"${f || ''}"`).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `顧客一覧_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}
