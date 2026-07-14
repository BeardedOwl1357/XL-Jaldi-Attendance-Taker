# Attendance Taker Prototype

Static attendance prototype for student events. It is ready to deploy on GitHub Pages with no build step.

## Files

- `index.html` - main app page
- `styles.css` - styling
- `app.js` - attendance logic
- `.nojekyll` - tells GitHub Pages to serve the site as plain static files

## Local use

Open `index.html` in a browser.

## GitHub Pages deployment

1. Create a GitHub repository and upload these files to the repository root.
2. In GitHub, open `Settings` -> `Pages`.
3. Under `Build and deployment`, set:
   - `Source`: `Deploy from a branch`
   - `Branch`: `main`
   - `Folder`: `/ (root)`
4. Save the settings.
5. Wait for GitHub Pages to publish the site.
6. Open the generated site URL shown in the Pages settings.

If the repository is named `username.github.io`, the site will be served from the root domain.
If it is any other repository name, it will be served from `/repository-name/`.
