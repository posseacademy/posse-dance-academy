// Imports
import { pricing, planOrder, visitorRevenueOverrides, defaultSchedule, timeSchedule, instructors, getEmptyCustomer, coursePrices, courseColors } from './config.js?v=4';
import * as db from './firebase-service.js?v=5';
import { calculateAge, sortStudentsByPlan, isRegularPlan, searchCustomerByName, exportCustomersCSV, calculateVisitorRevenue } from './utils.js?v=4';
import { renderDashboard } from './views/home.js?v=4';
import { renderCustomers, renderAddForm, renderCustomerRow } from './views/customers.js?v=6';
import { renderAttendance, renderAttendanceOverview, renderAttendanceRecord, renderPracticeSession, renderAddStudentForm, renderEventRecord } from './views/attendance.js?v=17';
import { renderTimeSchedule, renderMonthlySchedule } from './views/schedule.js?v=4';
import { renderInstructors } from './views/instructors.js?v=4';
import { renderRevenue } from './views/revenue.js?v=4';

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
        this.timeScheduleData = timeSchedule;
        this.instructorData = instructors;
    }

    // ===== INITIALIZATION =====
    async init() {
        this.customers = await db.loadCustomers();
        const loaded = await db.loadScheduleData(this.scheduleData);
        if (loaded) this.scheduleData = loaded;
        this.attendanceData = await db.loadAttendance(this.selectedMonth);
        this.eventsData = await db.loadEvents(this.selectedMonth);

        // Sort all students by plan
        Object.keys(this.scheduleData).forEach(day => {
            if (this.scheduleData[day] && Array.isArray(this.scheduleData[day])) {
                this.scheduleData[day].forEach(classInfo => {
                    classInfo.students = sortStudentsByPlan(classInfo.students, this.planOrder);
                });
            }
        });

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
        exportCustomersCSV(this.customers);
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
        } catch (error) {
            console.error('月切り替えエラー:', error);
        } finally {
            this.isLoading = false;
            this.render();
        }
    }

    async selectMonth(monthValue) {
        if (!monthValue) return;
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
        const classIndex = this.scheduleData[day].findIndex(c => c.location === location && c.name === className);
        if (classIndex !== -1) {
            const exists = this.scheduleData[day][classIndex].students.some(s => s.lastName === lastName && s.firstName === firstName);
            if (!exists) {
                this.scheduleData[day][classIndex].students.push({ lastName, firstName, plan });
                this.scheduleData[day][classIndex].students = sortStudentsByPlan(this.scheduleData[day][classIndex].students, this.planOrder);
                await db.saveScheduleData(this.scheduleData);
            }
            if (!isRegularPlan(plan)) {
                const studentKey = `${day}_${location}_${className}_${lastName}${firstName}`;
                if (!this.attendanceData[studentKey]) {
                    this.attendanceData[studentKey] = {};
                    await db.saveAttendance(this.selectedMonth, studentKey, { _active: true });
                }
            }
        }
        this.showAddStudentForm = false;
        this.selectedClassForAdd = null;
        this.selectedCustomerForStudent = null;
        this.studentSearchTerm = '';
        this.studentSearchResults = [];
        this.render();
        alert('生徒を追加しました');
    }

    startEditStudent(day, location, className, lastName, firstName) {
        this.editingStudent = { day, location, className, lastName, firstName };
        this.render();
    }

    async saveEditStudent() {
        const newPlan = document.getElementById('edit_student_plan')?.value;
        if (!newPlan) { alert('プランを選択してください'); return; }
        const { day, location, className, lastName, firstName } = this.editingStudent;
        const classIndex = this.scheduleData[day].findIndex(c => c.location === location && c.name === className);
        if (classIndex !== -1) {
            const studentIndex = this.scheduleData[day][classIndex].students.findIndex(s => s.lastName === lastName && s.firstName === firstName);
            if (studentIndex !== -1) {
                this.scheduleData[day][classIndex].students[studentIndex].plan = newPlan;
                this.scheduleData[day][classIndex].students = sortStudentsByPlan(this.scheduleData[day][classIndex].students, this.planOrder);
                await db.saveScheduleData(this.scheduleData);
            }
        }
        const studentKey = `${day}_${location}_${className}_${lastName}${firstName}`;
        if (!this.attendanceData[studentKey]) this.attendanceData[studentKey] = {};
        this.attendanceData[studentKey]._plan = newPlan;
        await db.saveAttendance(this.selectedMonth, studentKey, this.attendanceData[studentKey]);
        this.editingStudent = null;
        this.render();
        alert('生徒情報を更新しました');
    }

    async deleteStudent(day, location, className, lastName, firstName) {
        if (!confirm(`${lastName} ${firstName} を削除してもよろしいですか？`)) return;
        const classIndex = this.scheduleData[day].findIndex(c => c.location === location && c.name === className);
        if (classIndex !== -1) {
            this.scheduleData[day][classIndex].students = this.scheduleData[day][classIndex].students.filter(s => !(s.lastName === lastName && s.firstName === firstName));
            await db.saveScheduleData(this.scheduleData);
        }
        const studentKey = `${day}_${location}_${className}_${lastName}${firstName}`;
        try {
            await db.deleteAttendanceRecord(this.selectedMonth, studentKey);
        } catch (error) { console.log('出席データの削除エラー'); }
        this.attendanceData = await db.loadAttendance(this.selectedMonth);
        this.render();
        alert('生徒を削除しました');
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
        document.getElementById('app').innerHTML = `
            <div style="display:flex;">
                <aside class="sidebar">
                    <div class="sidebar-logo">
                        <svg class="logo-image" viewBox="0 0 280 100" xmlns="http://www.w3.org/2000/svg"><text x="6" y="68" font-family="'Futura','Trebuchet MS','Arial Black',sans-serif" font-weight="900" font-size="76" fill="#e42313" letter-spacing="-2">posse</text><text x="8" y="93" font-family="'Futura','Trebuchet MS',Arial,sans-serif" font-weight="300" font-size="24" fill="rgba(255,255,255,0.85)" letter-spacing="5.5">dance academy</text></svg>
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
                        <button id="instructorsTab" class="nav-item ${this.currentTab === 'instructors' ? 'active' : ''}">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4-4v2"/><circle cx="12" cy="7" r="4"/></svg>
                            <span>講師プロフィール</span>
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
                      this.currentTab === 'instructors' ? renderInstructors(this) :
                      renderDashboard(this)}
                </main>
            </div>
        `;

        // Setup navigation events
        document.getElementById('homeTab')?.addEventListener('click', () => { this.currentTab = 'home'; this.render(); });
        document.getElementById('customersTab')?.addEventListener('click', () => { this.currentTab = 'customers'; this.render(); });
        document.getElementById('attendanceTab')?.addEventListener('click', () => { this.currentTab = 'attendance'; this.render(); });
        document.getElementById('revenueTab')?.addEventListener('click', () => { this.currentTab = 'revenue'; this.render(); });
        document.getElementById('timeScheduleTab')?.addEventListener('click', () => { this.currentTab = 'timeSchedule'; this.render(); });
        document.getElementById('monthlyScheduleTab')?.addEventListener('click', () => { this.currentTab = 'monthlySchedule'; this.render(); });
        document.getElementById('instructorsTab')?.addEventListener('click', () => { this.currentTab = 'instructors'; this.render(); });

        // Setup page-specific events
        if (this.currentTab === 'customers') {
            this.setupCustomerPageEvents();
        } else if (this.currentTab === 'attendance') {
            this.setupAttendanceEvents();
        }
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
        const fields = ['memberNumber', 'status', 'course', 'annualFee', 'lastName', 'firstName', 'reading', 'guardianName', 'hakomonoName', 'gender', 'birthDate', 'phone1', 'email', 'postalCode', 'prefecture', 'city', 'address', 'building', 'joinDate', 'memo'];
        fields.forEach(field => {
            const el = document.getElementById(`new_${field}`);
            if (el) {
                el.addEventListener('change', (e) => { this.newCustomer[field] = e.target.value; });
                el.addEventListener('input', (e) => { this.newCustomer[field] = e.target.value; });
            }
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

        const editFields = ['memberNumber', 'status', 'course', 'annualFee', 'reading', 'guardianName', 'hakomonoName', 'gender', 'birthDate', 'phone1', 'phone2', 'email', 'postalCode', 'prefecture', 'city', 'address', 'building', 'joinDate', 'memo', 'lastName', 'firstName'];
        editFields.forEach(field => {
            const el = document.getElementById(`edit_${field}`);
            if (el) {
                el.addEventListener('change', (e) => { this.updateEditField(field, e.target.value); });
                el.addEventListener('input', (e) => { this.updateEditField(field, e.target.value); });
            }
        });
    }

    // ===== EVENT SETUP (ATTENDANCE) =====
    setupAttendanceEvents() {
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

        // Edit student buttons
        document.querySelectorAll('.edit-student-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.startEditStudent(btn.getAttribute('data-edit-student-day'), btn.getAttribute('data-edit-student-location'), btn.getAttribute('data-edit-student-class'), btn.getAttribute('data-edit-student-lastname'), btn.getAttribute('data-edit-student-firstname'));
            });
        });

        // Delete student buttons
        document.querySelectorAll('.delete-student-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.deleteStudent(btn.getAttribute('data-delete-day'), btn.getAttribute('data-delete-location'), btn.getAttribute('data-delete-class'), btn.getAttribute('data-delete-lastname'), btn.getAttribute('data-delete-firstname'));
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
_app.init();
