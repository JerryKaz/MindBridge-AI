import type {
  ChatMessage,
  ConsentRecord,
  ConsentType,
  ConversationDetail,
  ConversationSummary,
  CreateMoodInput,
  MoodEntry,
  MoodHistory,
  PipelineTrace,
  SendMessageResponse,
  StudentMemory,
  StudentProfile,
  SupportResource,
  University,
  UpdateProfileInput,
  WellnessActivity,
} from '@mindbridge/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/store/auth';
import { api } from './client';

export const keys = {
  me: ['me'] as const,
  universities: ['universities'] as const,
  conversations: ['conversations'] as const,
  conversation: (id: string) => ['conversations', id] as const,
  moods: (range: string) => ['moods', range] as const,
  wellness: ['wellness'] as const,
  activity: (id: string) => ['wellness', id] as const,
  support: (category?: string) => ['support', category ?? 'all'] as const,
  consents: ['consents'] as const,
  memories: ['memories'] as const,
};

export const useMe = () =>
  useQuery({ queryKey: keys.me, queryFn: () => api<StudentProfile>('/students/me'), staleTime: 60_000 });

export const useUniversities = () =>
  useQuery({ queryKey: keys.universities, queryFn: () => api<University[]>('/universities', { auth: false }), staleTime: Infinity });

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateProfileInput) => api<StudentProfile>('/students/me', { method: 'PUT', body: input }),
    onSuccess: (user) => {
      qc.setQueryData(keys.me, user);
      useAuth.getState().setUser(user);
    },
  });
}

// ---- Conversations ----------------------------------------------------------
export const useConversations = () =>
  useQuery({ queryKey: keys.conversations, queryFn: () => api<ConversationSummary[]>('/conversations') });

export const useConversation = (id: string) =>
  useQuery({ queryKey: keys.conversation(id), queryFn: () => api<ConversationDetail>(`/conversations/${id}`), enabled: !!id });

export function useCreateConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api<ConversationSummary>('/conversations', { method: 'POST', body: {} }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.conversations }),
  });
}

export function useDeleteConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/conversations/${id}`, { method: 'DELETE' }),
    onSuccess: (_d, id) => {
      qc.removeQueries({ queryKey: keys.conversation(id) });
      return qc.invalidateQueries({ queryKey: keys.conversations });
    },
  });
}

/** Optimistically shows the student's message, then swaps in the server's copy + reply. */
export function useSendMessage(conversationId: string, onTrace?: (messageId: string, trace: PipelineTrace) => void) {
  const qc = useQueryClient();
  const key = keys.conversation(conversationId);
  return useMutation({
    mutationFn: (content: string) =>
      api<SendMessageResponse>(`/conversations/${conversationId}/messages`, { method: 'POST', body: { content } }),
    onMutate: async (content) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<ConversationDetail>(key);
      const pending: ChatMessage = { id: `pending-${Date.now()}`, role: 'student', content, createdAt: new Date().toISOString() };
      if (previous) qc.setQueryData<ConversationDetail>(key, { ...previous, messages: [...previous.messages, pending] });
      return { previous, pendingId: pending.id };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous);
    },
    onSuccess: (res, _v, ctx) => {
      qc.setQueryData<ConversationDetail>(key, (old) =>
        old
          ? {
              ...old,
              messages: [...old.messages.filter((m) => m.id !== ctx?.pendingId), res.studentMessage, res.reply],
            }
          : old,
      );
      onTrace?.(res.reply.id, res.trace);
      void qc.invalidateQueries({ queryKey: keys.conversations });
    },
  });
}

// ---- Moods ------------------------------------------------------------------
export const useMoodHistory = (range: MoodHistory['range']) =>
  useQuery({ queryKey: keys.moods(range), queryFn: () => api<MoodHistory>(`/moods/history?range=${range}`) });

export function useCreateMood() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateMoodInput) => api<MoodEntry>('/moods', { method: 'POST', body: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['moods'] }),
  });
}

export function useDeleteMood() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/moods/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['moods'] }),
  });
}

// ---- Wellness & support -----------------------------------------------------
export const useWellness = () =>
  useQuery({ queryKey: keys.wellness, queryFn: () => api<WellnessActivity[]>('/wellness/activities'), staleTime: 5 * 60_000 });

export const useActivity = (id: string) =>
  useQuery({ queryKey: keys.activity(id), queryFn: () => api<WellnessActivity>(`/wellness/activities/${id}`) });

export const useCompleteActivity = () =>
  useMutation({ mutationFn: (id: string) => api<void>(`/wellness/activities/${id}/complete`, { method: 'POST' }) });

export const useSupportResources = (category?: string) =>
  useQuery({
    queryKey: keys.support(category),
    queryFn: () => api<SupportResource[]>(`/support/resources${category ? `?category=${category}` : ''}`),
    staleTime: 5 * 60_000,
  });

// ---- Privacy ----------------------------------------------------------------
export const useConsents = () => useQuery({ queryKey: keys.consents, queryFn: () => api<ConsentRecord[]>('/consents') });

export function useUpdateConsents() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (consents: Array<{ type: ConsentType; granted: boolean }>) =>
      api<ConsentRecord[]>('/consents', { method: 'PUT', body: { consents } }),
    onSuccess: (data) => qc.setQueryData(keys.consents, data),
  });
}

export const useMemories = (enabled = true) =>
  useQuery({ queryKey: keys.memories, queryFn: () => api<StudentMemory[]>('/memories'), enabled });

export function useAddMemory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => api<StudentMemory>('/memories', { method: 'POST', body: { content } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.memories }),
  });
}

export function useDeleteMemory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/memories/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.memories }),
  });
}

export const exportMyData = () => api<unknown>('/privacy/data-export', { method: 'POST' });
export const deleteMyAccount = (password: string) =>
  api<void>('/privacy/account-deletion', { method: 'POST', body: { password, confirm: 'DELETE' } });
