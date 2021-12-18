const express = require('express');
const app=express();
const PORT = process.env.PORT ||3000;
const path = require('path');
const http=require('http');
const server= http.createServer(app);
const socketio=require('socket.io');
const io=socketio(server);
const formatMessage = require('./utils/messages');
const {userJoin,getCurrentUser,userLeaves,getRoomUsers} = require('./utils/users');

//set static folder
app.use(express.static(path.join(__dirname,'public')));

//run when client connects
io.on('connection',socket=>{
    const botName='ChatCord Bot';
    socket.on('joinRoom',({username,room})=>{
        const user=userJoin(socket.id,username,room);
        socket.join(user.room);
        //welcome, current user
        socket.emit('message',formatMessage(botName,'welcome to chatcord!'));
    
        //brodcastes when a user connects
        socket.broadcast.to(user.room).emit('message',formatMessage(botName,`${user.username} has joined the chat`));    
        //send users room info
        io.to(user.room).emit('roomUsers',{
            room:user.room,
            users:getRoomUsers(user.room)
        });
    });

    //listen a chatMessgage
    socket.on('chatMessage',(msg)=>{
        const user=getCurrentUser(socket.id)
        io.to(user.room).emit('message',formatMessage(user.username,msg));
    });

    //runs when clients disconnects
    socket.on('disconnect',()=>{
        const user=userLeaves(socket.id);
        if(user){
            io.to(user.room).emit('message',formatMessage(botName,`${user.username} has left the chat`));
            //send users room info
            io.to(user.room).emit('roomUsers',{
                room:user.room,
                users:getRoomUsers(user.room)
            });
        }
    });
});

server.listen(PORT,console.log(`server started on ${PORT}`));