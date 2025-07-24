import { useEffect, useState } from 'react';
import TaskList from './screens/TaskList';
import dataService from './services/dataService';
import { ActivityIndicator, View } from 'react-native';
export default function App() {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState({});
  useEffect(() => {
    const loadData = async () => {
      await dataService.initializeData();
      const fetchedCategories = await dataService.getCategories();
      setCategories(fetchedCategories);
      setLoading(false);
    };
    loadData();
  }, []);
  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }
  return (
    <View>
      <TaskList categories={categories} /> {/* Use 'categories' prop */}
    </View>
  );
}
