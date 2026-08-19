import React, { useRef, useState, useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// --- Primary Play Button ---
interface PrimaryPlayButtonProps {
  onPress?: () => void;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const PrimaryPlayButton: React.FC<PrimaryPlayButtonProps> = ({
  onPress,
  label = 'Watch Now',
  size = 'md',
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [isHovered, setIsHovered] = useState(false);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: isHovered ? 1.04 : 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    Animated.spring(scaleAnim, {
      toValue: 1.04,
      friction: 4,
      useNativeDriver: true,
    }).start();
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
  };

  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 20 : 16;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.primaryBtn, size === 'sm' && styles.btnSm, size === 'lg' && styles.btnLg]}
        {...(Platform.OS === 'web'
          ? ({
              onMouseEnter: handleMouseEnter,
              onMouseLeave: handleMouseLeave,
            } as any)
          : {})}
      >
        <Ionicons name="play" size={iconSize} color="#ffffff" style={{ marginRight: 6 }} />
        <Text style={[styles.primaryText, size === 'sm' && styles.textSm, size === 'lg' && styles.textLg]}>
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// --- Glass Watchlist Button ---
interface GlassWatchlistButtonProps {
  isSaved: boolean;
  onToggle: () => void;
  label?: string;
  savedLabel?: string;
}

export const GlassWatchlistButton: React.FC<GlassWatchlistButtonProps> = ({
  isSaved,
  onToggle,
  label = '+ Watchlist',
  savedLabel = 'Saved',
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onToggle}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.glassBtn, isSaved && styles.glassSavedBtn]}
      >
        <Ionicons
          name={isSaved ? 'checkmark-circle' : 'add-circle-outline'}
          size={18}
          color={isSaved ? '#10b981' : '#ffffff'}
          style={{ marginRight: 6 }}
        />
        <Text style={[styles.glassText, isSaved && styles.glassSavedText]}>
          {isSaved ? savedLabel : label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// --- Server Pill Button ---
interface ServerPillButtonProps {
  serverId: string;
  name: string;
  badge?: string;
  isActive: boolean;
  latency?: string;
  onSelect: () => void;
}

export const ServerPillButton: React.FC<ServerPillButtonProps> = ({
  name,
  badge,
  isActive,
  latency = '12ms',
  onSelect,
}) => {
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (isActive) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0.4, duration: 600, useNativeDriver: true }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }
  }, [isActive, pulseAnim]);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onSelect}
      style={[styles.serverPill, isActive && styles.serverPillActive]}
    >
      {/* Status Live Indicator Dot */}
      <Animated.View
        style={[
          styles.statusDot,
          isActive ? { opacity: pulseAnim, backgroundColor: '#10b981' } : { backgroundColor: '#6b7280' },
        ]}
      />

      <Text style={[styles.serverName, isActive && styles.serverNameActive]}>{name}</Text>

      {/* Latency / Badge Tag */}
      <View style={[styles.latencyBadge, isActive && styles.latencyBadgeActive]}>
        <Text style={[styles.latencyText, isActive && styles.latencyTextActive]}>
          {badge || latency}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Primary Play Button
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e50914',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: '#e50914',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 6,
    ...(Platform.OS === 'web'
      ? ({
          backgroundImage: 'linear-gradient(135deg, #ff1e27 0%, #e50914 50%, #b91c1c 100%)',
          cursor: 'pointer',
        } as any)
      : {}),
  },
  btnSm: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  btnLg: {
    paddingHorizontal: 28,
    paddingVertical: 15,
    borderRadius: 16,
  },
  primaryText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  textSm: {
    fontSize: 12,
  },
  textLg: {
    fontSize: 16,
  },

  // Glass Watchlist Button
  glassBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    ...(Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          cursor: 'pointer',
        } as any)
      : {}),
  },
  glassSavedBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  glassText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  glassSavedText: {
    color: '#10b981',
  },

  // Server Pill Button
  serverPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 8,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  serverPillActive: {
    backgroundColor: 'rgba(229, 9, 20, 0.15)',
    borderColor: 'rgba(229, 9, 20, 0.4)',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  serverName: {
    color: '#9ca3af',
    fontSize: 13,
    fontWeight: '700',
  },
  serverNameActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  latencyBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  latencyBadgeActive: {
    backgroundColor: 'rgba(229, 9, 20, 0.3)',
  },
  latencyText: {
    color: '#6b7280',
    fontSize: 10,
    fontWeight: '700',
  },
  latencyTextActive: {
    color: '#ffffff',
  },
});
