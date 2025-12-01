import React, { useEffect, useRef } from 'react'
import { View, Text, Modal, Animated, TouchableOpacity, StyleSheet } from 'react-native'
import * as Haptics from 'expo-haptics'

interface CelebrationData {
  newLevel?: number
  xpEarned?: number
  badgeEmoji?: string
  badgeName?: string
  badgeDescription?: string
  xpReward?: number
  streakDay?: number
  badgeEarned?: string
  reason?: string
}

interface CelebrationModalProps {
  visible: boolean
  type: 'level_up' | 'badge' | 'streak' | 'xp' | null
  data: CelebrationData
  onClose: () => void
}

const CelebrationModal: React.FC<CelebrationModalProps> = ({ visible, type, data, onClose }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current
  const fadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        })
      ]).start()
    } else {
      scaleAnim.setValue(0)
      fadeAnim.setValue(0)
    }
  }, [visible, scaleAnim, fadeAnim])

  const renderContent = () => {
    switch (type) {
      case 'level_up':
        return (
          <View style={styles.content}>
            <Text style={styles.celebrationEmoji}>🎉</Text>
            <Text style={styles.title}>Level Up!</Text>
            <Text style={styles.subtitle}>
              You&apos;ve reached Level {data.newLevel}
            </Text>
            <View style={styles.xpBadge}>
              <Text style={styles.xpText}>+{data.xpEarned} XP</Text>
            </View>
          </View>
        )

      case 'badge':
        return (
          <View style={styles.content}>
            <Text style={styles.badgeEmoji}>{data.badgeEmoji || '🏆'}</Text>
            <Text style={styles.title}>Badge Unlocked!</Text>
            <Text style={styles.subtitle}>{data.badgeName}</Text>
            <Text style={styles.description}>{data.badgeDescription}</Text>
            <View style={styles.xpBadge}>
              <Text style={styles.xpText}>+{data.xpReward} XP</Text>
            </View>
          </View>
        )

      case 'streak':
        return (
          <View style={styles.content}>
            <Text style={styles.celebrationEmoji}>🔥</Text>
            <Text style={styles.title}>{data.streakDay} Day Streak!</Text>
            <Text style={styles.subtitle}>You&apos;re on fire! Keep it going!</Text>
            {data.badgeEarned && (
              <Text style={styles.bonusText}>
                Bonus: {data.badgeEarned} badge unlocked! 🎊
              </Text>
            )}
          </View>
        )

      case 'xp':
        return (
          <View style={styles.content}>
            <Text style={styles.celebrationEmoji}>⭐</Text>
            <Text style={styles.title}>+{data.xpEarned} XP</Text>
            <Text style={styles.subtitle}>{data.reason}</Text>
          </View>
        )

      default:
        return null
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.modal,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          {renderContent()}

          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>Awesome! ✨</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8
  },
  content: {
    alignItems: 'center',
    marginBottom: 24
  },
  celebrationEmoji: {
    fontSize: 80,
    marginBottom: 16
  },
  badgeEmoji: {
    fontSize: 100,
    marginBottom: 16
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8
  },
  description: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 16
  },
  bonusText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600' as const,
    textAlign: 'center',
    marginTop: 8
  },
  xpBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 12
  },
  xpText: {
    color: '#92400E',
    fontSize: 16,
    fontWeight: 'bold' as const
  },
  closeButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%'
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600' as const,
    textAlign: 'center'
  }
})

export default CelebrationModal
