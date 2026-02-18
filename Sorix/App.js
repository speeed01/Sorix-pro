import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  StatusBar
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export default function Sorix() {
  const [habits, setHabits] = useState([]);
  const [newHabit, setNewHabit] = useState('');

  // تحميل البيانات
  useEffect(() => {
    loadHabits();
  }, []);

  const loadHabits = async () => {
    try {
      const data = await AsyncStorage.getItem('sorix_habits');
      if (data) setHabits(JSON.parse(data));
    } catch (e) {
      console.log(e);
    }
  };

  const saveHabits = async (newHabits) => {
    try {
      await AsyncStorage.setItem('sorix_habits', JSON.stringify(newHabits));
      setHabits(newHabits);
    } catch (e) {
      console.log(e);
    }
  };

  // إضافة عادة
  const addHabit = () => {
    if (!newHabit.trim()) {
      Alert.alert('تنبيه', 'اكتب اسم العادة');
      return;
    }

    const habit = {
      id: Date.now().toString(),
      name: newHabit,
      logs: {},
      createdAt: new Date().toISOString()
    };

    saveHabits([...habits, habit]);
    setNewHabit('');
  };

  // تسجيل اليوم
  const toggleHabit = (habitId) => {
    const today = new Date().toISOString().split('T')[0];
    const updated = habits.map(h => {
      if (h.id === habitId) {
        return {
          ...h,
          logs: {
            ...h.logs,
            [today]: !h.logs[today]
          }
        };
      }
      return h;
    });
    saveHabits(updated);
  };

  // حذف عادة
  const deleteHabit = (id) => {
    Alert.alert(
      'حذف عادة',
      'متأكد؟',
      [
        { text: 'لا' },
        {
          text: 'نعم',
          onPress: () => saveHabits(habits.filter(h => h.id !== id)),
          style: 'destructive'
        }
      ]
    );
  };

  // حساب الاستمرارية
  const getStreak = (logs) => {
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      if (logs[dateStr]) streak++;
      else break;
    }
    return streak;
  };

  // حساب الإحصائيات
  const getStats = () => {
    const today = new Date();
    const last30 = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      last30.push(d.toISOString().split('T')[0]);
    }

    return habits.map(h => {
      let done = 0;
      last30.forEach(d => { if (h.logs[d]) done++; });
      return {
        name: h.name,
        percent: Math.round((done / 30) * 100),
        streak: getStreak(h.logs)
      };
    });
  };

  const stats = getStats();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#7C3AED" barStyle="light-content" />
      
      {/* الهيدر */}
      <View style={styles.header}>
        <Text style={styles.title}>SORIX</Text>
        <Text style={styles.subtitle}>عاداتك بلا حدود</Text>
      </View>

      {/* إضافة عادة */}
      <View style={styles.addSection}>
        <TextInput
          style={styles.input}
          placeholder="اكتب عادة جديدة..."
          value={newHabit}
          onChangeText={setNewHabit}
          onSubmitEditing={addHabit}
        />
        <TouchableOpacity style={styles.addButton} onPress={addHabit}>
          <Text style={styles.addButtonText}>➕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* قائمة العادات */}
        {habits.map(habit => {
          const today = new Date().toISOString().split('T')[0];
          const doneToday = habit.logs[today];

          return (
            <View key={habit.id} style={styles.card}>
              {/* رأس البطاقة */}
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.habitName}>{habit.name}</Text>
                  <Text style={styles.streakText}>🔥 {getStreak(habit.logs)} يوم</Text>
                </View>
                <TouchableOpacity onPress={() => deleteHabit(habit.id)}>
                  <Text style={styles.deleteBtn}>🗑️</Text>
                </TouchableOpacity>
              </View>

              {/* آخر 7 أيام */}
              <View style={styles.weekGrid}>
                {[...Array(7)].map((_, i) => {
                  const d = new Date();
                  d.setDate(d.getDate() - (6 - i));
                  const dateStr = d.toISOString().split('T')[0];
                  const done = habit.logs[dateStr];

                  return (
                    <View key={i} style={styles.dayBox}>
                      <Text style={styles.dayNum}>{d.getDate()}</Text>
                      <View style={[styles.dayDot, done && styles.dayDone]} />
                    </View>
                  );
                })}
              </View>

              {/* زر اليوم */}
              <TouchableOpacity
                style={[styles.todayBtn, doneToday && styles.todayBtnDone]}
                onPress={() => toggleHabit(habit.id)}
              >
                <Text style={styles.todayBtnText}>
                  {doneToday ? '✅ تم اليوم' : '📝 سجل اليوم'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}

        {/* إذا مافي عادات */}
        {habits.length === 0 && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>✨ أضف عادتك الأولى</Text>
          </View>
        )}

        {/* الإحصائيات */}
        {habits.length > 0 && (
          <View style={styles.statsBox}>
            <Text style={styles.statsTitle}>📊 إحصائيات 30 يوم</Text>
            
            {stats.map((s, i) => (
              <View key={i} style={styles.statRow}>
                <Text style={styles.statName}>{s.name}</Text>
                <View style={styles.progressBg}>
                  <View style={[styles.progressFill, { width: `${s.percent}%` }]} />
                </View>
                <Text style={styles.statPercent}>{s.percent}%</Text>
              </View>
            ))}

            {/* ملخص سريع */}
            <View style={styles.summaryBox}>
              <Text style={styles.summaryText}>
                ✅ أنجزت {stats.filter(s => s.percent >= 70).length} عادة بنسبة 70%+
              </Text>
              <Text style={styles.summaryText}>
                🔥 أطول استمرارية: {Math.max(...stats.map(s => s.streak), 0)} يوم
              </Text>
            </View>
          </View>
        )}

        {/* مساحة سفلي */}
        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F3FF',
  },
  header: {
    backgroundColor: '#7C3AED',
    padding: 25,
    paddingTop: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    color: '#DDD6FE',
    marginTop: 5,
  },
  addSection: {
    flexDirection: 'row',
    padding: 20,
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E9D8FD',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  addButton: {
    width: 55,
    backgroundColor: '#7C3AED',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  addButtonText: {
    fontSize: 24,
    color: 'white',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 18,
    marginHorizontal: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  habitName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  streakText: {
    fontSize: 13,
    color: '#F59E0B',
    marginTop: 2,
  },
  deleteBtn: {
    fontSize: 18,
    padding: 8,
  },
  weekGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  dayBox: {
    alignItems: 'center',
  },
  dayNum: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 5,
  },
  dayDot: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
  },
  dayDone: {
    backgroundColor: '#7C3AED',
  },
  todayBtn: {
    backgroundColor: '#EDE9FE',
    borderRadius: 15,
    padding: 12,
    alignItems: 'center',
  },
  todayBtnDone: {
    backgroundColor: '#7C3AED',
  },
  todayBtnText: {
    color: '#4B5563',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyBox: {
    padding: 50,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  statsBox: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 15,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statName: {
    width: 70,
    fontSize: 14,
    color: '#4B5563',
  },
  progressBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    marginHorizontal: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#7C3AED',
    borderRadius: 4,
  },
  statPercent: {
    width: 40,
    fontSize: 14,
    fontWeight: '600',
    color: '#7C3AED',
    textAlign: 'right',
  },
  summaryBox: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  summaryText: {
    fontSize: 14,
    color: '#4B5563',
    marginVertical: 3,
  },
});
