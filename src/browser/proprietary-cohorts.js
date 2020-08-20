'use strict';

var id=0;
var getId = function () {
    return id++;
}

var _outstandingCalls = {};

var IframeStorage = function (options) {
    this.url = options.url;

    // setup hidden iframe for communication
    this.iframe = document.createElement('iframe');
    this.iframe.style.display = "none";
    this.iframe.setAttribute('id', 'iframe');
    this.iframe.setAttribute('name', 'iframe');
    this.iframe.setAttribute('src', this.url);

    var d = q.defer();
    this.readyPromise = d.promise;
    if (this.iframe.attachEvent){
        this.iframe.attachEvent("onload", function(){
            d.resolve();
        });
    } else {
        this.iframe.onload = function(){
            d.resolve();
        };
    }

    document.body.appendChild(this.iframe);
    window.addEventListener('message', this._receiveMessage, false);
};

IframeStorage.prototype = {

    getItem: function (key) {
        return this._callMethod('getSessionVar', {key: key});
    },

    setItem: function (key, value) {
        return this._callMethod('storeSessionVar', {key: key, value: value});
    },

    removeItem: function (key) {
        return this._callMethod('removeSessionVar', {key: key});
    },

    _callMethod: function (method, params) {
        var that = this;
        var d = q.defer();
        var callId = getId();
        var message = {
            method: method,
            params: params,
            id: callId
        }
        _outstandingCalls[callId] = d;
        this.readyPromise.then(function () {
            that.iframe.contentWindow.postMessage(JSON.stringify(message), that.url);
        });
        return d.promise;
    },

    _receiveMessage: function (e) {
        if (typeof e.data === 'object') {
            return;
        }

        try {
            var message = JSON.parse(e.data);
        } catch (e) {
            return;
        }

        if(!message || !(message.id in _outstandingCalls)) {
            return;
        }
        if (message.error) {
             _outstandingCalls[message.id].reject(message.error);
        } else {
            _outstandingCalls[message.id].resolve(message.response);
        }
        delete _outstandingCalls[message.id];
    }
}

window.ProprietaryCohorts = {
    providerId: 'magnite',
    providerUrl: 'https://proprietarycohorts.github.io/server/classifier.js',
    getCohortId: function () {
        return 'foo';
    }
};

window.onload= function() {
    var iframeStorage = new IframeStorage({
        url: 'https://proprietarycohorts.github.io/browser/iframe.html'
    });

    if (ProprietaryCohorts && ProprietaryCohorts.classifier) {

    }

    var date = Date.now().toString();
    console.log(date);
    iframeStorage.setItem('test', date).then(function (){
        console.log('set item');
        iframeStorage.getItem('test').then(function (value) {
            console.log('got item');
            console.log(value);
        });
    });
};