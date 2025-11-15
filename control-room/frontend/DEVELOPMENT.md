# Development Guide

## Quick Start

### For Development (Recommended)
```bash
npm run dev
```
This starts the development server at `http://localhost:3000` with hot-reloading.

### For Production Build
```bash
# First, build the application
npm run build

# Then start the production server
npm start
```

## Common Issues

### Issue: "Could not find a production build"
**Solution**: Run `npm run build` before `npm start`

### Issue: Node.js Library Error (simdjson)
If you see errors about `libsimdjson.26.dylib`, this is a system-level Node.js issue. Solutions:

1. **Reinstall Node.js** (recommended):
   ```bash
   # Using Homebrew
   brew reinstall node
   ```

2. **Use a Node version manager**:
   ```bash
   # Using nvm
   nvm install 20
   nvm use 20
   ```

3. **For development, use `npm run dev`** instead of `npm start` - it doesn't require a build

### Issue: Multiple Lockfiles Warning
This is fixed in `next.config.ts` with `outputFileTracingRoot`. The warning is harmless but can be silenced by:
- Removing unused lockfiles from parent directories
- Or keeping the current config (already fixed)

## Environment Setup

1. Copy `env.example` to `.env.local`:
   ```bash
   cp ../../env.example .env.local
   ```

2. Fill in your environment variables (especially GitHub token for project features)

3. Run development server:
   ```bash
   npm run dev
   ```

## Available Scripts

- `npm run dev` - Start development server (hot-reload)
- `npm run build` - Build for production
- `npm start` - Start production server (requires build first)
- `npm run lint` - Run ESLint

## Notes

- **Development**: Always use `npm run dev` for local development
- **Production**: Build with `npm run build` then deploy or run `npm start`
- The app will work fine in development mode even with the Node.js library issue

