import { View, Text, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRecipientsStore } from '@/store/recipients';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function AddRecipientScreen() {
  const router = useRouter();
  const { addRecipient } = useRecipientsStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [relationship, setRelationship] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name || !email) {
      Alert.alert('Error', 'Name and Email are required');
      return;
    }

    setIsSubmitting(true);
    try {
      await addRecipient({ name, email, relationship });
      Alert.alert('Success', 'Recipient added successfully', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (error) {
      Alert.alert('Error', 'Failed to add recipient');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background p-6">
      <View className="flex-row items-center mb-8">
        <Pressable
          onPress={() => router.back()}
          className="mr-4">
          <IconSymbol
            name="chevron.left.forwardslash.chevron.right"
            size={24}
            color="#333"
          />
          {/* TODO: Add simple back arrow to IconSymbol mapping */}
        </Pressable>
        <Text className="text-2xl font-bold">Add Recipient</Text>
      </View>

      <View className="space-y-4">
        <View>
          <Text className="text-gray-500 mb-1 font-medium">Full Name</Text>
          <TextInput
            className="bg-white p-4 rounded-xl border border-gray-200 text-base"
            placeholder="e.g. John Doe"
            value={name}
            onChangeText={setName}
            autoFocus
          />
        </View>

        <View>
          <Text className="text-gray-500 mb-1 font-medium">Email Address</Text>
          <TextInput
            className="bg-white p-4 rounded-xl border border-gray-200 text-base"
            placeholder="john@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View>
          <Text className="text-gray-500 mb-1 font-medium">Relationship (Optional)</Text>
          <TextInput
            className="bg-white p-4 rounded-xl border border-gray-200 text-base"
            placeholder="e.g. Brother, Spouse"
            value={relationship}
            onChangeText={setRelationship}
          />
        </View>

        <Pressable
          className={`w-full py-4 rounded-xl items-center mt-6 ${
            isSubmitting || !name || !email ? 'bg-gray-300' : 'bg-primary'
          }`}
          onPress={handleSubmit}
          disabled={isSubmitting || !name || !email}>
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-bold text-lg">Save Recipient</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
