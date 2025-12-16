import { Link } from "wouter";
import { Download, Bookmark, BookmarkCheck } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/StarRating";
import type { BookWithDetails } from "@shared/schema";

interface BookCardProps {
  book: BookWithDetails;
  isBookmarked?: boolean;
  onBookmarkToggle?: (bookId: string) => void;
  index?: number;
}

export function BookCard({ book, isBookmarked = false, onBookmarkToggle, index = 0 }: BookCardProps) {
  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onBookmarkToggle) {
      onBookmarkToggle(book.id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Link href={`/books/${book.id}`}>
        <Card
          className="group relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg"
          data-testid={`card-book-${book.id}`}
        >
          <div className="aspect-[2/3] relative overflow-hidden bg-muted">
            {book.coverImage ? (
              <img
                src={book.coverImage}
                alt={book.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                <span className="text-4xl font-bold text-primary/30">
                  {book.title.charAt(0)}
                </span>
              </div>
            )}

            <motion.div
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            >
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="font-semibold text-white line-clamp-2 mb-1">
                  {book.title}
                </h3>
                <p className="text-sm text-white/80 mb-2">{book.author}</p>
                <div className="flex items-center gap-2">
                  <StarRating rating={book.averageRating || 0} size="sm" />
                  {book.reviewCount !== undefined && book.reviewCount > 0 && (
                    <span className="text-xs text-white/70">
                      ({book.reviewCount})
                    </span>
                  )}
                </div>
              </div>
            </motion.div>

            {onBookmarkToggle && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleBookmarkClick}
                className="absolute top-2 right-2 p-2 rounded-full bg-background/80 backdrop-blur-sm shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                data-testid={`button-bookmark-${book.id}`}
              >
                {isBookmarked ? (
                  <BookmarkCheck className="h-4 w-4 text-primary" />
                ) : (
                  <Bookmark className="h-4 w-4" />
                )}
              </motion.button>
            )}

            {book.category && (
              <Badge
                variant="secondary"
                className="absolute top-2 left-2 text-xs"
              >
                {book.category.name}
              </Badge>
            )}
          </div>

          <div className="p-3">
            <h3 className="font-medium line-clamp-1 group-hover:text-primary transition-colors">
              {book.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-1">
              {book.author}
            </p>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Download className="h-3 w-3" />
                <span>{book.downloadCount.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <StarRating rating={book.averageRating || 0} size="sm" />
              </div>
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}
