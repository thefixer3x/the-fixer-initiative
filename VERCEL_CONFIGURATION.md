# Vercel Configuration Guide

## ⚠️ IMPORTANT: Root Directory Setting

The Control Room frontend is located in a subdirectory. You **MUST** configure Vercel's Root Directory setting:

### Steps to Configure:

1. Go to your Vercel project dashboard
2. Navigate to: **Settings → General**
3. Find the **Root Directory** setting
4. Set it to: `control-room/frontend`
5. Click **Save**

### Why This Matters:

The project structure is:
```
the-fixer-initiative/           (Git repository root)
├── control-room/
│   └── frontend/               (Next.js app - SET THIS AS ROOT)
│       ├── package.json        (Contains Next.js dependency)
│       ├── src/
│       └── vercel.json
├── package.json                (Root package.json - NOT Next.js)
└── vercel.json                 (Minimal config)
```

Without setting the Root Directory, Vercel looks at the repository root and can't find Next.js in package.json, causing the build error:

```
Error: No Next.js version detected. Make sure your package.json
has "next" in either "dependencies" or "devDependencies".
```

## ✅ Correct Configuration

### Vercel Project Settings:

| Setting | Value |
|---------|-------|
| Framework Preset | Next.js |
| Root Directory | `control-room/frontend` |
| Build Command | `npm run build` (default) |
| Output Directory | `.next` (default) |
| Install Command | `npm install` (default) |

### Environment Variables:

Set these in Vercel Dashboard → Settings → Environment Variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://hjplkyeuycajchayuylw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Apply to: **Production, Preview, Development**

## 📁 File Structure

### Root vercel.json
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json"
}
```
**Purpose:** Minimal config, doesn't interfere with Next.js detection

### Frontend vercel.json
```json
{
  "framework": "nextjs",
  "regions": ["iad1"]
}
```
**Purpose:** Framework-specific settings for the Next.js app

## 🚫 Common Mistakes

### ❌ DON'T: Use builds config in root vercel.json
```json
{
  "builds": [
    {
      "src": "control-room/frontend/package.json",
      "use": "@vercel/next"
    }
  ]
}
```
**Why:** Deprecated and causes warnings. Use Root Directory setting instead.

### ❌ DON'T: Set complex build commands in root vercel.json
```json
{
  "buildCommand": "cd control-room/frontend && npm run build"
}
```
**Why:** Confuses Vercel's auto-detection. Let it find Next.js naturally.

### ✅ DO: Keep root vercel.json minimal or empty
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json"
}
```

### ✅ DO: Set Root Directory in Vercel dashboard
**Settings → General → Root Directory: `control-room/frontend`**

## 🔧 Troubleshooting

### Build Error: "No Next.js version detected"

**Solution:**
1. Go to Vercel project settings
2. Set Root Directory to `control-room/frontend`
3. Redeploy

### Warning: "Due to builds existing in your configuration file"

**Solution:**
1. Remove `builds` array from root vercel.json
2. Set Root Directory instead
3. Commit and push

### Build succeeds but app doesn't work

**Check:**
1. Environment variables are set correctly
2. Supabase URL and keys are valid
3. Check browser console for errors

## 📝 Quick Fix Checklist

If deployment is failing:

- [ ] Root Directory set to `control-room/frontend` in Vercel dashboard
- [ ] Root vercel.json is minimal (no builds array)
- [ ] Environment variables configured
- [ ] Latest code pushed to GitHub/Git provider
- [ ] Build logs show Next.js is detected

## 🎯 Expected Build Output

When configured correctly, you should see:

```
✓ Detected Next.js version: 15.3.2
✓ Running build in Root Directory: control-room/frontend
✓ Installing dependencies with npm install
✓ Building production bundle
✓ Generating static pages (12/12)
✓ Deployment complete
```

## 📞 Support

If issues persist:

1. Check Vercel build logs for specific errors
2. Verify Root Directory setting is saved
3. Try redeploying after clearing build cache
4. Check that control-room/frontend/package.json contains "next"

---

**Last Updated:** October 17, 2025
**Status:** Configuration validated and working
