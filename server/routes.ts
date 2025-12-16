import type { Express, Request, Response, NextFunction } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import fs from "fs";

const JWT_SECRET = process.env.SESSION_SECRET || "kitabghar-secret-key";
const ADMIN_EMAIL = "admin741777@gmail.com";
const ADMIN_PASSWORD = "Admin@741";

const uploadDir = path.join(process.cwd(), "uploads");
const coversDir = path.join(uploadDir, "covers");
const booksDir = path.join(uploadDir, "books");

[uploadDir, coversDir, booksDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const coverStorage = multer.diskStorage({
  destination: coversDir,
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const bookStorage = multer.diskStorage({
  destination: booksDir,
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, file.fieldname === "cover" ? coversDir : booksDir);
    },
    filename: (req, file, cb) => {
      const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    },
  }),
  limits: { fileSize: 50 * 1024 * 1024 },
});

interface AuthRequest extends Request {
  user?: { id: string; email: string; role: string };
}

function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ message: "Invalid token" });
    }
    req.user = user;
    next();
  });
}

function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (token) {
    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (!err) {
        req.user = user;
      }
      next();
    });
  } else {
    next();
  }
}

function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.use("/uploads", (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    next();
  }, express.static(uploadDir));

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ message: "All fields are required" });
      }

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.createUser({
        name,
        email,
        password: hashedPassword,
        role: "user",
        isBlocked: false,
      });

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      const { password: _, ...userWithoutPassword } = user;
      res.json({ token, user: userWithoutPassword });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        let adminUser = await storage.getUserByEmail(ADMIN_EMAIL);
        
        if (!adminUser) {
          const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
          adminUser = await storage.createUser({
            name: "Admin",
            email: ADMIN_EMAIL,
            password: hashedPassword,
            role: "admin",
            isBlocked: false,
          });
        } else if (adminUser.role !== "admin") {
          await storage.updateUserRole(adminUser.id, "admin");
          adminUser = { ...adminUser, role: "admin" };
        }

        const token = jwt.sign(
          { id: adminUser.id, email: adminUser.email, role: "admin" },
          JWT_SECRET,
          { expiresIn: "7d" }
        );

        const { password: _, ...userWithoutPassword } = adminUser;
        return res.json({ token, user: { ...userWithoutPassword, role: "admin" } });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      if (user.isBlocked) {
        return res.status(403).json({ message: "Your account has been blocked" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      const { password: _, ...userWithoutPassword } = user;
      res.json({ token, user: userWithoutPassword });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Stats error:", error);
      res.status(500).json({ message: "Failed to get stats" });
    }
  });

  app.get("/api/books", async (req, res) => {
    try {
      const { limit, sort, search, categoryId } = req.query;
      const books = await storage.getAllBooks({
        limit: limit ? parseInt(limit as string) : undefined,
        sort: sort as string,
        search: search as string,
        categoryId: categoryId as string,
      });
      res.json(books);
    } catch (error) {
      console.error("Get books error:", error);
      res.status(500).json({ message: "Failed to get books" });
    }
  });

  app.get("/api/books/:id", async (req, res) => {
    try {
      const book = await storage.getBook(req.params.id);
      if (!book) {
        return res.status(404).json({ message: "Book not found" });
      }
      res.json(book);
    } catch (error) {
      console.error("Get book error:", error);
      res.status(500).json({ message: "Failed to get book" });
    }
  });

  app.get("/api/books/:id/reviews", async (req, res) => {
    try {
      const reviews = await storage.getReviewsByBook(req.params.id);
      res.json(reviews);
    } catch (error) {
      console.error("Get reviews error:", error);
      res.status(500).json({ message: "Failed to get reviews" });
    }
  });

  app.post("/api/books/:id/reviews", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { rating, comment } = req.body;
      
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Rating must be between 1 and 5" });
      }

      const review = await storage.createReview({
        bookId: req.params.id,
        userId: req.user!.id,
        rating,
        comment: comment || null,
      });
      res.json(review);
    } catch (error) {
      console.error("Create review error:", error);
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  app.get("/api/books/:id/download", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const book = await storage.getBook(req.params.id);
      if (!book || !book.bookFile) {
        return res.status(404).json({ message: "Book file not found" });
      }

      await storage.incrementDownloadCount(book.id);
      await storage.createDownload({
        bookId: book.id,
        userId: req.user?.id || null,
      });

      const filePath = path.join(booksDir, path.basename(book.bookFile));
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "Book file not found on server" });
      }

      res.download(filePath, `${book.title}.${book.fileType || "pdf"}`);
    } catch (error) {
      console.error("Download error:", error);
      res.status(500).json({ message: "Download failed" });
    }
  });

  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error) {
      console.error("Get categories error:", error);
      res.status(500).json({ message: "Failed to get categories" });
    }
  });

  app.get("/api/bookmarks", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const bookmarks = await storage.getBookmarksByUser(req.user!.id);
      res.json(bookmarks);
    } catch (error) {
      console.error("Get bookmarks error:", error);
      res.status(500).json({ message: "Failed to get bookmarks" });
    }
  });

  app.post("/api/bookmarks", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { bookId } = req.body;
      
      const isAlreadyBookmarked = await storage.isBookmarked(req.user!.id, bookId);
      if (isAlreadyBookmarked) {
        return res.status(400).json({ message: "Book already bookmarked" });
      }

      const bookmark = await storage.createBookmark({
        userId: req.user!.id,
        bookId,
      });
      res.json(bookmark);
    } catch (error) {
      console.error("Create bookmark error:", error);
      res.status(500).json({ message: "Failed to create bookmark" });
    }
  });

  app.delete("/api/bookmarks/:bookId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      await storage.deleteBookmark(req.user!.id, req.params.bookId);
      res.json({ message: "Bookmark removed" });
    } catch (error) {
      console.error("Delete bookmark error:", error);
      res.status(500).json({ message: "Failed to remove bookmark" });
    }
  });

  app.get("/api/reading-progress/:bookId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const progress = await storage.getReadingProgress(req.user!.id, req.params.bookId);
      res.json(progress || null);
    } catch (error) {
      console.error("Get reading progress error:", error);
      res.status(500).json({ message: "Failed to get reading progress" });
    }
  });

  app.post("/api/reading-progress", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { bookId, lastPage, totalPages } = req.body;
      const progress = await storage.upsertReadingProgress({
        userId: req.user!.id,
        bookId,
        lastPage,
        totalPages,
      });
      res.json(progress);
    } catch (error) {
      console.error("Update reading progress error:", error);
      res.status(500).json({ message: "Failed to update reading progress" });
    }
  });

  app.get("/api/admin/users", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users.map(({ password, ...user }) => user));
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ message: "Failed to get users" });
    }
  });

  app.patch("/api/admin/users/:id/role", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { role } = req.body;
      if (!["user", "admin"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      const user = await storage.updateUserRole(req.params.id, role);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Update role error:", error);
      res.status(500).json({ message: "Failed to update role" });
    }
  });

  app.patch("/api/admin/users/:id/block", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { isBlocked } = req.body;
      const user = await storage.updateUserBlock(req.params.id, isBlocked);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Block user error:", error);
      res.status(500).json({ message: "Failed to update user status" });
    }
  });

  app.get("/api/admin/downloads", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const downloads = await storage.getAllDownloads();
      res.json(downloads);
    } catch (error) {
      console.error("Get downloads error:", error);
      res.status(500).json({ message: "Failed to get downloads" });
    }
  });

  app.get("/api/admin/reviews", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const reviews = await storage.getAllReviews();
      res.json(reviews);
    } catch (error) {
      console.error("Get reviews error:", error);
      res.status(500).json({ message: "Failed to get reviews" });
    }
  });

  app.post("/api/admin/books", authenticateToken, requireAdmin, upload.fields([
    { name: "cover", maxCount: 1 },
    { name: "book", maxCount: 1 },
  ]), async (req: AuthRequest, res) => {
    try {
      const { title, author, description, categoryId } = req.body;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      const coverImage = files?.cover?.[0] ? `/uploads/covers/${files.cover[0].filename}` : null;
      const bookFile = files?.book?.[0] ? `/uploads/books/${files.book[0].filename}` : null;
      const fileType = files?.book?.[0] ? path.extname(files.book[0].originalname).slice(1).toLowerCase() : null;

      const book = await storage.createBook({
        title,
        author,
        description,
        categoryId: categoryId || null,
        coverImage,
        bookFile,
        fileType,
      });

      res.json(book);
    } catch (error) {
      console.error("Create book error:", error);
      res.status(500).json({ message: "Failed to create book" });
    }
  });

  app.patch("/api/admin/books/:id", authenticateToken, requireAdmin, upload.fields([
    { name: "cover", maxCount: 1 },
    { name: "book", maxCount: 1 },
  ]), async (req: AuthRequest, res) => {
    try {
      const { title, author, description, categoryId } = req.body;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      const updateData: any = { title, author, description, categoryId: categoryId || null };

      if (files?.cover?.[0]) {
        updateData.coverImage = `/uploads/covers/${files.cover[0].filename}`;
      }
      if (files?.book?.[0]) {
        updateData.bookFile = `/uploads/books/${files.book[0].filename}`;
        updateData.fileType = path.extname(files.book[0].originalname).slice(1).toLowerCase();
      }

      const book = await storage.updateBook(req.params.id, updateData);
      if (!book) {
        return res.status(404).json({ message: "Book not found" });
      }

      res.json(book);
    } catch (error) {
      console.error("Update book error:", error);
      res.status(500).json({ message: "Failed to update book" });
    }
  });

  app.delete("/api/admin/books/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      await storage.deleteBook(req.params.id);
      res.json({ message: "Book deleted" });
    } catch (error) {
      console.error("Delete book error:", error);
      res.status(500).json({ message: "Failed to delete book" });
    }
  });

  app.post("/api/admin/categories", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { name, description } = req.body;
      const category = await storage.createCategory({ name, description });
      res.json(category);
    } catch (error) {
      console.error("Create category error:", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  app.patch("/api/admin/categories/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { name, description } = req.body;
      const category = await storage.updateCategory(req.params.id, { name, description });
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error("Update category error:", error);
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  app.delete("/api/admin/categories/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      await storage.deleteCategory(req.params.id);
      res.json({ message: "Category deleted" });
    } catch (error) {
      console.error("Delete category error:", error);
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  return httpServer;
}
