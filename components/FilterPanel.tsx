"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Filter, Palette } from "lucide-react";

export type ColorMode = "difficulty" | "status";

interface FilterPanelProps {
  // Filter values (arrays for multi-select)
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
  selectedStatuses: string[];
  onStatusesChange: (statuses: string[]) => void;
  selectedDifficulties: string[];
  onDifficultiesChange: (difficulties: string[]) => void;
  // Display options
  colorMode: ColorMode;
  onColorModeChange: (mode: ColorMode) => void;
  // Stats
  filteredCount: number;
  totalCount: number;
}

const categories = [
  "Enduro",
  "All Mountain",
  "Cross Country",
  "eMTB",
  "Gravel",
  "LBL",
];

const statusOptions = ["Open", "Closed"];
const difficultyOptions = ["Easy", "Moderate", "Difficult"];

function toggleSelection(current: string[], value: string, allOptions: string[]): string[] {
  if (current.includes(value)) {
    // Remove it
    const newSelection = current.filter((v) => v !== value);
    // If nothing selected, return all (no filter)
    return newSelection.length === 0 ? [] : newSelection;
  } else {
    // Add it
    return [...current, value];
  }
}

function isAllSelected(current: string[], allOptions: string[]): boolean {
  return current.length === 0 || current.length === allOptions.length;
}

export function FilterPanel({
  selectedCategories,
  onCategoriesChange,
  selectedStatuses,
  onStatusesChange,
  selectedDifficulties,
  onDifficultiesChange,
  colorMode,
  onColorModeChange,
  filteredCount,
  totalCount,
}: FilterPanelProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [isDisplayOpen, setIsDisplayOpen] = useState(true);

  const handleCategoryClick = (cat: string) => {
    onCategoriesChange(toggleSelection(selectedCategories, cat, categories));
  };

  const handleStatusClick = (status: string) => {
    onStatusesChange(toggleSelection(selectedStatuses, status, statusOptions));
  };

  const handleDifficultyClick = (difficulty: string) => {
    onDifficultiesChange(toggleSelection(selectedDifficulties, difficulty, difficultyOptions));
  };

  const handleAllCategories = () => {
    onCategoriesChange([]);
  };

  const handleAllStatuses = () => {
    onStatusesChange([]);
  };

  const handleAllDifficulties = () => {
    onDifficultiesChange([]);
  };

  return (
    <div className="bg-white border rounded-lg shadow-sm">
      {/* Filter Section */}
      <div className="border-b">
        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters</span>
            <span className="text-xs text-muted-foreground">
              ({filteredCount}/{totalCount})
            </span>
          </div>
          {isFilterOpen ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {isFilterOpen && (
          <div className="px-3 pb-3 space-y-3">
            {/* Difficulty Filter */}
            <div>
              <span className="text-xs text-muted-foreground block mb-1.5">
                Difficulty
              </span>
              <div className="flex flex-wrap gap-1">
                <Badge
                  variant={isAllSelected(selectedDifficulties, difficultyOptions) ? "default" : "outline"}
                  className="cursor-pointer text-xs"
                  onClick={handleAllDifficulties}
                >
                  All
                </Badge>
                {difficultyOptions.map((difficulty) => (
                  <Badge
                    key={difficulty}
                    variant={selectedDifficulties.includes(difficulty) ? "default" : "outline"}
                    className="cursor-pointer text-xs"
                    onClick={() => handleDifficultyClick(difficulty)}
                  >
                    {difficulty}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Type/Category Filter */}
            <div>
              <span className="text-xs text-muted-foreground block mb-1.5">
                Trail Type
              </span>
              <div className="flex flex-wrap gap-1">
                <Badge
                  variant={isAllSelected(selectedCategories, categories) ? "default" : "outline"}
                  className="cursor-pointer text-xs"
                  onClick={handleAllCategories}
                >
                  All
                </Badge>
                {categories.map((cat) => (
                  <Badge
                    key={cat}
                    variant={selectedCategories.includes(cat) ? "default" : "outline"}
                    className="cursor-pointer text-xs"
                    onClick={() => handleCategoryClick(cat)}
                  >
                    {cat}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <span className="text-xs text-muted-foreground block mb-1.5">
                Status
              </span>
              <div className="flex flex-wrap gap-1">
                <Badge
                  variant={isAllSelected(selectedStatuses, statusOptions) ? "default" : "outline"}
                  className="cursor-pointer text-xs"
                  onClick={handleAllStatuses}
                >
                  All
                </Badge>
                {statusOptions.map((status) => (
                  <Badge
                    key={status}
                    variant={selectedStatuses.includes(status) ? "default" : "outline"}
                    className="cursor-pointer text-xs"
                    onClick={() => handleStatusClick(status)}
                  >
                    {status}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Display Section */}
      <div>
        <button
          onClick={() => setIsDisplayOpen(!isDisplayOpen)}
          className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Display</span>
          </div>
          {isDisplayOpen ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {isDisplayOpen && (
          <div className="px-3 pb-3">
            <span className="text-xs text-muted-foreground block mb-1.5">
              Trail Coloring
            </span>
            <div className="flex gap-2">
              <Button
                variant={colorMode === "difficulty" ? "default" : "outline"}
                size="sm"
                className="text-xs h-7"
                onClick={() => onColorModeChange("difficulty")}
              >
                By Difficulty
              </Button>
              <Button
                variant={colorMode === "status" ? "default" : "outline"}
                size="sm"
                className="text-xs h-7"
                onClick={() => onColorModeChange("status")}
              >
                By Status
              </Button>
            </div>
            {colorMode === "difficulty" && (
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-green-500" />
                  Easy
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-blue-500" />
                  Moderate
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-red-500" />
                  Difficult
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-gray-400" />
                  Unknown
                </span>
              </div>
            )}
            {colorMode === "status" && (
              <div className="mt-2 flex gap-4 text-xs">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-green-500" />
                  Open
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-red-500" />
                  Closed
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
