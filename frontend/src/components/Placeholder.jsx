import { Construction } from "lucide-react";
import { EmptyState } from "./ui";

export default function Placeholder({ title }) {
  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      <div className="mt-6">
        <EmptyState icon={Construction} title="Not built yet" hint="This screen is coming soon." />
      </div>
    </div>
  );
}
