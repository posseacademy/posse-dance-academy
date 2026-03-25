// Imports
import { pricing, planOrder, visitorRevenueOverrides, defaultSchedule, timeSchedule, getEmptyCustomer, coursePrices, courseColors, coursePricesWithTransfer, combinedPrices15h, CLASS_15H } from './config.js?v=9';
import * as db from './firebase-service.js?v=8';
import { calculateAge, sortStudentsByPlan, isRegularPlan, searchCustomerByName, exportCustomersCSV, calculateVisitorRevenue, calculateMonthlyTuition, calculateFeeRevenue, calculatePracticeRevenue } from './utils.js?v=5';
import { renderDashboard } from './views/home.js?v=12';
import { renderCustomers, renderAddForm, renderCustomerRow } from './views/customers.js?v=10';
import { renderAttendance, renderAttendanceOverview, renderAttendanceRecord, renderPracticeSession, renderAddStudentForm, renderEventRecord } from './views/attendance.js?v=31';
import { renderTimeSchedule, renderMonthlySchedule } from './views/schedule.js?v=24';
import { renderRevenue } from './views/revenue.js?v=11';
import { exportCustomersCSV as exportCustomersCSVNew, exportAttendanceMonthlyCSV, exportAttendanceYearlyCSV, exportRevenueMonthlyCSV, exportRevenueYearlyCSV } from './csv-export.js?v=3';

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
        this.pricing = pricing;
        this.planOrder = planOrder;
        this.visitorRevenueOverrides = visitorRevenueOverrides;
        this.coursePrices = coursePrices;
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
        const validTabs = ['home', 'customers', 'attendance', 'revenue', 'timeSchedule', 'monthlySchedule'];
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
            const { id, ...dataToSave } = this.editForm;
            await db.updateCustomer(id, dataToSave);
            this.customers = await db.loadCustomers();
            this.editingId = null;
            this.editForm = {};
            this.render();
            alert('更新しました');
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
        exportCustomersCSVNew(this.customers);
    }

    handleExportAttendanceMonthly() {
        exportAttendanceMonthlyCSV(this.scheduleData, this.attendanceData, this.selectedMonth, isRegularPlan);
    }

    async handleExportAttendanceYearly() {
        await exportAttendanceYearlyCSV(this.scheduleData, this.selectedMonth, isRegularPlan, db.loadAttendance);
    }

    handleExportRevenueMonthly() {
        const data = this.buildRevenueData();
        exportRevenueMonthlyCSV(data, this.selectedMonth);
    }

    async handleExportRevenueYearly() {
        const year = this.selectedMonth.slice(0, 4);
        const yearlyData = [];
        for (let m = 1; m <= 12; m++) {
            const monthStr = `${year}-${String(m).padStart(2, '0')}`;
            try {
                const att = await db.loadAttendance(monthStr);
                const events = await db.loadEvents(monthStr);
                const tuition = calculateMonthlyTuition(this.customers, this.scheduleData, coursePricesWithTransfer, combinedPrices15h, CLASS_15H);
                const visitor = calculateVisitorRevenue(att, this.scheduleData, this.pricing, visitorRevenueOverrides, monthStr);
                let eventTotal = 0;
                Object.values(events || {}).forEach(ev => { eventTotal += (ev.participants || []).reduce((s, p) => s + (parseInt(p.amount) || 0), 0); });
                const practice = calculatePracticeRevenue(att);
                const feeData = calculateFeeRevenue(this.customers, monthStr);
                const enrollment = feeData?.enrollment?.total || 0;
                const annualFee = feeData?.annualFee?.total || 0;
                yearlyData.push({ month: `${m}月`, tuition: tuition.total || 0, visitor: visitor || 0, event: eventTotal, practice: practice.revenue || 0, enrollment, annualFee });
            } catch { yearlyData.push({ month: `${m}月`, tuition: 0, visitor: 0, event: 0, practice: 0, enrollment: 0, annualFee: 0 }); }
        }
        exportRevenueYearlyCSV(yearlyData, year);
    }

    buildRevenueData() {
        const tuition = calculateMonthlyTuition(this.customers, this.scheduleData, coursePricesWithTransfer, combinedPrices15h, CLASS_15H);
        const visitor = calculateVisitorRevenue(this.attendanceData, this.scheduleData, this.pricing, visitorRevenueOverrides, this.selectedMonth);
        let eventTotal = 0;
        Object.values(this.eventsData || {}).forEach(ev => { eventTotal += (ev.participants || []).reduce((s, p) => s + (parseInt(p.amount) || 0), 0); });
        const practice = calculatePracticeRevenue(this.attendanceData);
        const feeData = calculateFeeRevenue(this.customers, this.selectedMonth);
        const enrollment = feeData?.enrollment?.total || 0;
        const annualFee = feeData?.annualFee?.total || 0;
        return {
            tuition: { total: tuition.total || 0, details: tuition.details || [] },
            visitor: { total: visitor || 0, details: [] },
            event: { total: eventTotal },
            practice: { total: practice.revenue || 0 },
            enrollment: { total: enrollment },
            annualFee: { total: annualFee },
            grandTotal: (tuition.total || 0) + (visitor || 0) + eventTotal + (practice.revenue || 0) + enrollment + annualFee
        };
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

    calculateVisitorRevenue() {
        return calculateVisitorRevenue(this.attendanceData, this.scheduleData, this.pricing, this.visitorRevenueOverrides, this.selectedMonth);
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
            this.attendanceData = await db.loadAttendance(this.selectedMonth);
            this.eventsData = await db.loadEvents(this.selectedMonth);
            this.calendarData = await db.loadCalendarData(this.selectedMonth);
            this.selectedCalendarDate = null;
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
            this.attendanceData = await db.loadAttendance(this.selectedMonth);
            this.eventsData = await db.loadEvents(this.selectedMonth);
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
        if (classIndex !== -1) {
            const cls = this.scheduleData[day][classIndex];
            const exists = cls.students.some(s => s.lastName === lastName && s.firstName === firstName);
            if (!exists) {
                cls.students.push({ lastName, firstName, plan });
                await db.saveScheduleData(this.scheduleData);
            }
            // Save _plan to attendance data for revenue calculations
            const classLoc = cls.location || cls.venue || location;
            const studentKey = `${day}_${classLoc}_${className}_${lastName}${firstName}`;
            if (!this.attendanceData[studentKey]) this.attendanceData[studentKey] = {};
            this.attendanceData[studentKey]._plan = plan;
            await db.saveAttendance(this.selectedMonth, studentKey, this.attendanceData[studentKey]);
        } else {
            console.error('クラスが見つかりません:', day, location, className);
            alert('エラー: クラスが見つかりません。ページを再読み込みしてください。');
            this.showAddStudentForm = false;
            this.selectedClassForAdd = null;
            return;
        }
        this.showAddStudentForm = false;
        this.selectedClassForAdd = null;
        this.selectedCustomerForStudent = null;
        this.studentSearchTerm = '';
        this.studentSearchResults = [];
        alert('生徒を追加しました');
        this.render();
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
        if (classIndex !== -1) {
            const studentIndex = this.scheduleData[day][classIndex].students.findIndex(s => s.lastName === lastName && s.firstName === firstName);
            if (studentIndex !== -1) {
                this.scheduleData[day][classIndex].students[studentIndex].plan = newPlan;
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
            // Regular students: remove from schedule (affects all months)
            if (classIndex !== -1) {
                this.scheduleData[day][classIndex].students = this.scheduleData[day][classIndex].students.filter(s => !(s.lastName === lastName && s.firstName === firstName));
                await db.saveScheduleData(this.scheduleData);
            }
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
                            <div class="text-xs text-gray-600 mt-1">${customer.reading ? `読み: ${customer.reading}` : ''}${customer.reading && customer.course ? ' | ' : ''}${customer.course ? `コース: ${customer.course}` : ''}</div>
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
                            <div class="text-xs text-gray-700 mt-1">${this.selectedCustomerForStudent.memberNumber ? `会員番号: ${this.selectedCustomerForStudent.memberNumber} | ` : ''}${this.selectedCustomerForStudent.reading ? `読み: ${this.selectedCustomerForStudent.reading} | ` : ''}コース: ${this.selectedCustomerForStudent.course || 'なし'}</div>
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
            if (planSelect && this.selectedCustomerForStudent.course) {
                const courseMap = {'１': '１クラス', '２': '２クラス', '３': '３クラス', '４': '４クラス'};
                const planValue = courseMap[this.selectedCustomerForStudent.course] || '';
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
                        <button id="revenueTab" class="nav-item ${this.currentTab === 'revenue' ? 'active' : ''}">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
                            <span>売上</span>
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
                      this.currentTab === 'revenue' ? renderRevenue(this) :
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
                <button id="mobileRevenueTab" class="mobile-nav-item ${this.currentTab === 'revenue' ? 'active' : ''}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
                    売上
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
        document.getElementById('revenueTab')?.addEventListener('click', () => { this.currentTab = 'revenue'; this.render(); });
        document.getElementById('timeScheduleTab')?.addEventListener('click', () => { this.currentTab = 'timeSchedule'; this.render(); });
        document.getElementById('monthlyScheduleTab')?.addEventListener('click', () => { this.currentTab = 'monthlySchedule'; this.render(); });

        // Setup mobile navigation events
        document.getElementById('mobileHomeTab')?.addEventListener('click', () => { this.currentTab = 'home'; this.render(); });
        document.getElementById('mobileCustomersTab')?.addEventListener('click', () => { this.currentTab = 'customers'; this.render(); });
        document.getElementById('mobileAttendanceTab')?.addEventListener('click', () => { this.currentTab = 'attendance'; this.render(); });
        document.getElementById('mobileRevenueTab')?.addEventListener('click', () => { this.currentTab = 'revenue'; this.render(); });

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
        } else if (this.currentTab === 'revenue') {
            document.getElementById('exportRevenueMonthlyBtn')?.addEventListener('click', () => this.handleExportRevenueMonthly());
            document.getElementById('exportRevenueYearlyBtn')?.addEventListener('click', () => this.handleExportRevenueYearly());
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
        document.getElementById('searchInput')?.addEventListener('input', (e) => { this.searchTerm = e.target.value; this.render(); });
        document.getElementById('addCustomerBtn')?.addEventListener('click', () => this.addCustomer());
        document.getElementById('cancelAddBtn')?.addEventListener('click', () => { this.showAddForm = false; this.render(); });

        ['入会中', '休会中', '退会済み'].forEach(status => {
            document.getElementById(`status-${status}`)?.addEventListener('click', () => { this.statusFilter = status; this.render(); });
        });

        document.querySelectorAll('.sortable-header').forEach(header => {
            header.addEventListener('click', () => { this.sortBy(header.getAttribute('data-field')); });
        });

        // Form field events
        const fields = ['memberNumber', 'status', 'course', 'annualFee', 'lastName', 'firstName', 'reading', 'guardianName', 'hakomonoName', 'gender', 'birthDate', 'phone1', 'email', 'postalCode', 'prefecture', 'city', 'address', 'building', 'joinDate', 'memo', 'enrollmentFeeDate', 'annualFeeMonth'];
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

        const editFields = ['memberNumber', 'status', 'course', 'annualFee', 'reading', 'guardianName', 'hakomonoName', 'gender', 'birthDate', 'phone1', 'phone2', 'email', 'postalCode', 'prefecture', 'city', 'address', 'building', 'joinDate', 'memo', 'lastName', 'firstName', 'enrollmentFeeDate', 'annualFeeMonth'];
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
