# Contributing to X-POZ

First off, thank you for considering contributing to X-POZ! 🎉

## Table of Contents
- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Coding Guidelines](#coding-guidelines)
- [Commit Message Guidelines](#commit-message-guidelines)

## Code of Conduct

This project follows a simple code of conduct:
- Be respectful and inclusive
- Provide constructive feedback
- Focus on what's best for the community
- Show empathy towards others

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues. When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce** the issue
- **Expected behavior** vs actual behavior
- **Screenshots** if applicable
- **Environment details** (OS, Node version, browser)

### Suggesting Features

Feature suggestions are welcome! Please:
- Check if the feature has already been suggested
- Provide clear use cases
- Explain why this feature would be useful
- Include mockups or examples if applicable

### Code Contributions

1. **Find an issue** to work on or create one
2. **Comment** on the issue to claim it
3. **Fork** the repository
4. **Create a branch** for your feature
5. **Make your changes**
6. **Test thoroughly**
7. **Submit a pull request**

## Development Setup

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Git

### Setup Steps

1. **Fork and clone**
```bash
git clone https://github.com/YOUR_USERNAME/XPOZ.git
cd XPOZ
```

2. **Install dependencies**
```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

3. **Environment setup**

Create `server/.env`:
```env
MONGO_URI=mongodb://localhost:27017/anonymous_reporting
JWT_SECRET=your_dev_secret_key
PORT=5000
```

Create `client/.env`:
```env
VITE_API_URL=http://localhost:5000
```

4. **Start development servers**
```bash
# Terminal 1 - Backend
cd server
npm start

# Terminal 2 - Frontend
cd client
npm run dev
```

## Pull Request Process

1. **Update documentation** if you've changed functionality
2. **Follow coding guidelines** (see below)
3. **Test your changes** thoroughly
4. **Update README.md** if needed
5. **Write clear commit messages**
6. **Reference related issues** in PR description

### PR Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests added/updated (if applicable)
- [ ] All tests pass
- [ ] PR description clearly explains changes

## Coding Guidelines

### JavaScript/React

**General:**
- Use ES6+ features
- Use functional components with hooks
- Keep components small and focused
- Use meaningful variable names

**Naming Conventions:**
- Components: PascalCase (`UserProfile.jsx`)
- Files: camelCase or PascalCase
- Functions: camelCase (`handleSubmit`)
- Constants: UPPER_SNAKE_CASE (`API_URL`)

**Code Style:**
- 2 or 4 spaces for indentation (be consistent)
- Single quotes for strings
- Semicolons at end of statements
- No unused variables

**React Best Practices:**
```javascript
// ✅ Good
const UserCard = ({ user }) => {
  const [isActive, setIsActive] = useState(false);
  
  return (
    <div className="user-card">
      <h3>{user.name}</h3>
    </div>
  );
};

// ❌ Avoid
function UserCard(props) {
  var active = false;
  return <div><h3>{props.user.name}</h3></div>;
}
```

### Backend

**Structure:**
- Keep routes clean and focused
- Use middleware for auth and validation
- Handle errors gracefully
- Use async/await over callbacks

**Example:**
```javascript
// ✅ Good
router.post('/api/posts', auth, async (req, res) => {
  try {
    const post = await Post.create(req.body);
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
```

### CSS

- Use CSS variables for colors and common values
- Mobile-first approach
- Keep selectors specific but not overly nested
- Use flexbox/grid for layouts

## Commit Message Guidelines

Use conventional commits format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

### Examples
```
feat(chat): add typing indicators to group chat

Implemented real-time typing indicators using Socket.io
that show when other users are typing in a group chat.

Closes #123
```

```
fix(auth): resolve token expiration issue

Fixed bug where tokens would expire prematurely
due to incorrect timestamp calculation.
```

## Areas Needing Help

### High Priority
- [ ] Direct messaging feature
- [ ] Comprehensive test coverage
- [ ] Performance optimizations
- [ ] Accessibility improvements

### Medium Priority
- [ ] Push notifications
- [ ] Dark mode theme
- [ ] Message reactions
- [ ] File sharing in chats

### Low Priority
- [ ] Voice/video calls
- [ ] End-to-end encryption
- [ ] Multi-language support

## Questions?

Feel free to:
- Open an issue for discussion
- Comment on existing issues
- Reach out to maintainers

## Recognition

Contributors will be recognized in:
- GitHub contributors page
- README acknowledgments
- Release notes (for significant contributions)

---

Thank you for contributing to X-POZ! 🚀
