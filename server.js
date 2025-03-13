/* Directory structure:
- server.js (Node.js + Express backend)
- public/
  - index.html (Front-end UI)
  */

// server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const WIKI_DIR = path.join(__dirname, 'wiki');

if (!fs.existsSync(WIKI_DIR)) fs.mkdirSync(WIKI_DIR);

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.get('/pages', (req, res) => {
  const files = fs.readdirSync(WIKI_DIR);
  const pages = files.map(file => {
    const content = fs.readFileSync(path.join(WIKI_DIR, file), 'utf-8');
    return { title: path.basename(file), content };
  });
  res.json(pages);
});

app.post('/create', (req, res) => {
  const { title, extension, content } = req.body;
  if (!title || !content || !extension) return res.status(400).send('Invalid data');

  const filePath = path.join(WIKI_DIR, `${title}.${extension}`);
  fs.writeFileSync(filePath, content);
  res.send('Page created');
});

app.put('/edit/:title', (req, res) => {
  const { title } = req.params;
  const { content } = req.body;
  const files = fs.readdirSync(WIKI_DIR);
  const file = files.find(f => f.startsWith(title));
  if (!file) return res.status(404).send('Page not found');

  const filePath = path.join(WIKI_DIR, file);
  fs.writeFileSync(filePath, content);
  res.send('Page updated');
});

app.delete('/delete/:title', (req, res) => {
  const { title } = req.params;
  const files = fs.readdirSync(WIKI_DIR);
  const file = files.find(f => f.startsWith(title));
  if (!file) return res.status(404).send('Page not found');

  const filePath = path.join(WIKI_DIR, file);
  fs.unlinkSync(filePath);
  res.send('Page deleted');
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`
