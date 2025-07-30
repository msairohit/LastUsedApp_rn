import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, LayoutAnimation, UIManager, Platform } from 'react-native';
import dataService, { defaultCategories } from '../services/firestoreDataService';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../configs/firebaseConfig';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

dayjs.extend(relativeTime);

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const TaskList = () => {
  const [localCategories, setLocalCategories] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [timestamps, setTimestamps] = useState({});
  const [showPicker, setShowPicker] = useState(false);
  const [pickerDate, setPickerDate] = useState(new Date());
  const [mode, setMode] = useState('date');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [userCategories, storedTimestamps] = await Promise.all([
          dataService.getCategories(user.email),
          dataService.getTimestamps(user.email)
        ]);
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setLocalCategories(userCategories || defaultCategories);
        setTimestamps(storedTimestamps || {});
      } catch (error) {
        console.error("Failed to fetch task list data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  useEffect(() => {
    const catKeys = Object.keys(localCategories);
    if (catKeys.length > 0) {
      const firstCategory = catKeys[0];
      setSelectedCategory(firstCategory);
      if (localCategories[firstCategory]?.length > 0) {
        setSelectedSubcategory(localCategories[firstCategory][0]);
      } else {
        setSelectedSubcategory('');
      }
    }
  }, [localCategories]);

  const handleAddTimestamp = async (task, date) => {
    if (!user) return;
    const newTimestamp = date.getTime();
    const updatedTimestamps = { ...timestamps };
    if (!updatedTimestamps[selectedCategory]) updatedTimestamps[selectedCategory] = {};
    if (!updatedTimestamps[selectedCategory][task]) updatedTimestamps[selectedCategory][task] = [];
    updatedTimestamps[selectedCategory][task].push(newTimestamp);

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setTimestamps(updatedTimestamps);
    await dataService.addTimestamp(user.email, selectedCategory, task, newTimestamp);
  };

  const handleRemoveTimestamp = async (task, timestampToRemove) => {
    if (!user) return;
    const updatedTimestamps = { ...timestamps };
    if (updatedTimestamps[selectedCategory] && updatedTimestamps[selectedCategory][task]) {
      updatedTimestamps[selectedCategory][task] = updatedTimestamps[selectedCategory][task].filter(ts => ts !== timestampToRemove);
    }

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setTimestamps(updatedTimestamps);
    await dataService.removeTimestamp(user.email, selectedCategory, task, timestampToRemove);
  };

  const openPicker = () => {
    setPickerDate(new Date());
    setMode('date');
    setShowPicker(true);
  };

  const onPickerChange = (event, selectedDate) => {
    const currentDate = selectedDate || pickerDate;
    setShowPicker(false);
    if (event.type === 'set') {
      setPickerDate(currentDate);
      if (mode === 'date') {
        setMode('time');
        setShowPicker(true);
      } else {
        handleAddTimestamp(selectedSubcategory, currentDate);
        setMode('date');
      }
    } else {
      setMode('date');
    }
  };

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#10B981" /></View>;
  }

  const subcategories = localCategories[selectedCategory] || [];
  const subTimestamps = ((timestamps[selectedCategory] || {})[selectedSubcategory] || []).sort((a, b) => b - a);

  return (
    <View style={{ flex: 1, backgroundColor: '#111827' }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Animated.Text style={styles.title} entering={FadeInUp.duration(500)}>Track It</Animated.Text>

        <Animated.View entering={FadeInUp.duration(500).delay(200)}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedCategory}
              style={styles.picker}
              itemStyle={styles.pickerItem}
              dropdownIconColor="#10B981"
              onValueChange={(itemValue) => {
                setSelectedCategory(itemValue);
                setSelectedSubcategory(localCategories[itemValue]?.[0] || '');
              }}
            >
              {Object.keys(localCategories).map((cat) => (
                <Picker.Item label={cat} value={cat} key={cat} />
              ))}
            </Picker>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(500).delay(400)}>
          <Text style={styles.label}>Subcategory</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedSubcategory}
              style={styles.picker}
              itemStyle={styles.pickerItem}
              dropdownIconColor="#10B981"
              enabled={subcategories.length > 0}
              onValueChange={(itemValue) => setSelectedSubcategory(itemValue)}
            >
              {subcategories.map((subcat) => (
                <Picker.Item label={subcat} value={subcat} key={subcat} />
              ))}
            </Picker>
          </View>
        </Animated.View>

        <Animated.View style={styles.card} entering={FadeInUp.duration(500).delay(600)}>
          <Text style={styles.task}>{selectedSubcategory || 'Select a task'}</Text>
          <Text style={styles.lastUsed}>
            Last used: {subTimestamps.length > 0 ? dayjs(subTimestamps[0]).fromNow() : 'Never'}
          </Text>
          <TouchableOpacity style={styles.button} onPress={openPicker} disabled={!selectedSubcategory}>
            <Feather name="plus-circle" size={20} color="#fff" />
            <Text style={styles.buttonText}>Add Usage</Text>
          </TouchableOpacity>

          <View style={styles.historyContainer}>
            <Text style={styles.historyTitle}>History</Text>
            {subTimestamps.length === 0 ? (
              <Text style={styles.historyTime}>No entries yet.</Text>
            ) : (
              subTimestamps.map((ts, idx) => (
                <Animated.View key={ts + idx} style={styles.timestampRow} entering={FadeInDown.delay(idx * 50)}>
                  <View style={styles.timestampTextContainer}>
                    <Text style={styles.historyTime}>{dayjs(ts).format('MMM D, YYYY')}</Text>
                    <Text style={styles.historyDate}>{dayjs(ts).format('h:mm A')}</Text>
                  </View>
                  <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemoveTimestamp(selectedSubcategory, ts)}>
                    <Feather name="trash-2" size={16} color="#F87171" />
                  </TouchableOpacity>
                </Animated.View>
              ))
            )}
          </View>
        </Animated.View>

        {showPicker && (
          <DateTimePicker value={pickerDate} mode={mode} display="default" onChange={onPickerChange} />
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111827' },
  container: { padding: 24, backgroundColor: '#111827', minHeight: '100%', paddingTop: 60 },
  title: { fontSize: 36, fontWeight: 'bold', color: '#fff', marginBottom: 24, textAlign: 'center' },
  label: { color: '#9CA3AF', fontSize: 16, marginBottom: 8, marginLeft: 4 },
  pickerContainer: { backgroundColor: '#1F2937', borderRadius: 12, marginBottom: 20 },
  picker: { color: '#fff' },
  pickerItem: { color: '#fff', fontSize: 16 },
  card: {
    backgroundColor: '#1F2937',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginTop: 16,
  },
  task: { fontSize: 24, fontWeight: 'bold', color: '#fff', textAlign: 'center' },
  lastUsed: { color: '#9CA3AF', fontSize: 16, marginVertical: 8 },
  button: {
    flexDirection: 'row',
    backgroundColor: '#10B981',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    marginTop: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginLeft: 8 },
  historyContainer: { width: '100%', marginTop: 16 },
  historyTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 12,
    marginVertical: 4,
    justifyContent: 'space-between'
  },
  timestampTextContainer: {
    flex: 1,
  },
  historyTime: { color: '#D1D5DB', fontSize: 16 },
  historyDate: { color: '#9CA3AF', fontSize: 12 },
  removeBtn: {
    padding: 8,
  },
});

export default TaskList;
