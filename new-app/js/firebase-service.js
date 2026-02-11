import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, doc, getDocs, getDoc, setDoc, deleteDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { firebaseConfig, defaultSchedule } from './config.js';

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
      console.log('スケジュールデータが見つかりません。初期データを保存します。');
      // Save default schedule to Firestore
      for (const [day, classes] of Object.entries(defaultSchedule)) {
        await setDoc(doc(db, 'schedule', day), { classes: classes });
      }
      return { ...defaultSchedule };
    }
    querySnapshot.forEach(docSnap => {
      // Firestore stores as { classes: [...] }, unwrap to flat array
      scheduleData[docSnap.id] = docSnap.data().classes || [];
    });
  } catch (error) {
    console.error('スケジュールデータの読み込みに失敗:', error);
    return { ...defaultSchedule };
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

// Export db for direct access if needed
export { db };
