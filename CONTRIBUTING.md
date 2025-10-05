# Contributing to CodeMentorAI

Thank you for your interest in contributing to CodeMentorAI! We welcome contributions from the community.

## 🚀 Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/yourusername/CodeMentorAI.git
   cd CodeMentorAI
   ```
3. **Create a branch** for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 📋 Development Setup

### Prerequisites

- Visual Studio 2022 or VS Code
- .NET 8.0 SDK
- Node.js 18+
- Ollama

### Setup

1. **Install dependencies:**
   ```bash
   cd src/CodeMentorAI.Web
   npm install
   ```

2. **Run the application:**
   - See [Quick Start Guide](docs/QUICKSTART_VISUAL_STUDIO.md)

## 🎯 How to Contribute

### Reporting Bugs

1. **Check existing issues** to avoid duplicates
2. **Create a new issue** with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Environment details (OS, .NET version, Node version)

### Suggesting Features

1. **Check existing feature requests**
2. **Create a new issue** with:
   - Clear description of the feature
   - Use cases and benefits
   - Possible implementation approach

### Submitting Code

1. **Follow the coding standards:**
   - Use `.editorconfig` settings
   - Follow C# and TypeScript best practices
   - Write clean, readable code
   - Add comments for complex logic

2. **Write tests:**
   - Add unit tests for new features
   - Ensure existing tests pass
   - Aim for good code coverage

3. **Commit your changes:**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```

4. **Push to your fork:**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create a Pull Request:**
   - Provide a clear description
   - Reference related issues
   - Include screenshots for UI changes

## 📝 Coding Standards

### C# (.NET)

- Follow Microsoft C# coding conventions
- Use PascalCase for public members
- Use camelCase for private fields
- Add XML documentation for public APIs
- Use async/await for asynchronous operations

### TypeScript (Angular)

- Follow Angular style guide
- Use TypeScript strict mode
- Use RxJS for reactive programming
- Use standalone components
- Add JSDoc comments for complex functions

### Git Commit Messages

Follow conventional commits:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Examples:
```
feat: add model performance monitoring
fix: resolve SignalR connection issue
docs: update installation guide
```

## 🧪 Testing

### Backend Tests

```bash
cd src/CodeMentorAI.API
dotnet test
```

### Frontend Tests

```bash
cd src/CodeMentorAI.Web
ng test
```

## 📚 Documentation

- Update documentation for new features
- Keep README.md up to date
- Add inline code comments
- Update API documentation

## ✅ Pull Request Checklist

Before submitting a PR, ensure:

- [ ] Code follows project coding standards
- [ ] All tests pass
- [ ] New tests added for new features
- [ ] Documentation updated
- [ ] Commit messages follow conventions
- [ ] No merge conflicts
- [ ] PR description is clear and complete

## 🤝 Code Review Process

1. **Automated checks** run on PR submission
2. **Maintainers review** the code
3. **Feedback** is provided if changes needed
4. **Approval** and merge when ready

## 💬 Communication

- **GitHub Issues** - Bug reports and feature requests
- **Pull Requests** - Code contributions
- **Discussions** - Questions and general discussion

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙏 Thank You!

Your contributions make CodeMentorAI better for everyone. Thank you for taking the time to contribute!

---

**Questions?** Feel free to open an issue or start a discussion.

