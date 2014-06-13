/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 */
/**
 * This file provide some global services.
 *
 * Changes in version 1.1 (Module Assembly - Web Arena UI - Coding IDE Part 1):
 * - Added getUserPreferences method.
 * - Added remove listener function to socket.
 *
 * Changes in version 1.2 (Module Assembly - Web Arena UI Fix):
 * - Added helper.
 * - Some small changes to pass jslint.
 * - Added $rootScope, $timeout and socket to tcTimeService, and removed $http and appHelper.
 * - Updated tcTimeService to sync time with TC server.
 * - Removed $http from connectionService, updated it to handle disconnection event.
 * - Added getUserInfo to helper to retrieve complete user profile.
 *
 * @author tangzx, dexy
 * @version 1.2
 */
'use strict';
var config = require('./config');
var Auth0 = require('auth0-js');
var socket = require('socket.io-client').connect(config.webSocketURL);
/*jshint -W097*/
/*global $ : false, angular : false, require, module*/

var helper = require('./helper');
///////////////
// FACTORIES //

var factories = {};

factories.notificationService = ['$timeout', '$http', 'sessionHelper', function ($timeout, $http, sessionHelper) {
    var service = {
        notifications: [],
        unRead: 0
    },
        repeatTimer = null;
    service.getUnRead = function () {
        return service.unRead;
    };
    service.clearUnRead = function () {
        service.notifications.forEach(function (message) {
            message.read = true;
        });
        service.unRead = 0;
    };
    service.clearNotifications = function () {
        service.clearUnRead();
        service.notifications.length = 0;
        if (repeatTimer) {
            $timeout.cancel(repeatTimer);
        }
    };

    // the central way to add message
    service.addMessages = function (messages) {
        // messages: array of message
        // message: {
        //   read: boolean - indicate the message is read or not
        //   type: string - 'general'|'problem'|'round'
        //   date: mm/dd/yy hh:mm AM|PM
        //   status: string
        //   message: string - message content
        //   action: {
        //     question: string - the action question
        //     target: string - target href (url)
        //   }
        // }
        var i, unreadDelta = 0;
        for (i = messages.length - 1; i >= 0; i -= 1) {
            service.notifications.unshift(messages[i]);
            if (!messages[i].read) {
                unreadDelta += 1;
            }
        }
        // the change of service.unRead is watched in messageArenaCtrl.js
        service.unRead += unreadDelta;
    };

    // demo starts in messageArenaCtrl.js
    service.startLoadMessages = function () {
        function loadMessages(url) {
            $http.get(url).success(function (data) {
                service.addMessages(data);
            });
        }
        // periodically load messages
        function repeatLoadMessages() {
            // demo only
            if (service.repeatLoading) {
                if (service.demoing) {
                    if (service.demoId > service.demoCount) {
                        service.demoing = false;
                    } else if (sessionHelper.isLoggedIn()) {
                        loadMessages('data/notifications-' + service.demoId + '.json');
                        service.demoId += 1;
                    }
                }
                // request for messages after 4 seconds
                repeatTimer = $timeout(repeatLoadMessages, 4000);
            }
        }
        service.clearNotifications();
        service.repeatLoading = true;
        repeatLoadMessages();
        // demo only
        $timeout(function () {
            service.demoing = true;
            service.demoId = 0;
            service.demoCount = 3;
        }, 1500);
    };
    service.resetLoadMessages = function () {
        service.demoId = 0;
        service.demoCount = 0;
        service.demoing = false;
        service.repeatLoading = false;
        service.clearNotifications();
    };
    service.resetLoadMessages();
    //demo end

    return service;
}];

factories.appHelper = [function () {
    var helper = {};

    // return an empty array of fixed length
    helper.range = function (num) {
        return new [].constructor(num);
    };

    // Checks if a string is not null nor empty.
    helper.isStringNotNullNorEmpty = function (s) {
        return s && s.length > 0;
    };

    // Gets the phase time for display.
    // Used in contest schedule displaying.
    // Usually we have start time and end time.
    // When start time is not available, end time should take its place.
    helper.getPhaseTime = function (phase, id) {
        if (id === 0) {
            if (helper.isStringNotNullNorEmpty(phase.start)) {
                return {key: 'Start', value: phase.start};
            }
            if (helper.isStringNotNullNorEmpty(phase.end)) {
                return {key: 'End', value: phase.end};
            }
        } else if (id === 1) {
            if (helper.isStringNotNullNorEmpty(phase.start) &&
                    helper.isStringNotNullNorEmpty(phase.end)) {
                return {key: 'End', value: phase.end};
            }
        }
        return {};
    };

    // parse the string formatted as 'Fri Feb 6, 4:02 PM EST' to date object.
    helper.parseDate = function (s) {
        var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            arr = s.split(' '),
            month = (function (monthAbbr) {
                var i = 0;
                for (i = 0; i < months.length; i += 1) {
                    if (months[i] === monthAbbr) {
                        return i;
                    }
                }
                return -1;
            }(arr[1])),
            day = parseInt(arr[2].substring(0, arr[2].length - 1), 10),
            timeArr = arr[3].split(':'),
            hour = parseInt(timeArr[0], 10),
            minute = parseInt(timeArr[1], 10),
            seconds = timeArr.length <= 2 ? 0 : parseInt(timeArr[2], 10),
            ampm = arr[4].toLowerCase(),
            date = new Date();

        if (ampm === 'pm') {
            hour += 12;
        }

        date.setMonth(month);
        date.setDate(day);
        date.setHours(hour);
        date.setMinutes(minute);
        date.setSeconds(seconds);
        date.setMilliseconds(0);
        return date;
    };

    helper.clickOnTarget = function (clicked, id, stepLimit) {
        if (!clicked) {
            return false;
        }
        while (clicked && stepLimit > 0) {
            stepLimit -= 1;
            if (clicked.id === id) {
                return true;
            }
            clicked = clicked.parentNode;
        }
        return false;
    };

    helper.stripPx = function (str) {
        return parseInt(str.substring(0, str.length - 2), 10);
    };

    helper.getRenderedHeight = function (el) {
        return helper.stripPx(angular.element(el).css('height'));
    };

    return helper;
}];

factories.tcTimeService = ['$rootScope', '$timeout', '$filter', 'socket', function ($rootScope, $timeout, $filter, socket) {
    var service = {},
        counter = 0; // temporary solution before better handling of sync requests is added
    // makes sync time request to the TC server
    service.syncTimeRequest = function () {
        if ($rootScope.connectionID !== undefined) {
            socket.emit(helper.EVENT_NAME.SynchTimeRequest, {connectionID: $rootScope.connectionID});
        }
    };
    service.syncTimeTC = function () {
        if ($rootScope.isLoggedIn) {
            // we don't have correct handling of Sync requests/responses
            // so this is a temporary solution before correct implementation
            // of sync requests is added
            if ($rootScope.startSyncResponse && counter < 3) {
                counter += 1;
                $rootScope.startSyncResponse = false;
                $timeout(service.syncTimeTC, 1000);
            } else {
                counter = 0;
                service.syncTimeRequest();
                $timeout(service.syncTimeTC, helper.SYNC_TIME_INTERVAL);
            }
        } else {
            $timeout(service.syncTimeTC, helper.SYNC_TIME_INTERVAL);
        }
    };
    service.diffTC = 0;
    service.syncTimeTC();
    // helper function to return current time at TC server with zone offset (in minutes)
    service.getTimeZoneOffset = function (zoneOffset) {
        return service.getTime() + 60000 * zoneOffset;
    };
    // Helper function to retrieve the current time at TC server in a given zone.
    // If zone code is not in a helper TIME_ZONES list, default value 0 will be used.
    service.getTimeZone = function (zoneCode) {
        var code = zoneCode.trim().toUpperCase;
        if (angular.isDefined(helper.TIME_ZONES[code])) {
            return service.getTimeZoneOffset(helper.TIME_ZONES[code]);
        }
        return service.getTimeZoneOffset(0);
    };
    // returns the current time at TC server
    service.getTime = function () {
        return new Date().getTime() - service.diffTC;
    };
    // the central way to set time here
    service.setTimeTC = function (timeTC) {
        service.diffTC = new Date().getTime() - timeTC;
    };
    // Retrieves local time zone short name.
    // see: https://stackoverflow.com/questions/2897478/get-client-timezone-not-gmt-offset-amount-in-js
    service.getZoneName = function () {
        /*jslint regexp:true*/
        var now = new Date().toString(), tmp,
            timeZone = "UTC" + $filter('date')(new Date(), 'Z');
        if (now.indexOf('(') > -1) {
            tmp = now.match(/\([^\)]+\)/);
            if (angular.isDefined(tmp) && angular.isDefined(tmp[0])) {
                tmp = tmp[0].match(/[A-Z]/g);
                if (angular.isDefined(tmp)) {
                    tmp = tmp.join('');
                    if (angular.isDefined(tmp)) {
                        timeZone = tmp;
                    }
                }
            }
        } else {
            tmp = now.match(/[A-Z]{3,4}/);
            if (angular.isDefined(tmp) && angular.isDefined(tmp[0])) {
                timeZone = tmp[0];
            }
        }
        /*jslint regexp:false*/
        if (timeZone === "GMT" && /(GMT\W*\d{4})/.test(now)) {
            timeZone = RegExp.$1;
        }
        return timeZone;
    };
    $rootScope.timeZone = service.getZoneName();
    return service;
}];

// this service repeatedly updates the connection status
factories.connectionService = ['$timeout', '$rootScope', function ($timeout, $rootScope) {
    var service = {cStatus: {}},
        isConnected = false;

    // demoXXX are used for demo only.
    service.demoStatus = true;
    service.demoCounter = 0;
    // central way to set the connection status
    // 'stable' or 'lost'
    service.setConnectionStatus = function (status) {
        service.cStatus.status = status;
    };

    service.repeatUpdateStatus = function () {
        var inactivityInterval = new Date().getTime() - $rootScope.lastServerActivityTime;
        if (inactivityInterval >= $rootScope.keepAliveTimeout) {
            // emit keep alive request every timeout interval
            socket.emit(helper.EVENT_NAME.KeepAliveRequest, {});
        }
        if (socket.socket.connected && $rootScope.online && inactivityInterval < helper.INNACTIVITY_TIMEOUT) {
            service.setConnectionStatus('stable');
            if (!isConnected) {
                isConnected = true;
                $rootScope.$broadcast(helper.EVENT_NAME.Connected, {});
            }
        } else {
            isConnected = false;
            service.setConnectionStatus('lost');
            $rootScope.$broadcast(helper.EVENT_NAME.Disconnected, {});
        }
        $timeout(service.repeatUpdateStatus, helper.CONNECTION_UPDATE_INTERVAL);
    };
    service.repeatUpdateStatus();

/*
    // for starting the demo
    $timeout(function () {
        // set to a positive integer to demo
        service.demoCounter = 0;
    }, 3000);
*/
    return service;
}];

factories.API = [function () {
    var api = {};
        //this maps update to a put and also sets id:_id in conformance to mongo.
        /*makeResource = function (url) {
            var actions = {
                update : { method : 'PUT' }
            };
            //if not using mongo remove pass in {} instead of {id:'@_id'}
            return $resource(url, {
                id: '@_id'
            }, actions);
        };*/
    //for example:
    //api.User = makeResource(config.apiDomain + 'api/v1/users/:id');

    return api;
}];

factories.sessionHelper = ['$window', 'cookies', function ($window, cookies) {
    var helper = {};
    helper.isLoggedIn = function () {
        return cookies.get(config.ssoKey);
    };
    helper.clear = function () {
        delete $window.localStorage.userInfo;
        delete $window.localStorage.remember;
    };
    helper.clearRemember = function () {
        delete $window.localStorage.remember;
    };
    helper.persist = function (sess) {
        //set the storage
        if (sess.userInfo) { $window.localStorage.userInfo = angular.toJson(sess.userInfo); }
        if (sess.remember) { $window.localStorage.remember = angular.toJson(sess.remember); }
    };
    helper.getUsername = function () {
        var userInfo = angular.fromJson($window.localStorage.userInfo);
        return userInfo ? userInfo.handle : null;
    };
    helper.getUserInfo = function () {
        var userInfo = angular.fromJson($window.localStorage.userInfo);
        return userInfo || null;
    };

    /**
     * Get user preferences.
     *
     * @returns {*} user preferences or null if not exist
     */
    helper.getUserPreferences = function () {
        var userInfo = angular.fromJson($window.localStorage.userInfo);
        return userInfo ? userInfo.preferences : null;
    };

    helper.getRemember = function () {
        return angular.fromJson($window.localStorage.remember);
    };
    helper.getTcsso = function () {
        return cookies.get(config.ssoKey);
    };
    helper.removeTcsso = function () {
        cookies.remove(config.ssoKey);
    };
    return helper;
}];

//wrap auth0 in an angular factory
factories.auth0 = function () {
    var result = new Auth0({
        domain:       config.auth0domain,
        clientID:     config.auth0clientID,
        callbackURL:  config.callbackURL
    });

    result.auth0connection = config.auth0connection;
    return result;
};

factories.socket = ['$rootScope', function ($rootScope) {
    return {
        on: function (eventName, callback) {
            socket.on(eventName, function () {
                var args = arguments;
                $rootScope.lastServerActivityTime = new Date().getTime();
                $rootScope.$apply(function () {
                    callback.apply(socket, args);
                });
            });
        },
        emit: function (eventName, data, callback) {
            socket.emit(eventName, data, function () {
                var args = arguments;
                $rootScope.$apply(function () {
                    if (callback) {
                        callback.apply(socket, args);
                    }
                });
            });
        },
        remove: function (eventName) {
            socket.removeAllListeners(eventName);
        }
    };
}];

factories.cookies = ['$document', function ($document) {
    var cookies = {};
    cookies.set = function (key, value, expires) {
        $document[0].cookie = key + '=' + value + '; domain=topcoder.com; path=/'
            + (expires === -1 ? '; expires=Tue, 19 Jan 2038 03:14:07 GMT' : '');
    };
    cookies.remove = function (key) {
        $document[0].cookie = key + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=topcoder.com; path=/';
    };
    cookies.get = function (key) {
        return $document[0].cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + key.replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1") || null;
    };
    return cookies;
}];

module.exports = factories;
