var connected=false;
const socket=io();

socket.emit("setup",userLoggedIn);
socket.on("connected",()=>connected=true);
socket.on("message received",(newMessage)=>messageReceived(newMessage));