/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 */
/**
 * Controller for challenges advertising widget.
 *
 * @author Helstein
 * @version 1.0
 */

'use strict';
/*jshint -W097*/
/*jshint strict:false*/
/*global require, module*/

var config = require('../config.js');

var challengesAdvertisingCtrl = ['$scope', '$http', function ($scope, $http) {
    // Challenges to be advertised
    $scope.challenges = [];
    // Interval between advertising changes (miliseconds)
    $scope.interval = config.challengeAdvertisingInterval || 5000;


    $http.get("data/challenges-advertising.json").success(function (data) {
        $scope.challenges = data;
    });
}];

module.exports = challengesAdvertisingCtrl;