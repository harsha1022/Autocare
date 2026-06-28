const fs = require('fs');
const path = require('path');

const filesToUpdate = [
    '../client/src/components/Navbar.css',
    '../client/src/pages/Services.css',
    '../client/src/pages/HowItWorks.css',
    '../client/src/components/ChatBox.css'
];

filesToUpdate.forEach(relativePath => {
    const filePath = path.join(__dirname, relativePath);
    if (!fs.existsSync(filePath)) return;
    
    let content = fs.readFileSync(filePath, 'utf8');

    // Earthy Beiges and Browns -> CSS variables (Primary Orange)
    content = content.replace(/#D6B588/g, 'var(--primary)');
    content = content.replace(/#e5cdab/g, 'var(--primary-light)');
    content = content.replace(/#705E46/g, 'var(--primary)');
    content = content.replace(/#8f7959/g, 'var(--primary-light)');
    content = content.replace(/#C6C0B9/g, 'var(--text-muted)');
    content = content.replace(/#a07d50/g, 'var(--primary)');
    
    // Backgrounds to Dark Theme
    content = content.replace(/#2e1b00/g, 'var(--bg-deep)');
    content = content.replace(/#422701/g, 'var(--bg-dark)');
    
    // Replace RGBA instances of earthy brown/beige with orange
    content = content.replace(/rgba\(214,\s*181,\s*136/g, 'rgba(255, 140, 0');
    content = content.replace(/rgba\(112,\s*94,\s*70/g, 'rgba(255, 140, 0');
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`${relativePath} updated successfully.`);
});
