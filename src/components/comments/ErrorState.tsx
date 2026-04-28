import { Card } from "@/components/ui/card";

export function ErrorState({ error }: { error: string }) {
  return (
    <Card>
      <div className="p-6 text-center text-xs text-destructive">{error}</div>
    </Card>
  );
}
