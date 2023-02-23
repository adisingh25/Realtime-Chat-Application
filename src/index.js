const path = require('path')
const express = require('express')
const http = require('http')
const socketio = require('socket.io')
const Filter = require('bad-words')

const { generateMessage, generateLocation } = require('./utils/messages.js')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users.js')


const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.port || 3000

const publicDrirectoryPath = path.join(__dirname, '../public')


app.use(express.static(publicDrirectoryPath))

// let count = 0
io.on('connection', (socket) => {
    console.log("new connection from the client side")


    

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id)

      

        const filter = new Filter()

        if(filter.isProfane(message)){
            return callback('These words are not allowed')
        }
        io.to(user.room).emit('message', generateMessage(user.username, message))
        callback()
    })


    socket.on('join', ({username, room}, callback) => {

        const {user, error} = addUser({id : socket.id, username, room})

        if(error) {
            return callback(error)
        }

        socket.join(user.room)
        socket.emit('message', generateMessage('Admin' , 'WELCOME ! to this chat world!'))
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin' , `${user.username} has joined the room!`))
        io.to(user.room).emit('roomData', {
            room : user.room,
            users : getUsersInRoom(user.room)
        })
        callback()

    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        if(user) {
            io.to(user.room).emit('message', generateMessage('Admin' , `${user.username} has left the room!`))
            io.to(user.room).emit('roomData', {
                room : user.room,
                users : getUsersInRoom(user.room)
            })
        }
        
    })

    socket.on('sendLocation', ({latitude, longitude}, callback) => {
        const user = getUser(socket.id)

        io.to(user.room).emit('locationMessage', generateLocation(user.username, `http://www.google.com/maps?q=${latitude},${longitude}`))
        callback('ACKNOWLEDGED!!')
    })

    // socket.emit('countUpdate', count)

    // socket.on('increment', () => {
    //     count++;
    //     // socket.emit('countUpdate', count)      --only to that connection the value of the count gets updated
    //     io.emit('countUpdate', count)             //all the clients/connections get the updated value
    // }) 
})

server.listen(port, () => {
    console.log('Servers is running at ', port)
})
