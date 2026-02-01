// 誤って復元された生徒データをクリーンアップ
(async function() {
    console.log('===== 重複・誤った生徒データのクリーンアップ開始 =====');

    try {
        // 1. 顧客マスターを取得
        console.log('1. 顧客マスター読み込み中...');
        const customerNames = new Set();
        app.customers.forEach(customer => {
            const fullName = `${customer.lastName}${customer.firstName}`;
            customerNames.add(fullName);
            console.log(`顧客: ${fullName}`);
        });

        console.log(`顧客マスター: ${customerNames.size}名`);

        // 2. scheduleDataから顧客マスターに存在しない「ビジター（会員）」プランの生徒を抽出
        console.log('2. 削除対象の生徒を検索中...');
        const studentsToDelete = [];

        Object.keys(app.scheduleData).forEach(day => {
            app.scheduleData[day].forEach(classInfo => {
                if (classInfo.students && classInfo.students.length > 0) {
                    classInfo.students.forEach((student, index) => {
                        const fullName = `${student.lastName}${student.firstName}`;

                        // ビジター（会員）プランで、顧客マスターに存在しない生徒
                        if (student.plan === 'ビジター（会員）' && !customerNames.has(fullName)) {
                            studentsToDelete.push({
                                day: day,
                                location: classInfo.location,
                                className: classInfo.name,
                                lastName: student.lastName,
                                firstName: student.firstName,
                                plan: student.plan,
                                index: index
                            });
                        }
                    });
                }
            });
        });

        console.log(`削除対象: ${studentsToDelete.length}名`);
        console.table(studentsToDelete.map(s => ({
            曜日: s.day,
            場所: s.location,
            クラス: s.className,
            姓: s.lastName,
            名: s.firstName
        })));

        if (studentsToDelete.length === 0) {
            alert('✅ 削除する必要のある生徒は見つかりませんでした');
            console.log('===== クリーンアップ不要 =====');
            return;
        }

        // 3. ユーザーに確認
        const proceed = confirm(`${studentsToDelete.length}名の誤って復元された生徒が見つかりました。\n\nこれらは顧客マスターに存在しない名前の生徒です。\n\n削除しますか？`);

        if (!proceed) {
            console.log('===== キャンセルされました =====');
            return;
        }

        // 4. 削除処理（逆順で削除してインデックスのズレを防ぐ）
        console.log('3. 削除処理中...');
        let deletedCount = 0;

        // 曜日ごとにグループ化
        const groupedByDay = {};
        studentsToDelete.forEach(s => {
            if (!groupedByDay[s.day]) groupedByDay[s.day] = {};
            const classKey = `${s.location}_${s.className}`;
            if (!groupedByDay[s.day][classKey]) groupedByDay[s.day][classKey] = [];
            groupedByDay[s.day][classKey].push(s);
        });

        // 各クラスから削除
        Object.keys(groupedByDay).forEach(day => {
            Object.keys(groupedByDay[day]).forEach(classKey => {
                const students = groupedByDay[day][classKey];
                const [location, className] = classKey.split('_');

                const classData = app.scheduleData[day]?.find(c => c.location === location && c.name === className);
                if (classData && classData.students) {
                    // インデックスの大きい方から削除（逆順）
                    students.sort((a, b) => b.index - a.index);

                    students.forEach(student => {
                        classData.students.splice(student.index, 1);
                        console.log(`✓ 削除: ${day} - ${location} - ${className}: ${student.lastName} ${student.firstName}`);
                        deletedCount++;
                    });
                }
            });
        });

        // 5. Firebaseに保存
        console.log('4. Firebaseに保存中...');
        await app.saveScheduleData();

        // 6. データ再読み込み
        console.log('5. データ再読み込み中...');
        await app.loadScheduleData();
        await app.loadAttendance();

        // 7. 画面更新
        console.log('6. 画面更新中...');
        app.render();

        console.log('===== クリーンアップ完了 =====');
        alert(`✅ ${deletedCount}名の誤った生徒データを削除しました！\n\nダッシュボードでビジター売上を確認してください。`);

        // ダッシュボードに移動
        app.currentTab = 'dashboard';
        app.render();

    } catch (error) {
        console.error('❌ エラーが発生しました:', error);
        alert(`エラーが発生しました: ${error.message}`);
    }
})();
