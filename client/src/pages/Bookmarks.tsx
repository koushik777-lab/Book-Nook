import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Bookmark, BookX } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { BookGrid } from "@/components/BookGrid";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Link, Redirect } from "wouter";
import type { BookWithDetails, Bookmark as BookmarkType } from "@shared/schema";

export default function Bookmarks() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: bookmarks = [], isLoading: loadingBookmarks } = useQuery<BookmarkType[]>({
    queryKey: ["/api/bookmarks"],
    enabled: !!user,
  });

  const { data: allBooks = [] } = useQuery<BookWithDetails[]>({
    queryKey: ["/api/books"],
    enabled: !!user,
  });

  const bookmarkMutation = useMutation({
    mutationFn: async (bookId: string) => {
      await apiRequest("DELETE", `/api/bookmarks/${bookId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
      toast({
        title: "Bookmark Removed",
        description: "Book removed from your bookmarks",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!user) {
    return <Redirect to="/login" />;
  }

  const bookmarkedBooks = allBooks.filter((book) =>
    bookmarks.some((b) => b.bookId === book.id)
  );
  const bookmarkedIds = bookmarks.map((b) => b.bookId);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <Bookmark className="h-7 w-7 text-primary" />
            <h1 className="text-3xl font-bold">My Bookmarks</h1>
          </div>
          <p className="text-muted-foreground">
            Your saved books for later reading
          </p>
        </motion.div>

        {loadingBookmarks ? (
          <BookGrid books={[]} isLoading={true} />
        ) : bookmarkedBooks.length > 0 ? (
          <BookGrid
            books={bookmarkedBooks}
            bookmarkedIds={bookmarkedIds}
            onBookmarkToggle={(bookId) => bookmarkMutation.mutate(bookId)}
          />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="rounded-full bg-muted p-6 mb-4">
              <BookX className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No bookmarks yet</h3>
            <p className="text-muted-foreground max-w-md mb-6">
              Start exploring our library and bookmark books you want to read later.
            </p>
            <Button asChild>
              <Link href="/books">Browse Books</Link>
            </Button>
          </motion.div>
        )}
      </main>
    </div>
  );
}
