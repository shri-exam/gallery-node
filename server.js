var http = require("http");
var url = require('url');
var querystring = require('querystring');
var jsdom = require("jsdom");
var fs = require('fs');
var $ = require('jquery');
var album = "http://api-fotki.yandex.ru/api/users/aig1001/album/63684/photos/?format=json";


/*
param {string} url
return {promise} - resolve ({array} $images )
*/
function getAllPhotoByAlbum(url_main){   
    var ddd = $.Deferred();
    var images = [];
    function k(url)
    {
        if (url)
        {       
            url = url || false;
            http.get(url, function(res){
                var data = '';
                res.on('data', function (chunk){
                    data += chunk;
                });
                res.on('end',function(){
                    var obj = JSON.parse(data);
                    var next = obj.links.next;
                    /*console.log(next);*/
                    /*console.log('lenght = ',obj.entries.length);*/
                    for (var i in obj.entries)
                    {
                        var reg = /(\d+)$/g;
                        var idArray = reg.exec(obj.entries[i].id);
                        var id = idArray[0];
                        /*console.log('id=',id);*/
                        var imgObj = {
                            s_link:obj.entries[i].img.S.href,
                            l_link:obj.entries[i].img.L.href,
                            width:obj.entries[i].img.L.width,
                            height:obj.entries[i].img.L.height,
                            id:id
                        }
                        /*console.log('imgObj=',imgObj);*/
                        images[images.length] = imgObj;
                        //console.log('images ',id,'=',images[id[0]]);
                    }
                    if (next) 
                    {
                        /*console.log('perehod na =',next);*/
                        k(next);
                    }
                    else 
                    {
                        console.log('********************* end *****************');
                        delete images[images.length-1];
                        ddd.resolve(images);
                    };
                });    
            });
        }   
    }
    var b = ddd.done(function(images){
        return ddd.promise();
    });
    k(url_main); return b;    
}
/*
@param {string} id, {array} images
@return {Number} index
*/
function searchIndex(id,images) {
    for (var index=0;index<images.length;index++)
    {if (id==images[index].id) return index;}return false;
    }
/*
@parad {string} id, {array} images
@return {object} obj
*/
function getPhotoById(id,images)
{
    var ind = searchIndex(id,images);
    console.log('getPhotoByid ind=',ind);
    if (ind) return images[ind]; else return false;
}
/*
@param {string} id, {nubmer} count {nubmer} next, {nubmer} self, {array} images
@return {array} result
*/
function getNextTilesById(id,count,next,self,images)
{
    if (id === '0') {var ind = 0;}
    else  {var ind = searchIndex(id,images);}

    count = Number(count); next = Number(next); self = Number(self);
    if (ind === false)
    {
        return false;
        console.log('server getNextTilesById = return false');
    }
    else
    {
        var result = [];
        var i = (self === 1)?0:1;
        var newIndex;
        for (i;i<count;i++)
        {

            if (next === 1)
            {
                newIndex = ind + i;
            }
            else
            {
                newIndex = ind - i;
            }
            console.log('ind=',ind,' newIndex=',newIndex);
            if (images[newIndex]) {result[result.length] = images[newIndex];}
            else {console.log('*** ostanovilis'); break;}
        }
        return result;
    }
}
var g = getAllPhotoByAlbum(album);
 
    
    
        
        
            
            
            





 
function getContentType(s)
{
    var reg = /([a-z]{1,4})$/g;
    var p =  reg.exec(s);
    if (p)
    {
        var l = p[0];
        var r = "";
        switch (l)
        {
            case 'jpg': r = "image/jpeg";break;
            case 'png': r = 'image/png';break;
            case 'gif': r = 'image/gif';break;
            case 'css': r = 'text/css';break;
            case 'js': r = 'application/javascript';break;
            case 'html': r = 'text/html';break;
            case 'ico': r = 'image/x-icon';break;
            default: r = 'text/plain';
        }
        return r;
    }
    else return "text/plain";


} 
 

  
function start(route) {
  function onRequest(request, response) {
    /*console.log("Request received.");*/
    var query = url.parse(request.url);
    route(query,request,response);
    /*response.writeHead(200, {"Content-Type": "application/json"});*/
    /*response.write(result);*/
    /*g.pipe(function(images){
        response.write(JSON.stringify(getNextTilesById('174584',10,false,true,images)));
    });*/
  }

  http.createServer(onRequest).listen(8080);
  console.log("Server has started.");
}
/* ======================= route ============ */
function route(query,request,response) {
    console.log('query = ',query.path);
    var qo = querystring.parse(query.query);
    if (qo.f == 'getphotobyid') {
        /*запрос на инф. о фотке */
        g.pipe(function(images){
            response.writeHead(200, {"Content-Type": "application/json"});
            response.write(JSON.stringify(getPhotoById(qo.id,images)));
            response.end();
        });
    }
    else if (qo.f == 'getnexttilesbyid') {
        /*запрос партию картинок */
        g.pipe(function(images){
            response.writeHead(200, {"Content-Type": "application/json"});
            response.write(JSON.stringify(getNextTilesById(qo.id,qo.count,qo.next,qo.self,images)));
            response.end();
        });
    }
    else 
    {
        var z = "."+query.pathname;
        if (z == "./") z = "./index.html";
        var contentType = getContentType(z);
        fs.readFile(z,function(error,file){
            if (error) {
                response.writeHead(500,{"Content-type": "text/plain"});
                response.write(error+"\n");
                response.end();
            } else
            {
                
                response.writeHead(200,{"Content-type": contentType});
                response.write(file);
                response.end();
            }
        });
    }
}
start(route);