const { app, BrowserWindow } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');

let mainWindow = null;
let localServer = null;

// Single instance lock to prevent duplicate ghost processes in Task Manager
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    } else {
      createWindow();
    }
  });

  function startEmbeddedServer(distDir) {
    return new Promise((resolve, reject) => {
      const mimeTypes = {
        '.html': 'text/html; charset=utf-8',
        '.js': 'application/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        '.ttf': 'font/ttf',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2',
      };

      const server = http.createServer((req, res) => {
        try {
          let reqPath = decodeURIComponent(req.url.split('?')[0]);
          if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
          const cleanRel = reqPath.replace(/^[/\\]+/, '').replace(/^(\.\.[\/\\])+/, '');
          const filePath = path.join(distDir, cleanRel);

          fs.stat(filePath, (err, stats) => {
            if (err || !stats.isFile()) {
              // SPA Fallback to index.html for clean routing
              const indexPath = path.join(distDir, 'index.html');
              fs.readFile(indexPath, (indexErr, data) => {
                if (indexErr) {
                  res.writeHead(404);
                  res.end('Not Found');
                } else {
                  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                  res.end(data);
                }
              });
              return;
            }

            const ext = path.extname(filePath).toLowerCase();
            const contentType = mimeTypes[ext] || 'application/octet-stream';
            fs.readFile(filePath, (readErr, data) => {
              if (readErr) {
                res.writeHead(500);
                res.end('Read Error');
              } else {
                res.writeHead(200, {
                  'Content-Type': contentType,
                  'Cache-Control': 'no-cache',
                });
                res.end(data);
              }
            });
          });
        } catch {
          res.writeHead(500);
          res.end('Internal Server Error');
        }
      });

      server.listen(0, '127.0.0.1', () => {
        resolve({ server, port: server.address().port });
      });

      server.on('error', (err) => {
        reject(err);
      });
    });
  }

  async function createWindow() {
    const iconPath = path.join(__dirname, 'assets', 'icon.ico');

    mainWindow = new BrowserWindow({
      width: 1360,
      height: 860,
      minWidth: 940,
      minHeight: 640,
      title: 'MK Exotic Fruits - Billing & Cumulative Ledger',
      icon: iconPath,
      backgroundColor: '#071629',
      show: true,
      autoHideMenuBar: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false,
      },
    });

    const distDir = path.join(__dirname, 'dist');

    try {
      const { server, port } = await startEmbeddedServer(distDir);
      localServer = server;
      await mainWindow.loadURL(`http://127.0.0.1:${port}/index.html`);
    } catch (err) {
      console.error('Server start failed, falling back to loadFile:', err);
      await mainWindow.loadFile(path.join(distDir, 'index.html'));
    }

    mainWindow.webContents.on('before-input-event', (event, input) => {
      if (input.key === 'F12' || (input.control && input.shift && input.key.toLowerCase() === 'i')) {
        mainWindow.webContents.toggleDevTools();
        event.preventDefault();
      }
    });

    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      console.error(`[Load Error] ${errorCode} - ${errorDescription} (${validatedURL})`);
    });

    mainWindow.focus();

    mainWindow.on('closed', () => {
      mainWindow = null;
    });
  }

  app.whenReady().then(async () => {
    await createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('before-quit', () => {
    if (localServer) {
      try {
        localServer.close();
      } catch {}
    }
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
}
