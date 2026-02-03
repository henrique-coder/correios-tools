const decomment = require("decomment");
const fs = require("fs");
const path = require("path");

function processFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const ext = path.extname(filePath);

  try {
    let result;
    if (ext === ".html") {
      result = decomment.html(content);
    } else {
      result = decomment(content);
    }
    fs.writeFileSync(filePath, result, "utf8");
    console.log(`✓ ${filePath}`);
  } catch (err) {
    console.error(`✗ ${filePath}: ${err.message}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (/\.(js|css|html)$/.test(file)) {
      processFile(filePath);
    }
  });
}

walkDir("src/extensions");
