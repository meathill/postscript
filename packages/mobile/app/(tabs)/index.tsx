import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from '@/components/ui/image';
import { useAuthStore } from '@/store/auth';
import { useHeartbeatStore } from '@/store/heartbeat';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { status, isLoading, checkIn } = useHeartbeatStore();

  const daysRemaining = status.nextHeartbeatDue
    ? Math.max(0, Math.ceil((status.nextHeartbeatDue - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  useEffect(() => {
    // Check auth on mount, although strictly this should be protected by layout
    if (!user) {
      // router.replace('/(auth)/welcome');
    }
  }, [user]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1 px-6 pt-4"
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={checkIn}
            tintColor="#B08D55"
          />
        }>
        {/* Header */}
        <View className="flex-row justify-between items-center mb-8">
          <View>
            <Text className="text-gray-500 text-lg">Welcome back,</Text>
            <Text className="text-foreground text-2xl font-bold">{user?.email?.split('@')[0] || 'User'}</Text>
          </View>
          <Pressable
            onPress={() => router.push('/(tabs)/settings')}
            className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center">
            <IconSymbol
              name="gear"
              size={20}
              color="#333"
            />
          </Pressable>
        </View>

        {/* Heartbeat Card */}
        <View className="bg-card p-6 rounded-3xl mb-8 shadow-sm border border-border">
          <View className="flex-row justify-between items-start mb-4">
            <View>
              <Text className="text-gray-500 mb-1">Heartbeat Status</Text>
              <Text className="text-3xl font-bold text-primary">{daysRemaining} Days</Text>
              <Text className="text-gray-400 text-sm">Until next check-in</Text>
            </View>
            <View className={`w-3 h-3 rounded-full ${status.isOverdue ? 'bg-red-500' : 'bg-green-500'}`} />
          </View>

          <Pressable
            className="bg-primary w-full py-4 rounded-xl items-center active:opacity-90"
            onPress={checkIn}
            disabled={isLoading}>
            <Text className="text-white font-bold text-lg">Check In Now</Text>
          </Pressable>
        </View>

        {/* Quick Actions */}
        <Text className="text-xl font-bold text-foreground mb-4">Quick Actions</Text>

        <View className="flex-row flex-wrap justify-between">
          <ActionCard
            icon="lock.fill"
            title="Add Cipher"
            onPress={() => router.push('/add-crypto')}
          />
          <ActionCard
            icon="arrow.right.arrow.left"
            title="Transfer"
            onPress={() => router.push('/add-transfer')}
          />
          <ActionCard
            icon="envelope.fill"
            title="Message"
            onPress={() => router.push('/compose')}
          />
          <ActionCard
            icon="person.2.fill"
            title="Recipients"
            onPress={() => router.push('/(tabs)/recipients')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ActionCard({ icon, title, onPress }: { icon: string; title: string; onPress: () => void }) {
  return (
    <Pressable
      className="w-[48%] bg-white p-4 rounded-2xl mb-4 border border-gray-100 shadow-sm items-center justify-center py-8 active:scale-95 transition-transform"
      onPress={onPress}>
      <View className="w-12 h-12 bg-orange-50 rounded-full items-center justify-center mb-3">
        <IconSymbol
          name={icon as any}
          size={24}
          color="#B08D55"
        />
      </View>
      <Text className="font-medium text-gray-800">{title}</Text>
    </Pressable>
  );
}
