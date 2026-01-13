import { View, Text, Switch, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { IconSymbol } from '@/components/ui/icon-symbol';
import * as SecureStore from 'expo-secure-store';

export default function SecurityScreen() {
  const router = useRouter();
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);

  // TODO: Check actual biometrics availability and stored preference

  const handleResetPassword = () => {
    Alert.alert(
      'Reset Master Password',
      'This will re-encrypt all your data. You will need to enter your current password first.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: () => {
            // In a real app, navigating to a re-auth flow
            Alert.alert('Not implemented', 'Password reset flow would start here');
          },
        },
      ],
    );
  };

  const toggleBiometrics = async (value: boolean) => {
    setBiometricsEnabled(value);
    // TODO: Implement actual SecureStore biometrics logic
    if (value) {
      Alert.alert('Biometrics', 'FaceID/TouchID would be enabled here');
    }
  };

  return (
    <SafeAreaView
      className="flex-1 bg-background"
      edges={['top']}>
      <View className="px-6 py-4">
        <Text className="text-3xl font-bold text-foreground mb-8">Security</Text>

        <View className="space-y-6">
          {/* Master Password Section */}
          <View className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <View className="flex-row items-center mb-4">
              <View className="w-10 h-10 bg-orange-50 rounded-full items-center justify-center mr-3">
                <IconSymbol
                  name="lock.fill"
                  size={20}
                  color="#B08D55"
                />
              </View>
              <View>
                <Text className="font-bold text-lg text-gray-900">Master Password</Text>
                <Text className="text-gray-500 text-sm">Protects all your encrypted assets</Text>
              </View>
            </View>

            <Pressable
              className="bg-gray-50 py-3 rounded-lg items-center border border-gray-200 active:bg-gray-100"
              onPress={handleResetPassword}>
              <Text className="font-medium text-gray-700">Change Password</Text>
            </Pressable>
          </View>

          {/* Biometrics Section */}
          <View className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex-row justify-between items-center">
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-blue-50 rounded-full items-center justify-center mr-3">
                {/* Ensure 'faceid' or similar icon is mapped, or use safe fallback */}
                <IconSymbol
                  name="person.2.fill"
                  size={20}
                  color="#007AFF"
                />
                {/* TODO: Add proper FaceID icon mapping */}
              </View>
              <View>
                <Text className="font-bold text-lg text-gray-900">Biometrics</Text>
                <Text className="text-gray-500 text-sm">Use FaceID / TouchID</Text>
              </View>
            </View>
            <Switch
              value={biometricsEnabled}
              onValueChange={toggleBiometrics}
              trackColor={{ false: '#767577', true: '#B08D55' }}
            />
          </View>

          {/* Recovery Section (Future) */}
          <View className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm opacity-50">
            <View className="flex-row items-center mb-2">
              <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-3">
                <IconSymbol
                  name="gear"
                  size={20}
                  color="#666"
                />
              </View>
              <View>
                <Text className="font-bold text-lg text-gray-900">Recovery Kit</Text>
                <Text className="text-gray-500 text-sm">Coming soon</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
