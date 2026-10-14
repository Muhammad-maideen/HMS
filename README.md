# HMS - Hotel & Restaurant Management System (AL RIZQ ELITE)

A modern full-stack Restaurant POS and Management System built with **React (Vite)** on the frontend and **Laravel 11 (PHP)** on the backend with **MySQL**.

## 🚀 Features
- **Point of Sale (POS) Simulator**: Fast order processing, cart management, and receipt/QR generation.
- **Table Management**: Real-time dining table layout, status tracking (Available, Occupied, Reserved).
- **Menu & Combos**: Rich category management, items, pricing variants, and combo deals.
- **Role-Based Access Control**: Multi-role support (Admin, Waiter, Cashier, Kitchen).
- **Responsive Modern UI**: Built with Tailwind CSS, Lucide icons, and sleek dark mode styling.

## 📁 Project Structure
- `frontend/` - React 19 + Vite + Tailwind CSS SPA
- `backend/` - Laravel 11 REST API with MySQL database

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18+)
- PHP (v8.2+) & Composer
- MySQL Server

### 1. Backend Setup
```bash
cd backend
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
