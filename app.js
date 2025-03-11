const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

const wikiDir = path.join(__dirname, 'wiki');
if (!fs.existsSync(wikiDir)) fs.mkdirSync(wikiDir);

// Serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API to get all wiki pages
app.get('/api/pages', (req, res) => {
    const files = fs.readdirSync(wikiDir);
    const pages = files.map(file => file.replace('.html', ''));
    res.json(pages);
});

// API to create a new wiki page
app.post('/api/pages', (req, res) => {
    const title = req.body.title;
    const pagePath = path.join(wikiDir, `${title}.html`);
    if (fs.existsSync(pagePath)) {
        return res.status(400).json({ message: 'Page already exists' });
    }
    fs.writeFileSync(pagePath, `<h2>${title}</h2><p>New futuristic content...</p>`);
    res.json({ message: 'Page created', title });
});

// API to delete a wiki page
app.delete('/api/pages/:title', (req, res) => {
    const pagePath = path.join(wikiDir, `${req.params.title}.html`);
    if (fs.existsSync(pagePath)) {
        fs.unlinkSync(pagePath);
        res.json({ message: 'Page deleted' });
    } else {
        res.status(404).json({ message: 'Page not found' });
    }
});
