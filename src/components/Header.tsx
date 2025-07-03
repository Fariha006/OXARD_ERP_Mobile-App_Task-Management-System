import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NativeStackHeaderProps } from '@react-navigation/native-stack';

type Props = NativeStackHeaderProps;

const Header = ({ navigation, route }: Props) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.back}>←</Text>
      </TouchableOpacity>
      <Text style={styles.title}>{route.name}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 60,
    backgroundColor: '#6200ee',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  back: {
    color: 'white',
    fontSize: 20,
    marginRight: 15,
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default Header;
