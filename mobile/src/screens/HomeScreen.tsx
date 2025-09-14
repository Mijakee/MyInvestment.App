import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Property Investment Analyzer</Text>
          <Text style={styles.subtitle}>
            Make informed investment decisions with Australian suburb analysis
          </Text>
        </View>

        <View style={styles.featuresGrid}>
          <TouchableOpacity style={styles.featureCard}>
            <Ionicons name="analytics" size={40} color="#3b82f6" />
            <Text style={styles.featureTitle}>Census Analysis</Text>
            <Text style={styles.featureDescription}>
              Demographic and economic data from Australian Census
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.featureCard}>
            <Ionicons name="shield-checkmark" size={40} color="#10b981" />
            <Text style={styles.featureTitle}>Safety Ratings</Text>
            <Text style={styles.featureDescription}>
              Crime statistics and safety assessments
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.featureCard}>
            <Ionicons name="trending-up" size={40} color="#f59e0b" />
            <Text style={styles.featureTitle}>Investment Insights</Text>
            <Text style={styles.featureDescription}>
              Comprehensive investment recommendations
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.featureCard}>
            <Ionicons name="map" size={40} color="#ef4444" />
            <Text style={styles.featureTitle}>Suburb Explorer</Text>
            <Text style={styles.featureDescription}>
              Interactive maps and location data
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.startButton}>
          <Text style={styles.startButtonText}>Start Analysis</Text>
          <Ionicons name="arrow-forward" size={20} color="white" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  featuresGrid: {
    padding: 20,
    gap: 15,
  },
  featureCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 10,
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  startButton: {
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    margin: 20,
    borderRadius: 12,
    gap: 8,
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
})