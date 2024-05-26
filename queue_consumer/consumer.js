require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const socketIoClient = require('socket.io-client');
const { spawn } = require('child_process');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT;
const NODE_IP = process.env.NODE_IP;
const IP_SW = process.env.IP_SW || 'http://localhost:4000';

const clientUrl = `http://${NODE_IP}:${PORT}`;

const socket = socketIoClient(IP_SW, {
    query: { clientUrl: clientUrl }
});

// Manejar eventos de conexión y desconexión
socket.on('connect', () => {
    console.log('Conectado al servidor WebSocket');
});

socket.on('disconnect', () => {
    console.log('Desconectado del servidor WebSocket');
});

// Escuchar evento enviado por el servidor de cola
socket.on('new-job', ({ keyword, email }) => {
    console.log('Nuevo trabajo recibido:');
    console.log('Keyword:', keyword);
    console.log('Email:', email);

    // Ejecutar el script de Python con la palabra clave como argumento
    ejecutarScrapy(keyword);
});

function ejecutarScrapy(keyword) {
    console.log(`Iniciando Scrapy con la palabra clave: ${keyword}`);

    const scrapyProcess = spawn('scrapy', ['runspider', 'C:/Users/ACER_COREI5/Documents/GitHub/Instancia-Algoritmo-Scrapping-/scrapping/search_mercadolibre.py', '-a', `keyword=${keyword}`, '-o', 'mercado_libre.json']);

    // Capturar la salida estándar de Scrapy
    scrapyProcess.stdout.on('data', (data) => {
        console.log(`Resultado de Scrapy: ${data.toString()}`);
    });

    // Capturar los errores de Scrapy
    scrapyProcess.stderr.on('data', (data) => {
        console.error(`Error al ejecutar Scrapy: ${data.toString()}`);
    });

    // Manejar el evento de cierre del proceso
    scrapyProcess.on('close', (code) => {
        console.log(`Proceso de Scrapy finalizado con código ${code}`);
        if (code === 0) {
            // Leer y mostrar el contenido del archivo JSON generado por Scrapy
            fs.readFile('mercado_libre.json', 'utf8', (err, data) => {
                if (err) {
                    console.error('Error al leer el archivo JSON:', err);
                } else {
                    console.log('Contenido del archivo JSON:', data);
                    // Aquí puedes enviar el contenido por correo electrónico o realizar otras acciones necesarias
                }
            });
        }
    });
}

const server = http.createServer(app);
server.listen(PORT, () => {
    console.log(`Servidor HTTP escuchando en el puerto ${PORT}`);
});
