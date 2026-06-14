import { BookOpenText, Images, Map, Rows3 } from "lucide-react";

export type MemoryView = "story" | "timeline" | "map" | "photos";

type ViewSwitcherProps = {
  activeView: MemoryView;
  photoCount: number;
  onChange: (view: MemoryView) => void;
};

const views = [
  {
    id: "story",
    label: "Story",
    description: "Reflections",
    icon: BookOpenText
  },
  {
    id: "timeline",
    label: "Timeline",
    description: "Sequence",
    icon: Rows3
  },
  {
    id: "map",
    label: "Map",
    description: "Places",
    icon: Map
  },
  {
    id: "photos",
    label: "Photos",
    description: "Gallery",
    icon: Images
  }
] satisfies Array<{
  id: MemoryView;
  label: string;
  description: string;
  icon: typeof BookOpenText;
}>;

export function ViewSwitcher({
  activeView,
  photoCount,
  onChange
}: ViewSwitcherProps) {
  return (
    <nav className="view-switcher" aria-label="Memory views">
      {views.map((view) => {
        const Icon = view.icon;
        return (
          <button
            key={view.id}
            type="button"
            className={view.id === activeView ? "active" : ""}
            onClick={() => onChange(view.id)}
          >
            <Icon size={18} aria-hidden="true" />
            <span>
              <strong>{view.label}</strong>
              <em>{view.id === "photos" ? `${photoCount} photos` : view.description}</em>
            </span>
          </button>
        );
      })}
    </nav>
  );
}
