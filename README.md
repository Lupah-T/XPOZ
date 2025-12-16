# X-POZ 🌐

> An anonymous social networking platform with real-time messaging, group chats, and community engagement features.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v18+-blue.svg)](https://reactjs.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-v4+-black.svg)](https://socket.io/)

## ✨ Features

### 🔐 User Management
- Anonymous pseudonym-based accounts
- Secure JWT authentication
- User profiles with avatars
- Follow/unfollow system

### 💬 Messaging
- **Real-time Group Chat** - WhatsApp-style messaging with Socket.io
- **Chat List** - Unified view of all conversations with unread counts
- **Online Status** - See who's online in real-time
- **Typing Indicators** - Know when someone is typing

### 👥 Groups & Communities
- Create and join interest-based groups
- Group invitations system
- Admin member management
- Group discovery

### 📱 Posts & Engagement
- Create anonymous posts/reports
- Like and comment system
- Nested replies
- Delete your own posts
- Image upload support

### 📱 Mobile-First Design
- Responsive UI that works on all devices
- X (Twitter)-style bottom navigation on mobile
- Touch-optimized interface
- Progressive Web App ready

### 🛡️ Admin Dashboard
- Content moderation
- User management
- Analytics and insights

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- MongoDB (local or Atlas)
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Lupah-T/XPOZ.git
cd XPOZ
```

2. **Install dependencies**
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

3. **Set up environment variables**

Create `.env` in the `server` directory:
```env
MONGO_URI=mongodb://localhost:27017/anonymous_reporting
JWT_SECRET=your_super_secret_jwt_key_here
PORT=5000
```

Create `.env` in the `client` directory:
```env
VITE_API_URL=http://localhost:5000
```

4. **Start the development servers**

Terminal 1 - Backend:
```bash
cd server
npm start
```

Terminal 2 - Frontend:
```bash
cd client
npm run dev
```

5. **Open the app**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## 🏗️ Tech Stack

### Backend
- **Runtime**: Node.js + Express
- **Database**: MongoDB + Mongoose
- **Real-time**: Socket.io
- **Authentication**: JWT
- **File Upload**: Multer

### Frontend
- **Framework**: React 18
- **Routing**: React Router v6
- **Styling**: Vanilla CSS (Glass morphism design)
- **Real-time**: Socket.io Client
- **Build Tool**: Vite

## 📂 Project Structure

```
XPOZ/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React Context (Auth)
│   │   └── socket.js      # Socket.io client
│   └── package.json
│
├── server/                # Node.js backend
│   ├── models/           # Mongoose schemas
│   ├── routes/           # Express routes
│   ├── middleware/       # Auth & validation
│   ├── uploads/          # User uploads
│   └── server.js         # Entry point
│
├── README.md
├── CONTRIBUTING.md
└── LICENSE
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Quick Contribution Steps
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🗺️ Roadmap

### Current Features
- ✅ Real-time group chat
- ✅ Online status tracking
- ✅ Mobile-responsive design
- ✅ Post deletion
- ✅ Group invitations

### Planned Features
- [ ] Direct Messaging (1-on-1 DMs)
- [ ] Push notifications
- [ ] Message reactions
- [ ] File sharing in chats
- [ ] Voice/Video calls (WebRTC)
- [ ] End-to-end encryption
- [ ] Dark/Light theme toggle
- [ ] Multi-language support

## 📸 Screenshots

_Coming soon - Contributors welcome to add screenshots!_

## 🐛 Bug Reports & Feature Requests

Found a bug or have a feature request? Please open an issue on [GitHub Issues](https://github.com/Lupah-T/XPOZ/issues).

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👏 Acknowledgments

- Socket.io for real-time communication
- MongoDB for flexible data storage
- React community for amazing tools
- All contributors who help improve this project

## 📧 Contact

Project Link: [https://github.com/Lupah-T/XPOZ](https://github.com/Lupah-T/XPOZ)

---

**Made with ❤️ by the X-POZ community**
