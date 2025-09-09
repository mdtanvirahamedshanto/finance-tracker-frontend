# Vercel Deployment Guide

## Prerequisites

1. A [Vercel](https://vercel.com) account
2. Your backend API deployed and accessible

## Deployment Steps

### 1. Set Up Environment Variables

Before deploying to Vercel, you need to set up the following environment variables:

- `VITE_API_URL`: The URL of your backend API (e.g., https://your-backend-api.com)

### 2. Deploy to Vercel

#### Option 1: Using Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy the project:
   ```bash
   vercel
   ```

4. Follow the prompts to configure your project.

#### Option 2: Using Vercel Dashboard

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket).

2. Log in to your Vercel account and click "New Project".

3. Import your repository.

4. Configure the project:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

5. Add the environment variables in the "Environment Variables" section.

6. Click "Deploy".

### 3. Verify Deployment

1. Once deployed, Vercel will provide you with a URL for your application.

2. Visit the URL to ensure your application is working correctly.

3. Test the PWA functionality by:
   - Checking if the app can be installed
   - Testing offline capabilities
   - Verifying that the app works properly when offline

## Troubleshooting

### API Connection Issues

If your frontend cannot connect to your backend API:

1. Verify that the `VITE_API_URL` environment variable is set correctly.
2. Ensure your backend API allows CORS requests from your Vercel domain.
3. Check that your backend API is running and accessible.

### PWA Issues

If the PWA functionality is not working:

1. Ensure the service worker is registered correctly.
2. Verify that the manifest.json file is accessible.
3. Check that the PWA icons are properly configured and accessible.

### Routing Issues

If you encounter 404 errors when refreshing pages:

1. Verify that the `vercel.json` file is properly configured with the rewrite rule.
2. Ensure that your React Router is configured correctly.

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Documentation](https://vitejs.dev/guide/)
- [PWA Documentation](https://web.dev/progressive-web-apps/)