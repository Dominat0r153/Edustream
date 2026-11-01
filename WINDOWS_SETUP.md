# EduStream Windows setup

## Important
Do not run `npm install` from `C:\Windows\System32`. You must first `cd` into the folder containing `package.json`.

Example:

```cmd
cd /d "D:\DOWNLOADS\HHHHHH\backend\edustream-backend"
dir
npm install
npm start
```

The `dir` command should show `package.json`.

## Database
No PostgreSQL installation is required. The project uses SQLite by default and creates `data\edustream.sqlite` automatically.

## Open the app

After `npm start` succeeds, keep the command window open and visit:

`http://localhost:5000`

Demo credentials:
- Email: `prof@edustream.edu`
- Password: `password123`

## Live Server
The standalone front end can still run on port 5500, but for the final demo use `http://localhost:5000` so the backend serves the integrated front end.

The launcher creates the SQLite data folder automatically and waits for the backend health endpoint before opening the browser.


## Windows zero-setup architecture update

The integrated local app uses a file-backed JSON data store at `backend/edustream-backend/data/edustream.json`. No PostgreSQL server and no native SQLite package are required. This avoids native database-driver installation problems on Windows and works with Node.js 20+ including Node.js 26. Start the project with `START_EDUSTREAM.bat`; do not use VS Code Live Server for the integrated demo.


### Startup troubleshooting
The Windows build uses a local JSON data store and does not require PostgreSQL or SQLite. If the backend window closes immediately, run `npm start` from `backend\edustream-backend` and send the complete console output.
