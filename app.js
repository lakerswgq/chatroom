var http=require("http");
var fs=require("fs");
var express=require("express");
var app=express();
var port=process.env.PORT||3000;
var server=http.createServer(app);
server.listen(port);
var io=require("socket.io").listen(server);
var nicknames=[];
app.get('/',function(req,res){
	fs.readFile("index.html",function(err,data){
		res.writeHead(200,{
			"Content-Type":"text/html"
		});
		res.end(data,"utf-8");
	});
});
io.sockets.on("connection",function(socket){
	socket.on("nickname",function(data,callback){
		if(nicknames.indexOf(data)!==-1){
			callback(true);
		}
		else{
			callback(false);
			nicknames.push(data);
			for(var i=0;i<nicknames.length;i++)
				console.log(nicknames[i]+" ");
			socket.nickname=data;
			io.sockets.emit("nicknames",nicknames);
			io.sockets.emit("nicknamesOn",socket.nickname);
			console.log("Your friend "+data+" has joined the talk");
		}
	});
	socket.on("message",function(data){
		console.log("")
		io.sockets.emit("message",{
			nick:socket.nickname,
			message:data
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
});