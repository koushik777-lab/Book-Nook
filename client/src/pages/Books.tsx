import { useState, useMemo } from "react";
import { useSearch } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Navigation } from "@/components/Navigation";
import { BookGrid } from "@/components/BookGrid";
import { SearchFilter } from "@/components/SearchFilter";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { BookWithDetails, Category, Bookmark } from "@shared/schema";

export default function Books() {
  const searchParams = new URLSearchParams(useSearch());
  const initialSearch = searchParams.get("search") || "";
  const initialSort = searchParams.get("sort") || "latest";

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState(initialSort);
  const { user, token } = useAuth();
  const { toast } = useToast();

  const { data: books = [], isLoading: loadingBooks } = useQuery<BookWithDetails[]>({
    queryKey: ["/api/books"],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: bookmarks = [] } = useQuery<Bookmark[]>({
    queryKey: ["/api/bookmarks"],
    enabled: !!user,
  });

  const bookmarkMutation = useMutation({
    mutationFn: async (bookId: string) => {
      const isBookmarked = bookmarks.some((b) => b.bookId === bookId);
      if (isBookmarked) {
        await apiRequest("DELETE", `/api/bookmarks/${bookId}`);
      } else {
        await apiRequest("POST", "/api/bookmarks", { bookId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredBooks = useMemo(() => {
    let result = [...books];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (book) =>
          book.title.toLowerCase().includes(query) ||
          book.author.toLowerCase().includes(query) ||
          book.category?.name.toLowerCase().includes(query)
      );
    }

    if (selectedCategory !== "all") {
      result = result.filter((book) => book.categoryId === selectedCategory);
    }

    switch (sortBy) {
      case "rating":
        result.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
        break;
      case "downloads":
        result.sort((a, b) => b.downloadCount - a.downloadCount);
        break;
      case "title":
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "latest":
      default:
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    return result;
  }, [books, searchQuery, selectedCategory, sortBy]);

  const bookmarkedIds = bookmarks.map((b) => b.bookId);

  const handleBookmarkToggle = (bookId: string) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to bookmark books",
      });
      return;
    }
    bookmarkMutation.mutate(bookId);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-2">Browse Books</h1>
          <p className="text-muted-foreground">
            Discover your next favorite read from our collection of {books.length.toLocaleString()} books
          </p>
        </motion.div>

        <div className="mb-8">
          <SearchFilter
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            sortBy={sortBy}
            onSortChange={setSortBy}
            categories={categories}
          />
        </div>

        <div className="mb-4 text-sm text-muted-foreground">
          {filteredBooks.length} book{filteredBooks.length !== 1 ? "s" : ""} found
        </div>

        <BookGrid
          books={filteredBooks}
          isLoading={loadingBooks}
          bookmarkedIds={bookmarkedIds}
          onBookmarkToggle={handleBookmarkToggle}
        />
      </main>
    </div>
  );
}
