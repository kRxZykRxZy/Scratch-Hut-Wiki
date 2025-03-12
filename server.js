const express = require('express');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const app = express();
const port = process.env.PORT || 3000;

// Ensure the pages directory exists
const pagesDir = path.join(__dirname, 'pages');
if (!fs.existsSync(pagesDir)) {
  fs.mkdirSync(pagesDir);
}

// Serve the HTML, CSS, and JS
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Scratch Coding Hut Wiki</title>
      <style>
        /* Your combined styles (same as previously) */
        body { background: #0f172a; color: #a5f3fc; font-family: Arial, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; }
        h1 { font-size: 2.5rem; margin-bottom: 20px; }
        input, select, textarea, button { background: #1e293b; border: 1px solid #a5f3fc; color: #a5f3fc; padding: 20px; margin: 10px; border-radius: 10px; font-size: 1.2rem; width: 60vw; }
        select { width: 62vw; }
        textarea { height: 200px; resize: vertical; }
        .page { background: #1e293b; border: 1px solid #a5f3fc; padding: 20px; margin: 10px 0; width: 80vw; border-radius: 15px; }
        pre { background: #334155; padding: 10px; border-radius: 10px; overflow: auto; max-height: 200px; }
        button { cursor: pointer; }
      </style>
    </head>
    <body>
      <center>
        <h1>Scratch Coding Hut Wiki</h1>
        <input id="title" type="text" placeholder="Page Title" required>
        <select id="extension">
          <option value="txt">Text</option>
          <option value="html">HTML</option>
          <option value="css">CSS</option>
          <option value="js">JavaScript</option>
          <option value="py">Python</option>
          <option value="node">Node.js</option>
        </select>
        <textarea id="content" placeholder="Write your code or content here..."></textarea>
        <button onclick="savePage()">Create/Update Page</button>
        <div id="pages"></div>
      </center>
      <script>
        const API_URL = '/api'; // Local API endpoint
        let editingPageTitle = null;

        async function fetchPages() {
          const res = await fetch(\`\${API_URL}/pages\`);
          const pages = await res.json();
          document.getElementById('pages').innerHTML = pages.map(page =>
            \`<div class="page">
              <h2>\${page.title}</h2>
              <pre><code>\${page.content}</code></pre>
              <button onclick="editPage('\${page.title.split('.')[0]}', \`\${page.content.replace(/`/g, '\\`')}\`)">Edit</button>
              <button onclick="deletePage('\${page.title.split('.')[0]}')">Delete</button>
              <button onclick="runPage('\${page.title}', '\${page.extension}')">Run</button>
            </div>\`
          ).join('');
        }

        async function savePage() {
          const title = document.getElementById('title').value;
          const extension = document.getElementById('extension').value;
          const content = document.getElementById('content').value;

          if (!title || !content) {
            alert("Please provide both title and content.");
            return;
          }

          if (editingPageTitle) {
            await fetch(\`\${API_URL}/edit/\${editingPageTitle}\`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ title: \`\${title}.\${extension}\`, content })
            });
            editingPageTitle = null;
          } else {
            await fetch(\`\${API_URL}/create\`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ title: \`\${title}.\${extension}\`, content })
            });
          }

          clearForm();
          fetchPages();
        }

        function editPage(title, content) {
          document.getElementById('title').value = title;
          document.getElementById('content').value = content;
          const extension = title.split('.').pop();
          document.getElementById('extension').value = extension;
          editingPageTitle = title;
        }

        async function deletePage(title) {
          if (confirm('Are you sure you want to delete this page?')) {
            await fetch(\`\${API_URL}/delete/\${title}\`, { method: 'DELETE' });
            fetchPages();
          }
        }

        function clearForm() {
          document.getElementById('title').value = '';
          document.getElementById('content').value = '';
          document.getElementById('extension').value = 'txt';
        }

        // New function to handle running code
        async function runPage(title, extension) {
          const res = await fetch(\`\${API_URL}/run/\${title}\?extension=\${extension}\`);
          const result = await res.json();
          alert(result.output); // Alert the result of code execution
        }

        fetchPages();
        setInterval(fetchPages, 5000);
      </script>
    </body>
    </html>
  `);
});

// Fetch all pages
app.get('/api/pages', (req, res) => {
  fs.readdir(pagesDir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch pages' });
    }

    const pages = files.map(file => ({
      title: file,
      extension: file.split('.').pop(),
      content: fs.readFileSync(path.join(pagesDir, file), 'utf-8')
    }));

    res.json(pages);
  });
});

// Create a new page
app.post('/api/create', express.json(), (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  const filePath = path.join(pagesDir, title);
  fs.writeFile(filePath, content, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to create page' });
    }
    res.status(201).json({ message: 'Page created successfully' });
  });
});

// Edit an existing page
app.put('/api/edit/:title', express.json(), (req, res) => {
  const { title } = req.params;
  const { content } = req.body;
  if (!content) {
    return res.status(400).json({ error: 'Content is required' });
  }

  const filePath = path.join(pagesDir, title);
  fs.writeFile(filePath, content, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to update page' });
    }
    res.json({ message: 'Page updated successfully' });
  });
});

// Delete a page
app.delete('/api/delete/:title', (req, res) => {
  const { title } = req.params;
  const filePath = path.join(pagesDir, title);

  fs.unlink(filePath, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete page' });
    }
    res.json({ message: 'Page deleted successfully' });
  });
});

// Run code based on extension
app.get('/api/run/:title', (req, res) => {
  const { title } = req.params;
  const { extension } = req.query;
  const filePath = path.join(pagesDir, title);

  const content = fs.readFileSync(filePath, 'utf-8');

  if (extension === 'js') {
    try {
      const result = eval(content); // Execute JavaScript code
      res.json({ output: result });
    } catch (err) {
      res.json({ output: `Error: ${err.message}` });
    }
  } else if (extension === 'py') {
    // Execute Python code
    exec(`python -c "${content.replace(/"/g, '\\"')}"`, (err, stdout, stderr) => {
      if (err) {
        return res.json({ output: `Error: ${stderr}` });
      }
      res.json({ output: stdout });
    });
  } else {
    res.json({ output: 'Execution not supported for this language.' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
