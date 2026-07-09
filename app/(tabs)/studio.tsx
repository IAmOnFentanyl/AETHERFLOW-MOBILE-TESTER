import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable,
  ActivityIndicator, Dimensions, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Play, Square, Circle, ZoomIn, ZoomOut, Plus, Volume2, VolumeX,
  Pause, Trash2, Copy, Music, Scissors, Upload,
} from 'lucide-react-native';
import { useAudioPlayer } from 'expo-audio';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Clip {
  id: string;
  track_id: string;
  project_id: string;
  label: string;
  file_path: string | null;
  start_bar: number;
  duration_bars: number;
  duration_ms: number | null;
  waveform_data: number[];
  color: string;
  source_type: string;
}

interface Track {
  id: string;
  project_id: string;
  name: string;
  color: string;
  position: number;
  volume: number;
  is_muted: boolean;
  is_solo: boolean;
}

type TrackUI = Track & { clips: Clip[] };

// ─── Constants ────────────────────────────────────────────────────────────────

const BAR_WIDTH = 48;
const BAR_COUNT = 64;
const TRACK_HEIGHT = 64;
const HEADER_WIDTH = 90;
const SECONDS_PER_BAR = 2;
const TRANSPORT_HEIGHT = 56;
const EDIT_TOOLBAR_HEIGHT = 52;
const TAB_BAR_HEIGHT = 64; // Approximate tab bar height without safe area

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtBar(bar: number) {
  const m = Math.floor(bar / 4);
  const b = Math.floor(bar % 4) + 1;
  return `${m + 1}.${String(b).padStart(1, '0')}`;
}

// ─── ClipPlayer ───────────────────────────────────────────────────────────────

function ClipPlayer({
  clip, playheadBar, isPlaying, trackMuted, anySolo, trackSolo, volume,
}: {
  clip: Clip;
  playheadBar: number;
  isPlaying: boolean;
  trackMuted: boolean;
  anySolo: boolean;
  trackSolo: boolean;
  volume: number;
}) {
  const filePath = clip.file_path;
  const player = useAudioPlayer(filePath || '');
  const wasPlaying = useRef(false);

  const clipStart = clip.start_bar;
  const clipEnd = clip.start_bar + clip.duration_bars;
  const inRange = playheadBar >= clipStart && playheadBar < clipEnd;

  const shouldPlay = isPlaying && inRange && filePath &&
    (!trackMuted) && (!anySolo || trackSolo);

  useEffect(() => {
    if (!filePath) return;

    if (shouldPlay && !wasPlaying.current) {
      const offsetSec = (playheadBar - clipStart) * SECONDS_PER_BAR;
      try {
        if (offsetSec > 0.1) player.seekTo(offsetSec);
        player.volume = volume;
        player.play();
        wasPlaying.current = true;
      } catch (e: any) {
        console.error(`[ClipPlayer] Playback error:`, e?.message);
      }
    } else if (!shouldPlay && wasPlaying.current) {
      try {
        player.pause();
        wasPlaying.current = false;
      } catch (e: any) {
        console.error(`[ClipPlayer] Pause error:`, e?.message);
      }
    }
  }, [shouldPlay, volume, filePath, clipStart, playheadBar, player]);

  useEffect(() => {
    if (!filePath || isPlaying || !wasPlaying.current) return;
    try {
      player.pause();
      wasPlaying.current = false;
    } catch (e: any) {
      console.error(`[ClipPlayer] Stop error:`, e?.message);
    }
  }, [isPlaying, filePath, player]);

  return null;
}

// ─── DraggableClip ────────────────────────────────────────────────────────────

function DraggableClip({
  clip, color, pixelWidth, left, scaledBar, isSelected,
  onSelect, onDragEnd, onTrimEnd,
}: {
  clip: Clip;
  color: string;
  pixelWidth: number;
  left: number;
  scaledBar: number;
  isSelected: boolean;
  onSelect: () => void;
  onDragEnd: (clipId: string, deltaBars: number) => void;
  onTrimEnd: (clipId: string, deltaBars: number, side: 'left' | 'right') => void;
}) {
  const translateX = useSharedValue(0);
  const isDragging = useSharedValue(false);

  useEffect(() => {
    if (!isDragging.value) {
      translateX.value = withSpring(0, { damping: 18, stiffness: 200 });
    }
  }, [left]);

  const panGesture = Gesture.Pan()
    .activateAfterLongPress(150)
    .onStart(() => {
      'worklet';
      isDragging.value = true;
      runOnJS(onSelect)();
    })
    .onUpdate((e) => {
      'worklet';
      translateX.value = e.translationX;
    })
    .onEnd((e) => {
      'worklet';
      isDragging.value = false;
      const deltaBars = Math.round(e.translationX / scaledBar);
      runOnJS(onDragEnd)(clip.id, deltaBars);
      translateX.value = withSpring(0, { damping: 18, stiffness: 200 });
    });

  const trimRightGesture = Gesture.Pan()
    .onEnd((e) => {
      'worklet';
      const deltaBars = Math.round(e.translationX / scaledBar);
      runOnJS(onTrimEnd)(clip.id, deltaBars, 'right');
    });

  const trimLeftGesture = Gesture.Pan()
    .onEnd((e) => {
      'worklet';
      const deltaBars = Math.round(e.translationX / scaledBar);
      runOnJS(onTrimEnd)(clip.id, deltaBars, 'left');
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    zIndex: isDragging.value ? 100 : 1,
    opacity: isDragging.value ? 0.85 : 1,
  }));

  const hasAudio = !!clip.file_path;
  const data = clip.waveform_data;
  const barCount = Math.max(4, Math.floor(pixelWidth / 5));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[styles.clipWrapper, { left, width: pixelWidth + 2 }, animatedStyle]}
      >
        <Pressable onPress={onSelect}>
          <View style={[
            styles.clip,
            {
              backgroundColor: `${color}25`,
              borderColor: isSelected ? color : `${color}60`,
              borderWidth: isSelected ? 2 : 1,
              width: pixelWidth,
            },
          ]}>
            <LinearGradient
              colors={isSelected ? [`${color}50`, `${color}20`] : [`${color}30`, `${color}10`]}
              style={StyleSheet.absoluteFill}
            />
            {hasAudio && data.length > 0 ? (
              <View style={styles.waveform}>
                {Array.from({ length: barCount }).map((_, i) => {
                  const idx = Math.floor((i / barCount) * data.length);
                  const v = data[Math.min(idx, data.length - 1)];
                  return (
                    <View key={i} style={[styles.waveBar, { height: 4 + v * 22, backgroundColor: color }]} />
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyClip}>
                <Music size={12} color={`${color}60`} />
              </View>
            )}
            <Text style={[styles.clipLabel, { color }]} numberOfLines={1}>{clip.label}</Text>
          </View>
        </Pressable>

        {isSelected && (
          <GestureDetector gesture={trimLeftGesture}>
            <View style={[styles.trimHandleLeft, { borderColor: color }]} />
          </GestureDetector>
        )}
        {isSelected && (
          <GestureDetector gesture={trimRightGesture}>
            <View style={[styles.trimHandle, { borderColor: color }]} />
          </GestureDetector>
        )}
      </Animated.View>
    </GestureDetector>
  );
}

// ─── Main Studio Component ────────────────────────────────────────────────────

export default function StudioScreen() {
  const insets = useSafeAreaInsets();

  // State
  const [loading, setLoading] = useState(true);
  const [tracks, setTracks] = useState<TrackUI[]>([
    {
      id: 'track-1',
      project_id: 'proj-1',
      name: 'Audio 1',
      color: Colors.track.colors[0],
      position: 0,
      volume: 1,
      is_muted: false,
      is_solo: false,
      clips: [],
    },
    {
      id: 'track-2',
      project_id: 'proj-1',
      name: 'Vocals',
      color: Colors.track.colors[1],
      position: 1,
      volume: 1,
      is_muted: false,
      is_solo: false,
      clips: [],
    },
  ]);

  const [selectedTrackId, setSelectedTrackId] = useState<string | null>('track-1');
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playheadBar, setPlayheadBar] = useState(0);
  const [zoom, setZoom] = useState(1);

  const playheadInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  // Demo clips
  useEffect(() => {
    setTracks(prev => prev.map((t, i) => ({
      ...t,
      clips: i === 0 ? [
        {
          id: 'clip-1',
          track_id: t.id,
          project_id: 'proj-1',
          label: 'Intro Beat',
          file_path: null,
          start_bar: 0,
          duration_bars: 8,
          duration_ms: 16000,
          waveform_data: [0.3, 0.5, 0.7, 0.4, 0.6, 0.8, 0.5, 0.3, 0.4, 0.6, 0.5, 0.7],
          color: t.color,
          source_type: 'audio',
        },
        {
          id: 'clip-2',
          track_id: t.id,
          project_id: 'proj-1',
          label: 'Verse 1',
          file_path: null,
          start_bar: 8,
          duration_bars: 16,
          duration_ms: 32000,
          waveform_data: [0.2, 0.4, 0.6, 0.8, 0.5, 0.3, 0.7, 0.4, 0.5, 0.6],
          color: t.color,
          source_type: 'audio',
        },
      ] : [
        {
          id: 'clip-3',
          track_id: t.id,
          project_id: 'proj-1',
          label: 'Vocal Take 1',
          file_path: null,
          start_bar: 4,
          duration_bars: 12,
          duration_ms: 24000,
          waveform_data: [0.5, 0.7, 0.4, 0.6, 0.8, 0.5, 0.3, 0.6, 0.4, 0.5, 0.7, 0.5],
          color: t.color,
          source_type: 'vocal',
        },
      ],
    })));
    setLoading(false);
  }, []);

  // Playback control
  const startPlayback = useCallback(() => {
    setIsPlaying(true);
    if (playheadInterval.current) clearInterval(playheadInterval.current);
    playheadInterval.current = setInterval(() => {
      setPlayheadBar(prev => {
        if (prev >= BAR_COUNT) {
          setIsPlaying(false);
          return 0;
        }
        return prev + 0.1;
      });
    }, 50);
  }, []);

  const stopPlayback = useCallback(() => {
    setIsPlaying(false);
    if (playheadInterval.current) {
      clearInterval(playheadInterval.current);
      playheadInterval.current = null;
    }
  }, []);

  // Track controls
  const toggleMute = useCallback((id: string) => {
    setTracks(prev => prev.map(t =>
      t.id === id ? { ...t, is_muted: !t.is_muted } : t
    ));
  }, []);

  const toggleSolo = useCallback((id: string) => {
    setTracks(prev => prev.map(t =>
      t.id === id ? { ...t, is_solo: !t.is_solo } : t
    ));
  }, []);

  // Clip controls
  const handleDragClip = useCallback((clipId: string, deltaBars: number) => {
    if (deltaBars === 0) return;
    setTracks(prev => prev.map(t => ({
      ...t,
      clips: t.clips.map(c => {
        if (c.id !== clipId) return c;
        const newStart = Math.max(0, c.start_bar + deltaBars);
        return { ...c, start_bar: newStart };
      }),
    })));
  }, []);

  const handleTrimClip = useCallback((clipId: string, deltaBars: number, side: 'left' | 'right') => {
    if (deltaBars === 0) return;
    setTracks(prev => prev.map(t => ({
      ...t,
      clips: t.clips.map(c => {
        if (c.id !== clipId) return c;
        if (side === 'right') {
          const newDuration = Math.max(1, c.duration_bars + deltaBars);
          return { ...c, duration_bars: newDuration };
        } else {
          const clampedDelta = Math.min(deltaBars, c.duration_bars - 1);
          const newStart = Math.max(0, c.start_bar + clampedDelta);
          const newDuration = Math.max(1, c.duration_bars - clampedDelta);
          return { ...c, start_bar: newStart, duration_bars: newDuration };
        }
      }),
    })));
  }, []);

  // Add track
  const handleAddTrack = useCallback(() => {
    const colorIndex = tracks.length % Colors.track.colors.length;
    const newTrack: TrackUI = {
      id: `track-${Date.now()}`,
      project_id: 'proj-1',
      name: `Track ${tracks.length + 1}`,
      color: Colors.track.colors[colorIndex],
      position: tracks.length,
      volume: 1,
      is_muted: false,
      is_solo: false,
      clips: [],
    };
    setTracks(prev => [...prev, newTrack]);
    setSelectedTrackId(newTrack.id);
  }, [tracks.length]);

  // Import audio
  const handleImportAudio = useCallback(() => {
    if (!selectedTrackId) return;
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'audio/*';
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        console.log('Import file:', file.name);
      };
      input.click();
    }
  }, [selectedTrackId]);

  // Duplicate clip
  const handleDuplicate = useCallback(() => {
    if (!selectedClipId) return;
    setTracks(prev => prev.map(t => {
      const clip = t.clips.find(c => c.id === selectedClipId);
      if (!clip) return t;
      const newClip: Clip = {
        ...clip,
        id: `clip-${Date.now()}`,
        start_bar: clip.start_bar + clip.duration_bars,
      };
      return { ...t, clips: [...t.clips, newClip] };
    }));
  }, [selectedClipId]);

  // Delete clip
  const handleDelete = useCallback(() => {
    if (!selectedClipId) return;
    setTracks(prev => prev.map(t => ({
      ...t,
      clips: t.clips.filter(c => c.id !== selectedClipId),
    })));
    setSelectedClipId(null);
  }, [selectedClipId]);

  // Split clip
  const handleSplit = useCallback(() => {
    if (!selectedClipId) return;
    console.log('Split clip at playhead:', playheadBar);
  }, [selectedClipId, playheadBar]);

  const scaledBar = BAR_WIDTH * zoom;
  const timelinePixelWidth = scaledBar * BAR_COUNT;
  const anySolo = tracks.some(t => t.is_solo);

  // Calculate total bottom offset for fixed elements
  const totalBottomUI = TRANSPORT_HEIGHT + EDIT_TOOLBAR_HEIGHT;
  const bottomOffset = totalBottomUI + TAB_BAR_HEIGHT + insets.bottom;

  if (loading) {
    return (
      <View style={styles.loadingRoot}>
        <LinearGradient colors={[Colors.bg.deep, '#0A0A0F']} style={StyleSheet.absoluteFill} />
        <ActivityIndicator size="large" color={Colors.accent.cyan} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <LinearGradient colors={[Colors.bg.deep, Colors.bg.primary]} style={StyleSheet.absoluteFill} />

      {/* Zoom controls */}
      <View style={styles.zoomControls}>
        <TouchableOpacity style={styles.zoomBtn} onPress={() => setZoom(z => Math.max(0.5, z - 0.25))}>
          <ZoomOut size={18} color={Colors.text.muted} />
        </TouchableOpacity>
        <Text style={styles.zoomText}>{Math.round(zoom * 100)}%</Text>
        <TouchableOpacity style={styles.zoomBtn} onPress={() => setZoom(z => Math.min(2, z + 0.25))}>
          <ZoomIn size={18} color={Colors.text.muted} />
        </TouchableOpacity>
      </View>

      {/* Timeline - with bottom padding to clear fixed UI */}
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        bounces={false}
        style={styles.timelineScroll}
        contentContainerStyle={[
          styles.timelineContent,
          { paddingBottom: bottomOffset },
        ]}
      >
        <View style={{ width: timelinePixelWidth + HEADER_WIDTH + 20 }}>
          {/* Timeline header - bar numbers */}
          <View style={[styles.timelineHeader, { width: timelinePixelWidth + HEADER_WIDTH }]}>
            <View style={styles.headerSpacer} />
            {Array.from({ length: BAR_COUNT }).map((_, i) => (
              i % 4 === 0 ? (
                <View key={i} style={{ position: 'absolute', left: HEADER_WIDTH + i * scaledBar - 10 }}>
                  <Text style={styles.barNumber}>
                    {Math.floor(i / 4) + 1}
                  </Text>
                </View>
              ) : null
            ))}
          </View>

          {/* Tracks */}
          {tracks.map((track) => (
            <View key={track.id} style={[
              styles.trackRow,
              selectedTrackId === track.id && { backgroundColor: `${track.color}08` },
            ]}>
              {/* Track header */}
              <TouchableOpacity
                style={[
                  styles.trackHeader,
                  { borderLeftColor: track.color, borderLeftWidth: 3 },
                  selectedTrackId === track.id && { backgroundColor: `${track.color}15` },
                ]}
                onPress={() => setSelectedTrackId(track.id)}
                activeOpacity={0.8}
              >
                <Text
                  style={[styles.trackName, selectedTrackId === track.id && { color: track.color }]}
                  numberOfLines={1}
                >
                  {track.name}
                </Text>
                <View style={styles.trackControls}>
                  <TouchableOpacity
                    onPress={() => toggleMute(track.id)}
                    style={[styles.tinyBtn, track.is_muted && styles.tinyBtnActive]}
                  >
                    {track.is_muted
                      ? <VolumeX size={11} color={Colors.status.error} />
                      : <Volume2 size={11} color={Colors.text.muted} />}
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => toggleSolo(track.id)}
                    style={[styles.tinyBtn, track.is_solo && { backgroundColor: `${Colors.status.warning}30` }]}
                  >
                    <Text style={[styles.tinyBtnText, track.is_solo && { color: Colors.status.warning }]}>S</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>

              {/* Clip lane */}
              <View style={[styles.clipLane, { width: timelinePixelWidth }]}>
                {Array.from({ length: BAR_COUNT }).map((_, i) => (
                  <View key={i} style={[styles.gridLine, { left: i * scaledBar }]} />
                ))}
                {track.clips.map((clip) => (
                  <DraggableClip
                    key={clip.id}
                    clip={clip}
                    color={clip.color ?? track.color}
                    pixelWidth={clip.duration_bars * scaledBar - 2}
                    left={clip.start_bar * scaledBar}
                    scaledBar={scaledBar}
                    isSelected={selectedClipId === clip.id}
                    onSelect={() => setSelectedClipId(clip.id)}
                    onDragEnd={handleDragClip}
                    onTrimEnd={handleTrimClip}
                  />
                ))}
              </View>

              {/* Audio players */}
              {track.clips.filter(c => c.file_path).map((clip) => (
                <ClipPlayer
                  key={clip.id}
                  clip={clip}
                  playheadBar={playheadBar}
                  isPlaying={isPlaying}
                  trackMuted={track.is_muted}
                  anySolo={anySolo}
                  trackSolo={track.is_solo}
                  volume={track.volume}
                />
              ))}
            </View>
          ))}

          {/* Playhead */}
          {isPlaying && (
            <View style={styles.playheadOverlay} pointerEvents="none">
              <View style={[styles.playheadLine, { left: HEADER_WIDTH + playheadBar * scaledBar }]} />
            </View>
          )}
        </View>
      </ScrollView>

      {/* Fixed Transport - above edit toolbar */}
      <View style={[styles.transportContainer, { bottom: EDIT_TOOLBAR_HEIGHT + TAB_BAR_HEIGHT + insets.bottom }]}>
        <View style={styles.transport}>
          <TouchableOpacity style={styles.transportBtn} onPress={() => { stopPlayback(); setPlayheadBar(0); }}>
            <Square size={18} color={Colors.text.muted} fill="none" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.playBtn, isPlaying && styles.playBtnActive]}
            onPress={() => isPlaying ? stopPlayback() : startPlayback()}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={isPlaying ? [Colors.accent.blue, Colors.accent.cyan] : [Colors.accent.cyan, Colors.accent.blue]}
              style={styles.playGrad}
            >
              {isPlaying
                ? <Pause size={20} color={Colors.text.inverse} fill={Colors.text.inverse} />
                : <Play size={20} color={Colors.text.inverse} fill={Colors.text.inverse} />}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.recBtn} activeOpacity={0.8}>
            <Circle size={20} color={Colors.status.error} />
          </TouchableOpacity>

          <View style={styles.timeDisplay}>
            <Text style={styles.timeText}>{fmtBar(playheadBar)}</Text>
          </View>
        </View>
      </View>

      {/* Fixed Edit Toolbar - above tab bar */}
      <View style={[styles.editToolbarContainer, { bottom: TAB_BAR_HEIGHT + insets.bottom }]}>
        <View style={styles.editToolbar}>
          <TouchableOpacity style={styles.toolBtn} onPress={handleAddTrack} activeOpacity={0.7}>
            <Plus size={16} color={Colors.text.secondary} />
            <Text style={styles.toolBtnText}>Track</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.toolBtn} onPress={handleImportAudio} activeOpacity={0.7}>
            <Upload size={16} color={Colors.text.secondary} />
            <Text style={styles.toolBtnText}>Import</Text>
          </TouchableOpacity>

          <View style={styles.toolSeparator} />

          <TouchableOpacity
            style={[styles.toolBtn, !selectedClipId && styles.toolBtnDisabled]}
            onPress={handleDuplicate}
            disabled={!selectedClipId}
            activeOpacity={0.7}
          >
            <Copy size={16} color={selectedClipId ? Colors.text.secondary : Colors.text.muted} />
            <Text style={[styles.toolBtnText, !selectedClipId && styles.toolBtnTextDisabled]}>Duplicate</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toolBtn, !selectedClipId && styles.toolBtnDisabled]}
            onPress={handleSplit}
            disabled={!selectedClipId}
            activeOpacity={0.7}
          >
            <Scissors size={16} color={selectedClipId ? Colors.text.secondary : Colors.text.muted} />
            <Text style={[styles.toolBtnText, !selectedClipId && styles.toolBtnTextDisabled]}>Split</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toolBtn, !selectedClipId && styles.toolBtnDisabled]}
            onPress={handleDelete}
            disabled={!selectedClipId}
            activeOpacity={0.7}
          >
            <Trash2 size={16} color={selectedClipId ? Colors.status.error : Colors.text.muted} />
            <Text style={[styles.toolBtnText, !selectedClipId && { color: Colors.text.muted }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg.deep,
  },
  loadingRoot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bg.deep,
  },

  // Zoom
  zoomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    gap: Spacing.sm,
    marginTop: 8,
  },
  zoomBtn: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.glass.white5,
  },
  zoomText: {
    color: Colors.text.muted,
    fontSize: Typography.fontSizes.xs,
    minWidth: 40,
    textAlign: 'center',
  },

  // Timeline
  timelineScroll: {
    flex: 1,
  },
  timelineContent: {
    flexGrow: 1,
  },
  timelineHeader: {
    height: 24,
    backgroundColor: Colors.bg.secondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glass.white10,
    flexDirection: 'row',
  },
  headerSpacer: {
    width: HEADER_WIDTH,
  },
  barNumber: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.text.muted,
    fontWeight: Typography.fontWeights.medium,
  },

  // Tracks
  trackRow: {
    height: TRACK_HEIGHT,
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.glass.white5,
  },
  trackHeader: {
    width: HEADER_WIDTH,
    height: TRACK_HEIGHT,
    paddingHorizontal: Spacing.sm,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: Colors.glass.white10,
    backgroundColor: Colors.bg.secondary,
  },
  trackName: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.text.secondary,
    fontWeight: Typography.fontWeights.medium,
    marginBottom: 2,
  },
  trackControls: {
    flexDirection: 'row',
    gap: 4,
  },
  tinyBtn: {
    width: 20,
    height: 16,
    borderRadius: 3,
    backgroundColor: Colors.glass.white5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tinyBtnActive: {
    backgroundColor: `${Colors.status.error}20`,
  },
  tinyBtnText: {
    fontSize: 9,
    color: Colors.text.muted,
    fontWeight: Typography.fontWeights.bold,
  },

  // Clip lane
  clipLane: {
    height: TRACK_HEIGHT,
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: Colors.glass.white5,
  },

  // Clips
  clipWrapper: {
    position: 'absolute',
    top: 4,
    bottom: 4,
  },
  clip: {
    flex: 1,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
    paddingHorizontal: 4,
  },
  waveBar: {
    width: 3,
    borderRadius: 1,
  },
  emptyClip: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clipLabel: {
    position: 'absolute',
    bottom: 2,
    left: 4,
    right: 4,
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.medium,
    textAlign: 'center',
  },
  trimHandle: {
    position: 'absolute',
    right: -6,
    top: 0,
    bottom: 0,
    width: 12,
    backgroundColor: Colors.accent.cyan + '40',
    borderRadius: 2,
    borderWidth: 1,
  },
  trimHandleLeft: {
    position: 'absolute',
    left: -6,
    top: 0,
    bottom: 0,
    width: 12,
    backgroundColor: Colors.accent.cyan + '40',
    borderRadius: 2,
    borderWidth: 1,
  },

  // Playhead
  playheadOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  playheadLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: Colors.accent.magenta,
  },

  // Transport
  transportContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  transport: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: TRANSPORT_HEIGHT,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.bg.primary,
    borderTopWidth: 1,
    borderTopColor: Colors.glass.white10,
    gap: Spacing.lg,
  },
  transportBtn: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.glass.white5,
  },
  playBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  playBtnActive: {
    transform: [{ scale: 0.95 }],
  },
  playGrad: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recBtn: {
    padding: Spacing.sm,
  },
  timeDisplay: {
    minWidth: 50,
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    color: Colors.text.primary,
    fontWeight: Typography.fontWeights.medium,
  },

  // Edit Toolbar
  editToolbarContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  editToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: EDIT_TOOLBAR_HEIGHT,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.bg.secondary,
    borderTopWidth: 1,
    borderTopColor: Colors.glass.white10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glass.white10,
    gap: Spacing.xs,
  },
  toolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.glass.white5,
  },
  toolBtnDisabled: {
    opacity: 0.5,
  },
  toolBtnText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.text.secondary,
    fontWeight: Typography.fontWeights.medium,
  },
  toolBtnTextDisabled: {
    color: Colors.text.muted,
  },
  toolSeparator: {
    width: 1,
    height: 20,
    backgroundColor: Colors.glass.white10,
    marginHorizontal: Spacing.xs,
  },
});
