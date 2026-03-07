import Dashboard from "@/components/Dashboard";
import { ViewedMatchesProvider } from "@/hooks/useViewedMatches";

export default function Home() {
  return (
    <ViewedMatchesProvider>
      <Dashboard />
    </ViewedMatchesProvider>
  );
}
