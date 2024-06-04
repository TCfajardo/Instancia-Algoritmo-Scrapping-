require('dotenv').config();
const http = require('http');
const express = require('express');
const { exec } = require('child_process');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
const PORT = process.env.NODE_PORT;

app.use(express.json());

let isBusy = false;

app.post('/scrape-and-send', (req, res) => {
    const { keyword, email } = req.body;

    if (!keyword || !email) {
        return res.status(400).send('Keyword and email are required');
    }

    if (isBusy) {
        return res.status(503).send('Instance is busy');
    }

    console.log(`Received scraping request for keyword: ${keyword}`);
    console.log(`Received scraping request for email: ${email}`);
    isBusy = true;

    runScrapy(keyword, email)
        .then(pdfFileName => sendEmail(email, pdfFileName))
        .then(() => {
            isBusy = false;
            res.send('Scraping and PDF generation completed successfully, email sent');
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

function runScrapy(keyword, email) {
    return new Promise((resolve, reject) => {
        const fileName = `${keyword}-${email}.json`;
        const pdfFileName = `${keyword}-${email}.pdf`;
        const command = `scrapy runspider ./mercadolibre_spider.py -a keyword=${keyword} -o ${fileName}`;
        const scrapyScriptLocation = 'C:/Users/ACER_COREI5/Documents/GitHub/Instancia-Algoritmo-Scrapping-/scrapping';

        exec(command, { cwd: scrapyScriptLocation }, (error, stdout, stderr) => {
            if (error) {
                return reject(new Error(`Error executing the Scrapy script: ${error.message}`));
            }
            if (stderr) {
                console.error(`Stderr from Scrapy script: ${stderr}`);
            }
            console.log(`Stdout from Scrapy script: ${stdout}`);

            const pythonCommand = `python generate_pdf.py ${fileName} ${pdfFileName}`;
            exec(pythonCommand, { cwd: scrapyScriptLocation }, (pythonError, pythonStdout, pythonStderr) => {
                if (pythonError) {
                    return reject(new Error(`Error generating PDF: ${pythonError.message}`));
                }
                if (pythonStderr) {
                    console.error(`Stderr from PDF generation script: ${pythonStderr}`);
                }
                console.log(`Stdout from PDF generation script: ${pythonStdout}`);
                resolve(path.join(scrapyScriptLocation, pdfFileName));
            });
        });
    });
}

function sendEmail(to, pdfFilePath) {
    return new Promise((resolve, reject) => {
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        let mailOptions = {
            from: process.env.EMAIL_USER,
            to: to,
            subject: 'Resultados de Scraping',
            text: 'Por favor, encuentre adjunto el archivo PDF con los resultados del scraping.',
            attachments: [
                {
                    filename: path.basename(pdfFilePath),
                    path: pdfFilePath
                }
            ]
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return reject(error);
            }
            console.log('Email sent: ' + info.response);
            resolve(info);
        });
    });
}

const server = http.createServer(app);
server.listen(PORT, () => {
    console.log(`Servidor HTTP escuchando en el puerto ${PORT}`);
});
