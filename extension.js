const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

const EXCLUDE_FOLDERS = ['node_modules', '.git', '.vscode'];
const MAX_CLIPBOARD_SIZE = 1000000; // ~1MB
const BLOCKED_FILES = ['favicon.ico'];

let selectedFiles = new Set();

function activate(context) {
  const provider = new FileTreeProvider();
  vscode.window.registerTreeDataProvider('cpycoderFileTree', provider);

  context.subscriptions.push(
    vscode.commands.registerCommand('cpycoder.selectFile', (item) => {
      if (BLOCKED_FILES.includes(path.basename(item.resourcePath))) {
        vscode.window.showWarningMessage('❌ favicon.ico can’t be copied or selected.');
        return;
      }
      toggleFileSelection(item.resourcePath);
      provider.refresh();
    }),

    vscode.commands.registerCommand('cpycoder.copySelectedFiles', async () => {
      if (selectedFiles.size === 0) {
        vscode.window.showWarningMessage('No files selected.');
        return;
      }

      const rootPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      if (!rootPath) return;

      const fileMap = {};
      const skipped = [];

      for (const relPath of selectedFiles) {
        if (BLOCKED_FILES.includes(path.basename(relPath))) {
          skipped.push(relPath);
          continue;
        }

        const fullPath = path.join(rootPath, relPath);
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          fileMap[relPath] = content;

          const deps = collectUsedFiles(fullPath, rootPath);
          deps.forEach(dep => {
            if (!fileMap[dep] && !selectedFiles.has(dep)) {
              try {
                if (!BLOCKED_FILES.includes(path.basename(dep))) {
                  fileMap[dep] = fs.readFileSync(path.join(rootPath, dep), 'utf-8');
                } else {
                  skipped.push(dep);
                }
              } catch {
                skipped.push(dep);
              }
            }
          });
        } catch {
          skipped.push(relPath);
        }
      }

      const outputChunks = [];
      let totalSize = 0;

      for (const [filePath, content] of Object.entries(fileMap)) {
        const chunk = `--- ${filePath} ---\n${content}\n\n`;
        outputChunks.push(chunk);
        totalSize += chunk.length;
      }

      if (totalSize > MAX_CLIPBOARD_SIZE) {
        vscode.window.showWarningMessage(`Clipboard size limit exceeded (~1MB). Copied ${outputChunks.length} files partially.`);
      }

      await vscode.env.clipboard.writeText(outputChunks.join(''));

      const summary = [
        `✅ Copied: ${Object.keys(fileMap).length}`,
        skipped.length ? `⚠️ Skipped: ${skipped.length}` : '',
        `📄 Size: ${(totalSize / 1024).toFixed(2)} KB`
      ].filter(Boolean).join(' | ');

      const outputChannel = vscode.window.createOutputChannel('cpycoder');
      outputChannel.clear();
      outputChannel.appendLine(summary);
      outputChannel.appendLine('\nFiles copied:\n' + Object.keys(fileMap).join('\n'));
      if (skipped.length) {
        outputChannel.appendLine('\nSkipped:\n' + skipped.join('\n'));
      }
      outputChannel.show(true);

      vscode.window.showInformationMessage(summary);
    }),

    vscode.commands.registerCommand('cpycoder.selectFolder', (item) => {
      const rootPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      if (!rootPath) return;

      const fullFolderPath = path.join(rootPath, item.resourcePath);
      const allFiles = getAllFiles(fullFolderPath);
      const relativePaths = allFiles.map(f => path.relative(rootPath, f));

      const filteredPaths = relativePaths.filter(p => !BLOCKED_FILES.includes(path.basename(p)));
      const someSelected = filteredPaths.some(p => selectedFiles.has(p));
      let filesAffected = 0;

      filteredPaths.forEach(p => {
        if (someSelected) {
          if (selectedFiles.delete(p)) filesAffected++;
        } else {
          if (!selectedFiles.has(p)) {
            selectedFiles.add(p);
            filesAffected++;
          }
        }
      });

      if (filesAffected > 25) {
        vscode.window.showWarningMessage(`You just ${someSelected ? 'deselected' : 'selected'} ${filesAffected} files at once.`);
      }

      provider.refresh();
    }),

    vscode.commands.registerCommand('cpycoder.refreshFileTree', () => provider.refresh())
  );
}

function toggleFileSelection(resourcePath) {
  if (selectedFiles.has(resourcePath)) {
    selectedFiles.delete(resourcePath);
  } else {
    selectedFiles.add(resourcePath);
  }
}

function getAllFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir, { withFileTypes: true });
  list.forEach((entry) => {
    if (EXCLUDE_FOLDERS.includes(entry.name)) return;

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(getAllFiles(fullPath));
    } else {
      results.push(fullPath);
    }
  });
  return results;
}

class FileTreeProvider {
  constructor() {
    this._onDidChangeTreeData = new vscode.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
  }

  refresh() {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element) {
    const treeItem = new vscode.TreeItem(element.label, element.collapsibleState);
    treeItem.resourceUri = element.resourceUri;
    treeItem.command = element.command;
    treeItem.iconPath = element.iconPath;
    treeItem.contextValue = element.contextValue;
    return treeItem;
  }

  getChildren(element) {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceFolder) return [];

    const dir = element?.resourcePath || '';
    const fullPath = path.join(workspaceFolder, dir);
    const children = [];

    try {
      for (const entry of fs.readdirSync(fullPath, { withFileTypes: true })) {
        if (EXCLUDE_FOLDERS.includes(entry.name)) continue;

        const resourcePath = path.join(dir, entry.name);
        const fileUri = vscode.Uri.file(path.join(workspaceFolder, resourcePath));
        const isBlocked = BLOCKED_FILES.includes(entry.name);

        if (entry.isDirectory()) {
          children.push({
            label: '📁 ' + entry.name,
            resourceUri: fileUri,
            resourcePath,
            collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
            iconPath: new vscode.ThemeIcon('folder'),
            contextValue: 'folder',
            command: {
              command: 'cpycoder.selectFolder',
              title: 'Select All in Folder',
              arguments: [{ resourcePath }]
            }
          });
        } else {
          const picked = selectedFiles.has(resourcePath) ? '✅ ' : '📄 ';
          children.push({
            label: picked + entry.name,
            resourceUri: fileUri,
            resourcePath,
            collapsibleState: vscode.TreeItemCollapsibleState.None,
            iconPath: new vscode.ThemeIcon('file'),
            contextValue: 'file',
            command: {
              command: 'cpycoder.selectFile',
              title: 'Select File',
              arguments: [{ resourcePath }]
            }
          });
        }
      }
    } catch (err) {
      console.error('Error reading children:', err);
    }

    return children;
  }
}

function collectUsedFiles(filePath, rootPath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const importRegex = /(?:require\(['"](.+?)['"]\)|import .* from ['"](.+?)['"])/g;

  const used = new Set();
  let match;

  while ((match = importRegex.exec(content)) !== null) {
    const relative = match[1] || match[2];
    if (!relative.startsWith('.')) continue;

    let depPath = path.resolve(path.dirname(filePath), relative);
    if (!path.extname(depPath)) depPath += '.js';
    const relDepPath = path.relative(rootPath, depPath);

    if (fs.existsSync(depPath) && !BLOCKED_FILES.includes(path.basename(relDepPath))) {
      used.add(relDepPath);
    }
  }

  return [...used];
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
};
