import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { DN, FontFamily, FontSize, Space } from '@/constants/design-tokens';

const { width, height } = Dimensions.get('window');

type ProjectSplashProps = {
  onFinish: () => void;
};

export function ProjectSplash({ onFinish }: ProjectSplashProps) {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.85)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const glowMove = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 7,
        tension: 45,
        useNativeDriver: true,
      }),
      Animated.timing(progress, {
        toValue: 1,
        duration: 1800,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowMove, {
            toValue: 1,
            duration: 2200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glowMove, {
            toValue: 0,
            duration: 2200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ),
    ]);

    animation.start();

    const timer = setTimeout(() => {
      onFinish();
    }, 1900);

    return () => {
      animation.stop();
      clearTimeout(timer);
    };
  }, [glowMove, logoOpacity, logoScale, onFinish, progress]);

  const glowTranslate = glowMove.interpolate({
    inputRange: [0, 1],
    outputRange: [-35, 35],
  });

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 100],
  });

  return (
    <View style={styles.container}>
      {/* Background waves */}
      <Animated.View
        style={[
          styles.waveTop,
          {
            transform: [
              { translateX: glowTranslate },
              { rotate: '-18deg' },
            ],
          },
        ]}
      />

      <Animated.View
        style={[
          styles.waveBottom,
          {
            transform: [
              { translateX: glowTranslate },
              { rotate: '-18deg' },
            ],
          },
        ]}
      />

      <View style={styles.waveGlowTop} />
      <View style={styles.waveGlowBottom} />

      {/* Logo */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        <Image
          source={require('@/assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />


      </Animated.View>

      {/* Loading bar */}
      <View style={styles.loadingContainer}>
        <View style={styles.loadingTrack}>
          <Animated.View
            style={[
              styles.loadingProgress,
              {
                width: progressWidth,
              },
            ]}
          />
        </View>
      </View>

      <Text style={styles.loadingText}>BUILDING YOUR PROJECT PROFILE</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width,
    height,
    backgroundColor: '#050A18',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    zIndex: 9999,
  },

  // Top glowing wave
  waveTop: {
    position: 'absolute',
    width: width * 1.5,
    height: 240,
    borderTopWidth: 2,
    borderColor: '#208AEF',
    borderRadius: 200,
    top: -110,
    left: -150,
    opacity: 0.8,
  },

  waveGlowTop: {
    position: 'absolute',
    width: width * 1.2,
    height: 180,
    borderTopWidth: 1,
    borderColor: '#00C3E4',
    borderRadius: 180,
    top: -60,
    left: -80,
    opacity: 0.35,
  },

  // Bottom glowing wave
  waveBottom: {
    position: 'absolute',
    width: width * 1.6,
    height: 320,
    borderBottomWidth: 2,
    borderColor: '#208AEF',
    borderRadius: 260,
    bottom: -160,
    right: -220,
    opacity: 0.9,
  },

  waveGlowBottom: {
    position: 'absolute',
    width: width * 1.3,
    height: 250,
    borderBottomWidth: 1,
    borderColor: '#8B5CF6',
    borderRadius: 220,
    bottom: -110,
    right: -140,
    opacity: 0.4,
  },

  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
  },

  logo: {
    width: 300,
    height: 120,
  },

  brand: {
    marginTop: Space.sm,
    fontSize: FontSize['2xl'],
    fontFamily: FontFamily.bold,
    letterSpacing: -0.5,
  },

  projectText: {
    color: '#FFFFFF',
  },

  dnaText: {
    color: '#208AEF',
  },

  loadingContainer: {
    position: 'absolute',
    bottom: height * 0.17,
    alignItems: 'center',
  },

  loadingTrack: {
    width: 125,
    height: 4,
    borderRadius: 4,
    backgroundColor: '#15213A',
    overflow: 'hidden',
  },

  loadingProgress: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#00C3E4',
  },

  loadingText: {
    position: 'absolute',
    bottom: height * 0.12,
    fontSize: 9,
    fontFamily: FontFamily.mono,
    color: '#51627F',
    letterSpacing: 1,
  },
});