'use strict';

var config = require('../config.js');

var challengesAdvertisingCtrl = ['$scope', '$http', function ($scope, $http) {
    // Challenges to be advertised
    $scope.challenges = [];
    // Interval between advertising changes (miliseconds)
    $scope.interval = config.challengeAdvertisingInterval || 5000;


    $http.get("data/challenges-advertising.json").success(function(data) {
        $scope.challenges = data;
    });
}];

module.exports = challengesAdvertisingCtrl;