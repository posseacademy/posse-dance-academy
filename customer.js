// ========================================
// 顧客管理機能
// ========================================

import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

export class CustomerManager {
    constructor() {
        this.customers = [];
        this.editingId = null;
        this.editForm = {};
        this.showAddForm = false;
        this.searchTerm = '';
        this.sortField = 'memberNumber';
        this.sortOrder = 'asc';
        this.statusFilter = '入会中';
        this.newCustomer = this.getEmptyCustomer();
    }

    // 空の顧客データを取得
    getEmptyCustomer() {
        return {
            memberNumber: '', status: '入会中', course: '', annualFee: '',
            lastName: '', firstName: '', reading: '', guardianName: '', hakomonoName: '',
            gender: '', birthDate: '', phone1: '', phone2: '', email: '',
            postalCode: '', prefecture: '', city: '', address: '', building: '',
            joinDate: '', memo: ''
        };
    }

    // 年齢計算
    calculateAge(birthDate) {
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

    // 顧客データ読み込み
    async loadCustomers() {
        try {
            const querySnapshot = await getDocs(collection(window.db, 'customers'));
            this.customers = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    status: data.status || (data.active === '○' ? '入会中' : '休会中')
                };
            });
            // 会員番号順にソート
            this.customers.sort((a, b) => {
                const aNum = a.memberNumber || '';
                const bNum = b.memberNumber || '';
                return aNum > bNum ? 1 : -1;
            });
        } catch (error) {
            console.error('データ読み込みエラー:', error);
            this.customers = [];
        }
    }

    // 顧客追加
    async addCustomer() {
        if (!this.newCustomer.lastName || !this.newCustomer.firstName) {
            alert('氏名を入力してください');
            return false;
        }
        if (!this.newCustomer.memberNumber) {
            alert('会員番号を入力してください');
            return false;
        }
        try {
            await addDoc(collection(window.db, 'customers'), this.newCustomer);
            await this.loadCustomers();
            this.newCustomer = this.getEmptyCustomer();
            this.showAddForm = false;
            return true;
        } catch (error) {
            console.error('登録エラー:', error);
            alert('登録エラー: ' + error.message);
            return false;
        }
    }

    // 顧客更新
    async saveEdit() {
        if (!this.editForm.id) {
            alert('保存エラー: IDが見つかりません');
            return false;
        }
        try {
            const customerRef = doc(window.db, 'customers', this.editForm.id);
            const { id, ...dataToSave } = this.editForm;
            await updateDoc(customerRef, dataToSave);
            await this.loadCustomers();
            this.editingId = null;
            this.editForm = {};
            return true;
        } catch (error) {
            console.error('更新エラー:', error);
            alert('更新エラー: ' + error.message);
            return false;
        }
    }

    // 顧客削除
    async deleteCustomer(id) {
        if (!confirm('この顧客を削除してもよろしいですか?')) return false;
        try {
            await deleteDoc(doc(window.db, 'customers', id));
            await this.loadCustomers();
            return true;
        } catch (error) {
            console.error('削除エラー:', error);
            alert('削除エラー: ' + error.message);
            return false;
        }
    }

    // フィルタリングされた顧客リストを取得
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
        
        // ソート
        filtered.sort((a, b) => {
            let aVal = a[this.sortField] || '';
            let bVal = b[this.sortField] || '';
            if (this.sortOrder === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });
        
        return filtered;
    }

    // CSVエクスポート
    exportToCSV() {
        const headers = ['No', '会員番号', '会員ステータス', 'コース', '年会費更新日', '氏名', '読み', '保護者名', 'ハコモノ登録名', '性別', '生年月日', '年齢', '電話番号', 'メール', '入会日', '郵便番号', '都道府県', '市区町村', '番地', '建物・部屋番号', '備考'];
        const rows = this.customers.map((c, i) => [
            i + 1, c.memberNumber || '', c.status, c.course, c.annualFee,
            `${c.lastName} ${c.firstName}`, c.reading, c.guardianName, c.hakomonoName, c.gender,
            c.birthDate, this.calculateAge(c.birthDate), c.phone1, c.email, c.joinDate,
            c.postalCode, c.prefecture, c.city, c.address, c.building, c.memo
        ].map(f => `"${f || ''}"`).join(','));
        
        const csv = [headers.join(','), ...rows].join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `顧客管理_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    }
}
