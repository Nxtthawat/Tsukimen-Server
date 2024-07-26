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
const io = new Server(server, {
    cors:{
        origin: '*',
    }
});
const groups = {};
const MAX_GROUP_SIZE = 4;

const __dirname = dirname(fileURLToPath(import.meta.url));

var connectedUsers = [];

const generateRandomId = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 5; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

const assignUserToGroup = (socket) => {
    const groupIds = Object.keys(groups);
    const nonFullGroupIds = groupIds.filter(groupId => groups[groupId].members.length < MAX_GROUP_SIZE);

    let assignedGroup = null;

    if (nonFullGroupIds.length === 0) {
        // All groups are full or no groups exist, create a new group
        const newGroupId = `${generateRandomId()}`;
        groups[newGroupId] = { members: [] };
        assignedGroup = newGroupId;
    } else {
        // Randomly select a non-full group
        const randomIndex = Math.floor(Math.random() * nonFullGroupIds.length);
        assignedGroup = nonFullGroupIds[randomIndex];
    }

    // Add the user to the assigned group
    groups[assignedGroup].members.push(socket);
    socket.groupId = assignedGroup; // Store groupId on socket for future reference
};

app.use(cors());


// API Route
app.use('/api/user', userRoute);

io.on("connection", (socket) => {
    socket.username = socket.handshake.query.anonName;
    console.log(socket.username + " connected");
    
    if(socket.username === undefined){
        console.log("No username provided");
    }

    assignUserToGroup(socket); // Assign user to a group upon connection

    connectedUsers.push({id: socket.id ,username: socket.username, characters: 'src/assets/MCMale.png', roomId: socket.groupId});

    // Broadcast user connected message only within the same group
    groups[socket.groupId].members.forEach(member => {
        if (member !== socket) { // Don't send the message back tdeo the connector
            member.emit("userConnected", socket.username);
            member.emit("roomId", socket.groupId);
        }else{
            member.emit("roomId", socket.groupId);
        }
    });

    socket.on("sendMessage", (msg) => {
        // Broadcast message only to members of the same group
        const group = groups[socket.groupId];
        if (group) {
            group.members.forEach(member => {
                if (member !== socket) { // Don't send the message back to the sender
                    member.emit("chatMessage", {username: socket.username, message: msg});
                }
            });
        }
    });

    socket.on("disconnect", () => {
        const group = groups[socket.groupId];

        if (group) {
            const index = group.members.indexOf(socket);
            if (index !== -1) {
                group.members.splice(index, 1); // Remove the user from the group
            }

            // Broadcast user disconnected message only within the same group
            groups[socket.groupId].members.forEach(member => {
                if (member !== socket) { // Don't send the message back to the disconnected user
                    member.emit("userDisconnected", socket.username);
                    connectedUsers = connectedUsers.filter(user => user.id !== socket.id);
                    member.emit('updateUserList', connectedUsers);
                }
            });

            // Check if the group is now empty
            if (group.members.length === 0) {
                console.log(`Group ${socket.groupId} is now empty. Deleting...`);
                delete groups[socket.groupId]; // Delete the group if empty
                connectedUsers = connectedUsers.filter(user => user.id !== socket.id);
                io.emit('updateUserList', connectedUsers);
            }
        }
    });

    socket.emit('updateUserList', connectedUsers)
});

app.get('/', (req,res)=>{
    res.sendFile(join(__dirname, 'index.html'));
});

server.listen(3000, ()=>{
    console.log("server is running on port 3000")
})