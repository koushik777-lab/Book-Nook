
import axios from 'axios';

const API_URL = 'http://localhost:5001';
const ADMIN_EMAIL = "admin741777@gmail.com";
const ADMIN_PASSWORD = "Admin@741";

async function main() {
    try {
        // 1. Login
        console.log('Logging in...');
        const loginRes = await axios.post(`${API_URL}/api/auth/login`, {
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD
        });
        const token = loginRes.data.token;
        console.log('Logged in, token obtained.');

        const headers = { Authorization: `Bearer ${token}` };

        // 2. Create Category
        console.log('Creating category...');
        const catRes = await axios.post(`${API_URL}/api/admin/categories`, {
            name: 'Test Category',
            description: 'A test category'
        }, { headers });
        const categoryId = catRes.data.id;
        console.log('Category created:', categoryId);

        // 3. Create Book
        // We need to use FormData for file upload, according to the route
        // But axios handles object for JSON if content-type is set?
        // references: app.post("/api/admin/books", upload.fields(...)
        // so we need to send multipart/form-data.
        // For simplicity, I'll use a library or just construct it if possible.
        // Actually, simple way: use 'form-data' package or just use standard axios with FormData if running in node env.
        // Since I'm in node environment (tsx), I need 'form-data' package if I want to simulate multipart.
        // But I can try to skip files if they are optional?
        // Routes say: const files = req.files ...
        // Book creation requires title, author, description.
        // Schema says coverImage and bookFile are text (paths), nullable.

        console.log('Creating book with JSON...');
        const bookRes = await axios.post(`${API_URL}/api/admin/books`, {
            title: 'Test Book',
            author: 'Test Author',
            description: 'This is a test book description.',
            categoryId: categoryId
        }, {
            headers: headers
        });

        console.log('Book created:', bookRes.data);
        console.log(`Visit: http://localhost:5001/books/${bookRes.data.id}`);

    } catch (error: any) {
        console.error('Error:', error.response?.data || error.message);
    }
}

main();
