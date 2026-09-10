"use client";

import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";

export function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages = getPageWindow(page, totalPages);

  return (
    <div className="sticky bottom-0 flex items-center justify-end gap-1 border-t border-slate-200 bg-white px-6 py-3">
      <Button
        variant="ghost"
        size="icon"
        disabled={page === 1}
        onClick={() => onPageChange(1)}
        aria-label="First page"
      >
        <ChevronsLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft className="h-4 w-4" />
        Previous
      </Button>
      {pages.map((p, idx) =>
        p === "ellipsis" ? (
          <span key={`ellipsis-${idx}`} className="px-2 text-sm text-slate-400">
            …
          </span>
        ) : (
          <Button
            key={p}
            variant={p === page ? "outline" : "ghost"}
            size="icon"
            onClick={() => onPageChange(p)}
            className={cn(
              p === page && "border-slate-200 bg-white font-semibold"
            )}
          >
            {p}
          </Button>
        )
      )}
      <Button
        variant="ghost"
        size="sm"
        disabled={page === totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        disabled={page === totalPages}
        onClick={() => onPageChange(totalPages)}
        aria-label="Last page"
      >
        <ChevronsRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

function getPageWindow(page: number, totalPages: number): (number | "ellipsis")[] {
  const siblingCount = 1;
  const totalNumbers = siblingCount * 2 + 5;

  if (totalPages <= totalNumbers) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const leftIndex = Math.max(page - siblingCount, 1);
  const rightIndex = Math.min(page + siblingCount, totalPages);
  const showLeftEllipsis = leftIndex > 2;
  const showRightEllipsis = rightIndex < totalPages - 1;

  const result: (number | "ellipsis")[] = [1];
  if (showLeftEllipsis) result.push("ellipsis");
  for (let i = leftIndex; i <= rightIndex; i++) {
    if (i !== 1 && i !== totalPages) result.push(i);
  }
  if (showRightEllipsis) result.push("ellipsis");
  result.push(totalPages);
  return result;
}
