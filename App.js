import { useEffect, useState } from 'react';
import dataService from './services/firestoreDataService';
import { ActivityIndicator, TouchableOpacity, View, Text } from 'react-native';
import { useRouter } from 'expo-router';
export default function App() {
  const router = useRouter();
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
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <TouchableOpacity style={{ backgroundColor: 'lightblue', padding: 10, borderRadius: 5, marginBottom: 10 }}
        onPress={() => router.push("/CategoryManager")}>
        <Text>Manage Categories</Text>

      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push({
        pathname: "/TaskList",
        params: { categories }
      })}>
        <Text>Go to Categories</Text>

      </TouchableOpacity>
    </View>
  );
}
