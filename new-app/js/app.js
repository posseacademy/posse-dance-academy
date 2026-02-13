import { pricing, planOrder, defaultSchedule, navItems, dayOrder } from './config.js';
import { loadCustomers, saveCustomer, deleteCustomer as fbDeleteCustomer, loadScheduleData, saveScheduleData, loadAttendance, saveAttendance, loadEvents, saveEvent, deleteEvent as fbDeleteEvent, db } from './firebase-service.js';
import { calculateVisitorRevenue, calculatePracticeRevenue, formatCurrency, downloadJSON, generateCustomerCSV, downloadCSV } from './utils.js';
import { renderHome } from './views/home.js?v=3';
import { renderCustomers } from './views/customers.js?v=3';
import { renderAttendance } from './views/attendance.js?v=11';
import { renderSchedule } from './views/schedule.js';
import { renderInstructors } from './views/instructors.js';

class DanceStudioApp {
  constructor() {
    // State
    this.currentTab = 'home';
    this.customers = {};
    this.scheduleData = {};
    this.attendanceData = {};
    this.eventAttendanceData = {};
    this.eventsData = {};
    this.isLoading = true;

    // Month selection - default to current month
    const now = new Date();
    this.selectedMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Customer view state
    this.searchTerm = '';
    this.statusFilter = 'all';
    this.sortField = 'memberNumber';
    this.sortOrder = 'asc';
    this.showAddForm = false;
    this.editingId = null;
    this.editForm = {};

    // Attendance view state
    this.selectedDay = dayOrder[0];
    this.attendanceTab = 'overview';

    // Attendance record interactive state
    this.showAddStudentForm = false;
    this.selectedClassForAdd = null;
    this.editingStudent = null;

    // Event view state
    this.showAddEventForm = false;
    this.addingParticipantToEvent = null;

    // Schedule view state
    this.scheduleTab = 'time';

    // Config references
    this.pricing = pricing;
    this.planOrder = planOrder;

    // Make app globally accessible for onclick handlers
    window.app = this;

    // Initialize
    this.init();
  }

  async init() {
    this.isLoading = true;
    this.render();
    try {
      // Load data in parallel
      const [customers, scheduleData, attendanceData, eventsData] = await Promise.all([
        loadCustomers(),
        loadScheduleData(),
        loadAttendance(this.selectedMonth),
        loadEvents(this.selectedMonth)
      ]);
      this.customers = customers;
      this.scheduleData = scheduleData;
      this.attendanceData = attendanceData;
      this.eventsData = eventsData;
    } catch (error) {
      console.error('Data init failed:', error);
      this.scheduleData = { ...defaultSchedule };
    }
    this.isLoading = false;
    this.render();
  }

  // Navigation
  navigate(tab) {
    this.currentTab = tab;
    this.render();
  }

  // Month change
  async changeMonth(month) {
    this.selectedMonth = month;
    this.isLoading = true;
    this.render();
    const [attendanceData, eventsData] = await Promise.all([
      loadAttendance(month),
      loadEvents(month)
    ]);
    this.attendanceData = attendanceData;
    this.eventsData = eventsData;
    this.isLoading = false;
    this.render();
  }

  // Toggle attendance mark: - -> circle -> x -> closed -> -
  async toggleAttendance(studentKey, week) {
    if (!this.attendanceData[studentKey]) {
      this.attendanceData[studentKey] = {};
    }
    const current = this.attendanceData[studentKey][week] || '';
    const next = current === '\u25CB' ? '\u00D7'
               : current === '\u00D7' ? '\u4F11\u8B1B'
               : current === '\u4F11\u8B1B' ? ''
               : '\u25CB';

    if (next === '') {
      delete this.attendanceData[studentKey][week];
    } else {
      this.attendanceData[studentKey][week] = next;
    }
    await saveAttendance(this.selectedMonth, studentKey, this.attendanceData[studentKey]);
    this.render();
  }

  // Practice session update
  async updatePractice(key, week, value) {
    if (!this.attendanceData[key]) {
      this.attendanceData[key] = {};
    }
    this.attendanceData[key][week] = value;
    await saveAttendance(this.selectedMonth, key, this.attendanceData[key]);
    this.render();
  }

  // === Student management methods ===

  // Show add student form for a specific class
  addStudentToClass(day, location, className) {
    this.selectedClassForAdd = { day, location, className };
    this.showAddStudentForm = true;
    this.render();
  }

  // Cancel add student
  cancelAddStudent() {
    this.showAddStudentForm = false;
    this.selectedClassForAdd = null;
    this.render();
  }

  // Save new student
  async saveNewStudent() {
    const lastName = document.getElementById('new_student_lastName')?.value || '';
    const firstName = document.getElementById('new_student_firstName')?.value || '';
    const plan = document.getElementById('new_student_plan')?.value || '';

    if (!lastName || !plan) {
      alert('\u59D3\u540D\u3068\u30D7\u30E9\u30F3\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044');
      return;
    }

    const { day, location, className } = this.selectedClassForAdd;
    const classIndex = (this.scheduleData[day] || []).findIndex(c => c.location === location && c.name === className);

    if (classIndex !== -1) {
      // Check if student already exists
      const exists = this.scheduleData[day][classIndex].students.some(
        s => s.lastName === lastName && s.firstName === firstName
      );

      if (!exists) {
        this.scheduleData[day][classIndex].students.push({ lastName, firstName, plan });
        await saveScheduleData(day, this.scheduleData[day]);
      }

      // For non-regular plans (visitors etc), create attendance placeholder
      const regularPlans = ['1\u30AF\u30E9\u30B9', '\uFF11\u30AF\u30E9\u30B9', '2\u30AF\u30E9\u30B9', '\uFF12\u30AF\u30E9\u30B9', '3\u30AF\u30E9\u30B9', '\uFF13\u30AF\u30E9\u30B9', '4\u30AF\u30E9\u30B9', '\uFF14\u30AF\u30E9\u30B9', '1.5h\u30AF\u30E9\u30B9'];
      if (!regularPlans.includes(plan)) {
        const studentKey = `${day}_${location}_${className}_${lastName}${firstName}`;
        if (!this.attendanceData[studentKey]) {
          this.attendanceData[studentKey] = { _plan: plan };
          await saveAttendance(this.selectedMonth, studentKey, this.attendanceData[studentKey]);
        }
      }
    }

    this.showAddStudentForm = false;
    this.selectedClassForAdd = null;
    this.render();
    alert('\u751F\u5F92\u3092\u8FFD\u52A0\u3057\u307E\u3057\u305F');
  }

  // Start editing a student
  startEditStudent(day, location, className, lastName, firstName) {
    this.editingStudent = { day, location, className, lastName, firstName };
    this.render();
  }

  // Cancel editing
  cancelEditStudent() {
    this.editingStudent = null;
    this.render();
  }

  // Save edited student plan
  async saveEditStudent() {
    const newPlan = document.getElementById('edit_student_plan')?.value;
    if (!newPlan) {
      alert('\u30D7\u30E9\u30F3\u3092\u9078\u629E\u3057\u3066\u304F\u3060\u3055\u3044');
      return;
    }

    const { day, location, className, lastName, firstName } = this.editingStudent;
    const classIndex = (this.scheduleData[day] || []).findIndex(c => c.location === location && c.name === className);

    if (classIndex !== -1) {
      const studentIndex = this.scheduleData[day][classIndex].students.findIndex(
        s => s.lastName === lastName && s.firstName === firstName
      );
      if (studentIndex !== -1) {
        this.scheduleData[day][classIndex].students[studentIndex].plan = newPlan;
        await saveScheduleData(day, this.scheduleData[day]);
      }
    }

    // Also save plan in attendance data
    const studentKey = `${day}_${location}_${className}_${lastName}${firstName}`;
    if (!this.attendanceData[studentKey]) {
      this.attendanceData[studentKey] = {};
    }
    this.attendanceData[studentKey]._plan = newPlan;
    await saveAttendance(this.selectedMonth, studentKey, this.attendanceData[studentKey]);

    this.editingStudent = null;
    this.render();
    alert('\u751F\u5F92\u60C5\u5831\u3092\u66F4\u65B0\u3057\u307E\u3057\u305F');
  }

  // Delete student
  async deleteStudent(day, location, className, lastName, firstName) {
    if (!confirm(`${lastName} ${firstName} \u3092\u524A\u9664\u3057\u3066\u3082\u3088\u308D\u3057\u3044\u3067\u3059\u304B\uFF1F`)) {
      return;
    }

    const classIndex = (this.scheduleData[day] || []).findIndex(c => c.location === location && c.name === className);

    if (classIndex !== -1) {
      this.scheduleData[day][classIndex].students = this.scheduleData[day][classIndex].students.filter(
        s => !(s.lastName === lastName && s.firstName === firstName)
      );
      await saveScheduleData(day, this.scheduleData[day]);
    }

    // Also delete attendance data
    const studentKey = `${day}_${location}_${className}_${lastName}${firstName}`;
    try {
      const { deleteDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
      const monthKey = this.selectedMonth.replace('-', '');
      await deleteDoc(doc(db, `attendance_${monthKey}`, studentKey));
    } catch (error) {
      console.log('Attendance delete note:', error.message);
    }

    // Reload attendance
    this.attendanceData = await loadAttendance(this.selectedMonth);
    this.editingStudent = null;
    this.render();
    alert('\u751F\u5F92\u3092\u524A\u9664\u3057\u307E\u3057\u305F');
  }

  // === Event management methods ===

  toggleAddEventForm() {
    this.showAddEventForm = !this.showAddEventForm;
    this.render();
  }

  async createEvent() {
    const name = document.getElementById('new_event_name')?.value || '';
    const date = document.getElementById('new_event_date')?.value || '';
    if (!name) {
      alert('\u30A4\u30D9\u30F3\u30C8\u540D\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044');
      return;
    }
    const eventId = `event_${Date.now()}`;
    const eventData = { name, date, participants: [] };
    const success = await saveEvent(this.selectedMonth, eventId, eventData);
    if (success) {
      this.eventsData[eventId] = eventData;
      this.showAddEventForm = false;
      this.render();
    }
  }

  async deleteEvent(eventId) {
    const evt = this.eventsData[eventId];
    if (!confirm(`\u300C${evt?.name || '\u30A4\u30D9\u30F3\u30C8'}\u300D\u3092\u524A\u9664\u3057\u3066\u3082\u3088\u308D\u3057\u3044\u3067\u3059\u304B\uFF1F`)) return;
    const success = await fbDeleteEvent(this.selectedMonth, eventId);
    if (success) {
      delete this.eventsData[eventId];
      this.render();
    }
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
    const name = document.getElementById('evt_participant_name')?.value || '';
    const memberType = document.getElementById('evt_participant_memberType')?.value || '\u4F1A\u54E1';
    const plan = document.getElementById('evt_participant_plan')?.value || '';
    const amount = document.getElementById('evt_participant_amount')?.value || '0';
    if (!name) {
      alert('\u6C0F\u540D\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044');
      return;
    }
    if (!this.eventsData[eventId]) return;
    if (!this.eventsData[eventId].participants) {
      this.eventsData[eventId].participants = [];
    }
    this.eventsData[eventId].participants.push({
      name, memberType, plan, amount: parseInt(amount) || 0
    });
    await saveEvent(this.selectedMonth, eventId, this.eventsData[eventId]);
    this.addingParticipantToEvent = null;
    this.render();
  }

  async deleteParticipant(eventId, index) {
    if (!this.eventsData[eventId]) return;
    const participants = this.eventsData[eventId].participants || [];
    if (index < 0 || index >= participants.length) return;
    const p = participants[index];
    if (!confirm(`${p.name}\u3092\u524A\u9664\u3057\u3066\u3082\u3088\u308D\u3057\u3044\u3067\u3059\u304B\uFF1F`)) return;
    participants.splice(index, 1);
    this.eventsData[eventId].participants = participants;
    await saveEvent(this.selectedMonth, eventId, this.eventsData[eventId]);
    this.render();
  }

  // Customer CRUD
  startEdit(id) {
    this.editingId = id;
    this.editForm = { ...this.customers[id] };
    this.showAddForm = true;
    this.render();
  }

  async saveCustomerForm() {
    const existing = this.editingId ? (this.customers[this.editingId] || {}) : {};
    const data = {
      ...existing,
      memberNumber: document.getElementById('form-memberNumber')?.value || '',
      status: document.getElementById('form-status')?.value || '\u5165\u4F1A\u4E2D',
      course: document.getElementById('form-course')?.value || '',
      annualFee: document.getElementById('form-annualFee')?.value || '',
      lastName: document.getElementById('form-lastName')?.value || '',
      firstName: document.getElementById('form-firstName')?.value || '',
      reading: document.getElementById('form-reading')?.value || '',
      guardianName: document.getElementById('form-guardianName')?.value || '',
      hakomonoName: document.getElementById('form-hakomonoName')?.value || '',
      gender: document.getElementById('form-gender')?.value || '',
      birthDate: document.getElementById('form-birthDate')?.value || '',
      phone1: document.getElementById('form-phone1')?.value || '',
      email: document.getElementById('form-email')?.value || '',
      joinDate: document.getElementById('form-joinDate')?.value || '',
      postalCode: document.getElementById('form-postalCode')?.value || '',
      prefecture: document.getElementById('form-prefecture')?.value || '',
      city: document.getElementById('form-city')?.value || '',
      address: document.getElementById('form-address')?.value || '',
      building: document.getElementById('form-building')?.value || '',
      memo: document.getElementById('form-memo')?.value || ''
    };
    const id = this.editingId || `customer_${Date.now()}`;
    const success = await saveCustomer(id, data);
    if (success) {
      this.customers[id] = data;
      this.showAddForm = false;
      this.editingId = null;
      this.editForm = {};
      this.render();
    }
  }

  async deleteCustomer(id) {
    if (!confirm(`${this.customers[id]?.lastName || ''} ${this.customers[id]?.firstName || ''} \u3092\u524A\u9664\u3057\u307E\u3059\u304B\uFF1F`)) return;
    const success = await fbDeleteCustomer(id);
    if (success) {
      delete this.customers[id];
      this.render();
    }
  }

  // Backup download
  downloadBackup() {
    const data = {
      attendanceData: this.attendanceData,
      scheduleData: this.scheduleData,
      pricing: this.pricing,
      month: this.selectedMonth,
      exportDate: new Date().toISOString(),
      recordCount: Object.keys(this.attendanceData).length
    };
    const filename = `posse_${this.selectedMonth.replace('-', '')}_backup_${new Date().toISOString().split('T')[0]}.json`;
    downloadJSON(data, filename);
  }

  // CSV export
  exportCSV() {
    const csv = generateCustomerCSV(this.customers);
    downloadCSV(csv, `posse_customers_${new Date().toISOString().split('T')[0]}.csv`);
  }

  // Main render
  render() {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;

    // Update sidebar active state
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.tab === this.currentTab);
    });

    if (this.isLoading) {
      mainContent.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;height:60vh">
          <div class="loading-spinner"></div>
        </div>
      `;
      return;
    }

    // Render current view
    switch (this.currentTab) {
      case 'home':
        mainContent.innerHTML = renderHome(this);
        break;
      case 'customers':
        mainContent.innerHTML = renderCustomers(this);
        break;
      case 'attendance':
        mainContent.innerHTML = renderAttendance(this);
        break;
      case 'schedule':
        mainContent.innerHTML = renderSchedule(this);
        break;
      case 'instructors':
        mainContent.innerHTML = renderInstructors(this);
        break;
      default:
        mainContent.innerHTML = renderHome(this);
    }
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new DanceStudioApp();
});
