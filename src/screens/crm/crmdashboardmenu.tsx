import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const CrmDashboardMenu = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>CRM Dashboard</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
});

export default CrmDashboardMenu;
