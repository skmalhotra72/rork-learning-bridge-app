import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Dimensions, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

interface OnboardingPage {
  emoji: string;
  title: string;
  description: string;
}

const OnboardingScreen: React.FC = () => {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [currentPage, setCurrentPage] = useState(0);

  const pages: OnboardingPage[] = [
    {
      emoji: '🎓',
      title: 'Welcome to Buddy!',
      description: 'Your personal AI tutor that helps you master CBSE subjects with fun and interactive learning'
    },
    {
      emoji: '🎯',
      title: 'Learn at Your Pace',
      description: 'Get personalized explanations, practice problems, and instant doubt solving in your preferred language'
    },
    {
      emoji: '🏆',
      title: 'Track Your Progress',
      description: 'Earn XP, unlock badges, maintain streaks, and watch yourself improve every day'
    },
    {
      emoji: '👨‍👩‍👧',
      title: 'Parents Stay Connected',
      description: 'Parents can track progress, set goals, and celebrate achievements together'
    }
  ];

  const handleNext = () => {
    if (currentPage < pages.length - 1) {
      scrollRef.current?.scrollTo({
        x: width * (currentPage + 1),
        animated: true
      });
      setCurrentPage(currentPage + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = async () => {
    await AsyncStorage.setItem('@onboarding_complete', 'true');
    router.replace('/welcome');
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={(e) => {
          const page = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentPage(page);
        }}
        scrollEventThrottle={16}
      >
        {pages.map((page, index) => (
          <View key={index} style={styles.page}>
            <Text style={styles.emoji}>{page.emoji}</Text>
            <Text style={styles.title}>{page.title}</Text>
            <Text style={styles.description}>{page.description}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Pagination */}
      <View style={styles.pagination}>
        {pages.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              currentPage === index && styles.dotActive
            ]}
          />
        ))}
      </View>

      {/* Buttons */}
      <View style={styles.buttons}>
        {currentPage < pages.length - 1 && (
          <TouchableOpacity onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
        >
          <Text style={styles.nextText}>
            {currentPage === pages.length - 1 ? "Let's Start! 🚀" : 'Next →'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF'
  },
  page: {
    width,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40
  },
  emoji: {
    fontSize: 100,
    marginBottom: 32
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 4
  },
  dotActive: {
    width: 24,
    backgroundColor: '#4F46E5'
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20
  },
  skipText: {
    fontSize: 16,
    color: '#6B7280'
  },
  nextButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12
  },
  nextText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600'
  }
});

export default OnboardingScreen;
