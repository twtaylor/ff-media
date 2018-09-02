 // constants
 const timeBeforeNextVideo = 30000;
 const timeSlicePartition = 30;
 const timeSlice = timeBeforeNextVideo / timeSlicePartition;

 // max duration of a playable video 
 const hardUpperBound = 30; // set to 90
 // we fill this in if they don't have a duration
 const softUpperBound = 20; // set to 60
 // intermission time - how long we wait between videos
 const intermission = 5;

 // working variables
 var onDeckQueue = [];
 var alreadyPlayedQueue = [];
 var currentlyPlaying = { doc: null, elem: null };
 var timer = null;
 var intermissionEnd = new Date();
 var isFirstPlay = false;
 
 var init = function () {
   currentlyPlaying = { doc: null, elem: null };
   onDeckQueue = [];
   currentDocId = 0;
 };

 var generateFromPersonName = function (initials) {
   const initialsToPersonMap = [
    ['nb1', 'Cronic Tramatik Encephalawesome'],
    ['dh14', 'The Browns'],
    ['jj14', 'Reverse The Curse'],
    ['pl2', "AA's HUNTer Kitties"],
    ['sg14', "Gumby's Brady Bunch"],
    ['ca11', "Ice Cold Bruschis"],
    ['cs2', "Muscle Tank All-Stars"],
    ['ah4', "Luck Yeah Returns"],
    ['rm1', "Stat Corrections	"],
    ['oa14', "Potomac Wtrshed Indigenous Pers"],
    ['kb3', "Team Impressive"],
    ['tt1', "Looks Like Half My Team Died"],
   ];
  const items = _.filter(initialsToPersonMap, (o) => o[0] === initials);
  if (items && items.length && items[0].length) {
    return items[0][1];
  }
  return null;
 };
 
var renderWhole = function (doc, intermission) {
   if (intermission || !doc) {
    $('#viewer').html(`<h2>Intermission</h2>`);
   } else {
    $('#viewer').html(renderHead(doc) + renderMedia(doc));
   }
   
   $('#after-controls').html(renderTail());
}

var renderHead = function (doc) {
  if (doc) {
    return `<h2>${doc.player}</h2>`;
  }
  return '';   
}

// players that are trailing in our queue
var renderTail = function () {
  let ret = '';

  if (onDeckQueue.length) {
    let nextPlayers = '';
    for (let value of onDeckQueue) {
      nextPlayers += `<li>${value.player}</li>`;
    }
  
    ret += `<div class='container-end-list'><h1>Next up...</h1><ol>${nextPlayers}</ol></div>`;
  }

  if (alreadyPlayedQueue.length) {
    let alreadyPlayers = '';
    for (let value of _.take(alreadyPlayedQueue, 10)) {
      alreadyPlayers += `<li>${value.player}</li>`;
    }
  
    ret += `<div class='container-end-list'><h1>Just played...</h1><ol>${alreadyPlayers}</ol></div>`;
  }
  
  return ret;
};
 
var renderMedia = function(doc) {
  let ret = '';
  
  if (doc && doc.media.startsWith('yt')) {
    // get our various components
    var url = '/videos/store/' + doc.mediaId + '.mp4';

    ret = `
    <div id='video-container'>
    <video controls id='${doc.mediaId}'>
      <source src="${url}" type="video/mp4">
      Your browser sucks.
    </video>
    </div>
    `;
  }
          
  return ret;
};

var pushDoc = function (doc) {
  // add a seen field, add to our global queue
  doc.status = "on deck";

  // decorate parts of our media doc
  urlParts = doc.media.split(' ');
  doc.mediaType = urlParts[0];
  doc.mediaId = urlParts[1];

  if (urlParts[2]) {
    doc.startTime = urlParts[2];
  }
  if (urlParts[3]) {
    doc.duration = urlParts[3];
  }

  // push the item into the view queue
  onDeckQueue.push(doc);

  console.log('doc queued', doc.player);
};

var decomposeDoc = function (doc) {
  // clone our doc before we modify
  var playerDoc = _.clone(doc);

  // just a normal doc
  pushDoc(doc);

  // it's possible we also selected a player, so we need to queue up two docs, one for each person
  if (doc.mediaperson) {
    playerDoc.player = generateFromPersonName(doc.chosenBy);
    playerDoc.media = playerDoc.mediaperson;

    pushDoc(playerDoc);
  }
};
 
var pushToGlobalQueue = function (docs) {
    let doc;
    for (var i = 0; docs.length > i; i++) {
      doc = docs[i];  
      // make sure this doc isn't in our docs already
      if (!_.some(onDeckQueue, { player: doc.player })) {
        decomposeDoc(doc);
      }
      else {
        console.log('doc already exists, not added', doc.player);
      }
    }
};

var isCurrentVideoPlaying = function () {
  return currentlyPlaying.doc && currentlyPlaying.doc.status === 'playing'; 
};

var canWePlayNextVideo = function () {
  return (!onDeckQueue.length || onDeckQueue[0].status === "on deck") &&
         (new Date() > intermissionEnd);
};

var currentVideoPlayingOverExpiration = function () {
  const dt = new Date();
  return (currentlyPlaying.doc && (dt > currentlyPlaying.doc.expiration) && currentlyPlaying.doc.status === 'playing'); 
};

var queueHasVideos = function () {
  return onDeckQueue.length;
};

var currentVideoJustEnded = function () {
  return currentlyPlaying.doc && currentlyPlaying.doc.status === 'ended'; 
};

var attachExpiration = function (now, fromPlayed) {
  let secondsLeft = 0;

  // we calculate how much of this video we have played so far
  if (fromPlayed && currentlyPlaying.doc && currentlyPlaying.doc.remainingPlay) {
    secondsLeft = currentlyPlaying.doc.remainingPlay;
    secondsLeft = (secondsLeft > 0) ? secondsLeft : 0;
  }

  // create an expiration for when this video playing will end
  // - this is expressed as either the seconds past the duration 
  let duration = softUpperBound;
  if (currentlyPlaying.doc.duration) {
    console.log('Custom duration detected:', currentlyPlaying.doc.duration);
    duration = currentlyPlaying.doc.duration;
  }
  if (duration > (hardUpperBound - 1)) {
    duration = hardUpperBound;
  }

  let alreadyPlayed = 0;
  if (secondsLeft > 0) {
    alreadyPlayed = duration - secondsLeft;
    console.log('Seconds already played: ', alreadyPlayed);
  }

  now.setSeconds(now.getSeconds() + duration - alreadyPlayed);
  currentlyPlaying.doc.expiration = now;

  console.log('+ Video will end at: ', currentlyPlaying.doc.expiration.toLocaleTimeString());
};

var endPlayingVideo = function () {
   // check if we had a video playing, put it in the backlog
   if (currentlyPlaying.doc) { 
    alreadyPlayedQueue.unshift(currentlyPlaying.doc);

    // destroy the current elem
    $('#video-container').remove();

    currentlyPlaying.doc = null;
    currentlyPlaying.elem = null;

    // set the time we wait until the next video
    intermissionEnd = new Date();
    intermissionEnd.setSeconds(new Date().getSeconds() + intermission);
  }
};

var startPlayingVideo = function (doc) {
  const now = new Date();

  // cancel intermission
  intermissionEnd = now;

  // set currentlyPlaying
  currentlyPlaying.doc = doc;
  currentlyPlaying.doc.status = 'playing';
  currentlyPlaying.elem = document.getElementById(doc.mediaId);

  // set the video start time - the video wil start playing at this time
  if (currentlyPlaying.doc.startTime) {
    console.log('Video will start playing at: ', currentlyPlaying.doc.startTime);
    currentlyPlaying.elem.currentTime = currentlyPlaying.doc.startTime;
  }

  // console.log('Attaching expiration in startPlayingVideo')
  attachExpiration(now);

  // attach events that will change the stop event
  $('#' + doc.mediaId).on('pause', () => { 
    onPauseVideo();
  });

  $('#' + doc.mediaId).on('play', (target, type, bubbles, cancelable) => { 
    onPlayVideo();
  });

  // ended
  $('#' + doc.mediaId).on('ended', () => { 
    onEndVideo();
  });

  // finally, play our video
  playVideo(doc.mediaId, true);
};

var playVideo = function (id, firstPlay) {
  isFirstPlay = firstPlay;
  document.getElementById(id).play();
};

var onEndVideo = function () {
  console.log('Video ended playing.')
  if (currentlyPlaying.doc) {
    clearTimeout(timer);
    currentlyPlaying.doc.status = 'ended';
    endPlayingVideo();
    renderWhole(null, true);
    initRefreshView();
  }
};

var onPauseVideo = function () {
  const now = new Date();
  console.log('Video paused.')
  clearTimeout(timer);

  if (currentlyPlaying.doc.expiration) {
    currentlyPlaying.doc.remainingPlay = (currentlyPlaying.doc.expiration.getTime() - now.getTime()) / 1000;
    console.log('Remaining play time: ', currentlyPlaying.doc.remainingPlay);
  }
};

var onPlayVideo = function() {
  // don't run these if it's not your first play
  if (!isFirstPlay) {
    const now = new Date();

    console.log('Video started playing: ', now.toLocaleTimeString());

    //console.log('Attaching expiration in play event', target, type)
    attachExpiration(now, true);
    initRefreshView();
  }
  else {
    // let our subsequent clicks fire this
    isFirstPlay = false;
  }
};

var playLastVideo = function () {
  if (alreadyPlayedQueue.length) {
    clearTimeout(timer);

    // take the last played one and add it to on deck
    let doc = alreadyPlayedQueue.pop();
    doc.status = "on deck";
    onDeckQueue.push(doc);

    alreadyPlayedQueue.unshift(currentlyPlaying.doc);
    
    currentlyPlaying = { doc: null, elem: null };
    
    initRefreshView();
  }
};

var playNextVideo = function () {
  if (onDeckQueue.length) {
    clearTimeout(timer);

    alreadyPlayedQueue.push(currentlyPlaying.doc);
    currentlyPlaying = { doc: null, elem: null };

    initRefreshView();
  }
};
 
var refreshView = function () {
  console.log('- Refresh view at', new Date().toLocaleTimeString());
   
  // states - #1 needs to start playing (initial)
  //          #2 wait until the current is done and under time
  //          #3 force stop the current one if there is one in the queue and it's over the expiration
  //  
  // considerations -
  //            video has paused playing
  //            video has ended

  // console.log(onDeckQueue);

  // console.log('isCurrentVideoPlaying', isCurrentVideoPlaying())
  // console.log('currentVideoPlayingOverExpiration', currentVideoPlayingOverExpiration())
  // console.log('currentVideoJustEnded', currentVideoJustEnded())

  if (currentVideoPlayingOverExpiration() || currentVideoJustEnded()) {
    console.log('Stop playing video over expiration.');

    endPlayingVideo();
    renderWhole(null, true);
  }

  // we do not have a currently playing video
  if (!isCurrentVideoPlaying() && queueHasVideos() && canWePlayNextVideo()) {
    console.log('Start playing next video.');

    const doc = onDeckQueue.pop();

    if (validVideoToPlay(doc)) {
      renderWhole(doc, false);
      startPlayingVideo(doc);
    }
    else {
      // we will not play this video - or acknowledge it
      console.log('No video found: ', doc.player);
    }
  }
   
  timer = setTimeout(refreshView, timeSlice);
};

var validVideoToPlay = function (doc) {
  return (doc.media && (doc.media.startsWith('yt') || doc.media.startsWith('g')));
};

var initRefreshView = function () {
  clearTimeout(timer);
  refreshView();
};
 
 // init
 var socket = io();
 $(document).ready(function() {
   init();
   
   $('#reset').click(function() {
     // basically have to isolate this so we don't play in the middle of a reset
     socket.emit('chat message', 'reset');
     init();
   });

  $('#playNextVideo').click(function() {
    // playNextVideo();
  });

  $('#playLastVideo').click(function() {
    playLastVideo();
  });
   
   // start our socket listening 
   socket.on('chat message', function(msg) {
     var docs = JSON.parse(msg);
     
     pushToGlobalQueue(docs);
   });
   
   initRefreshView();
 });