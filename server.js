const express = require('express');
const multer = require('multer');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

// Serve static files
app.use(express.static(__dirname));

// Decompilation endpoint
app.post('/decompile', upload.single('file'), (req, res) => {
    const inputFile = req.file.path;
    const options = req.body.options || '';
    
    // Resolve absolute path to unluac.jar (must be in the same folder)
    const jarPath = path.join(__dirname, 'unluac.jar');
    
    // Check if unluac.jar exists
    if (!fs.existsSync(jarPath)) {
        fs.unlinkSync(inputFile);
        return res.status(500).send('Error: unluac.jar not found in ' + __dirname);
    }
    
    // Build command - use absolute paths to avoid spaces issues
    const command = `java -jar "${jarPath}" ${options} "${inputFile}"`;
    
    console.log(`Running: ${command}`);
    
    exec(command, { maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
        // Clean up uploaded file
        fs.unlinkSync(inputFile);
        
        if (err) {
            console.error(`Error: ${stderr}`);
            // Provide user-friendly message
            let errorMsg = stderr || err.message;
            if (errorMsg.includes('java not found') || errorMsg.includes('not recognized')) {
                errorMsg = 'Java is not installed or not in PATH. Please install Java Runtime Environment (JRE).';
            } else if (errorMsg.includes('ClassNotFoundException')) {
                errorMsg = 'unluac.jar is corrupted or invalid. Download a fresh copy.';
            }
            res.status(500).send(`Error: ${errorMsg}`);
        } else {
            res.send(stdout);
        }
    });
});

app.listen(8080, () => {
    console.log('Server running at http://127.0.0.1:8080');
    console.log('Make sure unluac.jar is in the same folder as server.js');
    console.log('Java must be installed and accessible');
});