/**
 * electron/main.cjs
 * ─────────────────────────────────────────────────────────────────────────────
 * Proceso principal de Electron para el Panel Administrativo de +AFINACIÓN.
 *
 * Usa extensión .cjs para que Node.js lo trate como CommonJS incluso cuando
 * el package.json tiene "type":"module" (requerido por Vite/React).
 *
 * En producción:
 *   - Carga dist/index.html via file:// (build de Vite)
 *   - El frontend conecta al backend en http://localhost:5000
 *   - DevTools completamente deshabilitadas
 */

'use strict';

const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

// Keep a global reference so GC doesn't destroy the window
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width:    1440,
    height:   900,
    minWidth: 1100,
    minHeight: 700,
    show: false,           // Reveal only after paint (avoids white flash)
    backgroundColor: '#020617',   // slate-950 — matches app background
    title: '+AFINACIÓN — Panel Administrativo',
    webPreferences: {
      nodeIntegration:  false,  // Security: no Node.js inside renderer
      contextIsolation: true,   // Security: isolated context
      devTools:         false,  // Disabled in production build
    },
  });

  // Remove the native menu bar entirely
  Menu.setApplicationMenu(null);

  // Load built Vite output
  const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
  mainWindow.loadFile(indexPath);

  // Show once the page has finished rendering (removes blank flash)
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Block all DevTools keyboard shortcuts (F12, Ctrl+Shift+I/J, Ctrl+U)
  mainWindow.webContents.on('before-input-event', (event, input) => {
    const ctrl = input.control || input.meta;
    const blocked =
      input.key === 'F12' ||
      (ctrl && input.shift && ['i', 'I', 'j', 'J'].includes(input.key)) ||
      (ctrl && ['u', 'U'].includes(input.key));

    if (blocked) {
      event.preventDefault();
    }
  });

  // Catch context-menu DevTools shortcut
  mainWindow.webContents.on('context-menu', (e) => {
    e.preventDefault();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ── App lifecycle ─────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  createWindow();

  // macOS: re-create window when dock icon is clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit on all windows closed (except macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
