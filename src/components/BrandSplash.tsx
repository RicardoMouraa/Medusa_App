import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';

const logo = require('../../assets/icon.png');

const BrandSplash = () => {
  const scale = useRef(new Animated.Value(0.9)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.loop(
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.05,
            duration: 900,
            useNativeDriver: true
          }),
          Animated.timing(scale, {
            toValue: 0.95,
            duration: 900,
            useNativeDriver: true
          })
        ])
      ),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true
      })
    ]).start();
  }, [opacity, scale]);

  return (
    <View style={styles.container}>
      <Animated.Image source={logo} style={[styles.logo, { transform: [{ scale }], opacity }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A7E51',
    alignItems: 'center',
    justifyContent: 'center'
  },
  logo: {
    width: 140,
    height: 140,
    resizeMode: 'contain'
  }
});

export default BrandSplash;
