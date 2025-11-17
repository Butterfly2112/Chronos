# Chronos Backend

> A time management and calendar application backend built with Node.js, Express, and MongoDB.

## 📑 Table of Contents

- [Technologies Used](#technologies-used)
- [Installation and Setup](#installation-and-setup)
- [Endpoints](#endpoints)
- [Error Responses](#error-responses)
- [Session Management](#session-management)
- [Used Practices](#used-practices)
- [Author](#author)

---

## Technologies Used

- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - database
- **Mongoose** - library to connect database and Node
- **bcrypt** - Password hashing
- **express-session** - Session management
- **nodemailer** - Email notifications

## Installation and Setup

### Prerequisites

- Node.js

### Installation Steps

1. **Clone the repository**

```bash
git clone https://github.com/Butterfly2112/Chronos.git
cd backend
```

2. **Install dependencies**

```bash
npm install
```

3. **Create .env file**

#### Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3000                    # Server port (default: 3000)
HOST=localhost               # Server host (default: localhost)
NODE_ENV=development         # Environment mode (development/production)

# Database
MONGO_URI=your_mongodb_uri   # MongoDB connection string (REQUIRED)

# Session
SESSION_SECRET=your_secret   # Session encryption key (REQUIRED)

# Email Service
EMAIL_USER=your@gmail.com    # Gmail address for nodemailer (REQUIRED)
EMAIL_PASS=app_password      # Gmail app password (REQUIRED)
HOST_FOR_EMAIL=localhost     # Host for email confirmation links
PORT_FOR_EMAIL=3000          # Port for email confirmation links
```

#### Important Notes:

- **MONGO_URI**: Get your connection string from [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- **EMAIL_USER & EMAIL_PASS**: Use Gmail App Password (not regular password)
  - Guide: [Create Gmail App Password](https://support.google.com/accounts/answer/185833)
- **SESSION_SECRET**: Use a strong random string (e.g., generate with `openssl rand -base64 32`)

#### Email Confirmation URL Format:

```
http://${HOST_FOR_EMAIL}:${PORT_FOR_EMAIL}/confirm-email?token=${token}
```

If frontend runs on different port, update `HOST_FOR_EMAIL` and `PORT_FOR_EMAIL` accordingly.

4. **Start the server**

```bash
npm start
```

Server will run on `http://localhost:3000` unless you changed post and host in .env file

## Endpoints

### Authentication Module

#### Register New User

```http
POST /api/auth/register
Content-type: application/json
{
    "login": "test_user",
    "username": "Test User",
    "password": "testPassword123",
    "confirm_password": "testPassword123",
    "email": "test@example.com"
}
```

**Response:** 201 Created

```json
{
  "success": true,
  "message": "User registered successfully. Please check your email.",
  "user": {
    "id": "6910e9440d42ff9e86ede7b5",
    "login": "test_user",
    "username": "Test User",
    "email": "test@example.com",
    "profilePicture": "uploads/default_avatar.svg",
    "role": "user"
  }
}
```

**Algorithm:**

1. Validate input data
2. Check if login/email already exists
3. Generate email confirmation token
4. Hash password with bcrypt
5. Save user to database with `email_confirmed: false`
6. Send confirmation email with token
7. Return success message

---

#### Confirm Email

```http
GET /api/auth/confirm-email?token={confirmation_token}
```

**Response:** 200 OK

```json
{
  "success": true,
  "message": "Email confirmed successfully"
}
```

**Algorithm:**

1. Check if token given
2. Find user by token
3. Set `email_confirmed: true`
4. Return success message

---

#### Send Email Token Again

```http
POST /api/auth/resend-confirmation
Content-type: application/json
{
    "email": "test@example.com"
}
```

**Response** 200 OK

```json
{
  "success": true,
  "message": "Confirmation email sent"
}
```

**Algorithm:**

1. Find user by email
2. Check if user haven't already confirmed this email
3. Generate new email confirmation token
4. Send confirmation email with token
5. Return success message

---

#### Login

```http
POST /api/auth/login
Content-Type: application/json
{
    "identifier": "test_user",
    "password": "testPassword123"
}
OR
{
    "identifier": "test@example.com"
}
```

**Response:** 200 OK

```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "123userid123",
    "login": "test_user",
    "username": "Test User",
    "email": "test@example.com",
    "profilePicture": "uploads/default_avatar.svg",
    "role": "user"
  }
}
```

**Algorithm**

1. Find user by login or email written inside identifier
2. Compare password with hashed password
3. Check if email is confirmed
4. Create session with user data and save in database for 15 minutes
5. Return success message with user information

---

#### Logout

```http
POST /api/auth/logout
Authorization: Session cookie required
```

**Response:** 200 OK

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Algorithm:**

1. Check if user is logged in
2. Destroy session
3. Return success message

---

#### Get current user information

```http
GET /api/auth/me
Authorization: Session cookie required
```

**Response:** 200 OK

```json
{
  "success": true,
  "user": {
    "id": "123userid123",
    "login": "test_user",
    "username": "Test User",
    "email": "test@example.com",
    "profilePicture": "uploads/default_avatar.svg",
    "role": "user"
  }
}
```

**Algorithm:**

1. Check if user is logged in
2. Return success message with current session information

---

#### Password reset request

```http
POST /api/auth/request-password-reset
Content-Type: application/json
{
  "email": "test@example.com"
}
```

**Response:** 200 OK

```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

**Algorithm:**

1. Check if user with given email exists
2. Generate password reset token
3. Save token to database with it's expiration in 15 minutes
4. Send email with token
5. Return success message

---

#### Token info (For debuging on backend)

```http
GET /api/auth/reset-password?token={password_reset_token}
```

**Response:** 200 OK

```json
{
  "success": true,
  "message": "Put this request: /api/auth/reset-password and put this token in this request body",
  "token": "1234abcd1234"
}
```

**Algorithm:**

1. Check if token given
2. Return success message with instructions and token

---

#### Reset Password

```http
POST api/auth/reset-password
Content-Type: application/json
{
  "token": "1234abcd1234"
  "password": "testPassword123",
  "confirm_password": "testPassword123"
}
```

**Response:** 200 OK

```json
{
  "success": true,
  "message": "Password has been reset successfully"
}
```

**Algorithm:**

1. Validate input data
2. Find user by given token
3. Check if token expired
4. Save new password to database
5. Return success message

---

### User module

#### Update profile

```http
PUT api/user/profile
Authorization: Session cookie required
Content-Type: application/json
{
  "username": "test Test"
  "email": "newtest@example.com"
}
```

**Response:** 200 OK

```json
{
  "success": true,
  "message": "Profile updated successfully.",
  "user": {
    "id": "123userid123",
    "login": "test_user",
    "username": "Test User",
    "email": "test@example.com",
    "profilePicture": "uploads/default_avatar.svg",
    "role": "user",
    "emailConfirmed": true
  }
}
```

**Algorithm:**

1. Check if user logged in
2. Validate input data
3. If `username` is in the request body: change username and sva to the database
4. If `email` is in the request body:
   4.1 Check if email is not taken yet
   4.2 Generate new email confirmation token
   4.3 Set `email_confirmed: false`
   4.4 Send confirmation email with token
5. Return success message with updated user info

---

## To be continued...

---

## Error Responses

All errors follow this format:

```json
{
  "status": "error",
  "message": "Error description here"
}
```

### Common Error Codes:

| Code  | Description                                            |
| ----- | ------------------------------------------------------ |
| `400` | Bad Request - Invalid input data                       |
| `401` | Unauthorized - Authentication required                 |
| `403` | Forbidden - No permission                              |
| `404` | Not Found - Resource doesn't exist                     |
| `409` | Conflict - Duplicate data (e.g., email already exists) |
| `500` | Internal Server Error                                  |

### Example Error Response:

```json
{
  "status": "error",
  "message": "Email already in use"
}
```

---

### Session Management

- Storage: MongoDB(via connect-mongo)
- Duration: 15 minutes
- Cookie Options:
  -- httpOnly: true - Prevents XSS attacks
  -- sameSite: 'lax'- CSRF protection
  -- secure: true - HTTPS only (production)

#### Session Contains:

```json
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "login": "johndoe",
    "username": "John Doe",
    "email": "john@example.com",
    "profilePicture": "uploads/default_avatar.svg",
    "role": "user"
  }
}
```

---

## Used Practices

- **MVC Pattern**: Clear separation of concerns
- **SOLID Principles**: Maintainable, extensible code
- **Password Security**: bcrypt hashing with salt
- **Email Verification**: Nodemailer integration
- **Session Management**: Express-session
- **Error Handling**: Comprehensive error responses
- **Input Validation**: Server-side validation

---

## Author

This is an educational team project for Innovation Campus NTU "KhPI", FullStack Track Challenge.

### Team Members:

- Anastasiia Shyrkova
- Diana Malashta - Backend
- Kateryna Lytovchenko
