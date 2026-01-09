"use client";

import { Trail } from "@/types/trail";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TrailCardProps {
  trail: Trail;
  isSelected: boolean;
  onClick: () => void;
}

const categoryColors: Record<string, string> = {
  Enduro: "bg-red-500",
  "All Mountain": "bg-orange-500",
  "Cross Country": "bg-green-500",
  "Downhill/Free Ride": "bg-purple-500",
  eMTB: "bg-blue-500",
  Gravel: "bg-amber-600",
  LBL: "bg-teal-500",
};

export function TrailCard({ trail, isSelected, onClick }: TrailCardProps) {
  const categoryColor = categoryColors[trail.category] || "bg-gray-500";

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        isSelected && "ring-2 ring-primary"
      )}
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {trail.id && (
                <span className="text-xs font-mono text-muted-foreground">
                  #{trail.id}
                </span>
              )}
              <h3 className="font-medium text-sm truncate">{trail.name}</h3>
            </div>
            <div className="flex flex-wrap gap-1 mb-2">
              <Badge
                variant={trail.status === "Open" ? "default" : "destructive"}
                className="text-xs"
              >
                {trail.status}
              </Badge>
              <Badge className={cn("text-xs text-white", categoryColor)}>
                {trail.category}
              </Badge>
              {trail.area && (
                <Badge variant="outline" className="text-xs">
                  {trail.area}
                </Badge>
              )}
            </div>
            <div className="flex gap-3 text-xs text-muted-foreground">
              <span>{trail.distance.value} {trail.distance.unit}</span>
              <span>{trail.elevation.descent}m descent</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
