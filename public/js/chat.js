

const socket = io()




const $messageForm = document.getElementById('messageForm')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.getElementById('send-location')

const $messages = document.getElementById('messages')


//the one below is one of our template to render the message 
const messageTemplate =document.getElementById('message-template').innerHTML
const locationTemplate = document.getElementById('location-template').innerHTML
const sidebarTemplate = document.getElementById('sidebar-template').innerHTML

//OPTIONS          (--ignoreQueryPrefix ignores the '?' in the query string)
const {username, room }= Qs.parse(location.search, { ignoreQueryPrefix : true})

const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message', (messageText) => {
    console.log(messageText)

    const html = Mustache.render(messageTemplate, {
        username : messageText.username,
        message : messageText.text,
        createdAt : moment(messageText.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})


socket.on('locationMessage', (locationmessage) => {
    console.log(locationmessage)

    const html = Mustache.render(locationTemplate, {
        username : locationmessage.username,
        url : locationmessage.url,
        createdAt : moment(locationmessage.createdAt).format('h:mm a')
    })

    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()

})


socket.on('roomData', ({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })

    document.getElementById('sidebar').innerHTML = html
})


const formSubmit = document.getElementById('messageForm')

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()
    //disable the form until u get the acknowledgment

    $messageFormButton.setAttribute('disabled', 'disabled')



    const message = e.target.elements.message.value



    socket.emit('sendMessage', message, (error) => {
        
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value=''
        $messageFormInput.focus()


        if(error) {
            return console.log(error)
        }
        else {
            console.log(`This message was delivered Successfully!`)
        }
    })
})


$sendLocationButton.addEventListener('click', () => {

    $sendLocationButton.setAttribute('disabled', 'disabled')
    if(!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser')
    }

   
    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            latitude : position.coords.latitude,
            longitude : position.coords.longitude
        }, (ack) => {
            
            $sendLocationButton.removeAttribute('disabled')
            console.log('Your Location was sent!', ack)
        }) 
    })

})


socket.emit('join', {username, room}, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})


// const incrementButton  = document.getElementById('increment')

// incrementButton.addEventListener('click', () => {
//     console.log('You clicked me')
//     socket.emit('increment')
// })