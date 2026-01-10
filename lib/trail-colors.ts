// S1-S4 singletrail difficulty colors
export const difficultyColors: Record<string, string> = {
  S1: "#22c55e", // green
  S2: "#3b82f6", // blue
  S3: "#800080", // purple
  S4: "#000000", // black
};

// Tailwind class versions for badges
export const difficultyBgClasses: Record<string, string> = {
  S1: "bg-green-500",
  S2: "bg-blue-500",
  S3: "bg-purple-700",
  S4: "bg-black",
};

export const statusColors: Record<string, string> = {
  Open: "#22c55e", // green
  Closed: "#ef4444", // red
};

export const statusBgClasses: Record<string, string> = {
  Open: "bg-green-500",
  Closed: "bg-red-500",
};

export const categoryColors: Record<string, string> = {
  Enduro: "#ef4444",
  "All Mountain": "#f97316",
  "Cross Country": "#22c55e",
  "Downhill/Free Ride": "#a855f7",
  eMTB: "#3b82f6",
  Gravel: "#d97706",
  LBL: "#14b8a6",
};

export const categoryBgColors: Record<string, string> = {
  Enduro: "bg-red-500",
  "All Mountain": "bg-orange-500",
  "Cross Country": "bg-green-500",
  "Downhill/Free Ride": "bg-purple-500",
  eMTB: "bg-blue-500",
  Gravel: "bg-amber-600",
  LBL: "bg-teal-500",
};

// Default/fallback colors
export const defaultTrailColor = "#9ca3af"; // gray for unknown difficulty
export const unknownStatusColor = "#6b7280"; // gray for unknown status
