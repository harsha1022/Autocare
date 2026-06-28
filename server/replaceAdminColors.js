const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../client/src/pages/AdminDashboard.css');
let content = fs.readFileSync(filePath, 'utf8');

// Replace dark earthy backgrounds with CSS variables
content = content.replace(/#120d07/g, 'var(--bg-dark)');
content = content.replace(/#1c1108/g, 'var(--bg-deep)');
content = content.replace(/#160e05/g, 'var(--bg-deep)');
content = content.replace(/#1a1008/g, 'var(--surface)');
content = content.replace(/#140b04/g, 'var(--surface)');
content = content.replace(/#1f1108/g, 'var(--surface)');
content = content.replace(/#180e05/g, 'var(--surface)');
content = content.replace(/rgba\(18, 13, 7, 0\.92\)/g, 'rgba(13, 13, 13, 0.92)');

// Replace gold/earthy text and borders
content = content.replace(/rgba\(214, 181, 136,/g, 'rgba(255, 140, 0,');
content = content.replace(/#D6B588/g, 'var(--primary)');
content = content.replace(/#a07d50/g, 'var(--primary-light)');
content = content.replace(/#e8ddd0/g, 'var(--text-main)');
content = content.replace(/#9d8d7a/g, 'var(--text-muted)');
content = content.replace(/#7a6a5a/g, 'var(--text-muted)');
content = content.replace(/#5a4e43/g, 'var(--text-muted)');
content = content.replace(/#c8bdb0/g, 'var(--text-muted)');
content = content.replace(/#1a0f05/g, '#ffffff');
content = content.replace(/#705E46/g, 'var(--primary)');

fs.writeFileSync(filePath, content, 'utf8');
console.log('AdminDashboard.css updated successfully.');
