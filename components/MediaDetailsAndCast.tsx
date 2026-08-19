import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { MediaItem } from '../types/media';
import { tmdbService } from '../lib/tmdb';

interface MediaDetailsAndCastProps {
  media: MediaItem;
  season?: number;
  episode?: number;
}

interface CastPerson {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

export const MediaDetailsAndCast: React.FC<MediaDetailsAndCastProps> = ({
  media,
  season = 1,
  episode = 1,
}) => {
  const [cast, setCast] = useState<CastPerson[]>([]);
  const [loadingCast, setLoadingCast] = useState(true);
  const [episodeOverview, setEpisodeOverview] = useState<string | null>(null);

  // Actor Filmography Modal State
  const [selectedPerson, setSelectedPerson] = useState<{
    id: number;
    name: string;
    biography: string;
    profile_path: string | null;
    works: MediaItem[];
  } | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const isSeries = media.media_type === 'tv' || media.media_type === 'anime';

  // Fetch TV Episode Overview or Movie Details
  useEffect(() => {
    if (isSeries) {
      tmdbService.getTVSeasonDetails(media.id, season).then((seasonData) => {
        if (seasonData?.episodes && Array.isArray(seasonData.episodes)) {
          const epObj = seasonData.episodes.find((e: any) => e.episode_number === episode);
          if (epObj?.overview) {
            setEpisodeOverview(epObj.overview);
            return;
          }
        }
        setEpisodeOverview(null);
      });
    } else {
      setEpisodeOverview(null);
    }
  }, [media.id, media.media_type, season, episode, isSeries]);

  // Fetch Cast Credits
  useEffect(() => {
    setLoadingCast(true);
    tmdbService
      .getCredits(media.id, media.media_type)
      .then((data) => {
        setCast(data);
      })
      .finally(() => setLoadingCast(false));
  }, [media.id, media.media_type]);

  // Handle Actor Click (Open Filmography Popup)
  const handleActorClick = async (personId: number) => {
    setModalVisible(true);
    setModalLoading(true);
    try {
      const personData = await tmdbService.getPersonCredits(personId);
      setSelectedPerson({ ...personData, id: personId });

    } catch {
      setSelectedPerson(null);
    } finally {
      setModalLoading(false);
    }
  };

  const overviewText = episodeOverview || media.overview || 'No synopsis available for this title.';
  const yearText = media.release_date?.substring(0, 4) || media.first_air_date?.substring(0, 4) || '2024';

  return (
    <View style={styles.container}>
      {/* --- About / Synopsis Section --- */}
      <View style={styles.aboutSection}>
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="information-circle-outline" size={18} color="#e50914" />
          <Text style={styles.sectionTitle}>
            {isSeries ? `About Season ${season}, Episode ${episode}` : 'About this Movie'}
          </Text>
        </View>

        <Text style={styles.overviewText}>{overviewText}</Text>

        {/* Dynamic Badges */}
        <View style={styles.badgeRow}>
          <View style={styles.infoBadge}>
            <Ionicons name="star" size={12} color="#fbbf24" style={{ marginRight: 4 }} />
            <Text style={styles.badgeText}>IMDb {(media.vote_average || 8.1).toFixed(1)}</Text>
          </View>

          <View style={styles.infoBadge}>
            <Text style={styles.badgeText}>{yearText}</Text>
          </View>

          <View style={styles.infoBadge}>
            <Text style={styles.badgeText}>{media.quality || '4K Ultra HD'}</Text>
          </View>

          {media.genres && media.genres.length > 0 && (
            <View style={styles.infoBadge}>
              <Text style={styles.badgeText}>{media.genres[0]}</Text>
            </View>
          )}
        </View>
      </View>

      {/* --- Top Cast Row --- */}
      <View style={styles.castSection}>
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="people-outline" size={18} color="#e50914" />
          <Text style={styles.sectionTitle}>Top Cast & Filmography</Text>
        </View>

        {loadingCast ? (
          <View style={styles.castLoadingBox}>
            <ActivityIndicator size="small" color="#e50914" />
          </View>
        ) : cast.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.castScrollPadding}
          >
            {cast.map((actor) => (
              <TouchableOpacity
                key={actor.id}
                activeOpacity={0.75}
                onPress={() => handleActorClick(actor.id)}
                style={styles.actorCard}
              >
                <View style={styles.avatarWrapper}>
                  {actor.profile_path ? (
                    <Image source={{ uri: actor.profile_path }} style={styles.avatarImg} resizeMode="cover" />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Ionicons name="person" size={24} color="#6b7280" />
                    </View>
                  )}
                </View>

                <Text style={styles.actorName} numberOfLines={1}>
                  {actor.name}
                </Text>
                <Text style={styles.characterRole} numberOfLines={1}>
                  {actor.character}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <Text style={styles.noCastText}>Cast information unavailable for this item.</Text>
        )}
      </View>

      {/* --- Actor Filmography Popup Modal --- */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <TouchableOpacity activeOpacity={1} onPress={() => setModalVisible(false)} style={styles.modalBackdrop}>
          <TouchableOpacity activeOpacity={1} style={styles.modalCard}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Actor Filmography</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>

            {modalLoading ? (
              <View style={styles.modalLoadingBox}>
                <ActivityIndicator size="large" color="#e50914" />
                <Text style={styles.modalLoadingText}>Loading filmography...</Text>
              </View>
            ) : selectedPerson ? (
              <ScrollView contentContainerStyle={styles.modalScrollContent}>
                {/* Actor Info Bio Header */}
                <View style={styles.actorProfileRow}>
                  {selectedPerson.profile_path ? (
                    <Image source={{ uri: selectedPerson.profile_path }} style={styles.actorBigAvatar} />
                  ) : (
                    <View style={[styles.actorBigAvatar, styles.avatarPlaceholder]}>
                      <Ionicons name="person" size={32} color="#6b7280" />
                    </View>
                  )}

                  <View style={{ flex: 1 }}>
                    <Text style={styles.actorBigName}>{selectedPerson.name}</Text>
                    {selectedPerson.biography ? (
                      <Text style={styles.actorBioText} numberOfLines={4}>
                        {selectedPerson.biography}
                      </Text>
                    ) : (
                      <Text style={styles.actorBioText}>Renowned actor featuring in popular movies and series.</Text>
                    )}
                  </View>
                </View>

                <Text style={styles.worksHeaderTitle}>
                  STARRED IN ({selectedPerson.works.length})
                </Text>

                {/* Filmography Works Grid */}
                <View style={styles.worksGrid}>
                  {selectedPerson.works.map((work) => (
                    <TouchableOpacity
                      key={`${work.media_type}_${work.id}`}
                      activeOpacity={0.8}
                      onPress={() => {
                        setModalVisible(false);
                        router.push(`/watch/${work.media_type || 'movie'}/${work.id}`);
                      }}
                      style={styles.workCard}
                    >
                      <Image source={{ uri: work.poster_path }} style={styles.workPoster} resizeMode="cover" />
                      <Text style={styles.workTitle} numberOfLines={1}>
                        {work.title}
                      </Text>
                      <Text style={styles.workMeta}>
                        {work.media_type === 'tv' ? 'TV SHOW' : 'MOVIE'} • ⭐ {work.vote_average?.toFixed(1) || '8.0'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            ) : (
              <View style={styles.modalLoadingBox}>
                <Text style={styles.modalLoadingText}>Filmography unavailable.</Text>
              </View>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 20,
  },
  aboutSection: {
    backgroundColor: '#12141a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  overviewText: {
    color: '#9ca3af',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  badgeText: {
    color: '#e5e7eb',
    fontSize: 11,
    fontWeight: '700',
  },
  castSection: {
    backgroundColor: '#12141a',
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  castLoadingBox: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  castScrollPadding: {
    paddingHorizontal: 16,
    gap: 14,
  },
  actorCard: {
    alignItems: 'center',
    width: 76,
  },
  avatarWrapper: {
    width: 58,
    height: 58,
    borderRadius: 29,
    overflow: 'hidden',
    backgroundColor: '#181924',
    borderWidth: 1.5,
    borderColor: 'rgba(229, 9, 20, 0.4)',
    marginBottom: 6,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1f2937',
  },
  actorName: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    width: '100%',
  },
  characterRole: {
    color: '#9ca3af',
    fontSize: 10,
    textAlign: 'center',
    width: '100%',
    marginTop: 1,
  },
  noCastText: {
    color: '#6b7280',
    fontSize: 12,
    paddingHorizontal: 16,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    ...(Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        } as any)
      : {}),
  },
  modalCard: {
    width: '100%',
    maxWidth: 580,
    maxHeight: '85%',
    backgroundColor: '#0b0c0f',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#12141a',
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  modalLoadingBox: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 10,
  },
  modalLoadingText: {
    color: '#9ca3af',
    fontSize: 13,
  },
  modalScrollContent: {
    padding: 16,
  },
  actorProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 18,
  },
  actorBigAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#1f2937',
    borderWidth: 2,
    borderColor: '#e50914',
  },
  actorBigName: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  actorBioText: {
    color: '#9ca3af',
    fontSize: 11,
    lineHeight: 16,
  },
  worksHeaderTitle: {
    color: '#6b7280',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 10,
  },
  worksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  workCard: {
    width: '31%',
    marginBottom: 8,
  },
  workPoster: {
    width: '100%',
    aspectRatio: 2 / 3,
    borderRadius: 10,
    backgroundColor: '#181924',
    marginBottom: 4,
  },
  workTitle: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  workMeta: {
    color: '#e50914',
    fontSize: 9,
    fontWeight: '800',
    marginTop: 1,
  },
});
