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

    for (const folder of INCLUDE_FOLDERS) {
      const folderPath = path.join(rootPath, folder);
      if (fs.existsSync(folderPath)) {
        collectFiles(folderPath, folder, fileMap);
      }
    }

    let output = '';
    for (const [filePath, content] of Object.entries(fileMap)) {
      output += `--- ${filePath} ---\n`;
      output += content + '\n\n';
    }

    await vscode.env.clipboard.writeText(output);
    vscode.window.showInformationMessage('Project files copied to clipboard!');
  });

  context.subscriptions.push(disposable);
}

function collectFiles(dir, relativePath, fileMap) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.join(relativePath, entry.name);

    if (EXCLUDE_FOLDERS.includes(entry.name) || EXCLUDE_FILES.includes(entry.name)) continue;

    if (entry.isDirectory()) {
      collectFiles(fullPath, relPath, fileMap);
    } else if (entry.isFile()) {
      try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        fileMap[relPath] = content;
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
