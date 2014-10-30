
'use strict';
/*jshint -W097*/
/*jshint strict:false*/

// Directive for challenges advertising widget
var challengesAdvertiser = [function () {
    return {
        restrict: 'A',
        scope: true,
        templateUrl: 'partials/user.challenges.advertising.html',
        controller: 'challengesAdvertisingCtrl'
    };
}];
module.exports = challengesAdvertiser;