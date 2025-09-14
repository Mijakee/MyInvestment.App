import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { RouteProp } from '@react-navigation/native'
import { RootStackParamList } from '../navigation/AppNavigator'

type SuburbDetailScreenRouteProp = RouteProp<RootStackParamList, 'SuburbDetail'>

interface Props {
  route: SuburbDetailScreenRouteProp
}

export default function SuburbDetailScreen({ route }: Props) {
  const { suburbId } = route.params

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Suburb Details</Text>
        <Text style={styles.description}>
          Detailed analysis for suburb: {suburbId}
        </Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
  },
})