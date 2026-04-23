import { ChevronRight } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export default function SettingRow({ icon: Icon, label, description, type, value, onChange }) {
  return (
    <div className="flex items-center gap-4 py-3.5">
      <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      {type === "toggle" && (
        <Switch checked={value} onCheckedChange={onChange} />
      )}
      {type === "link" && (
        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      )}
      {type === "value" && (
        <span className="text-xs text-muted-foreground font-medium">{value}</span>
      )}
    </div>
  );
}
