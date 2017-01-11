var app = require('express')();
var express = require('express');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var request = require('request');
//Spotify stuff
const SpotifyWebHelper = require('@jonny/spotify-web-helper');
const helper = SpotifyWebHelper();

//Setting view engien to EJS, static folder with out HTML & CSS
app.set('view engine', 'ejs');
app.use(express.static('views'))

//socket to emit events in multiple methods
var currSocket;
var uName = 'Riley';

//Called when we first load the page
app.get('/', function(req, res){
  res.render(__dirname + '/views/index.ejs', {
  	yourName: uName
  });
});

io.on('connection', function(socket){
  console.log('Connction opened');
  currSocket = socket;
  /*If someone disconnects
  socket.on('disconnect', function () {
    console.log('A user disconnected');
  });
  */
});

http.listen(3000, function(){
  console.log('listening on port 3000');
});

helper.player.on('status-will-change', status => {
	if (currSocket != null) {
		if (status.playing) {
			console.log('Spotifydash: Were playing ' + status.track.track_resource.name + ' by ' + status.track.artist_resource.name);

			//url for grabbing the album art from spotify
			var imgUrl = getAlbumArt(status.track.album_resource.uri)

			//Grabbing the album image from spotify
			request({
    			url: imgUrl,
    			json: true
			}, function (error, response, body) {
    			if (!error && response.statusCode === 200) {
    				//Sending the data to the website to update
        			currSocket.emit('updateSongData', {title: status.track.track_resource.name,
  								artist: status.track.artist_resource.name,
  								albumArtUrl: body.images[0].url});
    			}
			});
		} else {
			//if nothing is playing, or music is paused, this is sent
			console.log('Spotifydash: Not playing any music.');
			currSocket.emit('updateSongData', {title: 'Paused',
  								artist: 'Press play to resume',
  								isPaused: true});
		}
	}
});

//Method to remove strings and garbage from the URL
function getAlbumArt(urlString) {
	urlString = urlString.replace(/:/g, '');
	urlString = urlString.replace('spotify', '');
	urlString = urlString.replace('album', '');
	urlString = 'https://api.spotify.com/v1/albums/' + urlString;

	return urlString;
}