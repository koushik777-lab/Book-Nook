import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Download,
  Bookmark,
  BookmarkCheck,
  ArrowLeft,
  FileText,
  Calendar,
  User as UserIcon,
  Tag,
  Loader2
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Navigation } from "@/components/Navigation";
import { StarRating } from "@/components/StarRating";
import { ReviewCard } from "@/components/ReviewCard";
import { ReviewForm } from "@/components/ReviewForm";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { BookWithDetails, ReviewWithUser, Bookmark as BookmarkType, ReadingProgress } from "@shared/schema";

export default function BookDetail() {
  const params = useParams();
  const bookId = params.id;
  const [, setLocation] = useLocation();
  const { user, token } = useAuth();
  const { toast } = useToast();

  const { data: book, isLoading: loadingBook } = useQuery<BookWithDetails>({
    queryKey: [`/api/books/${bookId}`],
    enabled: !!bookId,
  });

  const { data: reviews = [], isLoading: loadingReviews } = useQuery<ReviewWithUser[]>({
    queryKey: [`/api/books/${bookId}/reviews`],
    enabled: !!bookId,
  });

  const { data: bookmarks = [] } = useQuery<BookmarkType[]>({
    queryKey: ["/api/bookmarks"],
    enabled: !!user,
  });

  const { data: progress } = useQuery<ReadingProgress>({
    queryKey: [`/api/reading-progress/${bookId}`],
    enabled: !!user && !!bookId,
  });

  const isBookmarked = bookmarks.some((b) => b.bookId === bookId);

  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      if (isBookmarked) {
        await apiRequest("DELETE", `/api/bookmarks/${bookId}`);
      } else {
        await apiRequest("POST", "/api/bookmarks", { bookId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
      toast({
        title: isBookmarked ? "Bookmark Removed" : "Bookmarked!",
        description: isBookmarked
          ? "Book removed from your bookmarks"
          : "Book added to your bookmarks",
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

  const downloadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/books/${bookId}/download`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${book?.title || "book"}.${book?.fileType || "pdf"}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/books/${bookId}`] });
      toast({
        title: "Download Started",
        description: "Your book is being downloaded",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Download Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ rating, comment }: { rating: number; comment: string }) => {
      await apiRequest("POST", `/api/books/${bookId}/reviews`, { rating, comment });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/books/${bookId}/reviews`] });
      queryClient.invalidateQueries({ queryKey: [`/api/books/${bookId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      toast({
        title: "Review Submitted",
        description: "Thank you for your review!",
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

  const handleReviewSubmit = async (rating: number, comment: string) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to submit a review",
      });
      return;
    }
    await reviewMutation.mutateAsync({ rating, comment });
  };

  if (loadingBook) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="grid gap-8 md:grid-cols-[300px_1fr] lg:grid-cols-[350px_1fr]">
            <Skeleton className="aspect-[2/3] rounded-lg" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!book || !book.title) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Book Not Found</h1>
          <p className="text-muted-foreground mb-8">The book you're looking for doesn't exist.</p>
          <Button onClick={() => setLocation("/books")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Browse
          </Button>
        </main>
      </div>
    );
  }

  const hasUserReviewed = reviews.some((r) => r.userId === user?.id);
  const progressPercent = progress && progress.totalPages
    ? (progress.lastPage / progress.totalPages) * 100
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <Button variant="ghost" onClick={() => setLocation("/books")} data-testid="button-back">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Browse
          </Button>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-[300px_1fr] lg:grid-cols-[350px_1fr]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="overflow-hidden sticky top-24">
              <div className="aspect-[2/3] relative bg-muted">
                {book.coverImage ? (
                  <img
                    src={book.coverImage}
                    alt={book.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                    <span className="text-6xl font-bold text-primary/30">
                      {book?.title?.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
              <CardContent className="p-4 space-y-4">
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={() => downloadMutation.mutate()}
                    disabled={downloadMutation.isPending || !book.bookFile}
                    data-testid="button-download"
                  >
                    {downloadMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    Download
                  </Button>
                  {user && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => bookmarkMutation.mutate()}
                      disabled={bookmarkMutation.isPending}
                      data-testid="button-bookmark"
                    >
                      {isBookmarked ? (
                        <BookmarkCheck className="h-4 w-4 text-primary" />
                      ) : (
                        <Bookmark className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>

                {progress && progress.totalPages && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Reading Progress</span>
                      <span className="font-medium">{Math.round(progressPercent)}%</span>
                    </div>
                    <Progress value={progressPercent} />
                    <p className="text-xs text-muted-foreground text-center">
                      Page {progress.lastPage} of {progress.totalPages}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <div>
              <h1 className="text-3xl font-bold mb-2" data-testid="text-book-title">{book.title}</h1>
              <p className="text-xl text-muted-foreground mb-4">{book.author}</p>

              <div className="flex flex-wrap items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <StarRating rating={book.averageRating || 0} size="md" showValue />
                  <span className="text-sm text-muted-foreground">
                    ({book.reviewCount || 0} reviews)
                  </span>
                </div>
                {book.category && (
                  <Badge variant="secondary">
                    <Tag className="mr-1 h-3 w-3" />
                    {book.category.name}
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Download className="h-4 w-4" />
                  <span>{book.downloadCount.toLocaleString()} downloads</span>
                </div>
                <div className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  <span>{book.fileType?.toUpperCase() || "PDF"}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Added {formatDistanceToNow(new Date(book.createdAt), { addSuffix: true })}</span>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h2 className="text-lg font-semibold mb-3">Description</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {book.description}
              </p>
            </div>

            <Separator />

            <div>
              <h2 className="text-lg font-semibold mb-4">
                Reviews ({reviews.length})
              </h2>

              {user && !hasUserReviewed && (
                <div className="mb-6">
                  <ReviewForm
                    onSubmit={handleReviewSubmit}
                    isSubmitting={reviewMutation.isPending}
                  />
                </div>
              )}

              {loadingReviews ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review, index) => (
                    <ReviewCard key={review.id} review={review} index={index} />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
