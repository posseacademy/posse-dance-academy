// ビジター履歴復元スクリプト
// 本番環境のindex-enhanced.htmlのブラウザコンソールで実行してください

async function restoreVisitorData() {
    console.log('===== ビジター履歴復元開始 =====');

    try {
        // 1. scheduleDataを確認
        console.log('1. Schedule Data確認中...');
        console.log('Schedule Data:', app.scheduleData);

        // 2. attendanceDataを確認
        console.log('2. Attendance Data確認中...');
        console.log('Attendance Data keys:', Object.keys(app.attendanceData).length);

        // 3. attendanceDataのキーを解析して、scheduleDataに存在しない生徒を抽出
        const missingStudents = [];
        Object.keys(app.attendanceData).forEach(key => {
            const parts = key.split('_');
            if (parts.length >= 4) {
                const day = parts[0];
                const location = parts[1];
                const className = parts[2];
                const studentName = parts.slice(3).join('_');

                // scheduleDataに該当するクラスを検索
                const classData = app.scheduleData[day]?.find(c => c.location === location && c.name === className);

                if (classData) {
                    // 生徒が存在するか確認
                    const student = classData.students?.find(s => `${s.lastName}${s.firstName}` === studentName);

                    if (!student) {
                        // 生徒が見つからない場合、ビジター参加者として記録
                        missingStudents.push({
                            key: key,
                            day: day,
                            location: location,
                            className: className,
                            studentName: studentName,
                            attendance: app.attendanceData[key]
                        });
                    }
                } else {
                    console.warn(`クラスが見つかりません: ${day} - ${location} - ${className}`);
                }
            }
        });

        console.log('3. 見つからない生徒:', missingStudents);

        if (missingStudents.length === 0) {
            console.log('✅ すべての生徒がscheduleDataに存在しています。復元の必要はありません。');
            return;
        }

        // 4. 見つからない生徒をscheduleDataに追加
        let restoredCount = 0;

        missingStudents.forEach(student => {
            // 名前を姓と名に分割（仮）
            // 日本人の名前を仮定して、最後の2文字を名、残りを姓とする
            const lastName = student.studentName.length > 2 ? student.studentName.slice(0, -2) : student.studentName;
            const firstName = student.studentName.length > 2 ? student.studentName.slice(-2) : '';

            // scheduleDataに追加
            const classData = app.scheduleData[student.day]?.find(c => c.location === student.location && c.name === student.className);
            if (classData) {
                if (!classData.students) {
                    classData.students = [];
                }

                // デフォルトのビジタープランを設定
                classData.students.push({
                    lastName: lastName,
                    firstName: firstName,
                    plan: 'ビジター（会員）'  // デフォルト値
                });

                console.log(`✓ 復元: ${student.day} - ${student.location} - ${student.className}: ${lastName} ${firstName}`);
                restoredCount++;
            }
        });

        console.log(`4. 復元された生徒数: ${restoredCount}名`);

        // 5. Firestoreに保存
        console.log('5. Firebaseに保存中...');
        await app.saveScheduleData();

        console.log('===== ビジター履歴復元完了 =====');
        console.log(`✅ ${restoredCount}名の生徒を復元しました`);
        console.log('⚠️  注意: すべてのビジター参加者のプランは「ビジター（会員）」に設定されています。');
        console.log('必要に応じて、出席記録画面で個別に編集してください。');
        console.log('ページを再読み込みしてビジター売上を確認してください。');

        // ページを再読み込み
        await app.loadScheduleData();
        await app.loadAttendance();
        app.render();

        alert(`✅ ビジター履歴を復元しました！\n復元された生徒数: ${restoredCount}名\n\n⚠️ すべてのビジター参加者のプランは「ビジター（会員）」に設定されています。\n必要に応じて、出席記録画面で個別に編集してください。`);

    } catch (error) {
        console.error('❌ エラーが発生しました:', error);
        alert(`エラーが発生しました: ${error.message}`);
    }
}

// 実行
console.log('復元スクリプトが読み込まれました。');
console.log('実行するには: restoreVisitorData()');
