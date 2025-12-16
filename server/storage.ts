import {
  users,
  books,
  categories,
  reviews,
  bookmarks,
  readingProgress,
  downloads,
  type User,
  type InsertUser,
  type Book,
  type InsertBook,
  type Category,
  type InsertCategory,
  type Review,
  type InsertReview,
  type Bookmark,
  type InsertBookmark,
  type ReadingProgress,
  type InsertReadingProgress,
  type Download,
  type InsertDownload,
  type BookWithDetails,
  type ReviewWithUser,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, ilike, or } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserRole(id: string, role: string): Promise<User | undefined>;
  updateUserBlock(id: string, isBlocked: boolean): Promise<User | undefined>;

  getBook(id: string): Promise<BookWithDetails | undefined>;
  getAllBooks(params?: { limit?: number; sort?: string; search?: string; categoryId?: string }): Promise<BookWithDetails[]>;
  createBook(book: InsertBook): Promise<Book>;
  updateBook(id: string, book: Partial<InsertBook>): Promise<Book | undefined>;
  deleteBook(id: string): Promise<void>;
  incrementDownloadCount(id: string): Promise<void>;

  getCategory(id: string): Promise<Category | undefined>;
  getAllCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<void>;

  getReviewsByBook(bookId: string): Promise<ReviewWithUser[]>;
  createReview(review: InsertReview): Promise<Review>;
  getAllReviews(): Promise<Review[]>;

  getBookmarksByUser(userId: string): Promise<Bookmark[]>;
  createBookmark(bookmark: InsertBookmark): Promise<Bookmark>;
  deleteBookmark(userId: string, bookId: string): Promise<void>;
  isBookmarked(userId: string, bookId: string): Promise<boolean>;

  getReadingProgress(userId: string, bookId: string): Promise<ReadingProgress | undefined>;
  upsertReadingProgress(progress: InsertReadingProgress): Promise<ReadingProgress>;

  createDownload(download: InsertDownload): Promise<Download>;
  getAllDownloads(): Promise<Download[]>;

  getStats(): Promise<{ books: number; users: number; downloads: number; reviews: number }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUserRole(id: string, role: string): Promise<User | undefined> {
    const [user] = await db.update(users).set({ role }).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  async updateUserBlock(id: string, isBlocked: boolean): Promise<User | undefined> {
    const [user] = await db.update(users).set({ isBlocked }).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  async getBook(id: string): Promise<BookWithDetails | undefined> {
    const [book] = await db.select().from(books).where(eq(books.id, id));
    if (!book) return undefined;

    const category = book.categoryId
      ? await db.select().from(categories).where(eq(categories.id, book.categoryId)).then((r) => r[0])
      : null;

    const bookReviews = await db.select().from(reviews).where(eq(reviews.bookId, id));
    const averageRating = bookReviews.length > 0
      ? bookReviews.reduce((sum, r) => sum + r.rating, 0) / bookReviews.length
      : 0;

    return {
      ...book,
      category,
      averageRating,
      reviewCount: bookReviews.length,
    };
  }

  async getAllBooks(params?: { limit?: number; sort?: string; search?: string; categoryId?: string }): Promise<BookWithDetails[]> {
    let query = db.select().from(books);
    const allBooks = await query.orderBy(desc(books.createdAt));
    
    const allCategories = await db.select().from(categories);
    const categoryMap = new Map(allCategories.map((c) => [c.id, c]));

    const allReviews = await db.select().from(reviews);
    const reviewsByBook = new Map<string, typeof allReviews>();
    allReviews.forEach((r) => {
      const existing = reviewsByBook.get(r.bookId) || [];
      existing.push(r);
      reviewsByBook.set(r.bookId, existing);
    });

    let result: BookWithDetails[] = allBooks.map((book) => {
      const bookReviews = reviewsByBook.get(book.id) || [];
      const averageRating = bookReviews.length > 0
        ? bookReviews.reduce((sum, r) => sum + r.rating, 0) / bookReviews.length
        : 0;

      return {
        ...book,
        category: book.categoryId ? categoryMap.get(book.categoryId) || null : null,
        averageRating,
        reviewCount: bookReviews.length,
      };
    });

    if (params?.search) {
      const search = params.search.toLowerCase();
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(search) ||
          b.author.toLowerCase().includes(search)
      );
    }

    if (params?.categoryId && params.categoryId !== "all") {
      result = result.filter((b) => b.categoryId === params.categoryId);
    }

    if (params?.sort === "rating") {
      result.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
    } else if (params?.sort === "downloads") {
      result.sort((a, b) => b.downloadCount - a.downloadCount);
    }

    if (params?.limit) {
      result = result.slice(0, params.limit);
    }

    return result;
  }

  async createBook(book: InsertBook): Promise<Book> {
    const [created] = await db.insert(books).values(book).returning();
    return created;
  }

  async updateBook(id: string, book: Partial<InsertBook>): Promise<Book | undefined> {
    const [updated] = await db.update(books).set(book).where(eq(books.id, id)).returning();
    return updated || undefined;
  }

  async deleteBook(id: string): Promise<void> {
    await db.delete(books).where(eq(books.id, id));
  }

  async incrementDownloadCount(id: string): Promise<void> {
    await db.update(books).set({ downloadCount: sql`${books.downloadCount} + 1` }).where(eq(books.id, id));
  }

  async getCategory(id: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category || undefined;
  }

  async getAllCategories(): Promise<Category[]> {
    return db.select().from(categories);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [created] = await db.insert(categories).values(category).returning();
    return created;
  }

  async updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const [updated] = await db.update(categories).set(category).where(eq(categories.id, id)).returning();
    return updated || undefined;
  }

  async deleteCategory(id: string): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }

  async getReviewsByBook(bookId: string): Promise<ReviewWithUser[]> {
    const bookReviews = await db.select().from(reviews).where(eq(reviews.bookId, bookId)).orderBy(desc(reviews.createdAt));
    
    const result: ReviewWithUser[] = [];
    for (const review of bookReviews) {
      const [user] = await db.select().from(users).where(eq(users.id, review.userId));
      if (user) {
        result.push({
          ...review,
          user: { id: user.id, name: user.name, email: user.email },
        });
      }
    }
    return result;
  }

  async createReview(review: InsertReview): Promise<Review> {
    const [created] = await db.insert(reviews).values(review).returning();
    return created;
  }

  async getAllReviews(): Promise<Review[]> {
    return db.select().from(reviews).orderBy(desc(reviews.createdAt));
  }

  async getBookmarksByUser(userId: string): Promise<Bookmark[]> {
    return db.select().from(bookmarks).where(eq(bookmarks.userId, userId)).orderBy(desc(bookmarks.createdAt));
  }

  async createBookmark(bookmark: InsertBookmark): Promise<Bookmark> {
    const [created] = await db.insert(bookmarks).values(bookmark).returning();
    return created;
  }

  async deleteBookmark(userId: string, bookId: string): Promise<void> {
    await db.delete(bookmarks).where(and(eq(bookmarks.userId, userId), eq(bookmarks.bookId, bookId)));
  }

  async isBookmarked(userId: string, bookId: string): Promise<boolean> {
    const [bookmark] = await db.select().from(bookmarks).where(and(eq(bookmarks.userId, userId), eq(bookmarks.bookId, bookId)));
    return !!bookmark;
  }

  async getReadingProgress(userId: string, bookId: string): Promise<ReadingProgress | undefined> {
    const [progress] = await db.select().from(readingProgress).where(and(eq(readingProgress.userId, userId), eq(readingProgress.bookId, bookId)));
    return progress || undefined;
  }

  async upsertReadingProgress(progress: InsertReadingProgress): Promise<ReadingProgress> {
    const existing = await this.getReadingProgress(progress.userId, progress.bookId);
    if (existing) {
      const [updated] = await db.update(readingProgress)
        .set({ lastPage: progress.lastPage, totalPages: progress.totalPages, updatedAt: new Date() })
        .where(eq(readingProgress.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(readingProgress).values(progress).returning();
    return created;
  }

  async createDownload(download: InsertDownload): Promise<Download> {
    const [created] = await db.insert(downloads).values(download).returning();
    return created;
  }

  async getAllDownloads(): Promise<Download[]> {
    return db.select().from(downloads).orderBy(desc(downloads.downloadedAt));
  }

  async getStats(): Promise<{ books: number; users: number; downloads: number; reviews: number }> {
    const [bookCount] = await db.select({ count: sql<number>`count(*)` }).from(books);
    const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
    const [downloadCount] = await db.select({ count: sql<number>`count(*)` }).from(downloads);
    const [reviewCount] = await db.select({ count: sql<number>`count(*)` }).from(reviews);

    return {
      books: Number(bookCount?.count || 0),
      users: Number(userCount?.count || 0),
      downloads: Number(downloadCount?.count || 0),
      reviews: Number(reviewCount?.count || 0),
    };
  }
}

export const storage = new DatabaseStorage();
