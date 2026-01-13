import { View, Text, Pressable, Switch, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/welcome');
  };

  return (
    <SafeAreaView
      className="flex-1 bg-background"
      edges={['top']}>
      <ScrollView className="px-6 py-4">
        <Text className="text-3xl font-bold text-foreground mb-8">Settings</Text>

        <View className="mb-8 items-center">
          <View className="w-20 h-20 bg-gray-200 rounded-full items-center justify-center mb-4">
            <Text className="text-2xl font-bold text-gray-500">{user?.email?.charAt(0).toUpperCase() || 'U'}</Text>
          </View>
          <Text className="text-xl font-bold text-foreground">{user?.email}</Text>
          <Text className="text-gray-500">Free Plan</Text>
        </View>

        <View className="space-y-6">
          {/* Account Section */}
          <Section title="Account">
            <MenuItem
              icon="person.2.fill"
              title="Profile Details"
              onPress={() => {}}
            />
            <MenuItem
              icon="lock.fill"
              title="Security"
              onPress={() => router.push('/(tabs)/security')}
            />
          </Section>

          {/* Preferences */}
          <Section title="Preferences">
            <MenuItem
              icon="gear"
              title="Notifications"
              onPress={() => {}}
            />
            <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
              <View className="flex-row items-center">
                <IconSymbol
                  name="house.fill"
                  size={20}
                  color="#666"
                  style={{ marginRight: 12 }}
                />
                {/* TODO: Use moon/sun icon for theme */}
                <Text className="text-base font-medium text-gray-800">Dark Mode</Text>
              </View>
              <Switch
                value={false}
                onValueChange={() => {}}
              />
            </View>
          </Section>

          {/* Support */}
          <Section title="Support">
            <MenuItem
              icon="paperplane.fill"
              title="Help Center"
              onPress={() => {}}
            />
            <MenuItem
              icon="envelope.fill"
              title="Contact Us"
              onPress={() => {}}
            />
          </Section>

          <Pressable
            className="mt-4 bg-red-50 p-4 rounded-xl items-center border border-red-100 active:bg-red-100"
            onPress={handleLogout}>
            <Text className="text-red-500 font-bold text-lg">Log Out</Text>
          </Pressable>

          <View className="h-10" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View>
      <Text className="text-gray-500 font-bold mb-2 uppercase text-xs tracking-wider">{title}</Text>
      <View className="bg-white rounded-xl border border-gray-100 overflow-hidden px-4">{children}</View>
    </View>
  );
}

function MenuItem({ icon, title, onPress }: { icon: string; title: string; onPress: () => void }) {
  return (
    <Pressable
      className="flex-row items-center py-4 border-b border-gray-100 last:border-0 active:opacity-70"
      onPress={onPress}>
      <IconSymbol
        name={icon as any}
        size={20}
        color="#666"
      />
      <Text className="flex-1 ml-3 text-base font-medium text-gray-800">{title}</Text>
      <IconSymbol
        name="chevron.right"
        size={16}
        color="#ccc"
      />
    </Pressable>
  );
}
