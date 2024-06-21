import express from 'express'
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Server } from 'socket.io';
import cors from 'cors';

// Routes Import
import userRoute from './api/users.js'

const app = express();
const server = createServer(app);
const io = new Server(server);

const __dirname = dirname(fileURLToPath(import.meta.url));

app.use(cors());

// API Route
app.use('/api/user', userRoute);


app.get('/', (req,res)=>{
    res.sendFile(join(__dirname, 'index.html'));
});

server.listen(3000, ()=>{
    console.log("server is running on port 3000")
})