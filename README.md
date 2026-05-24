# mLookup

Chat-based market intelligence platform for stocks and crypto with technical analysis, forecasting, and interactive dashboards.

## Highlights

- Chat-driven analyst workflow with visible subprocess pipeline.
- Forecast engine with confidence intervals and backtest metrics.
- Asset dashboards for stocks and crypto with chart visualizations.
- Route-level lazy loading and bundled chunk optimization.
- Graceful runtime recovery via app-wide error boundary.

## Tech Stack

- React 18 + Vite 5
- React Router 6
- Recharts
- Tailwind CSS
- Axios

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Start development server:

```bash
npm run dev
```

3. Build for production:

```bash
npm run build
```

4. Preview production build:

```bash
npm run preview
```

## GitHub Pages Deployment

This repository includes an automated deployment workflow at `.github/workflows/deploy-pages.yml`.

### What is configured

- Build and deploy on every push to `main`
- Manual trigger support via Actions tab
- SPA fallback (`404.html`) for React Router refreshes
- Automatic project-page base path using repository name

### One-time repository setup

1. Open your repository on GitHub.
2. Go to **Settings > Pages**.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.

After this, every push to `main` will publish the latest build at:

- `https://<owner>.github.io/<repo>/`
- For this repo: `https://cosmic-hydra.github.io/mLookup/`

## API Keys

Configure keys inside the Settings page in the app:

- OpenAI (optional for LLM responses)
- Alpha Vantage (recommended for live stock quotes)

When keys are absent, the app falls back to safe local simulation paths where available.

## Project Structure

```text
src/
	components/
		Analysis/
		Charts/
		Common/
		Dashboard/
		Layout/
		News/
	config/
	pages/
	services/
	utils/
```

## Key Services

- `src/services/predictorService.js`: Ensemble forecasting logic and confidence bands.
- `src/services/chatAnalystService.js`: Chat orchestration pipeline for asset analysis.
- `src/services/analysisService.js`: Technical signal and recommendation engine.

## Performance Notes

- Routes are lazy-loaded in `src/App.jsx`.
- Vendor chunking is configured in `vite.config.js`.
- Warning limit was adjusted to better reflect current analytics/charts footprint.

## Disclaimer

This application is for informational and educational use only, and does not provide financial advice.