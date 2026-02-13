import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, doc, getDocs, getDoc, setDoc, deleteDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { firebaseConfig } from './config.js?v=2';

// Initialize Firebase
const fireApp = initializeApp(firebaseConfig);
const db = getFirestore(fireApp);

// Load all customers from Firestore
export async function loadCustomers() {
  const customers = {};
  try {
    const querySnapshot = await getDocs(collection(db, 'customers'));
    querySnapshot.forEach(doc => {
      customers[doc.id] = doc.data();
    });
  } catch (error) {
    console.error('顧客データの読み込みに失敗:', error);
  }
  return customers;
}

// Save a customer to Firestore
export async function saveCustomer(id, data) {
  try {
    await setDoc(doc(db, 'customers', id), data);
    return true;
  } catch (error) {
    console.error('顧客データの保存に失敗:', error);
    return false;
  }
}

// Delete a customer from Firestore
export async function deleteCustomer(id) {
  try {
    await deleteDoc(doc(db, 'customers', id));
    return true;
  } catch (error) {
    console.error('顧客データの削除に失敗:', error);
    return false;
  }
}

// Load schedule data from Firestore
export async function loadScheduleData() {
  const scheduleData = {};
  try {
    const querySnapshot = await getDocs(collection(db, 'schedule'));
    if (querySnapshot.empty) {
      console.warn('スケジュールデータが見つかりません。空のデータを返します。');
      return {};
    }
    querySnapshot.forEach(docSnap => {
      // Firestore stores as { classes: [...] }, unwrap to flat array
      scheduleData[docSnap.id] = docSnap.data().classes || [];
    });
  } catch (error) {
    console.error('スケジュールデータの読み込みに失敗:', error);
    return {};
  }
  return scheduleData;
}

// Save schedule data to Firestore
export async function saveScheduleData(day, classes) {
  try {
    // Wrap flat array in { classes: [...] } for Firestore storage
    await setDoc(doc(db, 'schedule', day), { classes: classes });
    return true;
  } catch (error) {
    console.error('スケジュールデータの保存に失敗:', error);
    return false;
  }
}

// Load attendance data from Firestore
export async function loadAttendance(selectedMonth) {
  const attendanceData = {};
  try {
    const monthKey = selectedMonth.replace('-', '');
    const querySnapshot = await getDocs(collection(db, `attendance_${monthKey}`));
    querySnapshot.forEach(docSnap => {
      attendanceData[docSnap.id] = docSnap.data();
    });
  } catch (error) {
    console.error('出席データの読み込みに失敗:', error);
  }
  return attendanceData;
}

// Save attendance data to Firestore
export async function saveAttendance(selectedMonth, studentId, weekData) {
  try {
    const monthKey = selectedMonth.replace('-', '');
    await setDoc(doc(db, `attendance_${monthKey}`, studentId), weekData);
    return true;
  } catch (error) {
    console.error('出席データの保存に失敗:', error);
    return false;
  }
}

// Load events data from Firestore
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

// Save event data to Firestore
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

// Delete event from Firestore
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

// Export db for direct access if needed
export { db };
