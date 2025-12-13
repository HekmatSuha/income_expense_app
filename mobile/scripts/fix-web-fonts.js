const fs = require("fs");
const path = require("path");

// Ensures icon fonts are available at the paths the web bundle requests.
const SOURCE_DIR = path.join(
  __dirname,
  "..",
  "dist",
  "assets",
  "node_modules",
  "@expo",
  "vector-icons",
  "build",
  "vendor",
  "react-native-vector-icons",
  "Fonts"
);

const TARGET_DIR = path.join(
  __dirname,
  "..",
  "dist",
  "assets",
  "node_modules",
  "@expo",
  "vector-icons",
  "Fonts"
);

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copyFonts() {
  ensureDir(TARGET_DIR);

  const files = fs.existsSync(SOURCE_DIR)
    ? fs.readdirSync(SOURCE_DIR)
    : [];

  files.forEach((file) => {
    const src = path.join(SOURCE_DIR, file);
    const dest = path.join(TARGET_DIR, file);
    fs.copyFileSync(src, dest);

    const parts = file.split(".");
    if (parts.length >= 3) {
      // Rename hashed files to also support underscore naming (e.g., MaterialIcons_xxx.ttf)
      const ext = parts.pop();
      const hash = parts.pop();
      const base = parts.join(".");
      const underscoreName = `${base}_${hash}.${ext}`;
      fs.copyFileSync(src, path.join(TARGET_DIR, underscoreName));
    }
  });
}

copyFonts();
