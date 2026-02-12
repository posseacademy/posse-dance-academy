import { pricing, planOrder, defaultSchedule, navItems, dayOrder } from './config.js';
import { loadCustomers, saveCustomer, deleteCustomer as fbDeleteCustomer, loadScheduleData, loadAttendance, saveAttendance } from './firebase-service.js';
import { calculateVisitorRevenue, calculatePracticeRevenue, formatCurrency, downloadJSON, generateCustomerCSV, downloadCSV } from './utils.js';
import { renderHome } from './views/home.js';
import { renderCustomers } from './views/customers.js';
import { renderAttendance } from './views/attendance.js?v=2';
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
    this.isLoading = true;

    // Month selection - default to current month
    const now = new Date();
    this.selectedMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Customer view state
    this.searchTerm = '';
    this.statusFilter = 'all';
    this.sortField = 'name';
    this.sortOrder = 'asc';
    this.showAddForm = false;
    this.editingId = null;
    this.editForm = {};

    // Attendance view state
    this.selectedDay = dayOrder[0];
    this.attendanceTab = 'classes';

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
      const [customers, scheduleData, attendanceData] = await Promise.all([
        loadCustomers(),
        loadScheduleData(),
        loadAttendance(this.selectedMonth)
      ]);

      this.customers = customers;
      this.scheduleData = scheduleData;
      this.attendanceData = attendanceData;
    } catch (error) {
      console.error('データの初期化に失敗:', error);
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

    this.attendanceData = await loadAttendance(month);
    this.isLoading = false;
    this.render();
  }

  // Toggle attendance mark: - → ○ → × → 休諛 → -
  async toggleAttendance(studentKey, week) {
    if (!this.attendanceData[studentKey]) {
      this.attendanceData[studentKey] = {};
    }

    const current = this.attendanceData[studentKey][week] || '-';
    const cycle = ['-', '○', '×', '休講'];
    const nextIndex = (cycle.indexOf(current) + 1) % cycle.length;
    this.attendanceData[studentKey][week] = cycle[nextIndex] === '-' ? null : cycle[nextIndex];

    // Clean up null values
    if (!this.attendanceData[studentKey][week]) {
      delete this.attendanceData[studentKey][week];
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

  // Customer CRUD
  startEdit(id) {
    this.editingId = id;
    this.editForm = { ...this.customers[id] };
    this.showAddForm = true;
    this.render();
  }

  async saveCustomerForm() {
    const data = {
      lastName: document.getElementById('form-lastName')?.value || '',
      firstName: document.getElementById('form-firstName')?.value || '',
      course: document.getElementById('form-plan')?.value || '',
      status: document.getElementById('form-status')?.value || '入会中',
      joinDate: document.getElementById('form-joinDate')?.value || '',
      phone: document.getElementById('form-phone')?.value || '',
      notes: document.getElementById('form-notes')?.value || ''
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
    if (!confirm(`${this.customers[id]?.lastName || ''} ${this.customers[id]?.firstName || ''} を削除しますか？`)) return;

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
