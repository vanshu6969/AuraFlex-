import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Platform } from 'react-native';

interface SkeletonGridProps {
  count?: number;
}

export const SkeletonGrid: React.FC<SkeletonGridProps> = ({ count = 12 }) => {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.8,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [pulseAnim]);

  const cards = Array.from({ length: count });

  return (
    <View style={styles.gridContainer}>
      {cards.map((_, index) => (
        <Animated.View
          key={index}
          style={[
            styles.skeletonCard,
            { opacity: pulseAnim },
          ]}
        >
          <View style={styles.contentPlaceholder}>
            <View style={styles.titlePlaceholder} />
            <View style={styles.subPlaceholder} />
          </View>
        </Animated.View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  skeletonCard: {
    width: Platform.OS === 'web' ? ('calc(16.666% - 10px)' as any) : '47%',
    minWidth: 140,
    aspectRatio: 2 / 3,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'flex-end',
    padding: 12,
    overflow: 'hidden',
  },
  contentPlaceholder: {
    gap: 6,
  },
  titlePlaceholder: {
    width: '75%',
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 4,
  },
  subPlaceholder: {
    width: '45%',
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 4,
  },
});
