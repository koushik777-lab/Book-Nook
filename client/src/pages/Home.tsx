import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Users, Download, Star, TrendingUp, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Navigation } from "@/components/Navigation";
import { BookGrid } from "@/components/BookGrid";
import { useAuth } from "@/lib/auth";
import type { BookWithDetails } from "@shared/schema";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const { data: featuredBooks = [], isLoading: loadingFeatured } = useQuery<BookWithDetails[]>({
    queryKey: ["/api/books", { limit: 5, sort: "rating" }],
  });

  const { data: latestBooks = [], isLoading: loadingLatest } = useQuery<BookWithDetails[]>({
    queryKey: ["/api/books", { limit: 5, sort: "latest" }],
  });

  const { data: stats } = useQuery<{ books: number; users: number; downloads: number; reviews: number }>({
    queryKey: ["/api/stats"],
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/books?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container mx-auto px-4 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-3xl text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary"
            >
              <Sparkles className="h-4 w-4" />
              Your Digital Library Awaits
            </motion.div>

            <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              Discover Your Next
              <span className="block bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Great Read
              </span>
            </h1>

            <p className="mb-8 text-lg text-muted-foreground md:text-xl">
              Explore thousands of e-books across every genre. Download, read, and track your progress all in one place.
            </p>

            <form onSubmit={handleSearch} className="mx-auto mb-8 flex max-w-lg gap-2">
              <Input
                type="search"
                placeholder="Search books, authors, categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12"
                data-testid="input-hero-search"
              />
              <Button type="submit" size="lg" data-testid="button-hero-search">
                Search
              </Button>
            </form>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button asChild size="lg">
                <Link href="/books" data-testid="link-browse-all">
                  Browse Library
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              {!user && (
                <Button variant="outline" size="lg" asChild>
                  <Link href="/register" data-testid="link-get-started">
                    Get Started Free
                  </Link>
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {stats && (
        <section className="border-y bg-muted/30 py-8">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-4 md:grid-cols-4"
            >
              {[
                { icon: BookOpen, label: "Books", value: stats.books },
                { icon: Users, label: "Readers", value: stats.users },
                { icon: Download, label: "Downloads", value: stats.downloads },
                { icon: Star, label: "Reviews", value: stats.reviews },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <stat.icon className="mx-auto mb-2 h-6 w-6 text-primary" />
                  <p className="text-2xl font-bold md:text-3xl">{stat.value.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <TrendingUp className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Top Rated Books</h2>
            </div>
            <Button variant="ghost" asChild>
              <Link href="/books?sort=rating">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>

          <BookGrid books={featuredBooks} isLoading={loadingFeatured} />
        </div>
      </section>

      <section className="border-t bg-muted/20 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Recently Added</h2>
            </div>
            <Button variant="ghost" asChild>
              <Link href="/books?sort=latest">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>

          <BookGrid books={latestBooks} isLoading={loadingLatest} />
        </div>
      </section>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="font-semibold">KitabGhar</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Your digital library for unlimited reading
          </p>
        </div>
      </footer>
    </div>
  );
}
