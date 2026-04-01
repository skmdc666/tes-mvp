# Contributing to TES MVP

Thank you for your interest in contributing to the TES MVP project!

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/tes-mvp.git`
3. Navigate to the project: `cd tes-mvp`
4. Install dependencies: `npm install`

## Development Workflow

### Branches

- `main` - Production-ready code
- `develop` - Integration branch for features and fixes

### Creating a Feature Branch

```bash
git checkout -b feature/your-feature-name develop
```

### Making Changes

1. Make your changes
2. Test your changes
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to your branch: `git push origin feature/your-feature-name`
5. Create a Pull Request to `develop`

### Commit Message Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Adding or fixing tests
- `chore:` - Other changes

### Pull Request Process

1. Ensure your code follows the project style
2. Run tests locally: `npm test`
3. Update documentation if needed
4. Create a Pull Request with a clear description
5. Ensure all CI checks pass

## Development Environment

### Local Development

```bash
# Start development server
npm run dev

# Run linting
npm run lint

# Run tests
npm test

# Build the application
npm run build
```

### Docker Development

```bash
# Start with Docker
docker compose up -d

# View logs
docker compose logs -f

# Stop
docker compose down
```

## Code Style

- Use 2-space indentation
- Follow ESLint configuration
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

## Testing

- Write unit tests for all new features
- Ensure existing tests still pass
- Aim for high test coverage

## Deployment

- Main branch deploys to production Railway
- Develop branch deploys to staging Railway
- All deployments are automated via GitHub Actions

## Questions?

Feel free to open an issue or reach out to the team.