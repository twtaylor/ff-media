const http = require('http');
const Rx = require('rx');

// configuration level
const hostname = '0.0.0.0';
const port = 8888;

const timeEvents = Rx.Observable
  .interval(1000)
  
var pingEverySecond = Rx.Observable.create(observer => {
    nextRandom(observer, parseInt(Math.random() * (99) + 1));
});

function nextRandom (observer, data) {
    var interval = parseInt(Math.random() * (99) + 1);
    console.log(data);
    setTimeout(function() { observer.onNext(data); nextRandom(observer, interval) }, interval);
}

Rx.Observable
    .merge(timeEvents, pingEverySecond, 
        function pickValue(t, n) { return "this t is " + t + " and this number is " + n + " time " + (new Date()); })
    .subscribe(console.log);
  
const requests_ = new Rx.Subject();
requests_
  .tap(e => console.log('request to', e.req.url))
  .subscribe(sendHello);