// ========================================
// メインアプリケーション
// ========================================

import { CustomerManager } from './customer.js';
import { AttendanceManager } from './attendance.js';

class DanceStudioApp {
    constructor() {
        this.currentTab = 'dashboard';
        this.customerManager = new CustomerManager();
        this.attendanceManager = new AttendanceManager();
    }

    // 初期化
    async init() {
        console.log('🚀 アプリケーション起動中...');
        
        try {
            // データ読み込み
            await this.customerManager.loadCustomers();
            await this.attendanceManager.loadAttendance();
            await this.attendanceManager.loadEventAttendance();
            
            console.log('✅ データ読み込み完了');
            
            // 画面表示
            this.render();
            
            console.log('✅ アプリケーション起動完了');
        } catch (error) {
            console.error('❌ 初期化エラー:', error);
            alert('アプリケーションの起動に失敗しました: ' + error.message);
        }
    }

    // 画面レンダリング
    render() {
        const app = document.getElementById('app');
        
        if (!app) {
            console.error('❌ #app 要素が見つかりません');
            return;
        }

        // ヘッダー
        const header = `
            <header class="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
                <div class="container mx-auto px-4 py-4">
                    <div class="flex justify-between items-center">
                        <div>
                            <h1 class="text-2xl font-bold">posse dance academy</h1>
                            <p class="text-sm opacity-90">顧客管理システム</p>
                        </div>
                    </div>
                </div>
            </header>
        `;

        // ナビゲーション
        const nav = `
            <nav class="bg-white shadow">
                <div class="container mx-auto px-4">
                    <div class="flex space-x-8">
                        <button id="dashboardTab" class="py-4 px-2 font-medium ${this.currentTab === 'dashboard' ? 'tab-active' : 'text-gray-600 hover:text-blue-600'}">ダッシュボード</button>
                        <button id="customersTab" class="py-4 px-2 font-medium ${this.currentTab === 'customers' ? 'tab-active' : 'text-gray-600 hover:text-blue-600'}">顧客管理</button>
                        <button id="attendanceTab" class="py-4 px-2 font-medium ${this.currentTab === 'attendance' ? 'tab-active' : 'text-gray-600 hover:text-blue-600'}">出席名簿</button>
                    </div>
                </div>
            </nav>
        `;

        // コンテンツ
        let content = '';
        switch (this.currentTab) {
            case 'dashboard':
                content = this.renderDashboard();
                break;
            case 'customers':
                content = this.renderCustomers();
                break;
            case 'attendance':
                content = this.renderAttendance();
                break;
        }

        app.innerHTML = `
            <div class="min-h-screen">
                ${header}
                ${nav}
                <main class="container mx-auto px-4 py-8">
                    ${content}
                </main>
            </div>
        `;

        // イベントリスナー設定
        this.setupEventListeners();
    }

    // ダッシュボード表示
    renderDashboard() {
        const total = this.customerManager.customers.length;
        const activeCount = this.customerManager.customers.filter(c => c.status === '入会中').length;
        const pausedCount = this.customerManager.customers.filter(c => c.status === '休会中').length;
        const withdrawnCount = this.customerManager.customers.filter(c => c.status === '退会済み').length;

        return `
            <div>
                <h2 class="text-3xl font-bold mb-6 text-gray-800">ダッシュボード</h2>
                <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div class="bg-white rounded-lg shadow p-6">
                        <div class="text-gray-600 text-sm mb-2">総顧客数</div>
                        <div class="text-4xl font-bold text-blue-600">${total}</div>
                        <div class="text-xs text-gray-500 mt-2">名</div>
                    </div>
                    <div class="bg-white rounded-lg shadow p-6">
                        <div class="text-gray-600 text-sm mb-2">入会中</div>
                        <div class="text-4xl font-bold text-green-600">${activeCount}</div>
                        <div class="text-xs text-gray-500 mt-2">名</div>
                    </div>
                    <div class="bg-white rounded-lg shadow p-6">
                        <div class="text-gray-600 text-sm mb-2">休会中</div>
                        <div class="text-4xl font-bold text-orange-600">${pausedCount}</div>
                        <div class="text-xs text-gray-500 mt-2">名</div>
                    </div>
                    <div class="bg-white rounded-lg shadow p-6">
                        <div class="text-gray-600 text-sm mb-2">退会済み</div>
                        <div class="text-4xl font-bold text-gray-600">${withdrawnCount}</div>
                        <div class="text-xs text-gray-500 mt-2">名</div>
                    </div>
                </div>
                <div class="bg-white rounded-lg shadow p-6">
                    <h3 class="text-xl font-bold mb-4 text-gray-800">システム情報</h3>
                    <div class="text-sm text-gray-600 space-y-2">
                        <p>✅ コード分割済み - メンテナンスが容易</p>
                        <p>✅ Firebase連携 - リアルタイムデータベース</p>
                        <p>✅ レスポンシブデザイン - スマホ対応</p>
                    </div>
                </div>
            </div>
        `;
    }

    // 顧客管理表示
    renderCustomers() {
        const filteredCustomers = this.customerManager.getFilteredCustomers();
        
        return `
            <div>
                <h2 class="text-3xl font-bold mb-6 text-gray-800">顧客管理</h2>
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex justify-between items-center mb-4">
                        <p class="text-gray-600">顧客一覧: ${filteredCustomers.length}名</p>
                        <button id="exportBtn" class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition">
                            CSVエクスポート
                        </button>
                    </div>
                    <div class="text-sm text-gray-500">
                        ※ 完全な顧客管理機能は元のHTMLファイルをご利用ください
                    </div>
                </div>
            </div>
        `;
    }

    // 出席管理表示
    renderAttendance() {
        const revenue = this.attendanceManager.calculateVisitorRevenue();
        
        return `
            <div>
                <h2 class="text-3xl font-bold mb-6 text-gray-800">出席名簿</h2>
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="mb-4">
                        <div class="text-gray-600 text-sm mb-2">今月のビジター売上</div>
                        <div class="text-3xl font-bold text-yellow-600">¥${revenue.toLocaleString()}</div>
                    </div>
                    <div class="text-sm text-gray-500">
                        ※ 完全な出席記録機能は元のHTMLファイルをご利用ください
                    </div>
                </div>
            </div>
        `;
    }

    // イベントリスナー設定
    setupEventListeners() {
        // タブ切り替え
        document.getElementById('dashboardTab')?.addEventListener('click', () => {
            this.currentTab = 'dashboard';
            this.render();
        });

        document.getElementById('customersTab')?.addEventListener('click', () => {
            this.currentTab = 'customers';
            this.render();
        });

        document.getElementById('attendanceTab')?.addEventListener('click', () => {
            this.currentTab = 'attendance';
            this.render();
        });

        // CSVエクスポート
        document.getElementById('exportBtn')?.addEventListener('click', () => {
            this.customerManager.exportToCSV();
            alert('CSVをダウンロードしました');
        });
    }
}

// アプリケーション起動
window.addEventListener('DOMContentLoaded', () => {
    console.log('📱 DOMContentLoaded イベント発火');
    
    // DBが準備できるまで待つ（最大5秒）
    let attempts = 0;
    const waitForDB = setInterval(() => {
        attempts++;
        
        if (window.db) {
            clearInterval(waitForDB);
            console.log('✅ Firebase DB準備完了');
            window.app = new DanceStudioApp();
            window.app.init();
        } else if (attempts > 50) {
            clearInterval(waitForDB);
            console.error('❌ Firebase DB準備タイムアウト');
            alert('データベース接続に失敗しました。ページをリロードしてください。');
        }
    }, 100);
});
