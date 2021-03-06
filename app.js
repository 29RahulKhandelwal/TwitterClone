require("dotenv").config();
const express=require("express");
const pug=require("pug");
const middleware=require("./middleware");
const path=require("path");
const mongoose=require("mongoose");
const bcrypt=require("bcrypt");
const session=require("express-session");
const fs=require("fs");
const multer=require("multer");
const upload=multer({dest:"uploads/"})
const socketio=require("socket.io");
const http=require("http");
const app=express();

const server=http.createServer(app);
const io=socketio(server);

app.set("view engine","pug");
app.use(express.static(path.join(__dirname,"public")));
app.use(express.urlencoded({extended:true}));
app.use(session({
    secret:process.env.Secret,
    resave:true,
    saveUninitialized:false
}));

mongoose.connect("mongodb+srv://admin:admin@cluster0.hf4xy.mongodb.net/TwitterCloneDB?retryWrites=true&w=majority",{
  useNewUrlParser:true,
  useUnifiedTopology:true
});
const Schema=mongoose.Schema;
const userSchema=new Schema({
    firstname:{
        type:String,
        required:true,
        trim:true
    },
    lastname:{
        type:String,
        required:true,
        trim:true
    },
    username:{
        type:String,
        required:true,
        trim:true,
        unique:true
    },
    email:{
        type:String,
        required:true,
        trim:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    },
    profilePic:{
        type:String,
        default:"/images/profilePic.png"
    },
    coverPhoto:{
        type:String
    },
    likes:[{
        type:Schema.Types.ObjectId,
        ref:'Post'
    }],
    retweets:[{
        type:Schema.Types.ObjectId,
        ref:'Post'
    }],
    following:[{
        type:Schema.Types.ObjectId,
        ref:'User'
    }],
    followers:[{
        type:Schema.Types.ObjectId,
        ref:'User'
    }],
},{timestamps:true});
const User=mongoose.model("User",userSchema);

const postSchema=new Schema({
    content:{
        type:String,
        trim:true
    },
    postedBy:{
        type:Schema.Types.ObjectId,
        ref:'User'
    },
    pinned:Boolean,
    likes:[{
        type:Schema.Types.ObjectId,
        ref:'User'
    }],
    retweetUsers:[{
        type:Schema.Types.ObjectId,
        ref:'User'
    }],
    retweetData:{
        type:Schema.Types.ObjectId,
        ref:'Post'
    },
    replyTo:{
        type:Schema.Types.ObjectId,
        ref:'Post'
    },
},{timestamps:true})
const Post=mongoose.model("Post",postSchema);

const chatSchema=new Schema({
    chatName:{type:String, trim:true},
    isGroupChat:{type:Boolean,default:false},
    users:[{type:Schema.Types.ObjectId,ref:'User'}],
    latestMessage:{type:Schema.Types.ObjectId,ref:'Message'}
},{timestamps:true});
const Chat=mongoose.model("Chat",chatSchema);

const messageSchema=new Schema({
    sender:{type:Schema.Types.ObjectId,ref:'User'},
    content:{type:String, trim:true},
    chat:{type:Schema.Types.ObjectId,ref:'Chat'},
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
},{timestamps:true});
const Message=mongoose.model("Message",messageSchema);

const NotificationSchema=new Schema({
    userTo:{type:Schema.Types.ObjectId,ref:'User'},
    userFrom:{type:Schema.Types.ObjectId,ref:'User'},
    notificationType:{type:String, trim:true},
    opened:{type:Boolean,default:false},
    entityId:Schema.Types.ObjectId,
},{timestamps:true});
NotificationSchema.statics.insertNotification=async (userTo,userFrom,notificationType,entityId)=>{
    var data={
        userTo:userTo,
        userFrom:userFrom,
        notificationType:notificationType,
        entityId:entityId
    };

    await Notification.deleteOne(data).catch(error=>console.log(error));
    return Notification.create(data).catch(error=>console.log(error));
}
const Notification=mongoose.model("Notification",NotificationSchema);

app.get("/",middleware.requireLogin,(req,res,next)=>{
    var payload={
        pageTitle:"Home - This is not the official Twitter site, Its a clone",
        userLoggedIn:req.session.user,
        userLoggedInJs:JSON.stringify(req.session.user),
    }
    res.render("home",payload);
})

app.get("/login",(req,res,next)=>{
    var payload={
        pageTitle:"Login"
    }
    res.render("login",payload);
})

app.post("/login",async (req,res,next)=>{
    var payload = req.body;

    if(req.body.logUsername && req.body.logPassword) {
        var user = await User.findOne({
            $or: [
                { username: req.body.logUsername },
                { email: req.body.logUsername }
            ]
        })
        .catch((error) => {
            console.log(error);
            payload.errorMessage = "Something went wrong.";
            res.status(200).render("login", payload);
        });
        
        if(user != null) {
            var result = await bcrypt.compare(req.body.logPassword, user.password);

            if(result === true) {
                req.session.user = user;
                return res.redirect("/");
            }
        }

        payload.errorMessage = "Login credentials incorrect.";
        return res.status(200).render("login", payload);
    }

    payload.errorMessage = "Make sure each field has a valid value.";
    res.status(200).render("login");
})

app.get("/register",(req,res,next)=>{
    var payload={
        pageTitle:"Register"
    }
    res.render("register",payload);
})
app.post("/register",async (req,res,next)=>{
    var firstname=req.body.firstname.trim()
    var lastname=req.body.lastname.trim()
    var username=req.body.username.trim()
    var email=req.body.email.trim()
    var password=req.body.password

    var payload=req.body;

    if(firstname && lastname && username && email && password){
        var user=await User.findOne({
            $or:[
                {username:username},   
                {email:email}   
            ]
        })
        .catch((error)=>{
            console.log(error);
            payload.errorMessage="Something went wrong!.";
            res.render("register",payload);
        });

        if(user==null){
            // No user found
            var data=req.body;
            data.password=await bcrypt.hash(password,10);
            User.create(data)
            .then((user)=>{
                req.session.user=user;
                return res.redirect("/")
            })
        }else{
            // User found
            if(email==user.email){
                payload.errorMessage="Email Already In Use.";
            }else{
                payload.errorMessage="Username Already In Use.";
            }
            res.render("register",payload);
        }

    }else{
        payload.errorMessage="Make sure each field have a valid value.";
        res.render("register",payload);
    }
})

app.get("/api/posts",async (req,res,next)=>{
    var searchObj=req.query;

    if(searchObj.isReply !== undefined){
        var isReply=searchObj.isReply=="true";
        searchObj.replyTo={$exists: isReply}
        delete searchObj.isReply;
    }
    
    if(searchObj.search!==undefined){
        searchObj.content={$regex:searchObj.search,$options:"i"};
        delete searchObj.search;
    }

    if(searchObj.followingOnly !== undefined){
        var followingOnly=searchObj.followingOnly == "true";

        if(followingOnly){
            // Following User's posts
            var objectIds=[];
            if(!req.session.user.following){
                req.session.user.following=[];
            }
            req.session.user.following.forEach(user=>{
                objectIds.push(user);
            })
            // login user posts
            objectIds.push(req.session.user._id)
    
            searchObj.postedBy={$in: objectIds}
        }
        delete searchObj.followingOnly;
    }
    

    var results=await getPosts(searchObj);
    res.send(results);
})

app.post("/api/posts",async (req,res,next)=>{
    if(!req.body.content){
        console.log("content param not sent with request");
        return res.sendStatus(400);
    }
    var postData={
        content:req.body.content,
        postedBy:req.session.user
    }

    if(req.body.replyTo){
        postData.replyTo=req.body.replyTo;
    }

    Post.create(postData)
    .then(async newPost=>{
        newPost=await User.populate(newPost, {path:"postedBy"})
        newPost=await Post.populate(newPost, {path:"replyTo"})
        if(newPost.replyTo!==undefined){
            await Notification.insertNotification(newPost.replyTo.postedBy,req.session.user._id,"reply",newPost._id);
        }
        res.status(201).send(newPost);
    })
    .catch((error)=>{
        console.log(error);
        res.sendStatus(400);
    })
})

app.get("/api/posts/:id",async (req,res,next)=>{
    var postId=req.params.id;
    // console.log(postId)
    var postData=await getPosts({_id:postId});
    postData=postData[0];
    // console.log(postData)

    var results={
        postData:postData
    }

    if(postData.replyTo != undefined){
        results.replyTo=postData.replyTo;
    }

    results.replies=await getPosts({replyTo:postId});

    res.send(results);
})  

app.put("/api/posts/:id/like",async (req,res,next)=>{
    var postId=req.params.id;
    var userId=req.session.user._id;
    var isLiked=req.session.user.likes && req.session.user.likes.includes(postId);

    var option= isLiked ? "$pull" : "$addToSet";
    //Insert user L ike
    req.session.user=await User.findByIdAndUpdate(userId,{ [option]:{likes:postId}},{new:true})
    .catch(error=>{
        console.log(error);
    })   

    // Insert post Like
    var post=await Post.findByIdAndUpdate(postId,{ [option]:{likes:userId}},{new:true})
    .catch(error=>{
        console.log(error);
    })

    if(!isLiked){
        await Notification.insertNotification(post.postedBy,req.session.user._id,"postLike",post._id);
    }

    res.send(post)
})

app.post("/api/posts/:id/retweet",async (req,res,next)=>{
    var postId = req.params.id;
    var userId = req.session.user._id;

    // Try and delete retweet
    var deletedPost = await Post.findOneAndDelete({ postedBy: userId, retweetData: postId })
    .catch(error => {
        console.log(error);
    })

    var option = deletedPost != null ? "$pull" : "$addToSet";
    var repost = deletedPost;

    if (repost == null) {
        repost = await Post.create({ postedBy: userId, retweetData: postId })
        .catch(error => {
            console.log(error);
            res.sendStatus(400);
        })
    }

    // Insert user like
    req.session.user = await User.findByIdAndUpdate(userId, { [option]: { retweets: repost._id } }, { new: true})
    .catch(error => {
        console.log(error);
    })

    // Insert post like
    var post = await Post.findByIdAndUpdate(postId, { [option]: { retweetUsers: userId } }, { new: true})
    .catch(error => {
        console.log(error);
    })

    if(!deletedPost){
        await Notification.insertNotification(post.postedBy,req.session.user._id,"retweet",post._id);
    }

    res.send(post)
})

app.get("/posts/:id",middleware.requireLogin,(req,res,next)=>{
    var payload={   
        pageTitle:"View Post",
        userLoggedIn:req.session.user,
        userLoggedInJs:JSON.stringify(req.session.user),
        postId:req.params.id
    }
    res.render("postPage",payload);
})

app.delete("/api/posts/:id",(req,res,next)=>{
    Post.findByIdAndDelete(req.params.id)
    .then(()=>res.sendStatus(202))
    .catch(error=>{
        console.log(error);
        res.sendStatus(400);
    })
})

app.put("/api/posts/:id",async(req,res,next)=>{
    if(req.body.pinned!==undefined){
        await Post.updateMany({postedBy:req.session.user},{pinned:false})
        .catch(error=>{
            console.log(error);
            res.sendStatus(400);
        })
    }
    Post.findByIdAndUpdate(req.params.id,req.body)
    .then(()=>res.sendStatus(204))
    .catch(error=>{
        console.log(error);
        res.sendStatus(400);
    })
})
app.get("/profile/",middleware.requireLogin, (req, res, next) => {
    var payload = {
        pageTitle: req.session.user.username,
        userLoggedIn: req.session.user,
        userLoggedInJs: JSON.stringify(req.session.user),
        profileUser: req.session.user
    }
    res.status(200).render("profilePage", payload);
})

app.get("/profile/:username",middleware.requireLogin, async (req, res, next) => {
    var payload = await getPayload(req.params.username, req.session.user);
    res.status(200).render("profilePage", payload);
})

app.get("/profile/:username/replies",middleware.requireLogin, async (req, res, next) => {
    var payload = await getPayload(req.params.username, req.session.user);
    payload.selectedTab="replies";
    res.status(200).render("profilePage", payload);
})

app.get("/api/users",async (req,res,next)=>{
    var searchObj=req.query;
    if(req.query.search!==undefined){
        searchObj={
            $or:[
                {firstname:{$regex:req.query.search,$options:"i"}},
                {lastname:{$regex:req.query.search,$options:"i"}},
                {username:{$regex:req.query.search,$options:"i"}},
            ]
        }
    }
    User.find(searchObj)
    .then(results=>res.send(results))
    .catch(error=>console.log(error))
})
app.put("/api/users/:userId/follow",async (req,res,next)=>{
    var userId=req.params.userId;
    var user=await User.findById(userId)
    
    if(user==null) return res.sendStatus(404)
    
    var isFollowing=user.followers && user.followers.includes(req.session.user._id)
    var option=isFollowing ? "$pull" : "$addToSet"
    
    req.session.user=await User.findByIdAndUpdate( req.session.user._id,{ [option]:{following:userId}},{new:true})
    .catch(error=>{
        console.log(error);
    })
    
    User.findByIdAndUpdate( userId,{ [option]:{followers:req.session.user._id}})
    .catch(error=>{
        console.log(error);
    })

    if(!isFollowing){
        await Notification.insertNotification(userId,req.session.user._id,"follow",req.session.user._id);
    }
    
    res.status(200).send(req.session.user);
})

app.get("/profile/:username/following",middleware.requireLogin, async (req, res, next) => {
    var payload = await getPayload(req.params.username, req.session.user);
    payload.selectedTab="following";
    res.status(200).render("followers&following", payload);
})

app.get("/profile/:username/followers",middleware.requireLogin, async (req, res, next) => {
    var payload = await getPayload(req.params.username, req.session.user);
    payload.selectedTab="followers";
    res.status(200).render("followers&following", payload);
})

app.get("/api/users/:userId/following",async (req,res,next)=>{
    User.findById(req.params.userId)
    .populate("following")
    .then(results=>{
        res.status(200).send(results);
    })
    .catch(error=>{
        console.log(error);
        res.sendStatus(400);
    })
})

app.get("/api/users/:userId/followers",async (req,res,next)=>{
    User.findById(req.params.userId)
    .populate("followers")
    .then(results=>{
        res.status(200).send(results);
    })
    .catch(error=>{
        console.log(error);
        res.sendStatus(400);
    })
})

app.post("/api/users/profilePicture",upload.single("croppedImage"),async (req,res,next)=>{
    if(!req.file){
        console.log("no file uploaded with ajax request");
        return res.sendStatus(400);
    }
    var filePath=`/uploads/images/${req.file.filename}.png`;
    var tempPath=req.file.path;
    var targetPath=path.join(__dirname,`/${filePath}`);
    fs.rename(tempPath,targetPath,async error=>{
        if(error!=null){
            console.log(error);
            return res.sendStatus(400);
        }
        req.session.user=await User.findByIdAndUpdate(req.session.user._id,{profilePic:filePath},{new:true});
        res.sendStatus(204);
    })
})

app.get("/uploads/images/:path",(req,res,next)=>{
    res.sendFile(path.join(__dirname,"/uploads/images/"+req.params.path))
})

app.post("/api/users/coverPhoto",upload.single("croppedImage"),async (req,res,next)=>{
    if(!req.file){
        console.log("no file uploaded with ajax request");
        return res.sendStatus(400);
    }
    var filePath=`/uploads/images/${req.file.filename}.png`;
    var tempPath=req.file.path;
    var targetPath=path.join(__dirname,`/${filePath}`);
    fs.rename(tempPath,targetPath,async error=>{
        if(error!=null){
            console.log(error);
            return res.sendStatus(400);
        }
        req.session.user=await User.findByIdAndUpdate(req.session.user._id,{coverPhoto:filePath},{new:true});
        res.sendStatus(204);
    })
})

app.get("/search",middleware.requireLogin,(req,res,next)=>{
    var payload=createPayload(req.session.user)
    res.render("searchPage",payload);
})

app.get("/search/:selectedTab",middleware.requireLogin,(req,res,next)=>{
    var payload=createPayload(req.session.user)
    payload.selectedTab=req.params.selectedTab
    res.render("searchPage",payload);
})

app.get("/messages",middleware.requireLogin,(req,res,next)=>{
    var payload={
        pageTitle:"Inbox",
        userLoggedIn:req.session.user,
        userLoggedInJs:JSON.stringify(req.session.user),
    }
    res.render("inboxPage",payload);
})

app.get("/messages/new",middleware.requireLogin,(req,res,next)=>{
    var payload={
        pageTitle:"New Message",
        userLoggedIn:req.session.user,
        userLoggedInJs:JSON.stringify(req.session.user),
    }
    res.render("newMessage",payload);
})

app.post("/api/chats", async (req, res, next) => {
    if(!req.body.users) {
        console.log("Users param not sent with request");
        return res.sendStatus(400);
    }

    var users = JSON.parse(req.body.users);

    if(users.length == 0) {
        console.log("Users array is empty");
        return res.sendStatus(400);
    }

    users.push(req.session.user);

    var chatData = {
        users: users,
        isGroupChat: true
    };

    Chat.create(chatData)
    .then(results => res.status(200).send(results))
    .catch(error => {
        console.log(error);
        res.sendStatus(400);
    })
})

app.get("/api/chats", async (req, res, next) => {
    Chat.find({ users: { $elemMatch: { $eq: req.session.user._id } }})
    .populate("users")
    .populate("latestMessage")
    .sort({ updatedAt: -1 })
    .then(async results => {

        if(req.query.unreadOnly !== undefined && req.query.unreadOnly == "true") {
            results = results.filter(r => r.latestMessage && !r.latestMessage.readBy.includes(req.session.user._id));
        }

        results = await User.populate(results, { path: "latestMessage.sender" });
        res.status(200).send(results)
    })
    .catch(error=>console.log(error))
})

app.get("/api/chats/:chatId", async (req, res, next) => {
    Chat.findOne({_id:req.params.chatId,users:{$elemMatch:{$eq:req.session.user._id}}})
    .populate("users")
    .then(results=>res.status(200).send(results))
    .catch(error=>{
        console.log(error);
        res.sendStatus(400)
    })
})

app.put("/api/chats/:chatId", async (req, res, next) => {
    Chat.findByIdAndUpdate(req.params.chatId,req.body)
    .then(results=>res.send(results))
    .catch(error=>console.log(error))
})

app.get("/api/chats/:chatId/messages", async (req, res, next) => {
    Message.find({chat:req.params.chatId})
    .populate("sender")
    .then(results=>res.status(200).send(results))
    .catch(error=>{
        console.log(error);
        res.sendStatus(400)
    })
})

app.get("/messages/:chatId",middleware.requireLogin,async (req,res,next)=>{
    var userId = req.session.user._id;
    var chatId = req.params.chatId;
    var isValidId = mongoose.isValidObjectId(chatId);


    var payload = {
        pageTitle: "Chat",
        userLoggedIn: req.session.user,
        userLoggedInJs: JSON.stringify(req.session.user)
    };

    if(!isValidId) {
        payload.errorMessage = "Chat does not exist or you do not have permission to view it.";
        return res.status(200).render("chatPage", payload);
    }

    var chat = await Chat.findOne({ _id: chatId, users: { $elemMatch: { $eq: userId } } })
    .populate("users");

    if(chat == null) {
        // Check if chat id is really user id
        var userFound = await User.findById(chatId);

        if(userFound != null) {
            // get chat using user id
            chat = await getChatByUserId(userFound._id, userId);
        }
    }

    if(chat == null) {
        payload.errorMessage = "Chat does not exist or you do not have permission to view it.";
    }
    else {
        payload.chat = chat;
    }

    res.status(200).render("chatPage", payload);
})

app.post("/api/messages",middleware.requireLogin,async (req,res,next)=>{
    if(!req.body.content || !req.body.chatId){
        console.log("invalid data passed into request");
        res.sendStatus(400);
    }
    var newMessage={
        sender:req.session.user._id,
        content:req.body.content,
        chat:req.body.chatId
    };
    Message.create(newMessage)
    .then(async message=>{
        await message.populate("sender")
        await message.populate("chat")
        await User.populate(message,{path:"chat.users"});
        var chat=await Chat.findByIdAndUpdate(req.body.chatId,{latestMessage:message})
        .catch(error=>console.log(error))

        insertNotifications(chat,message)

        res.status(201).send(message)
    })
    .catch(error=>{
        console.log(error);
        res.sendStatus(400);
    })
})

app.get("/notifications",middleware.requireLogin,async (req,res,next)=>{
    var payload={
        pageTitle:"Notifications",
        userLoggedIn:req.session.user,
        userLoggedInJs:JSON.stringify(req.session.user),
    }
    res.render("notificationsPage",payload);
});

app.get("/api/notifications",middleware.requireLogin,async (req,res,next)=>{
    var searchObj={userTo:req.session.user._id,notificationType:{$ne:"newMessage"}};

    if(req.query.unreadOnly !== undefined && req.query.unreadOnly == "true") {
        searchObj.opened=false;
    }

    Notification.find(searchObj)
    .populate("userTo")
    .populate("userFrom")
    .sort({createdAt:-1})
    .then(results=>res.status(200).send(results))
    .catch(error=>{
        console.log(error);
        res.sendStatus(400);
    });
});

app.get("/api/notifications/latest",middleware.requireLogin,async (req,res,next)=>{
    Notification.findOne({userTo:req.session.user._id})
    .populate("userTo")
    .populate("userFrom")
    .sort({createdAt:-1})
    .then(results=>res.status(200).send(results))
    .catch(error=>{
        console.log(error);
        res.sendStatus(400);
    });
});

app.put("/api/notifications/:id/markAsOpened",middleware.requireLogin,async (req,res,next)=>{
    Notification.findByIdAndUpdate(req.params.id,{opened:true})
    .then(()=>res.sendStatus(204))
    .catch(error=>{
        console.log(error);
        res.sendStatus(400);
    });
});

app.put("/api/notifications/markAsOpened",middleware.requireLogin,async (req,res,next)=>{
    Notification.updateMany({userTo:req.session.user._id},{opened:true})
    .then(()=>res.sendStatus(204))
    .catch(error=>{
        console.log(error);
        res.sendStatus(400);
    });
});

app.put("/api/chats/:chatId/messages/markAsRead",middleware.requireLogin,async (req,res,next)=>{
    Message.updateMany({chat:req.params.chatId},{$addToSet:{readBy:req.session.user._id}})
    .then(()=>res.sendStatus(204))
    .catch(error=>{
        console.log(error);
        res.sendStatus(400)
    })
})

app.get("/logout",(req,res,next)=>{
    if(req.session){
        req.session.destroy(()=>{
            res.redirect("/login");
        })
    }
})

async function getPosts(filter){
    var results=await Post.find(filter)
    .populate("postedBy")
    .populate("retweetData")
    .populate("replyTo")
    .sort({"createdAt":-1})
    .catch(error=>{
        console.log(error);
    })
    results=await User.populate(results,{path:"replyTo.postedBy"})
    return await User.populate(results,{path:"retweetData.postedBy"});
}

async function getPayload(username, userLoggedIn) {
    var user = await User.findOne({ username: username })
    if(user == null) {
        user = await User.findById(username);
        if (user == null) {
            return {
                pageTitle: "User not found",
                userLoggedIn: userLoggedIn,
                userLoggedInJs: JSON.stringify(userLoggedIn)
            }
        }
    }
    return {
        pageTitle: user.username,
        userLoggedIn: userLoggedIn,
        userLoggedInJs: JSON.stringify(userLoggedIn),
        profileUser: user
    }
}

function createPayload(userLoggedIn){
    return{
        pageTitle:"Search",
        userLoggedIn:userLoggedIn,
        userLoggedInJs:JSON.stringify(userLoggedIn),
    }
}

function getChatByUserId(userLoggedInId, otherUserId) {
    return Chat.findOneAndUpdate({
        isGroupChat: false,
        users: {
            $size: 2,
            $all: [
                { $elemMatch: { $eq: userLoggedInId }},
                { $elemMatch: { $eq: otherUserId }}
            ]
        }
    },
    {
        $setOnInsert: {
            users: [userLoggedInId, otherUserId]
        }
    },
    {
        new: true,
        upsert: true
    })
    .populate("users");
}

function insertNotifications(chat,message){
    chat.users.forEach(userId=>{
        if(userId==message.sender._id.toString()) return;
        Notification.insertNotification(userId,message.sender._id,"newMessage",message.chat._id);
    })
}

io.on("connection",socket=>{
    socket.on("setup",userData=>{
        socket.join(userData._id);
        socket.emit("connected");
    })
    socket.on("join room",room=>socket.join(room))
    socket.on("typing",room=>socket.in(room).emit("typing"));
    socket.on("stop typing",room=>socket.in(room).emit("stop typing"));
    socket.on("notification received",room=>socket.in(room).emit("notification received"));
    

    socket.on("new message",newMessage=>{
        var chat=newMessage.chat;
        if(!chat.users) return console.log("chat.users not defined");

        chat.users.forEach(user=>{
            if(user._id==newMessage.sender) return;
            socket.in(user._id).emit("message received",newMessage);
        })
    });
})


const port=process.env.PORT || 3000;
server.listen(port,function(){
    console.log(`Server started on port ${port}`);
});