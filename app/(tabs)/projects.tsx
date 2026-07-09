import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Plus, Music } from 'lucide-react-native';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { Button } from '@/components/Button';
import { GlassCard } from '@/components/GlassCard';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Project } from '@/lib/supabase';

export default function ProjectsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadProjects();
    }
  }, [user]);

  const loadProjects = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (e) {
      console.error('[ProjectsScreen] Error loading projects:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = () => {
    // TODO: Navigate to project creation screen or show modal
    console.log('Create new project');
  };

  const handleOpenProject = (projectId: string) => {
    // TODO: Navigate to studio with project
    console.log('Open project:', projectId);
  };

  const renderProjectCard = ({ item }: { item: Project }) => (
    <TouchableOpacity onPress={() => handleOpenProject(item.id)} activeOpacity={0.8}>
      <GlassCard style={styles.projectCard} intensity="medium">
        <LinearGradient
          colors={[item.color + '30', item.color + '10']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.projectContent}>
          <View style={[styles.projectIcon, { backgroundColor: item.color + '40' }]}>
            <Music size={24} color={item.color} />
          </View>
          <View style={styles.projectInfo}>
            <Text style={styles.projectName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.projectMeta}>{item.bpm} BPM • {item.time_signature}</Text>
            <Text style={styles.projectDate}>
              {new Date(item.updated_at).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.bg.deep, Colors.bg.primary]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Projects</Text>
        <Button
          label="New Project"
          onPress={handleCreateProject}
          variant="primary"
          size="sm"
          style={styles.createBtn}
        />
      </View>

      {/* Projects List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.accent.cyan} />
        </View>
      ) : projects.length === 0 ? (
        <View style={styles.centerContainer}>
          <Music size={48} color={Colors.accent.cyan} />
          <Text style={styles.emptyText}>No projects yet</Text>
          <Text style={styles.emptySubtext}>Create your first project to get started</Text>
          <Button
            label="Create Project"
            onPress={handleCreateProject}
            variant="primary"
            style={styles.emptyBtn}
          />
        </View>
      ) : (
        <FlatList
          data={projects}
          renderItem={renderProjectCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.deep,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glass.white10,
  },
  title: {
    fontSize: Typography.fontSizes.display,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.text.primary,
  },
  createBtn: {
    paddingHorizontal: Spacing.lg,
  },
  listContent: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  projectCard: {
    height: 80,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  projectContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  projectIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.semibold,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  projectMeta: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  projectDate: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.text.muted,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: Typography.fontWeights.semibold,
    color: Colors.text.primary,
    marginTop: Spacing.lg,
  },
  emptySubtext: {
    fontSize: Typography.fontSizes.md,
    color: Colors.text.secondary,
    marginTop: Spacing.sm,
  },
  emptyBtn: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.xl,
  },
});
