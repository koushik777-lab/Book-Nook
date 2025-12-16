import { motion } from "framer-motion";
import { BookCard } from "@/components/BookCard";
import { Skeleton } from "@/components/ui/skeleton";
import { BookX } from "lucide-react";
import type { BookWithDetails } from "@shared/schema";

interface BookGridProps {
  books: BookWithDetails[];
  isLoading?: boolean;
  bookmarkedIds?: string[];
  onBookmarkToggle?: (bookId: string) => void;
}

export function BookGrid({ books, isLoading = false, bookmarkedIds = [], onBookmarkToggle }: BookGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-[2/3] rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16 text-center"
      >
        <div className="rounded-full bg-muted p-6 mb-4">
          <BookX className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No books found</h3>
        <p className="text-muted-foreground max-w-md">
          We couldn't find any books matching your criteria. Try adjusting your filters or search terms.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {books.map((book, index) => (
        <BookCard
          key={book.id}
          book={book}
          index={index}
          isBookmarked={bookmarkedIds.includes(book.id)}
          onBookmarkToggle={onBookmarkToggle}
        />
      ))}
    </div>
  );
}
