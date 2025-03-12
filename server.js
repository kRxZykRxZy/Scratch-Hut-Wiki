// app.js (Node.js with Express)

const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// In-memory storage for wiki entries
let wikiEntries = [
    { id: 1, title: 'What is Node.js?', content: '<p>Node.js is a JavaScript runtime built on Chrome\'s V8 JavaScript engine.</p>' },
    { id: 2, title: 'What is Express?', content: '<p>Express is a fast, unopinionated, minimalist web framework for Node.js.</p>' }
];

// Middleware to parse JSON in requests
app.use(express.json());

// Serve the index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Get all wiki entries
app.get('/api/wiki', (req, res) => {
    res.json(wikiEntries);
});

// Get a specific wiki entry by ID
app.get('/api/wiki/:id', (req, res) => {
    const { id } = req.params;
    const entry = wikiEntries.find(entry => entry.id == id);
    if (entry) {
        res.json(entry);
    } else {
        res.status(404).send('Entry not found');
    }
});

// Create a new wiki entry
app.post('/api/wiki', (req, res) => {
    const { title, content } = req.body;
    const newEntry = { id: Date.now(), title, content };
    wikiEntries.push(newEntry);
    res.status(201).json(newEntry);
});

// Edit an existing wiki entry
app.put('/api/wiki/:id', (req, res) => {
    const { id } = req.params;
    const { title, content } = req.body;

    let entry = wikiEntries.find(entry => entry.id == id);
    if (entry) {
        entry.title = title;
        entry.content = content;
        res.json(entry);
    } else {
        res.status(404).send('Entry not found');
    }
});

// Delete a wiki entry
app.delete('/api/wiki/:id', (req, res) => {
    const { id } = req.params;
    const index = wikiEntries.findIndex(entry => entry.id == id);

    if (index > -1) {
        wikiEntries.splice(index, 1);
        res.status(200).send('Entry deleted');
    } else {
        res.status(404).send('Entry not found');
    }
});

app.listen(port, () => {
    console.log(`Wiki app listening at port: ${port}`);
});
