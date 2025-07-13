import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DrawerContextType {
  refreshDrawer: () => void;
  isDrawerRefreshing: boolean;
}

const DrawerContext = createContext<DrawerContextType | undefined>(undefined);

export const useDrawer = () => {
  const context = useContext(DrawerContext);
  if (context === undefined) {
    throw new Error('useDrawer must be used within a DrawerProvider');
  }
  return context;
};

interface DrawerProviderProps {
  children: ReactNode;
}

export const DrawerProvider: React.FC<DrawerProviderProps> = ({ children }) => {
  const [isDrawerRefreshing, setIsDrawerRefreshing] = useState(false);

  const refreshDrawer = () => {
    setIsDrawerRefreshing(true);
    // Reset the refreshing state after a short delay
    setTimeout(() => {
      setIsDrawerRefreshing(false);
    }, 100);
  };

  return (
    <DrawerContext.Provider value={{ refreshDrawer, isDrawerRefreshing }}>
      {children}
    </DrawerContext.Provider>
  );
}; 