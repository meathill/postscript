import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from '@/components/ui/image';
import * as AppleAuthentication from 'expo-apple-authentication';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

export default function WelcomeScreen() {
  const router = useRouter();

  const handleAppleLogin = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (credential.identityToken) {
        console.log('Apple Sign-In successful, authenticating with backend...');
        const { token, user } = await api.auth.loginWithApple(credential.identityToken);

        await useAuthStore.getState().setToken(token);
        useAuthStore.getState().setUser(user);

        // TODO: Check if user has already set up a password.
        // For now, assume every login goes to setup logic or dashboard.
        // Let's redirect to Setup Password for demo purposes if it's a new flow.
        router.replace('/(auth)/setup-password');
      } else {
        throw new Error('No identity token provided');
      }
    } catch (e: any) {
      if (e.code === 'ERR_CANCELED') {
        // User canceled the sign-in flow
      } else {
        console.error('Apple Sign-In failed', e);
        // TODO: Show error toast
      }
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black items-center justify-center p-6">
      <View className="items-center mb-10">
        {/* Placeholder for Logo if needed later, using expo-image as requested */}
        {/* <Image source={require('@/assets/logo.png')} className="size-24" /> */}
        <Text className="text-white text-4xl font-bold mb-4">Postscript</Text>
        <Text className="text-gray-400 text-center text-lg leading-6 max-w-xs">
          Leave a message for the future. Secure, encrypted, and everlasting.
        </Text>
      </View>

      <Pressable
        className="w-full bg-white py-4 rounded-xl items-center mb-4 active:opacity-90"
        onPress={handleAppleLogin}>
        <Text className="text-black font-bold text-lg">Continue with Apple</Text>
      </Pressable>

      <Pressable
        onPress={() => router.push('/(tabs)')}
        className="py-2 active:opacity-70">
        <Text className="text-gray-500">Skip to Dashboard (Dev)</Text>
      </Pressable>
    </SafeAreaView>
  );
}
