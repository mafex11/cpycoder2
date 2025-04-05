const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

const INCLUDE_FOLDERS = ['src', 'ui', 'app', 'lib', 'utils'];
const EXCLUDE_FOLDERS = ['node_modules', '.git', '.vscode'];
const EXCLUDE_FILES = ['package.json', 'package-lock.json', 'yarn.lock', '.env'];

function activate(context) {
  console.log('cpycoder is now active!');

  let disposable = vscode.commands.registerCommand('extension.copyImportantFiles', async () => {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      vscode.window.showErrorMessage('No workspace folder is open.');
      return;
    }

    const rootPath = workspaceFolders[0].uri.fsPath;
    let fileMap = {};
    let copiedFiles = [];

    // Create or reuse a terminal
    const terminal = vscode.window.createTerminal("cpycoder");
    terminal.show(true);
    terminal.sendText(`echo "[cpycoder] Starting to collect files..."`);

    for (const folder of INCLUDE_FOLDERS) {
      const folderPath = path.join(rootPath, folder);
      if (fs.existsSync(folderPath)) {
        collectFiles(folderPath, folder, fileMap, copiedFiles);
      }
    }

    let output = '';

    for (const [filePath, content] of Object.entries(fileMap)) {
      output += `--- ${filePath} ---\n`;
      output += content + '\n\n';
    }

    if (copiedFiles.length === 0) {
      vscode.window.showWarningMessage('No important files found to copy.');
      terminal.sendText(`echo "[cpycoder] No files were copied."`);
      return;
    }

    await vscode.env.clipboard.writeText(output);

    // Show notification
    const shownFiles = copiedFiles.slice(0, 5).join(', ');
    const more = copiedFiles.length > 5 ? ` +${copiedFiles.length - 5} more...` : '';
    vscode.window.showInformationMessage(`Copied files: ${shownFiles}${more}`);

    // Log copied files to terminal
    terminal.sendText(`echo "[cpycoder] Copied ${copiedFiles.length} files:"`);
    copiedFiles.forEach(file => {
      terminal.sendText(`echo " - ${file}"`);
    });
  });

  context.subscriptions.push(disposable);
}

function collectFiles(dir, relativePath, fileMap, copiedFiles) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.join(relativePath, entry.name);

    if (EXCLUDE_FOLDERS.includes(entry.name) || EXCLUDE_FILES.includes(entry.name)) continue;

    if (entry.isDirectory()) {
      collectFiles(fullPath, relPath, fileMap, copiedFiles);
    } else if (entry.isFile()) {
      try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        fileMap[relPath] = content;
        copiedFiles.push(relPath);
      } catch (err) {
        console.error(`Failed to read file: ${relPath}`, err);
      }
    }
  }
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
