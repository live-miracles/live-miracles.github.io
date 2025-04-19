const express = require('express');
const https = require('https');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { marked } = require('marked');
const net = require('net');

const app = express();
app.use(express.json());

app.use(
    cors({
        origin: 'https://live-miracles.github.io',
        credentials: true, // if you're using cookies or auth headers
    }),
);

const folderName = '.';
const readmePath = path.join(__dirname, folderName, 'README.md');

app.use('/', express.static(path.join(__dirname, folderName)));

app.get('/', (req, res) => {
    fs.readFile(readmePath, 'utf8', (err, data) => {
        if (err) {
            res.status(500).send('Error reading README.md');
        } else {
            const htmlContent = marked(data);
            res.send(htmlContent);
        }
    });
});

const statusRoutes = require('./delayed-yt/routes');
app.use('/delayed-yt/api', statusRoutes);

// Handle 404 errors for undefined routes
app.use((req, res) => {
    res.status(404).send('404: Not Found');
});

// Function to check if a port is available
const checkPort = (port) => {
    return new Promise((resolve, reject) => {
        const tester = net
            .createServer()
            .once('error', (err) => (err.code === 'EADDRINUSE' ? resolve(false) : reject(err)))
            .once('listening', () => tester.once('close', () => resolve(true)).close())
            .listen(port);
    });
};

// Start the server with dynamic port allocation
const startServer = async (port) => {
    let currentPort = port;
    while (!(await checkPort(currentPort))) {
        console.log(`Port ${currentPort} is taken. Trying port ${currentPort + 1}...`);
        currentPort++;
    }

    app.listen(currentPort, () => {
        console.log(`HTTP server is running at http://localhost:${currentPort}/`);
    });
};

// Start the process by checking port 3000 & 80
startServer(3000).catch((err) => {
    console.error('Error starting the server:', err);
});
startServer(80).catch((err) => {
    console.error('Error starting the server:', err);
});

const options = {
    key: fs.readFileSync('./localhost-key.pem'),
    cert: fs.readFileSync('./localhost-cert.pem'),
};
https.createServer(options, app).listen(443, () => {
    console.log('HTTPS server is running at https://localhost:443/');
});
