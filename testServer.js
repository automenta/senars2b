const express = require('express');
const path = require('path');

const app = express();
const port = 3000;

// Serve static files from the current directory
app.use(express.static(path.join(__dirname)));

// Serve the new unified interface as the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'newUnifiedInterface.html'));
});

app.listen(port, () => {
    console.log(`Test server listening at http://localhost:${port}`);
});