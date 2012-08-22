/**
 * @author ChetanD
 */


		

/*var app = express.createServer(express.logger());

app.get('/', function(request, response) {
  response.send('Hello World!');
});


app.listen(port, function() {
  console.log("Listening on " + port);
});
 */

var express = require('express');
var http=require("http").createServer(handler)
		,io=require('socket.io').listen(http)
        ,fs=require("fs");
        
var port = process.env.PORT || 5000;
http.listen(port);



var sockets = new Array();
function handler(req,res){
	fs.readFile( __dirname + '/index.html',
	  function(err,data){
	  	if(err){
	  		console.log(err);
	  		res.writeHead(500);
	  		return res.end('error in loading...');
	   	}
	   	
	   	res.writeHead(200);
	   	res.end(data);
	  });
};

function finduser(uname){
	
	for(var i=0;i<sockets.length;i++){
		 if(sockets[i].uname==uname){
		 	return i;
		 }
		 
	}
	
	return -1;
}

function getusername(socket){
	for(var i=0;i<sockets.length;i++){
		 if(sockets[i].socket==socket){
		 	return i;
		 	
		 }
		 
	}
	
	return -1;
}


function onlineppl(){
	var a="";
	 for(var i=0;i<sockets.length;i++){
	 	a+=sockets[i].uname+"`"+sockets[i].isplaying+"`";
	 	
	 }
	 
	 return a;
}



io.configure(function () { 
  io.set("transports", ["xhr-polling"]); 
  io.set("polling duration", 100); 
});


io.sockets.on('connection',function(socket){
	
	 
  	socket.on('draw',function(data){
  		var i=getusername(socket);
      if(i!=-1){
      	       		
  		sockets[i].emit('draw','draw');
  		} 
  		else{
  			socket.emit('draw','no working!!! '+i);
  		}
  	});
  	
  	
	socket.on('join',function(data){
      		
		//var index=sockets.indexOf(data.name)
		
		console.log(data.name+ "join");
		if( finduser(data.name)==-1){
		var user=new Object();
		user.uname=data.name;
		user.socket=socket;
		user.isplaying=0;
		user.oppname="";
		sockets.push(user); 	
		console.log("join")
		user.socket.emit('join','1',function(data){
			if(data=='done'){
		      console.log('done');		
		 	}
		});
		
	    	    
	    //user.socket.broadcast.emit('online',list);
			
		}
		else{
			console.log("name already selected");
			socket.emit('join','0')
		}
	});
	
 
	socket.on('online',function(fn){
		var list=onlineppl();
        fn(list);
	});
	
	socket.on('send',function(data){
		console.log(data.x+" "+data.y);
		var i=finduser(data.to);
		console.log(i);
		 if(i!=-1){
			sockets[i].socket.emit('recieve',data);
		}
	});
	
	
	socket.on('win',function(data){
		console.log("win!!!!");
		var i=finduser(data.to);
		sockets[i].socket.emit('win',data,function(data1){
			if(data1=="1"){
			   var j=finduser(sockets[i].oppname);	
			   sockets[i].isplaying=0;
			   sockets[i].oppname="";
			   sockets[j].isplaying=0;
			   sockets[j].oppname="";
			   var news=sockets[j].uname + " won against "+ sockets[i].uname;
	    	   console.log(news);
               io.sockets.emit("update",news);
			   	
			}
		});
	});

	
	socket.on('request',function(data,fn){
		var i=finduser(data.opponante);
		console.log(i +" " +data.opponante);
		if(i!=-1){
			if(sockets[i].isplaying==0){
				sockets[i].socket.emit("request",data.challenger,function(data1){
					console.log("request to "+data.opponante+" has been sent");
					console.log(data1);
				});
				fn("-3") //request is sent to opponante
			}
			else{
				fn("-2")   //user is not free
			}
		}
		else{
			fn("-1");    //user not found...
		}
	});
	
	
	socket.on('accept',function(data,fn){
	   var i=finduser(data);
	    if(i!=-1){
	    	if(sockets[i].isplaying==0){
	    		var j=getusername(socket);
	    		
	    		sockets[i].socket.emit("start",sockets[j].uname,function(data1){
	    		   if(data1=="start"){
	    		   	 sockets[i].isplaying=1;
	    		   	 sockets[j].isplaying=1;
	    		   	 sockets[i].oppname=sockets[j].uname;
	    		   	 sockets[j].oppname=sockets[i].uname;
	    		   	 var news=sockets[i].uname + " starts playing with "+ sockets[i].oppname;
	    		   	 console.log(news);
                     io.sockets.emit("update",news);	    		   	 
	    		   }	
	    		});
	    		
	    		fn("-3") //successfuly start game
	    	}
	      else{
	      	fn("-2");
	      }	
	    
	    }	
	    else{
	    	fn('-1');
	    }
		
	});
	
	
	
	 socket.on('disconnect', function () {
        console.log('DISCONNESSO!!! ');
        var i=getusername(socket);
         if(i!=-1){
         	var name=sockets[i].uname;
	        console.log(sockets[i].uname+" is disconnected!!!");
	        var oppname=sockets[i].oppname;
	         if(oppname.length!=0){
		        var j=finduser(oppname);
		        sockets[j].isplaying=0;
		        sockets[j].oppname="";
	        }
	        sockets.splice(i,1);
	        var news=name + " disconnected!!!";
	        console.log(news);
            io.sockets.emit("update",news);
        }
    });
    
    
    
    
});

