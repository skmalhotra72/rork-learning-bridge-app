# Quick Start Guide: Using New Production Features

This guide shows you how to integrate the new features into your existing screens.

## 1. Adding Error Handling to Existing Screens

### Before:
```typescript
const handleSubmit = async () => {
  try {
    await saveData();
  } catch (error) {
    console.error('Error:', error);
    Alert.alert('Error', 'Something went wrong');
  }
};
```

### After:
```typescript
import { showError, showSuccess } from '@/utils/errorHandler';

const handleSubmit = async () => {
  try {
    await saveData();
    showSuccess('Data saved successfully!');
  } catch (error) {
    showError(error, 'Save Data');
  }
};
```

---

## 2. Adding Loading States

### Before:
```typescript
if (loading) {
  return <ActivityIndicator />;
}
```

### After:
```typescript
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorView from '@/components/ErrorView';

if (loading) {
  return <LoadingSpinner message="Loading your progress..." />;
}

if (error) {
  return <ErrorView message="Failed to load data" onRetry={fetchData} />;
}
```

---

## 3. Adding Offline Support to Critical Operations

### Example: Saving XP (already in gamification service)
```typescript
import { queueAction, isOnline } from '@/services/offlineSync';

export const addXPWithOfflineSupport = async (userId: string, xpAmount: number) => {
  const online = await isOnline();
  
  if (!online) {
    await queueAction({
      type: 'add_xp',
      data: { p_user_id: userId, p_xp_amount: xpAmount, ... }
    });
    return { success: true, offline: true };
  }
  
  // Online - execute normally
  return await addXP(userId, xpAmount);
};
```

### Example: Saving Assessment Results
```typescript
import { queueAction, isOnline } from '@/services/offlineSync';

const saveAssessment = async (assessmentData) => {
  if (!await isOnline()) {
    await queueAction({
      type: 'save_assessment',
      data: assessmentData
    });
    showSuccess('Assessment saved! Will sync when online.');
    return;
  }
  
  // Save normally when online
  await supabase.from('assessments').insert(assessmentData);
  showSuccess('Assessment saved!');
};
```

---

## 4. Optimizing Search/Filter Features

### Before:
```typescript
const [search, setSearch] = useState('');

// Runs on every keystroke
const filtered = data.filter(item => 
  item.name.toLowerCase().includes(search.toLowerCase())
);
```

### After:
```typescript
import { useDebounce, useMemoizedValue } from '@/utils/performance';

const [search, setSearch] = useState('');
const debouncedSearch = useDebounce(search, 300); // Wait 300ms after typing stops

// Only recalculates when debouncedSearch changes
const filtered = useMemoizedValue(
  () => data.filter(item => 
    item.name.toLowerCase().includes(debouncedSearch.toLowerCase())
  ),
  [data, debouncedSearch]
);
```

---

## 5. Optimizing Scroll Handlers

### Before:
```typescript
const handleScroll = (event) => {
  // Runs on every scroll event (hundreds per second!)
  updateScrollPosition(event.nativeEvent.contentOffset.y);
};
```

### After:
```typescript
import { useThrottle } from '@/utils/performance';

const handleScroll = useThrottle((event) => {
  // Runs at most once per second
  updateScrollPosition(event.nativeEvent.contentOffset.y);
}, 1000);
```

---

## 6. Caching Frequently Accessed Data

### Example: Caching User Profile
```typescript
import { cacheData, getCachedData } from '@/services/offlineSync';

const loadUserProfile = async (userId: string) => {
  // Try to get from cache first
  const cached = await getCachedData(`profile_${userId}`, 3600000); // 1 hour
  if (cached) {
    setProfile(cached);
    return;
  }
  
  // Fetch from server if not cached
  const { data } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  // Cache for next time
  await cacheData(`profile_${userId}`, data);
  setProfile(data);
};
```

---

## 7. Testing Onboarding Flow

### To Show Onboarding Again (for testing):
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// In a settings screen or dev menu
const resetOnboarding = async () => {
  await AsyncStorage.removeItem('@onboarding_complete');
  // Restart app or navigate to index
};
```

---

## 8. Using App Configuration

### Before:
```typescript
const appName = 'Buddy';
const version = '1.0.0';
const supportEmail = 'support@example.com';
```

### After:
```typescript
import { APP_CONFIG, APP_VERSION, SUPPORTED_LANGUAGES } from '@/constants/appConfig';

const AboutScreen = () => (
  <View>
    <Text>{APP_CONFIG.name}</Text>
    <Text>Version: {APP_VERSION}</Text>
    <Text>Support: {APP_CONFIG.supportEmail}</Text>
  </View>
);
```

---

## 9. Showing Confirmation Dialogs

### Before:
```typescript
const handleDelete = () => {
  Alert.alert('Confirm', 'Delete this item?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', onPress: () => deleteItem() }
  ]);
};
```

### After:
```typescript
import { showConfirmation } from '@/utils/errorHandler';

const handleDelete = () => {
  showConfirmation(
    'Are you sure you want to delete this item?',
    () => deleteItem(),
    'Confirm Deletion'
  );
};
```

---

## 10. Complete Example: Updated Screen

Here's a complete example of a screen using all the new features:

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { useDebounce, useMemoizedValue } from '@/utils/performance';
import { showError, showSuccess } from '@/utils/errorHandler';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorView from '@/components/ErrorView';
import { queueAction, isOnline } from '@/services/offlineSync';

const MyScreen = () => {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Debounce search to avoid too many re-renders
  const debouncedSearch = useDebounce(search, 300);
  
  // Memoize filtered data
  const filteredData = useMemoizedValue(
    () => data.filter(item => 
      item.name.toLowerCase().includes(debouncedSearch.toLowerCase())
    ),
    [data, debouncedSearch]
  );
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetchDataFromAPI();
      setData(response);
    } catch (err) {
      setError('Failed to load data');
      showError(err, 'Load Data');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSave = async (item) => {
    try {
      if (!await isOnline()) {
        // Queue for later if offline
        await queueAction({
          type: 'save_item',
          data: item
        });
        showSuccess('Saved! Will sync when online.');
        return;
      }
      
      // Save normally when online
      await saveToAPI(item);
      showSuccess('Item saved successfully!');
    } catch (err) {
      showError(err, 'Save Item');
    }
  };
  
  if (loading) {
    return <LoadingSpinner message="Loading items..." />;
  }
  
  if (error) {
    return <ErrorView message={error} onRetry={loadData} />;
  }
  
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="Search..."
        value={search}
        onChangeText={setSearch}
      />
      
      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleSave(item)}>
            <Text>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16
  },
  search: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 16
  }
});

export default MyScreen;
```

---

## Common Patterns

### Pattern 1: Data Fetching with Error Handling
```typescript
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

const fetchData = async () => {
  try {
    setLoading(true);
    const result = await api.getData();
    setData(result);
  } catch (err) {
    setError(err);
    showError(err, 'Fetch Data');
  } finally {
    setLoading(false);
  }
};
```

### Pattern 2: Form Submission with Offline Support
```typescript
const handleSubmit = async (formData) => {
  try {
    if (!await isOnline()) {
      await queueAction({ type: 'submit_form', data: formData });
      showSuccess('Saved! Will sync when online.');
      return;
    }
    
    await api.submit(formData);
    showSuccess('Form submitted!');
  } catch (err) {
    showError(err, 'Submit Form');
  }
};
```

### Pattern 3: Expensive List Filtering
```typescript
const [items, setItems] = useState([]);
const [filter, setFilter] = useState('');
const debouncedFilter = useDebounce(filter, 300);

const filteredItems = useMemoizedValue(
  () => items.filter(item => matchesFilter(item, debouncedFilter)),
  [items, debouncedFilter]
);
```

---

## Tips & Best Practices

1. **Always use error handlers** - Replace generic Alert.alert with showError
2. **Add loading states** - Use LoadingSpinner instead of ActivityIndicator
3. **Debounce search inputs** - Prevents excessive re-renders
4. **Cache static data** - User profiles, app settings, etc.
5. **Queue critical operations** - XP, assessments, progress
6. **Show offline indicators** - Let users know when they're offline
7. **Test offline mode** - Airplane mode or network settings
8. **Monitor performance** - Use the measurement utilities
9. **Keep cache fresh** - Set appropriate TTL values
10. **Clear cache on logout** - Privacy and data freshness

---

## Need Help?

- Check `docs/IMPLEMENTATION_SUMMARY.md` for detailed documentation
- Review existing code in `services/` for examples
- Look at `app/onboarding.tsx` for a complete screen example

**Happy coding! 🚀**
