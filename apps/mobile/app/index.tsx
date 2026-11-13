import { LoadingState } from '@/components/ui';

/** The AuthGate in _layout redirects from here once the session state is known. */
export default function Index() {
  return <LoadingState />;
}
