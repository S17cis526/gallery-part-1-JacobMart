"use strict";

/**
 * server.js
 * This file defines the server for a
 * simple photo gallery web app.
 */

 var multipart = require('./multipart');
 var http = require('http');
 var url = require('url');
 var fs = require('fs');
 var port = 3040;
 var template = require('./template');
 var staticFiles = require('./static');
 var config = JSON.parse(fs.readFileSync('config.json'));
 var stylesheet = fs.readFileSync('public/gallery.css');
 var script = fs.readFileSync('public/gallery.js');
 
 /*load public directory*/
 staticFiles.loadDir('public');
 

 /*load templates*/
 template.loadDir('templates');

 var imageNames = ['ace.jpg', 'bubble.jpg', 'chess.jpg', 'fern.jpg', 'mobile.jpg'];

 function getImageNames (callback){
	 fs.readdir('images/', function(err, fileNames){
		 if(err) callback(err, undefined);
		 else callback(false, fileNames);
	 });
 }

 function imageNamesToTags(fileNames){
	 return fileNames.map(function(fileName){
		 return `<img src="${fileName}" alt="${fileName}">`;
		 });
 }

 function buildGallery(imageTags){
		   return template.render('gallery.html', {
         title: config.title,
         imageTags: imageNamesToTags(imageTags).join('')
       });
 }

 function serveGallery(req, res){
	 getImageNames(function(err, imageNames){
		 if (err){
			 console.error(err);
			 res.statusCode = 500;
			 res.statusMessage = 'Server error';
			 res.end();
		 }
		 res.setHeader('Content-Type', 'text/html');
		   res.end(buildGallery(imageNames));
	 });
 }

 function serveImage(filename, req, res){
	 var data = fs.readFile('images/' + filename, function(err, data){
		if(err){
		  console.error(err);
		  res.statusCode = 404;
		  res.statusMessage = "Resource not found";
		  res.end();
		  return;
		}
	 res.setHeader("Content-Type", "image/jpeg");
	 res.end(data);
 });
 }

 function uploadImage(req, res){
	 var body='';
	 req.on('error', function(){
		res.statusCode = 500;
		res.end();
	 });
	 req.on('data', function(){
		 body += data;
	 });
	 req.on('end', function(){
		fs.writeFile('filename', body, function(){
			if(err){
				console.error(err);
				res.statusCode = 500;
				res.end();
				return;
			}
			serveGallery(req, res);
		});
	 });
 }

 var server = http.createServer(function(req, res) {
     //at most, the url should have two parts -
	 //a resource and a querystring separated by a ?
	 var urlParts = url.parse(req.url);

	 if(urlParts.query){
		 var matches = /title=(.+)($|&)/.exec(urlParts.query);
		 if(matches && matches[1]){
			 config.title = decodeURIComponent(matches[1]);
			 fs.writeFile('config.json', JSON.stringify(config));
		 }
	 }

	 switch(urlParts.pathname) {
		 case '/':
		 case '/gallery':
		   if(req.method == 'GET'){
		       serveGallery(req, res);
		   }else if(req.method == 'POST'){
			   uploadImage(req, res);
		   }
		   break;
		 default:
		   console.log(req.url);
		   if(staticFiles.isCached('public' + req.url)) {
			   staticFiles.serveFile('public' + req.url, req, res);
		   }
		   else {
			   serveImage(req.url, req, res);
		   }
	 }

 });

 server.listen(port, function(){
	console.log("Listening on Port " + port);
 });
