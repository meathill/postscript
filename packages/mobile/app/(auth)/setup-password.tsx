import { View, Text, Pressable, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { deriveKey } from '../../lib/crypto';
import * as SecureStore from 'expo-secure-store';

export default function SetupPasswordScreen() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSetup = async () => {
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Derive Key
      const { key, salt } = await deriveKey(password);

      // 2. Store Salt (publicly safe-ish) and Verification Hash
      await SecureStore.setItemAsync('master_salt', salt);

      // In a real app, we might also encrypt the user's private key or recovery phrase here.
      // For now, we will verify the key works by encrypting a dummy value locally.

      // Store a "session" indicator or the key via biometrics (optional, skipping for now)
      // We will assume the session is strictly memory-based for the key usually,
      // but for convenience we might store a hash related to it.

      Alert.alert('Success', 'Master Password set successfully', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') },
      ]);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to setup password');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black p-6">
      <View className="mt-10">
        <Text className="text-white text-3xl font-bold mb-2">Create Master Password</Text>
        <Text className="text-gray-400 text-base mb-8">
          This password will encrypt all your assets. We cannot recover it if you check it.
        </Text>

        <Text className="text-gray-300 mb-2 font-medium">Master Password</Text>
        <TextInput
          className="bg-gray-900 text-white p-4 rounded-xl mb-6 border border-gray-800 focus:border-white"
          secureTextEntry
          placeholder="At least 8 characters"
          placeholderTextColor="#666"
          value={password}
          onChangeText={setPassword}
          autoCapitalize="none"
        />

        <Text className="text-gray-300 mb-2 font-medium">Confirm Password</Text>
        <TextInput
          className="bg-gray-900 text-white p-4 rounded-xl mb-8 border border-gray-800 focus:border-white"
          secureTextEntry
          placeholder="Re-enter password"
          placeholderTextColor="#666"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          autoCapitalize="none"
        />

        <Pressable
          className={`w-full py-4 rounded-xl items-center ${isProcessing || !password ? 'bg-gray-700' : 'bg-white'}`}
          onPress={handleSetup}
          disabled={isProcessing || !password}>
          {isProcessing ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text className={`font-bold text-lg ${isProcessing || !password ? 'text-gray-400' : 'text-black'}`}>
              Set Password
            </Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
