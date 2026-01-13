import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-black items-center justify-center p-6">
      <View className="items-center mb-10">
        <Text className="text-white text-4xl font-bold mb-4">Postscript</Text>
        <Text className="text-gray-400 text-center text-lg leading-6 max-w-xs">
          Leave a message for the future. Secure, encrypted, and everlasting.
        </Text>
      </View>

      <TouchableOpacity
        className="w-full bg-white py-4 rounded-xl items-center mb-4 active:opacity-90"
        onPress={() => console.log('Login with Apple')}>
        <Text className="text-black font-bold text-lg">Continue with Apple</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push('/(tabs)')}
        className="py-2">
        <Text className="text-gray-500">Skip to Dashboard (Dev)</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
