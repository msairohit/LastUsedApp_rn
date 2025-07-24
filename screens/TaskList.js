import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
dayjs.extend(relativeTime);

const defaultCategories = {
  "Personal Care": [
    "Haircut", "Beard Trim", "Nail Clipping", "Skincare Routine", "Dental Cleaning",
    "Eyebrow Threading", "Hair Coloring", "Shaving", "Hair Oiling", "Pedicure"
  ],
  "Home Maintenance": [
    "AC Filter Cleaned", "Battery Replaced (Remote)", "Refrigerator Defrosted",
    "Water Filter Changed", "Washing Machine Cleaned", "Lights Replaced",
    "Gas Cylinder Refilled", "Generator Oil Changed", "Fire Alarm Tested", "Roof/Gutter Cleaned"
  ],
  "Digital/Bills": [
    "Mobile Recharged", "Internet Bill Paid", "Electricity Bill Paid",
    "Netflix Subscription Renewed", "Phone Storage Cleared", "Password Changed",
    "Data Backup Done", "Antivirus Updated", "VPN Subscription Paid", "Credit Card Bill Paid"
  ]
};

const TaskList = ({ categories }) => {
  const [localCategories, setLocalCategories] = useState(defaultCategories);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [timestamps, setTimestamps] = useState({});
  const [showPicker, setShowPicker] = useState(false);
  const [pickerDate, setPickerDate] = useState(new Date());
  const [mode, setMode] = useState('date');

  // Load categories from props or fallback to default
  useEffect(() => {
    if (categories && Object.keys(categories).length > 0) {
      setLocalCategories(categories);
    } else {
      setLocalCategories(defaultCategories);
    }
  }, [categories]);

  // Set initial selected category and subcategory when categories change
  useEffect(() => {
    const catKeys = Object.keys(localCategories);
    if (catKeys.length > 0) {
      setSelectedCategory(catKeys[0]);
      setSelectedSubcategory(localCategories[catKeys[0]][0]);
    }
  }, [localCategories]);

  // Load timestamps for selected category
  useEffect(() => {
    if (!selectedCategory) return;
    (async () => {
      const stored = await AsyncStorage.getItem(`timestamps_${selectedCategory}`);
      if (stored) setTimestamps(JSON.parse(stored));
      else setTimestamps({});
    })();
  }, [selectedCategory]);

  // Add timestamp for subcategory
  const handleAddTimestamp = async (task, date) => {
    const updated = {
      ...timestamps,
      [task]: timestamps[task] ? [...timestamps[task], date.getTime()] : [date.getTime()]
    };
    setTimestamps(updated);
    await AsyncStorage.setItem(`timestamps_${selectedCategory}`, JSON.stringify(updated));
  };

  // Remove timestamp for subcategory
  const handleRemoveTimestamp = async (task, index) => {
    const arr = timestamps[task] ? [...timestamps[task]] : [];
    arr.splice(index, 1);
    const updated = { ...timestamps, [task]: arr };
    setTimestamps(updated);
    await AsyncStorage.setItem(`timestamps_${selectedCategory}`, JSON.stringify(updated));
  };

  // Show DateTime picker
  const openPicker = () => {
    setPickerDate(new Date());
    setShowPicker(true);
  };

  // Handle DateTime picker change
  const onPickerChange = (event, selectedDate) => {
    if (event.type === 'dismissed') {
      setShowPicker(false);
      setMode('date');
      return;
    }
    if (mode === 'date') {
      setPickerDate(selectedDate || pickerDate);
      setMode('time');
    } else {
      setPickerDate(selectedDate || pickerDate);
      setShowPicker(false);
      setMode('date');
      if (selectedDate) {
        handleAddTimestamp(selectedSubcategory, selectedDate);
      }
    }
  };

  const subcategories = localCategories[selectedCategory] || [];
  const subTimestamps = (timestamps[selectedSubcategory] || []).sort((a, b) => a - b);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Last Used App</Text>
      <View style={styles.dropdownContainer}>
        <Text style={styles.label}>Category</Text>
        <Picker
          selectedValue={selectedCategory}
          style={styles.picker}
          onValueChange={(itemValue) => {
            setSelectedCategory(itemValue);
            setSelectedSubcategory(localCategories[itemValue][0]);
          }}
        >
          {Object.keys(localCategories).map((cat) => (
            <Picker.Item label={cat} value={cat} key={cat} />
          ))}
        </Picker>
      </View>
      <View style={styles.dropdownContainer}>
        <Text style={styles.label}>Subcategory</Text>
        <Picker
          selectedValue={selectedSubcategory}
          style={styles.picker}
          onValueChange={(itemValue) => setSelectedSubcategory(itemValue)}
        >
          {subcategories.map((subcat) => (
            <Picker.Item label={subcat} value={subcat} key={subcat} />
          ))}
        </Picker>
      </View>
      <View style={styles.card}>
        <Text style={styles.task}>{selectedSubcategory}</Text>
        <TouchableOpacity style={styles.button} onPress={openPicker}>
          <Text style={styles.buttonText}>Add Timestamp</Text>
        </TouchableOpacity>
        <Text style={styles.label}>History:</Text>
        {subTimestamps.length === 0 ? (
          <Text style={styles.time}>No timestamps yet.</Text>
        ) : (
          subTimestamps
            .slice()
            .reverse()
            .map((ts, idx) => (
              <View key={ts + idx} style={styles.timestampRow}>
                <Text style={styles.time}>
                  {dayjs(ts).format('YYYY-MM-DD HH:mm')} ({dayjs(ts).fromNow()})
                </Text>
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => handleRemoveTimestamp(selectedSubcategory, subTimestamps.length - 1 - idx)}
                >
                  <Text style={styles.removeText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))
        )}
      </View>
      {showPicker && (
        <DateTimePicker
          value={pickerDate}
          mode={mode}
          display="default"
          onChange={onPickerChange}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: '#181A20', minHeight: '100%' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: 24, textAlign: 'center', letterSpacing: 1 },
  dropdownContainer: { marginBottom: 20 },
  label: { color: '#00C896', fontSize: 16, marginBottom: 8, fontWeight: 'bold' },
  picker: { backgroundColor: '#23272F', color: '#fff', borderRadius: 8 },
  card: {
    backgroundColor: '#23272F',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#00C896',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    marginTop: 24,
    marginBottom: 24
  },
  task: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 12, letterSpacing: 1 },
  time: { marginVertical: 4, color: '#aaa', fontSize: 16 },
  button: {
    backgroundColor: '#00C896',
    paddingVertical: 12,
    paddingHorizontal: 36,
    borderRadius: 10,
    marginTop: 12,
    marginBottom: 16,
    shadowColor: '#00C896',
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 2
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 17, letterSpacing: 1 },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181A20',
    borderRadius: 8,
    padding: 8,
    marginVertical: 4,
    width: '100%',
    justifyContent: 'space-between'
  },
  removeBtn: {
    marginLeft: 12,
    backgroundColor: '#ff4d4d',
    borderRadius: 6,
    padding: 4
  },
  removeText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});

export default TaskList;
