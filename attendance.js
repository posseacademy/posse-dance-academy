// ========================================
// 出席管理機能
// ========================================

import { collection, getDocs, doc, setDoc, deleteDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

export class AttendanceManager {
    constructor() {
        this.selectedMonth = new Date().toISOString().slice(0, 7);
        this.selectedDay = '月曜日';
        this.attendanceData = {};
        this.eventAttendanceData = [];
        this.isLoading = false;
        
        // スケジュールデータ（簡略版 - 実際は全データを含める）
        this.scheduleData = {
            '月曜日': [
                { location: '天神', name: 'アクロバット SOYA', color: 'red', students: [] }
                // ... 他のクラス
            ],
            '火曜日': [],
            '水曜日': [],
            '木曜日': [],
            '金曜日': [],
            'イベント': []
        };
        
        // プラン順序
        this.planOrder = {
            '4クラス': 1, '４クラス': 1,
            '3クラス': 2, '３クラス': 2,
            '2クラス': 3, '２クラス': 3,
            '1クラス': 4, '１クラス': 4,
            '1.5hクラス': 5,
            'ビジター（会員）': 6,
            'ビジター（非会員）': 7,
            'ビジター（振替）': 8,
            '初回体験': 9,
            '初回無料': 10
        };
        
        // 料金設定
        this.pricing = {
            '4クラス': 18600, '４クラス': 18600,
            '3クラス': 14400, '３クラス': 14400,
            '2クラス': 10000, '２クラス': 10000,
            '1クラス': 6000, '１クラス': 6000,
            '1.5hクラス': 6600,
            '初回体験': 1000,
            '初回無料': 0,
            'ビジター（会員）': 2000,
            'ビジター（非会員）': 2300,
            'ビジター1.5h（会員）': 2200,
            'ビジター1.5h（非会員）': 2500,
            '月謝クラス振替': 1000
        };
    }

    // 出席データ読み込み
    async loadAttendance() {
        try {
            const monthKey = this.selectedMonth.replace('-', '');
            const querySnapshot = await getDocs(collection(window.db, `attendance_${monthKey}`));
            this.attendanceData = {};
            querySnapshot.docs.forEach(doc => {
                this.attendanceData[doc.id] = doc.data();
            });
        } catch (error) {
            console.error('出席データ読み込みエラー:', error);
            this.attendanceData = {};
        }
    }

    // イベント出席データ読み込み
    async loadEventAttendance() {
        try {
            const monthKey = this.selectedMonth.replace('-', '');
            const querySnapshot = await getDocs(collection(window.db, `event_attendance_${monthKey}`));
            this.eventAttendanceData = [];
            querySnapshot.docs.forEach(doc => {
                const data = doc.data();
                this.eventAttendanceData.push({
                    id: doc.id,
                    isMember: data.isMember || false,
                    ...data
                });
            });
            // indexでソート
            this.eventAttendanceData.sort((a, b) => (a.index || 0) - (b.index || 0));
        } catch (error) {
            console.error('イベント出席データ読み込みエラー:', error);
            this.eventAttendanceData = [];
        }
    }

    // 出席データ保存
    async saveAttendance(studentId, weekData) {
        try {
            const monthKey = this.selectedMonth.replace('-', '');
            const docRef = doc(window.db, `attendance_${monthKey}`, studentId);
            await setDoc(docRef, weekData, { merge: true });
            await this.loadAttendance();
            return true;
        } catch (error) {
            console.error('出席データ保存エラー:', error);
            return false;
        }
    }

    // 出席切り替え
    toggleAttendance(classId, week) {
        const current = this.attendanceData[classId]?.[week] || '';
        const next = current === '○' ? '×' : current === '×' ? '休講' : current === '休講' ? '' : '○';
        
        if (!this.attendanceData[classId]) {
            this.attendanceData[classId] = {};
        }
        this.attendanceData[classId][week] = next;
        
        return this.saveAttendance(classId, this.attendanceData[classId]);
    }

    // 出席率計算
    getAttendanceRate(classId) {
        const data = this.attendanceData[classId] || {};
        const weeks = ['week1', 'week2', 'week3', 'week4']; // 予備週を除外
        const attended = weeks.filter(w => data[w] === '○').length;
        const recorded = weeks.filter(w => data[w] === '○' || data[w] === '×').length; // 休講を除外
        return recorded > 0 ? Math.round((attended / recorded) * 100) : 0;
    }

    // 月切り替え
    async changeMonth(direction) {
        this.isLoading = true;
        
        try {
            const [currentYear, currentMonth] = this.selectedMonth.split('-').map(Number);
            let newYear = currentYear;
            let newMonth = currentMonth + direction;
            
            if (newMonth > 12) {
                newMonth = 1;
                newYear++;
            } else if (newMonth < 1) {
                newMonth = 12;
                newYear--;
            }
            
            this.selectedMonth = `${newYear}-${String(newMonth).padStart(2, '0')}`;
            
            await this.loadAttendance();
            await this.loadEventAttendance();
            return true;
        } catch (error) {
            console.error('月切り替えエラー:', error);
            return false;
        } finally {
            this.isLoading = false;
        }
    }

    // ビジター売上計算
    calculateVisitorRevenue() {
        let revenue = 0;
        const monthKey = this.selectedMonth.replace('-', '');
        
        Object.keys(this.attendanceData).forEach(key => {
            const attendance = this.attendanceData[key];
            const weeks = ['week1', 'week2', 'week3', 'week4', 'week5'];
            
            weeks.forEach(week => {
                if (attendance[week] === '○') {
                    const parts = key.split('_');
                    const day = parts[0];
                    const location = parts[1];
                    const className = parts[2];
                    const studentName = parts.slice(3).join('_');
                    
                    const classData = this.scheduleData[day]?.find(c => c.location === location && c.name === className);
                    const student = classData?.students.find(s => `${s.lastName}${s.firstName}` === studentName);
                    
                    if (student && (student.plan.includes('ビジター') || student.plan.includes('体験') || student.plan.includes('無料'))) {
                        if (this.pricing[student.plan]) {
                            revenue += this.pricing[student.plan];
                        }
                    }
                }
            });
        });
        
        return revenue;
    }
}
