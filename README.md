# cpycoder - Copy Code for AI Tools

A **Visual Studio Code extension** that helps developers quickly copy essential files and source code from their projects — such as `src`, `lib`, `utils`, `ui`, or `app` folders — into their clipboard. This is perfect for sharing your project context with AI tools like ChatGPT, Copilot, Cursor, and more.

![cpycoder logo](./icon.png)

---

## 📹 Demo Video
> _Coming soon..._

---

## 🚀 Features

- ✅ Copies only important folders (`src`, `lib`, `utils`, `ui`, `app`) to clipboard
- ❌ Skips noise like `node_modules`, `.git`, `package.json`, `.env`, etc.
- 📋 Preserves directory structure for clarity
- 🧠 Designed for AI tools: clean, ready-to-paste structure
- 🖥️ Lists copied files in the terminal and in a VS Code popup

---

## 🛠 How It Works

1. Run the command: `Copy Important Project Files` (via `Ctrl+Shift+P`)
2. The extension will scan your project for important folders and collect all readable files
3. File names and contents are formatted with directory context
4. The formatted output is copied to your clipboard
5. A summary of copied files is shown in the status bar and terminal

---

## 🧪 Supported Folder Names

- `src`
- `lib`
- `utils`
- `ui`
- `app`

Only these folders will be scanned. If they don’t exist, they’ll be skipped.

---

## 🚫 Ignored By Default

- `node_modules`, `.git`, `.vscode`
- Files like `package.json`, `.env`, `yarn.lock`, etc.
- Hidden or binary files

---

## 📦 Installation

### From VSIX (Local Install)

```bash
# Step 1: Package the extension
vsce package

# Step 2: Install the VSIX file
code --install-extension cpycoder-0.0.3.vsix
```

### From Marketplace
[Marketplace](https://marketplace.visualstudio.com/items?itemName=Mafex.cpycoder&ssr=false#overview)

---

## 💡 Use Cases

- Share your app logic with ChatGPT without including irrelevant files
- Paste clean project structure into bug reports
- Feed scoped code to AI tools for analysis or refactoring
- Maintain privacy while sharing only what’s necessary

---

## 🧰 Developer Settings (Advanced)

No user settings yet — but future versions will allow customization for:

- Folder inclusion/exclusion patterns
- File types
- Output format
- Directory Tree

---

## 🐞 Support & Contributions

Found a bug or have a feature request?

- 🐛 Report issues: [GitHub Issues](https://github.com/mafex11/cpycoder2/issues)
- 💬 Suggest features or ask questions
- 🤝 Pull requests welcome!

---

## 📬 Contact

Created with ❤️ by Mafex

- GitHub: [github.com/mafex11](https://github.com/mafex11)
- Twitter: [@mafexuwu](https://twitter.com/mafexuwu)
- Email: sudhanshuk1140@gmail.com

---

## 📄 License

This project is licensed under the [MIT License](./LICENSE).

---

## 📘 Changelog

### v0.0.1 - Initial Release
- Basic folder scanning
- Clipboard copy
- File list output
- Skipping ignored files

### v0.0.2 - Initial Release
- Added ReadME
- Bug Fixes



Stay tuned for more improvements!

---

> Your feedback powers the next version of **cpycoder** 🔥

