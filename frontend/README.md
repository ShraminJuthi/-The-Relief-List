# The Relief List — Frontend

React + Vite frontend for the SE 331 project. It supports:
- Three source lists (Union Council, Own Survey, Partner Organisation)
- CSV import preview
- Beneficiary records
- Possible duplicate review with explanation
- Human decisions: Same Person / Different People / Need More Information
- Final beneficiary list and CSV export

## Run locally
```bash
npm install
npm run dev
```
Open the URL printed by Vite (usually http://localhost:5173).

## Build
```bash
npm run build
```

## Backend integration
The app currently uses local demo data and browser localStorage so the frontend can be demonstrated before the backend is ready.
Set `VITE_USE_MOCK_DATA=false` and `VITE_API_BASE_URL` in `.env` when the backend is available. The API client in `src/services/api.js` documents the expected routes. Coordinate route names and request/response shapes with the backend member before integration.

## Important
- A similarity score is only a suggestion, never a final identity decision.
- No records are automatically merged.
- Do not upload real beneficiary data to public repositories.
