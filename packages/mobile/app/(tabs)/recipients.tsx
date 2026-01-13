import { View, Text, FlatList, Pressable, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useRecipientsStore, Recipient } from '@/store/recipients';
import { useEffect } from 'react';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function RecipientsScreen() {
  const router = useRouter();
  const { recipients, isLoading, fetchRecipients, deleteRecipient } = useRecipientsStore();

  useEffect(() => {
    fetchRecipients();
  }, []);

  const handleDelete = (id: string) => {
    Alert.alert('Delete Recipient', 'Are you sure you want to delete this recipient?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteRecipient(id),
      },
    ]);
  };

  const renderItem = ({ item }: { item: Recipient }) => (
    <View className="bg-white p-4 rounded-xl mb-3 flex-row items-center border border-gray-100 shadow-sm">
      <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-4">
        <IconSymbol
          name="person.2.fill"
          size={20}
          color="#666"
        />
      </View>
      <View className="flex-1">
        <Text className="font-bold text-base text-gray-900">{item.name}</Text>
        <Text className="text-gray-500 text-sm">{item.email}</Text>
        {item.relationship && <Text className="text-gray-400 text-xs mt-1">{item.relationship}</Text>}
      </View>
      <Pressable
        onPress={() => handleDelete(item.id)}
        className="p-2">
        <IconSymbol
          name="chevron.right"
          size={20}
          color="#ccc"
        />
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView
      className="flex-1 bg-background"
      edges={['top']}>
      <View className="flex-row justify-between items-center px-6 py-4">
        <Text className="text-3xl font-bold text-foreground">Recipients</Text>
        <Pressable
          onPress={() => router.push('/add-recipient')}
          className="w-10 h-10 bg-primary rounded-full items-center justify-center">
          <IconSymbol
            name="paperplane.fill"
            size={20}
            color="white"
          />
          {/* Using paperplane as 'plus' might not be mapped yet, or just consistent with action */}
        </Pressable>
      </View>

      <FlatList
        data={recipients}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={fetchRecipients}
            tintColor="#B08D55"
          />
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-4">
              <IconSymbol
                name="person.2.fill"
                size={32}
                color="#ccc"
              />
            </View>
            <Text className="text-gray-500 text-lg font-medium">No recipients yet</Text>
            <Text className="text-gray-400 text-center mt-2 max-w-xs">
              Add trusted contacts who should receive your assets.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
