import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Voice is optional (compile should still work if the package isn't installed).
let Voice: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Voice = require('@react-native-voice/voice').default;
} catch {
  Voice = null;
}

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: any;
};

const MyMediAiScreen = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const userId = auth().currentUser?.uid;

  useEffect(() => {
    if (!userId) {
      setMessages([
        {
          id: 'welcome',
          text: 'Please sign in to use the Assistant. 💊',
          sender: 'bot',
          timestamp: new Date(),
        },
      ]);
      return;
    }

    // Voice setup
    if (Voice) {
      Voice.onSpeechResults = (e: any) => {
        if (e.value && e.value[0]) {
          setInput(e.value[0]);
          setIsListening(false);
        }
      };
      Voice.onSpeechEnd = () => setIsListening(false);
    }

    // Firebase chat history
    const unsubscribe = firestore()
      .collection('users')
      .doc(userId)
      .collection('chats')
      .orderBy('timestamp', 'asc')
      .limit(50)
      .onSnapshot(snapshot => {
        const msgs: Message[] = [];
        snapshot.forEach(doc => msgs.push({ id: doc.id, ...(doc.data() as any) } as Message));

        if (msgs.length === 0) {
          msgs.push({
            id: 'welcome',
            text:
              'Namaste Prahlad! Main aapka MyMedi Assistant hu. 💊\n\nAap mujhse puch sakte ho:\n• "Meri agli dawai kab hai?"\n• "Metformin stock kitna hai?"\n• "Aspirin lena bhul gaya"',
            sender: 'bot',
            timestamp: new Date(),
          });
        }

        setMessages(msgs);
      });

    return () => {
      if (Voice) {
        Voice.destroy().then(Voice.removeAllListeners);
      }
      unsubscribe();
    };
  }, [userId]);

  const startListening = async () => {
    if (!Voice) return;
    try {
      setIsListening(true);
      await Voice.start('hi-IN');
    } catch {
      setIsListening(false);
    }
  };

  const stopListening = async () => {
    if (!Voice) return;
    await Voice.stop();
    setIsListening(false);
  };

  const sendMessage = async () => {
    if (!userId) return;
    if (!input.trim()) return;

    const text = input;
    setInput('');

    const userMsg = {
      text,
      sender: 'user' as const,
      timestamp: firestore.FieldValue.serverTimestamp(),
      userId,
    };

    await firestore().collection('users').doc(userId).collection('chats').add(userMsg);

    // Keep chat UX: show bot reply with short delay.
    setTimeout(async () => {
      const botReply = await getBotReply(text, userId);
      await firestore().collection('users').doc(userId).collection('chats').add({
        text: botReply,
        sender: 'bot',
        timestamp: firestore.FieldValue.serverTimestamp(),
        userId,
      });
    }, 500);
  };

  const getBotReply = async (query: string, uid: string): Promise<string> => {
    const q = query.toLowerCase();

    try {
      // Fetch user medications & today's schedules (keep existing schema usage).
      const medsSnap = await firestore().collection('users').doc(uid).collection('medications').get();

      const todayDoc = '2026-06-04';
      const schedulesSnap = await firestore()
        .collection('users')
        .doc(uid)
        .collection('schedules')
        .doc(todayDoc)
        .collection('items')
        .where('status', 'in', ['Due', 'Upcoming'])
        .get();

      if (q.includes('agli dawai') || q.includes('next') || q.includes('kab') || q.includes('dawai kab')) {
        const next = schedulesSnap.docs[0]?.data() as any;
        if (next && next.name) {
          return `Aapki agli dawai ${next.name} hai, ${next.time} par - ${next.instruction}`;
        }
        return 'Aaj ke liye abhi koi next dose nahi mila. (Firestore me data check karein)';
      }

      if (q.includes('stock') || q.includes('kitna')) {
        // If query contains a specific medicine name, try to match.
        const meds = medsSnap.docs.map(d => d.data() as any);
        const match = meds.find(m => q.includes((m?.name || '').toLowerCase().split(' ')[0]));

        if (match?.name) {
          const stockLeft = Number(match.stockLeft ?? 0);
          const threshold = Number(match.threshold ?? 0);
          return `⚠️ ${match.name} stock: ${stockLeft} (Threshold: ${threshold}).`;
        }

        // Otherwise return low-stock summary.
        const lowMeds = meds.filter(m => Number(m.stockLeft) < Number(m.threshold));
        if (lowMeds.length) {
          return `⚠️ Dhyaan de:\n${lowMeds
            .slice(0, 5)
            .map(d => `• ${d.name}: ${d.stockLeft} tablets bache`)
            .join('\n')}`;
        }

        return 'Sab medicines ka stock theek hai!';
      }

      if (q.includes('bhul') || q.includes('miss')) {
        return 'Samajh gaya. Agar aap chahein to main next dose reminder aur schedule me status update ki guidance de sakta hu.';
      }

      // If we can’t match intent/data, respond neutrally.
      return 'Main samajh gaya. Lekin is time mere paas exact data nahi hai. Aap medicine name ya question thoda aur specific kar dein.';
    } catch {
      return 'Assistant ko data fetch karne me issue aaya. Firestore connection / permissions check karein.';
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[styles.messageRow, item.sender === 'user' ? styles.userRow : styles.botRow]}>
      {item.sender === 'bot' && (
        <View style={styles.botAvatar}>
          <Icon name="robot-outline" size={18} color="white" />
        </View>
      )}
      <View style={[styles.bubble, item.sender === 'user' ? styles.userBubble : styles.botBubble]}>
        <Text style={[styles.messageText, item.sender === 'user' ? styles.userText : styles.botText]}>
          {item.text}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#047857" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity>
          <Icon name="chevron-down" size={28} color="white" />
        </TouchableOpacity>
        <View style={{ alignItems: 'center', flex: 1 }}>
          <Text style={styles.headerTitle}>MyMedi Assistant</Text>
          <View style={styles.onlineDot}>
            <View style={styles.greenDot} />
            <Text style={styles.onlineText}>Online • Firebase connected</Text>
          </View>
        </View>
        <Icon name="dots-vertical" size={24} color="white" />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.chatContainer}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        />

        {/* Quick Suggestions */}
        <View style={styles.suggestions}>
          <TouchableOpacity style={styles.chip} onPress={() => setInput('Meri agli dawai kab hai?')}>
            <Text style={styles.chipText}>Agli dawai?</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.chip} onPress={() => setInput('Metformin stock kitna hai?')}>
            <Text style={styles.chipText}>Stock check</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.chip} onPress={() => setInput('Aaj ka schedule')}>
            <Text style={styles.chipText}>Aaj ka schedule</Text>
          </TouchableOpacity>
        </View>

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TouchableOpacity
            style={[styles.micBtn, isListening && styles.micActive]}
            onPress={isListening ? stopListening : startListening}
          >
            <Icon name={isListening ? 'waveform' : 'microphone'} size={22} color="white" />
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder={isListening ? 'Sun raha hu...' : 'Type ya bolo...'}
            placeholderTextColor="#9CA3AF"
            value={input}
            onChangeText={setInput}
            multiline
          />

          <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
            <Icon name="send" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ECFDF5' },
  header: {
    backgroundColor: '#047857',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: { color: 'white', fontSize: 18, fontWeight: '700' },
  onlineDot: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  greenDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ADE80', marginRight: 4 },
  onlineText: { color: '#A7F3D0', fontSize: 11 },
  chatContainer: { padding: 16, paddingBottom: 10 },
  messageRow: { flexDirection: 'row', marginBottom: 16, alignItems: 'flex-end' },
  userRow: { justifyContent: 'flex-end' },
  botRow: { justifyContent: 'flex-start' },
  botAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#047857', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  bubble: { maxWidth: '78%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  userBubble: { backgroundColor: '#047857', borderBottomRightRadius: 4 },
  botBubble: { backgroundColor: 'white', borderBottomLeftRadius: 4, elevation: 1 },
  messageText: { fontSize: 14, lineHeight: 20 },
  userText: { color: 'white' },
  botText: { color: '#1F2937' },
  suggestions: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  chip: { backgroundColor: 'white', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: '#D1FAE5' },
  chipText: { color: '#047857', fontSize: 12, fontWeight: '500' },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  micBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#047857', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  micActive: { backgroundColor: '#DC2626' },
  input: { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, maxHeight: 100, fontSize: 14, color: '#111827' },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#047857', justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
});

export default MyMediAiScreen;

