import AsyncStorage from '@react-native-async-storage/async-storage';

export function useRecipes({ vegetarianOnly, search }: UseRecipesOptions = {}) {
  // ... existing code ...

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      
      // Try to get cached data first
      const cached = await AsyncStorage.getItem('recipes');
      const cacheTime = await AsyncStorage.getItem('recipes_cache_time');
      
      // Use cache if it's less than 5 minutes old
      if (cached && cacheTime && (Date.now() - parseInt(cacheTime)) < 300000) {
        const parsedData = JSON.parse(cached);
        setRecipes(filterRecipes(parsedData));
        setLoading(false);
        
        // Fetch fresh data in background
        refreshDataInBackground();
        return;
      }

      // No cache or expired, fetch fresh data
      const response = await axios.get('https://recipe-api.onrender.com/api/recipes');
      const data = response.data;
      
      // Cache the response
      await AsyncStorage.setItem('recipes', JSON.stringify(data));
      await AsyncStorage.setItem('recipes_cache_time', Date.now().toString());
      
      setRecipes(filterRecipes(data));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };
} 