var http=require("http");
var fs=require("fs");
var cookieParser=require("cookie-parser");
//so that we can use req.body
var bodyParser=require("body-parser");
var express=require("express");
var session=require("express-session");
var app=express();
//to place the app on heroku
var port=process.env.PORT||3000;
var server=http.createServer(app);
server.listen(port);
var io=require("socket.io").listen(server);
var nicknames=[];
//so that we can use req.body
app.use(bodyParser());
app.use(cookieParser());
var fileWriteStream=fs.createWriteStream('1.txt');
app.get('/',function(req,res){
	fs.readFile("index.html",function(err,data){
	res.writeHead(200,{
		"Content-Type":"text/html"
	});
		res.end(data,"utf-8");
	});

});
app.get("/logs",function(req,res){
	fs.readFile("1.txt", "utf-8", function(err,data){
		res.send(data);
	});
});
app.get('/login',function(req,res){
	fs.readFile("login.html",function(err,data){
		res.writeHead(200,{
			"Content-Type":"text/html"
		});
		res.end(data,"utf-8");
	});
});
app.get('/delete',function(req,res){
	fs.readFile("delete.html",function(err,data){
		res.writeHead(200,{
			"Content-Type":"text/html"
		});
		res.end(data,"utf-8");
	});
});
app.post('/login',function(req,res){
	if(req.body.username=="Julien"&&req.body.password=="lakers24"){
		res.redirect("/delete");
	}
	else if(req.body.username!="Julien"){
		io.sockets.emit("loginError",{message:"The username is wrong"});
	}
	else{
		io.sockets.emit("loginError",{message:"The password is wrong"});
	}
});
io.sockets.on("connection",function(socket){
	socket.on("nickname",function(data,callback){
		if(nicknames.indexOf(data)!==-1){
			callback(true);
		}
		else{
			callback(false);
			socket.nickname=data.replace(/</g,"&lt;").replace(/>/g,"&gt;");
			nicknames.push(socket.nickname);
			for(var i=0;i<nicknames.length;i++)
				console.log(nicknames[i]+" ");
			// socket.nickname=data;
			io.sockets.emit("nicknames",nicknames);
			io.sockets.emit("nicknamesOn",socket.nickname);
			console.log("Your friend "+socket.nickname+" has joined the talk");
		}
	});
	socket.on("message",function(data){
		console.log(socket.nickname+": "+data);
		fileWriteStream.write("<p>");
		fileWriteStream.write(socket.nickname+":");
		fileWriteStream.write(data+" --");
		fileWriteStream.write(new Date().toString());
		fileWriteStream.write("</p>\r\n");
		io.sockets.emit("message",{
			nick:socket.nickname,
			message:data,
			date:new Date()
		});
	});
	socket.on("disconnect",function(){
		if(!socket.nickname)
			return;
		if(nicknames.indexOf(socket.nickname)>-1){
			nicknames.splice(nicknames.indexOf(socket.nickname),1);
		}
		console.log("Your friend "+socket.nickname+" has left the talk");
		console.log("Nicknames are "+nicknames);
		io.sockets.emit("nicknames",nicknames);
		io.sockets.emit("nicknamesOff",socket.nickname);
	});
	socket.on("delete",function(data){
		console.log(data.message);
		fs.writeFile("1.txt","");
		io.sockets.emit("deleteSuccess",{message:"The logs has been deleted successfully"});
	});
});