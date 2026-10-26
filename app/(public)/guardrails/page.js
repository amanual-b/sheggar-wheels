import GuardrailsView from "@/components/views/GuardrailsView";

export const metadata = { title: "Safety checks", description: "Live checks that forbidden actions are refused safely.", robots: { index: false } };

export default function GuardrailsPage() {
  return <GuardrailsView />;
}
