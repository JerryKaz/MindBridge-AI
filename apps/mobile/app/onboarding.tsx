import { Ionicons } from '@expo/vector-icons';
import type { ConsentType } from '@mindbridge/shared';
import { useState } from 'react';
import { Pressable, Switch, View } from 'react-native';
import { useUniversities, useUpdateConsents, useUpdateProfile } from '@/api/hooks';
import { ApiRequestError } from '@/api/client';
import { AppText, Button, Card, Chip, Screen } from '@/components/ui';
import { colors, spacing } from '@/theme';

const CAN = [
  'Listen without judgement, any time of day',
  'Help you reflect on how you feel',
  'Suggest coping and study-stress techniques',
  'Point you to verified human support',
];
const CANNOT = [
  'Diagnose or treat mental health conditions',
  'Prescribe or recommend medication',
  'Replace a counsellor, doctor or therapist',
  'Respond to emergencies — contact emergency services if you are in danger',
];

const CONSENT_COPY: Array<{ type: ConsentType; title: string; body: string; required?: boolean }> = [
  {
    type: 'AI_PROCESSING',
    title: 'AI conversations',
    body: 'Your messages are processed by our AI to reply to you. They are encrypted at rest and never used to train external models.',
    required: true,
  },
  {
    type: 'CONVERSATION_MEMORY',
    title: 'Remember things I choose',
    body: 'Let MindBridge use short notes you save (e.g. your course) to personalise replies. You can view and delete them anytime.',
  },
  {
    type: 'ANONYMOUS_ANALYTICS',
    title: 'Help improve MindBridge',
    body: 'Contribute to anonymous, aggregated usage statistics. No one can see your messages or journal.',
  },
];

function Bullet({ ok, text }: { ok: boolean; text: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}>
      <Ionicons name={ok ? 'checkmark-circle' : 'close-circle'} size={20} color={ok ? colors.primary : colors.textMuted} />
      <AppText style={{ flex: 1 }}>{text}</AppText>
    </View>
  );
}

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [consents, setConsents] = useState<Record<ConsentType, boolean>>({
    TERMS_AND_PRIVACY: true,
    AI_PROCESSING: true,
    CONVERSATION_MEMORY: false,
    ANONYMOUS_ANALYTICS: false,
  });
  const [universityId, setUniversityId] = useState<string | null>(null);
  const [year, setYear] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const universities = useUniversities();
  const updateConsents = useUpdateConsents();
  const updateProfile = useUpdateProfile();

  const saveConsents = async () => {
    setError(null);
    try {
      await updateConsents.mutateAsync(CONSENT_COPY.map(({ type }) => ({ type, granted: consents[type] })));
      setStep(2);
    } catch (e) {
      setError(e instanceof ApiRequestError ? e.message : 'Could not save your choices');
    }
  };

  const finish = async () => {
    setError(null);
    try {
      await updateProfile.mutateAsync({ universityId, yearOfStudy: year, onboardingCompleted: true });
    } catch (e) {
      setError(e instanceof ApiRequestError ? e.message : 'Could not save your profile');
    }
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <AppText variant="caption">Step {step + 1} of 3</AppText>
      {error && (
        <Card tone="danger">
          <AppText>{error}</AppText>
        </Card>
      )}

      {step === 0 && (
        <>
          <AppText variant="title">What MindBridge is (and isn't)</AppText>
          <Card>
            <AppText variant="subheading">MindBridge can</AppText>
            {CAN.map((t) => (
              <Bullet key={t} ok text={t} />
            ))}
          </Card>
          <Card tone="soft">
            <AppText variant="subheading">MindBridge cannot</AppText>
            {CANNOT.map((t) => (
              <Bullet key={t} ok={false} text={t} />
            ))}
          </Card>
          <Button title="I understand" onPress={() => setStep(1)} />
        </>
      )}

      {step === 1 && (
        <>
          <AppText variant="title">Your privacy, your choice</AppText>
          <AppText style={{ color: colors.textMuted }}>You can change these anytime in Profile & privacy.</AppText>
          {CONSENT_COPY.map((c) => (
            <Card key={c.type}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <View style={{ flex: 1, gap: 4 }}>
                  <AppText variant="subheading">
                    {c.title}
                    {c.required ? ' (needed to chat)' : ''}
                  </AppText>
                  <AppText variant="caption">{c.body}</AppText>
                </View>
                <Switch
                  accessibilityLabel={c.title}
                  value={consents[c.type]}
                  onValueChange={(v) => setConsents((s) => ({ ...s, [c.type]: v }))}
                  trackColor={{ true: colors.primary, false: colors.border }}
                />
              </View>
            </Card>
          ))}
          {!consents.AI_PROCESSING && (
            <AppText variant="caption">
              Without AI conversations you can still use mood check-ins, wellness activities and the support directory.
            </AppText>
          )}
          <Button title="Save and continue" onPress={saveConsents} loading={updateConsents.isPending} />
        </>
      )}

      {step === 2 && (
        <>
          <AppText variant="title">A little about you</AppText>
          <AppText style={{ color: colors.textMuted }}>
            Optional. Choosing your school helps us show your campus counselling services first.
          </AppText>
          <AppText variant="label">Your university</AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            <Chip label="Prefer not to say" selected={universityId === null} onPress={() => setUniversityId(null)} />
            {universities.data?.map((u) => (
              <Chip key={u.id} label={u.shortName} selected={universityId === u.id} onPress={() => setUniversityId(u.id)} />
            ))}
          </View>
          <AppText variant="label">Year of study</AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {[1, 2, 3, 4, 5, 6].map((y) => (
              <Chip key={y} label={`Year ${y}`} selected={year === y} onPress={() => setYear(year === y ? null : y)} />
            ))}
          </View>
          <Button title="Start using MindBridge" onPress={finish} loading={updateProfile.isPending} />
          <Pressable onPress={() => setStep(1)} accessibilityRole="button">
            <AppText variant="caption" style={{ textAlign: 'center' }}>
              Back
            </AppText>
          </Pressable>
        </>
      )}
    </Screen>
  );
}
