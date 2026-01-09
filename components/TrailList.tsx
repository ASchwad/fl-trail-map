"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Trail } from "@/types/trail";
import { TrailCard } from "./TrailCard";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface TrailListProps {
  trails: Trail[];
  selectedTrail: Trail | null;
  onSelectTrail: (trail: Trail) => void;
}

const categories = [
  "All",
  "Enduro",
  "All Mountain",
  "Cross Country",
  "eMTB",
  "Gravel",
  "LBL",
];

const statusOptions = ["All", "Open", "Closed"] as const;
type StatusFilter = (typeof statusOptions)[number];

const difficultyOptions = ["All", "Easy", "Moderate", "Difficult"] as const;
type DifficultyFilter = (typeof difficultyOptions)[number];

export function TrailList({ trails, selectedTrail, onSelectTrail }: TrailListProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>("All");
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Scroll to selected trail card when selection changes (e.g., from map click)
  useEffect(() => {
    if (selectedTrail) {
      const cardElement = cardRefs.current.get(selectedTrail.slug);
      if (cardElement) {
        cardElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [selectedTrail]);

  const filteredTrails = useMemo(() => {
    return trails.filter((trail) => {
      const matchesSearch =
        trail.name.toLowerCase().includes(search.toLowerCase()) ||
        trail.fullName.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        selectedCategory === "All" || trail.category === selectedCategory;
      const matchesStatus =
        statusFilter === "All" || trail.status === statusFilter;
      const matchesDifficulty =
        difficultyFilter === "All" ||
        trail.difficulty.overall?.toLowerCase() === difficultyFilter.toLowerCase();
      return matchesSearch && matchesCategory && matchesStatus && matchesDifficulty;
    });
  }, [trails, search, selectedCategory, statusFilter, difficultyFilter]);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="p-3 border-b space-y-3">
        <Input
          placeholder="Search trails..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9"
        />
        <div className="flex flex-wrap gap-1">
          {categories.map((cat) => (
            <Badge
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              className="cursor-pointer text-xs"
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </Badge>
          ))}
        </div>
        <div className="flex flex-wrap gap-1">
          <span className="text-xs text-muted-foreground mr-1">Status:</span>
          {statusOptions.map((status) => (
            <Badge
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              className="cursor-pointer text-xs"
              onClick={() => setStatusFilter(status)}
            >
              {status}
            </Badge>
          ))}
        </div>
        <div className="flex flex-wrap gap-1">
          <span className="text-xs text-muted-foreground mr-1">Difficulty:</span>
          {difficultyOptions.map((difficulty) => (
            <Badge
              key={difficulty}
              variant={difficultyFilter === difficulty ? "default" : "outline"}
              className="cursor-pointer text-xs"
              onClick={() => setDifficultyFilter(difficulty)}
            >
              {difficulty}
            </Badge>
          ))}
        </div>
        <div className="flex items-center">
          <span className="text-xs text-muted-foreground">
            {filteredTrails.length} trails
          </span>
        </div>
      </div>
      <ScrollArea className="flex-1 min-h-0">
        <div className="px-3 py-3 space-y-2">
          {filteredTrails.map((trail) => (
            <div
              key={trail.slug}
              ref={(el) => {
                if (el) {
                  cardRefs.current.set(trail.slug, el);
                } else {
                  cardRefs.current.delete(trail.slug);
                }
              }}
            >
              <TrailCard
                trail={trail}
                isSelected={selectedTrail?.slug === trail.slug}
                onClick={() => onSelectTrail(trail)}
              />
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
