import React from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SubtitleTrack {
  url: string;
  lang: string;
}

interface DirectVideoPlayerProps {
  streamUrl: string;
  mimeType?: string;
  title?: string;
  subtitles?: SubtitleTrack[];
  onError?: () => void;
}

export const DirectVideoPlayer: React.FC<DirectVideoPlayerProps> = ({
  streamUrl,
  title = '',
  subtitles = [],
  onError,
}) => {
  return (
    <View style={styles.container}>
      {Platform.OS === 'web' ? (
        <video
          key={streamUrl}
          src={streamUrl}
          controls
          autoPlay
          onError={() => onError && onError()}
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#000000',
            objectFit: 'contain',
          }}
        >
          {subtitles.map((sub, idx) => (
            <track
              key={idx}
              kind="subtitles"
              src={sub.url}
              srcLang={sub.lang}
              label={sub.lang}
            />
          ))}
        </video>
      ) : (
        <View style={styles.mobileBox}>
          <Ionicons name="play-circle-outline" size={56} color="#e50914" />
          <Text style={styles.mobileTitle}>Direct Proxy Video Ready</Text>
          <Text style={styles.mobileSub}>{title || 'Streaming via AuraFlex Direct Engine'}</Text>
        </View>
      )}

      <View style={styles.badgeRow}>
        <Ionicons name="shield-checkmark" size={12} color="#10b981" />
        <Text style={styles.badgeText}>Direct HTML5 Proxy Stream (Bypassing Embed Block)</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000000',
    position: 'relative',
  },
  mobileBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 10,
  },
  mobileTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  mobileSub: {
    color: '#9ca3af',
    fontSize: 12,
  },
  badgeRow: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#10b981',
    zIndex: 20,
  },
  badgeText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '700',
  },
});
