import type { ChatMessage, PipelineTrace } from '@mindbridge/shared';
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '@/theme';
import { ResourceCard } from './ResourceCard';
import { AppText } from './ui';

const time = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export function MessageBubble({ message, trace }: { message: ChatMessage; trace?: PipelineTrace }) {
  const mine = message.role === 'student';
  const pending = message.id.startsWith('pending-');
  return (
    <View style={{ alignItems: mine ? 'flex-end' : 'flex-start', gap: spacing.xs }}>
      <View
        style={[styles.bubble, mine ? styles.mine : styles.theirs, pending && { opacity: 0.6 }]}
        accessibilityLabel={`${mine ? 'You' : 'MindBridge'} said: ${message.content}`}
      >
        <AppText style={{ color: mine ? colors.white : colors.text }}>{message.content}</AppText>
      </View>
      <AppText variant="caption" style={{ paddingHorizontal: spacing.xs }}>
        {mine ? (pending ? 'Sending…' : time(message.createdAt)) : `MindBridge · ${time(message.createdAt)}`}
      </AppText>
      {message.safety && message.safety.resources.length > 0 && (
        <View style={{ width: '100%', gap: spacing.sm }}>
          {message.safety.resources.map((r) => (
            <ResourceCard key={r.id} resource={r} compact />
          ))}
        </View>
      )}
      {trace && <TraceView trace={trace} />}
    </View>
  );
}

const pretty = (s: string) => s.toLowerCase().replace(/_/g, ' ');

/** Explainability panel: how the pipeline handled this message (no raw model output). */
export function TraceView({ trace }: { trace: PipelineTrace }) {
  const [open, setOpen] = useState(false);
  return (
    <Pressable onPress={() => setOpen((o) => !o)} style={styles.trace} accessibilityRole="button" accessibilityLabel="How MindBridge understood this">
      <AppText variant="caption" style={{ fontWeight: '600', color: colors.accent }}>
        {open ? '▾' : '▸'} How MindBridge understood this
      </AppText>
      {open && (
        <View style={{ gap: 2, marginTop: spacing.xs }}>
          <AppText variant="caption">Topic: {pretty(trace.intent.label)} ({Math.round(trace.intent.confidence * 100)}%)</AppText>
          <AppText variant="caption">
            Feelings noticed: {trace.signals.length ? trace.signals.map((s) => pretty(s.signal)).join(', ') : 'none clear'}
          </AppText>
          <AppText variant="caption">Safety check: {pretty(trace.safety.level)}</AppText>
          <AppText variant="caption">Approach: {pretty(trace.strategy)}</AppText>
          <AppText variant="caption">
            Response check: {trace.validation.passed ? 'passed' : `replaced with a safe reply (${trace.validation.issues.join(', ')})`}
          </AppText>
          <AppText variant="caption">
            {trace.provider} · {trace.latencyMs} ms
          </AppText>
          <AppText variant="caption" style={{ fontStyle: 'italic' }}>
            These are conversational cues, not a diagnosis.
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

export function TypingIndicator() {
  const dots = useRef([0, 1, 2].map(() => new Animated.Value(0.3))).current;
  useEffect(() => {
    const anims = dots.map((d, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(d, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(d, { toValue: 0.3, duration: 300, useNativeDriver: true }),
          Animated.delay((2 - i) * 150),
        ]),
      ),
    );
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, [dots]);
  return (
    <View style={[styles.bubble, styles.theirs, { flexDirection: 'row', gap: 5, alignSelf: 'flex-start' }]} accessibilityLabel="MindBridge is typing">
      {dots.map((d, i) => (
        <Animated.View key={i} style={[styles.dot, { opacity: d }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: { maxWidth: '85%', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: radius.lg },
  mine: { backgroundColor: colors.studentBubble, borderBottomRightRadius: radius.sm },
  theirs: { backgroundColor: colors.assistantBubble, borderBottomLeftRadius: radius.sm, borderWidth: 1, borderColor: colors.border },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  trace: { backgroundColor: colors.accentSoft, borderRadius: radius.md, padding: spacing.sm, maxWidth: '85%' },
});
