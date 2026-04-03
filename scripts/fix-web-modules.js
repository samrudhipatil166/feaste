const fs = require('fs');
const path = require('path');

function fixHtmlFile(filePath) {
  let html = fs.readFileSync(filePath, 'utf8');
  // Change <script src="/_expo/static/js/web/entry-*.js" defer> to type="module"
  const fixed = html.replace(
    /(<script) src="(\/_expo\/static\/js\/web\/entry-[^"]+\.js)" defer>/g,
    '<script type="module" src="$2">'
  );
  if (fixed !== html) {
    fs.writeFileSync(filePath, fixed, 'utf8');
    console.log(`Fixed: ${filePath}`);
  }
}

function walkDir(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkDir(full);
    else if (entry.name.endsWith('.html')) fixHtmlFile(full);
  }
}

const distDir = path.join(__dirname, '..', 'dist');
walkDir(distDir);
console.log('Done fixing module scripts.');
