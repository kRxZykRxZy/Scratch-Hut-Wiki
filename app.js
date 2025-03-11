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

// Home Page
app.get('/', (req, res) => {
    const files = fs.readdirSync(wikiDir);
    const pages = files.map(file => file.replace('.html', ''));
    res.send(`
        <html>
            <head>
                <title>Futuristic Wiki</title>
                <style>
                    body { font-family: Arial, sans-serif; background: #0f0f23; color: #0ff; text-align: center; }
                    a { color: #0ff; }
                    .page { margin: 10px; }
                </style>
            </head>
            <body>
                <h1>🌌 Futuristic Wiki 🌌</h1>
                <ul>${pages.map(page => `<li><a href="/${page}">${page}</a></li>`).join('')}</ul>
                <form action="/new" method="POST">
                    <input type="text" name="title" placeholder="New Page Title" required />
                    <button type="submit">Create Page</button>
                </form>
            </body>
        </html>
    `);
});

// View Wiki Page
app.get('/:page', (req, res) => {
    const pagePath = path.join(wikiDir, `${req.params.page}.html`);
    if (fs.existsSync(pagePath)) {
        const content = fs.readFileSync(pagePath, 'utf-8');
        res.send(`
            <html>
                <head>
                    <title>${req.params.page}</title>
                    <style>body { background: #0f0f23; color: #0ff; text-align: center; }</style>
                </head>
                <body>
                    ${content}
                    <form action="/${req.params.page}/edit" method="GET">
                        <button type="submit">Edit</button>
                    </form>
                    <form action="/${req.params.page}/delete" method="POST">
                        <button type="submit">Delete</button>
                    </form>
                </body>
            </html>
        `);
    } else {
        res.status(404).send('Page not found');
    }
});

// Create New Page
app.post('/new', (req, res) => {
    const title = req.body.title;
    const pagePath = path.join(wikiDir, `${title}.html`);
    fs.writeFileSync(pagePath, `<h2>${title}</h2><p>New futuristic content...</p>`);
    res.redirect(`/${title}`);
});

// Edit Page
app.get('/:page/edit', (req, res) => {
    const pagePath = path.join(wikiDir, `${req.params.page}.html`);
    if (fs.existsSync(pagePath)) {
        const content = fs.readFileSync(pagePath, 'utf-8');
        res.send(`
            <form action="/${req.params.page}" method="POST">
                <textarea name="content" rows="10" cols="50">${content}</textarea>
                <button type="submit">Save</button>
            </form>
        `);
    } else {
        res.status(404).send('Page not found');
    }
});

// Save Edited Page
app.post('/:page', (req, res) => {
    const pagePath = path.join(wikiDir, `${req.params.page}.html`);
    fs.writeFileSync(pagePath, req.body.content);
    res.redirect(`/${req.params.page}`);
});

// Delete Page
app.post('/:page/delete', (req, res) => {
    const pagePath = path.join(wikiDir, `${req.params.page}.html`);
    if (fs.existsSync(pagePath)) {
        fs.unlinkSync(pagePath);
    }
    res.redirect('/');
});

/*
** Setup Instructions **
1. Create a project folder and cd into it
2. Run: npm init -y
3. Run: npm install express
4. Create 'public' and 'wiki' folders in the project root
5. Save this file as 'app.js'
6. Start the server: node app.js
7. Open your browser at http://localhost:3000
*/
