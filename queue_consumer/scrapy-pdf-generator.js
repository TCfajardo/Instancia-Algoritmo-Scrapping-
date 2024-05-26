const express = require('express');
const { exec } = require('child_process');

const app = express();
const port = 3000;

app.use(express.json());

let isBusy = false;

app.post('/scrape-and-send', (req, res) => {
    const { keyword, email  } = req.body;

    if (!keyword || !email) {
        return res.status(400).send('Keyword and email are required');
    }

    if (isBusy) {
        return res.status(503).send('Instance is busy');
    }

    console.log(`Received scraping request for keyword: ${keyword}`);
    isBusy = true;

    runScrapy(keyword)
        .then(() => {
            isBusy = false;
            console.log(`Scraping completed successfully for keyword: ${keyword}`);
            res.send('Scraping completed successfully');
        })
        .catch(error => {
            isBusy = false;
            console.error(`Error executing Scrapy for keyword ${keyword}: ${error.message}`);
            res.status(500).send(`Error executing Scrapy: ${error.message}`);
        });
});

app.get('/ping', (req, res) => {
    res.json({ status: 'pong', isBusy });
});


function runScrapy(keyword) {
    return new Promise((resolve, reject) => {
        const command = `scrapy runspider ./mercadolibre_spider.py -a keyword=${keyword} -o result.json`;
        const scrapyScriptLocation = 'C:/Users/USUARIO/Documents/GitHub/Instancia-Algoritmo-Scrapping-/scrapping';
        exec(command, { cwd: scrapyScriptLocation }, (error, stdout, stderr) => {
            if (error) {
                reject(new Error(`Error executing the Scrapy script: ${error.message}`));
            } else if (stderr) {
                reject(new Error(`Error in the Scrapy script: ${stderr}`));
            } else {
                resolve(stdout);
            }
        });
    });
}


app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
