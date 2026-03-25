import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    setDoc
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { firebaseConfig } from './config.js';

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
export const db = getFirestore(firebaseApp);

/**
 * Load all customers from Firestore
 * @returns {Promise<Array>} Array of customer objects with id property
 */
export async function loadCustomers() {
    try {
        const customersRef = collection(db, 'customers');
        const snapshot = await getDocs(customersRef);

        const customers = [];
        snapshot.forEach(doc => {
            customers.push({
                id: doc.id,
                ...doc.data()
            });
        });

        // Sort by memberNumber
        customers.sort((a, b) => {
            const numA = parseInt(a.memberNumber) || 0;
            const numB = parseInt(b.memberNumber) || 0;
            return numA - numB;
        });

        return customers;
    } catch (error) {
        console.error('Error loading customers:', error);
        return [];
    }
}

/**
 * Add a new customer to Firestore
 * @param {Object} customerData - Customer object
 * @returns {Promise<string>} Document ID of the new customer
 */
export async function addCustomer(customerData) {
    try {
        const customersRef = collection(db, 'customers');
        const docRef = await addDoc(customersRef, customerData);
        console.log('Customer added with ID:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('Error adding customer:', error);
        throw error;
    }
}

/**
 * Update an existing customer
 * @param {string} id - Document ID
 * @param {Object} data - Updated customer data
 * @returns {Promise<void>}
 */
export async function updateCustomer(id, data) {
    try {
        const customerRef = doc(db, 'customers', id);
        await updateDoc(customerRef, data);
        console.log('Customer updated:', id);
    } catch (error) {
        console.error('Error updating customer:', error);
        throw error;
    }
}

/**
 * Delete a customer
 * @param {string} id - Document ID
 * @returns {Promise<void>}
 */
export async function deleteCustomer(id) {
    try {
        const customerRef = doc(db, 'customers', id);
        await deleteDoc(customerRef);
        console.log('Customer deleted:', id);
    } catch (error) {
        console.error('Error deleting customer:', error);
        throw error;
    }
}

/**
 * Load schedule data from Firestore
 * @param {Object} defaultSchedule - Default schedule to use as fallback
 * @returns {Promise<Object>} Schedule data
 */
export async function loadScheduleData(defaultSchedule) {
    try {
        const scheduleRef = collection(db, 'schedule');
        const snapshot = await getDocs(scheduleRef);

        if (snapshot.empty) {
            console.log('No schedule data found, using default');
            return defaultSchedule;
        }

        const loadedSchedule = {};
        snapshot.forEach(doc => {
            loadedSchedule[doc.id] = doc.data().classes || [];
        });

        return Object.keys(loadedSchedule).length > 0 ? loadedSchedule : defaultSchedule;
    } catch (error) {
        console.error('Error loading schedule data:', error);
        return defaultSchedule;
    }
}

/**
 * Save schedule data to Firestore
 * @param {Object} scheduleData - Schedule object with days as keys
 * @returns {Promise<void>}
 */
export async function saveScheduleData(scheduleData) {
    try {
        for (const [day, classes] of Object.entries(scheduleData)) {
            const scheduleRef = doc(db, 'schedule', day);
            await setDoc(scheduleRef, {
                classes: Array.isArray(classes) ? classes : []
            });
        }
        console.log('Schedule data saved');
    } catch (error) {
        console.error('Error saving schedule data:', error);
        throw error;
    }
}

/**
 * Load time schedule from Firestore
 * @param {Object} defaultTimeSchedule - Fallback from config.js
 * @returns {Promise<Object>} Time schedule keyed by day
 */
export async function loadTimeSchedule(defaultTimeSchedule) {
    try {
        const tsRef = collection(db, 'timeSchedule');
        const snapshot = await getDocs(tsRef);
        if (snapshot.empty) return defaultTimeSchedule;
        const loaded = {};
        snapshot.forEach(d => { loaded[d.id] = d.data().lessons || []; });
        return Object.keys(loaded).length > 0 ? loaded : defaultTimeSchedule;
    } catch (error) {
        console.error('Error loading timeSchedule:', error);
        return defaultTimeSchedule;
    }
}

/**
 * Save time schedule for a specific day
 * @param {string} day - Day name (e.g. '月曜日')
 * @param {Array} lessons - Array of lesson objects
 */
export async function saveTimeScheduleDay(day, lessons) {
    try {
        await setDoc(doc(db, 'timeSchedule', day), { lessons });
    } catch (error) {
        console.error('Error saving timeSchedule:', error);
        throw error;
    }
}

/**
 * Load attendance records for a specific month
 * @param {string} selectedMonth - Month in format 'YYYY-MM'
 * @returns {Promise<Array>} Array of attendance records
 */
export async function loadAttendance(selectedMonth) {
    try {
        const monthKey = selectedMonth.replace('-', '');
        const collectionName = `attendance_${monthKey}`;
        const attendanceRef = collection(db, collectionName);
        const snapshot = await getDocs(attendanceRef);

        const attendanceData = {};
        snapshot.forEach(doc => {
            attendanceData[doc.id] = doc.data();
        });

        return attendanceData;
    } catch (error) {
        console.error('Error loading attendance:', error);
        return {};
    }
}

/**
 * Save attendance record for a student
 * @param {string} selectedMonth - Month in format 'YYYY-MM'
 * @param {string} studentId - Student identifier
 * @param {Object} weekData - Week attendance data
 * @returns {Promise<void>}
 */
export async function saveAttendance(selectedMonth, studentId, weekData) {
    try {
        const monthKey = selectedMonth.replace('-', '');
        const collectionName = `attendance_${monthKey}`;
        const attendanceRef = doc(db, collectionName, studentId);

        await setDoc(attendanceRef, weekData, { merge: true });
        console.log('Attendance saved for:', studentId);
    } catch (error) {
        console.error('Error saving attendance:', error);
        throw error;
    }
}

/**
 * Delete an attendance record
 * @param {string} selectedMonth - Month in format 'YYYY-MM'
 * @param {string} studentKey - Student key/ID
 * @returns {Promise<void>}
 */
export async function deleteAttendanceRecord(selectedMonth, studentKey) {
    try {
        const monthKey = selectedMonth.replace('-', '');
        const collectionName = `attendance_${monthKey}`;
        const attendanceRef = doc(db, collectionName, studentKey);

        await deleteDoc(attendanceRef);
        console.log('Attendance record deleted:', studentKey);
    } catch (error) {
        console.error('Error deleting attendance record:', error);
        throw error;
    }
}

/**
 * Load events for a specific month
 * @param {string} selectedMonth - Month in format 'YYYY-MM'
 * @returns {Promise<Object>} Events data keyed by event ID
 */
export async function loadEvents(selectedMonth) {
    const eventsData = {};
    try {
        const monthKey = selectedMonth.replace('-', '');
        const querySnapshot = await getDocs(collection(db, `events_${monthKey}`));
        querySnapshot.forEach(docSnap => {
            eventsData[docSnap.id] = docSnap.data();
        });
    } catch (error) {
        console.error('イベントデータの読み込みに失敗:', error);
    }
    return eventsData;
}

/**
 * Save event data to Firestore
 * @param {string} selectedMonth - Month in format 'YYYY-MM'
 * @param {string} eventId - Event document ID
 * @param {Object} data - Event data object
 * @returns {Promise<boolean>}
 */
export async function saveEvent(selectedMonth, eventId, data) {
    try {
        const monthKey = selectedMonth.replace('-', '');
        await setDoc(doc(db, `events_${monthKey}`, eventId), data);
        return true;
    } catch (error) {
        console.error('イベントデータの保存に失敗:', error);
        return false;
    }
}

/**
 * Delete event from Firestore
 * @param {string} selectedMonth - Month in format 'YYYY-MM'
 * @param {string} eventId - Event document ID
 * @returns {Promise<boolean>}
 */
export async function deleteEvent(selectedMonth, eventId) {
    try {
        const monthKey = selectedMonth.replace('-', '');
        await deleteDoc(doc(db, `events_${monthKey}`, eventId));
        return true;
    } catch (error) {
        console.error('イベントデータの削除に失敗:', error);
        return false;
    }
}

/**
 * Create a backup of all collections as JSON
 * @returns {Promise<void>} Downloads backup file
 */
export async function createBackup() {
    try {
        // Load attendance for the current month
        const currentMonth = new Date().toISOString().slice(0, 7);
        const attendance = await loadAttendance(currentMonth);
        const eventsData = await loadEvents(currentMonth);

        const backup = {
            timestamp: new Date().toISOString(),
            backupMonth: currentMonth,
            customers: await loadCustomers(),
            schedule: await loadScheduleData({}),
            attendance: attendance,
            eventsData: eventsData
        };

        // Convert to JSON and download
        const dataStr = JSON.stringify(backup, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `posse-backup-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        console.log('Backup created successfully');
    } catch (error) {
        console.error('Error creating backup:', error);
        throw error;
    }
}

// ===== CALENDAR DATA =====

export async function loadCalendarData(selectedMonth) {
    const data = {};
    try {
        const monthKey = selectedMonth.replace('-', '');
        const snapshot = await getDocs(collection(db, `calendar_${monthKey}`));
        snapshot.forEach(docSnap => { data[docSnap.id] = docSnap.data(); });
    } catch (error) {
        console.error('カレンダーデータ読込エラー:', error);
    }
    return data;
}

export async function saveCalendarDay(selectedMonth, dateStr, dayData) {
    try {
        const monthKey = selectedMonth.replace('-', '');
        await setDoc(doc(db, `calendar_${monthKey}`, dateStr), dayData);
    } catch (error) {
        console.error('カレンダー保存エラー:', error);
    }
}

export async function deleteCalendarDay(selectedMonth, dateStr) {
    try {
        const monthKey = selectedMonth.replace('-', '');
        await deleteDoc(doc(db, `calendar_${monthKey}`, dateStr));
    } catch (error) {
        console.error('カレンダー削除エラー:', error);
    }
}
