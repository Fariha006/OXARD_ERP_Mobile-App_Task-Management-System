import { useDrawer } from '../context/DrawerContext';

// Hook to get drawer refresh function
export const useDrawerRefresh = () => {
  const { refreshDrawer } = useDrawer();
  return refreshDrawer;
};

// Utility function to refresh drawer (can be used in components that don't have access to context)
export const refreshDrawerData = async () => {
  try {
    console.log('DrawerRefresh: Manually refreshing drawer data...');
    
    // You can add any additional logic here if needed
    // For example, clearing cache, re-fetching data, etc.
    
    console.log('DrawerRefresh: Drawer refresh completed');
  } catch (error) {
    console.error('DrawerRefresh: Error refreshing drawer:', error);
  }
}; 