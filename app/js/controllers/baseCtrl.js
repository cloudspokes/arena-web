/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 */
/**
 * This file provides the base controller.
 *
 * Changes in version 1.1 (Module Assembly - Web Arena UI Fix):
 * - Added pop up modal.
 * - Handle ForcedLogoutResponse, Disconnected, Connected events.
 *
 * Changes in version 1.2 (Module Assembly - Web Arena UI - System Tests):
 * - Added $filter as an injected service.
 * - Added handler for PopUpGenericResponse to partially handle the Phase Change messages.
 * - Added handler for SingleBroadcastResponse.
 *
 * Changes in version 1.3 (Module Assembly - Web Arena UI - Phase I Bug Fix):
 * - Defined global popup modals for global usage.
 * - Fixed the issue of showing duplicate modals.
 * - Moved the function for calculating rating colors from chat widget to enable global usage.
 *
 * Changes in version 1.4 (Module Assembly - Web Arena UI - Rating Indicator):
 * - Updated rating-purple to rating-blue in $scope.getRatingClass.
 *
 * Changes in version 1.5 (Module Assembly - Web Arena UI - Division Summary):
 * - Added $timeout and socket.
 * - Moved waitingCoderInfo, modalTimeoutPromise, setTimeoutModal and showCoderInfo
 *   from chatAreaCtrl
 * - Updated PopUpGenericResponse handler to cover CoderInfo and Incorrect Usage title.
 *
 * Changes in version 1.6 (Module Assembly - Web Arena UI - Phase I Bug Fix 2):
 * - Now show coderinfo and its corresponding response is global
 * - Fixed tooltip overlapping theme problem
 * - Implemented Enter room messages
 *
 * Changes in version 1.7 (Module Assembly - Web Arena UI - Phase I Bug Fix 3):
 * - Handle the disconnect logic.
 *
 * Changes in version 1.8 (Module Assembly - Web Arena UI - Notifications):
 * - Send GetAdminBroadcastsRequest on the start to get all the broadcast messages.
 * - Add notification messages on the phase change, removed pop-up opening.
 * - Removed SingleBroadcastResponse handling since it is handled in resolver to
 *   create notifications instead of pop-ups.
 * - Added showNotificationDetails to the scope to show notification details in the pop-up.
 *
 * Changes in version 1.9 (Module Assembly - Web Arena UI - Phase I Bug Fix 4):
 * - Change the disconnect message.
 *
 * @author dexy, amethystlei, ananthhh, flytoj2ee
 * @version 1.9
 */
'use strict';
/*jshint -W097*/
/*jshint strict:false*/
/*global document, angular:false, $:false, module, window, require*/

/**
 * The helper.
 *
 * @type {exports}
 */
var helper = require('../helper'),
    contestCreationCtrl = require('./contestCreationCtrl');

/**
 * The base controller.
 *
 * @type {*[]}
 */
var baseCtrl = ['$rootScope', '$scope', '$http', 'appHelper', 'notificationService', '$modal', '$state', 'themer', '$cookies', 'socket', '$timeout', '$window', function ($rootScope, $scope, $http, appHelper, notificationService, $modal, $state, themer, $cookies, socket, $timeout, $window) {
    var /**
         * The modal controller.
         *
         * @type {*[]}
         */
        popupModalCtrl = ['$scope', '$modalInstance', 'data', 'ok', 'cancel', function ($scope, $modalInstance, data, ok, cancel) {
            $scope.title = data.title;
            $scope.message = data.message.replace(/(\r\n|\n|\r)/gm, "<br/>");
            $scope.buttons = data.buttons && data.buttons.length > 0 ? data.buttons : ['Close'];
            $scope.enableClose = data.enableClose;
            $scope.coderInfo = data.message;

            /**
             * OK handler.
             */
            $scope.ok = function () {
                ok();
                $modalInstance.close();
            };

            /**
             * Cancel handler.
             */
            $scope.cancel = function () {
                cancel();
                $modalInstance.dismiss('cancel');
            };
        }],
        isDisconnecting = false,
        closeThemeHandler = function (event) {
            // the depth of DOM tree rooted at the element with id 'themePanel'
            var themePanelDOMDepth = 4;
            if (!appHelper.clickOnTarget(event.target, 'themePanel', themePanelDOMDepth)) {
                if (appHelper.clickOnTarget(event.target, 'iconTS', 1)) {
                    event.preventDefault();
                }
                $scope.cancelTheme();
            }
        },
        selTheme,
        waitingCoderInfo = false,
        modalTimeoutPromise = null,
        phaseChangeRoundId;

    // modal defined in the root scope can be used by other scopes.
    $rootScope.currentModal = null;
    socket.emit(helper.EVENT_NAME.GetAdminBroadcastsRequest, {});

    /**
     * Open modal function.
     *
     * @param data the data
     * @param handle the handler
     * @param finish the finish function
     */
    $scope.openModal = function (data, handle, finish, templateUrl) {
        if ($rootScope.currentModal) {
            $rootScope.currentModal.dismiss('cancel');
            $rootScope.currentModal = undefined;
        }
        if (!templateUrl) {
            templateUrl =  'popupModalBase.html';
        }
        $rootScope.currentModal = $modal.open({
            templateUrl: templateUrl,
            controller: popupModalCtrl,
            backdrop: 'static',
            resolve: {
                data: function () {
                    return data;
                },
                ok: function () {
                    return function () {
                        if (angular.isFunction(handle)) {
                            handle();
                        }
                        $rootScope.currentModal = undefined;
                    };
                },
                cancel: function () {
                    return function () {
                        if (angular.isFunction(finish)) {
                            finish();
                        }
                        $rootScope.currentModal = undefined;
                    };
                }
            }
        });
    };


    /**
     * Set timeout modal.
     */
    function setTimeoutModal() {
        $scope.openModal({
            title: 'Timeout',
            message: 'Sorry, the request is timeout.',
            enableClose: true
        });
        modalTimeoutPromise = null;
        waitingCoderInfo = false;
    }

    /**
     * Requests to show coder info.
     *
     * @param {string} name the name of the user
     * @param {string} userType the user type
     */
    $scope.showCoderInfo = function (name, userType) {
        if (waitingCoderInfo) {
            return;
        }
        waitingCoderInfo = true;
        if (modalTimeoutPromise) {
            $timeout.cancel(modalTimeoutPromise);
        }
        $scope.openModal({
            title: 'Getting coder info',
            message: 'Please wait while we retrieve coder information',
            enableClose: false
        });

        modalTimeoutPromise = $timeout(setTimeoutModal, helper.REQUEST_TIME_OUT);
        socket.emit(helper.EVENT_NAME.CoderInfoRequest, {coder: name, userType: userType});
    };
    /*jslint unparam: true*/
    $scope.$on(helper.EVENT_NAME.ForcedLogoutResponse, function (event, data) {
        $scope.openModal({
            title: helper.POP_UP_TITLES.ForcedLogout,
            message: helper.POP_UP_MESSAGES.ForcedLogout,
            enableClose: true
        }, null, function () {
            $state.go(helper.STATE_NAME.Logout);
        });
    });
    $scope.$on(helper.EVENT_NAME.Disconnected, function (event, data) {
        if (!isDisconnecting) {
            isDisconnecting = true;
            $scope.openModal({
                title: helper.POP_UP_TITLES.Disconnected,
                message: helper.POP_UP_MESSAGES.LostConnection,
                enableClose: true
            });
        }
    });
    $scope.$on(helper.EVENT_NAME.Connected, function (event, data) {
        if (isDisconnecting) {
            isDisconnecting = false;
            if ($rootScope.currentModal !== undefined && $rootScope.currentModal !== null) {
                $rootScope.currentModal.dismiss('cancel');
            }
            if (!$rootScope.reconnected) {
                $state.go(helper.STATE_NAME.AnonymousHome);
            }
        }
    });
    $scope.$on(helper.EVENT_NAME.PopUpGenericResponse, function (event, data) {
        var roundName, idx;
        // handle phase change messages
        if (data.title === helper.POP_UP_TITLES.PhaseChange) {
            if (!data.buttons) {
                idx = data.message.indexOf(helper.PHASE_DATA.START_MESSAGE);
                if (idx === -1) {
                    idx = data.message.indexOf(helper.PHASE_DATA.END_MESSAGE);
                    if (idx === -1) {
                        roundName = '';
                    } else {
                        roundName = data.message.substr(idx + helper.PHASE_DATA.END_MESSAGE.length);
                    }
                } else {
                    roundName = data.message.substr(idx + helper.PHASE_DATA.START_MESSAGE.length);
                }
                if (roundName[roundName.length - 1] === '.') {
                    roundName = roundName.substr(0, roundName.length - 1);
                }
                notificationService.addNotificationMessage({
                    type: 'round',
                    roundName: roundName,
                    time: Date.now(),
                    message: data.message,
                    popUpContent: data.message
                });
            } else {
                data.enableClose = true;
                roundName = angular.isDefined($rootScope.roundData) && angular.isDefined($rootScope.roomData)
                            && angular.isDefined($rootScope.roomData[data.moveData[1]])
                            && angular.isDefined($rootScope.roundData[$rootScope.roomData[data.moveData[1]].roundID])
                            ? $rootScope.roundData[$rootScope.roomData[data.moveData[1]].roundID].contestName : '';
                angular.forEach($rootScope.roundData, function (round) {
                    angular.forEach(round.coderRooms, function (room) {
                        if (room.roomID === data.moveData[1]) {
                            phaseChangeRoundId = round.roundID;
                        }
                    });
                });
                notificationService.addNotificationMessage({
                    type: 'round',
                    roundName: roundName,
                    time: Date.now(),
                    message: '',
                    popUpContent: data.message,
                    action : {
                        question: data.message,
                        target: '#/u/contests/' + phaseChangeRoundId
                    }
                });
            }
        } else if (data.title === helper.POP_UP_TITLES.CoderInfo) {
            if (modalTimeoutPromise) {
                $timeout.cancel(modalTimeoutPromise);
            }
            waitingCoderInfo = false;
            $scope.openModal({
                title: helper.POP_UP_TITLES.CoderInfo,
                message: data.message,
                enableClose: true
            }, null, null, 'partials/user.chat.area.coderinfo.html');
        } else if (data.title === helper.POP_UP_TITLES.IncorrectUsage) {
            $scope.openModal({
                title: helper.POP_UP_TITLES.IncorrectUsage,
                message: data.message,
                enableClose: true
            });
        }
    });
    /*jslint unparam: false*/
    // theme selector
    $scope.themesInfo = [];
    $cookies.themeInUse = ($cookies.themeInUse === null || $cookies.themeInUse === undefined) ? 'DARK' : $cookies.themeInUse;
    $scope.themeInUse = $scope.themeBackup = $cookies.themeInUse;
    themer.setSelected($scope.themeInUse);
    $scope.themePanelOpen = false;
    $http.get('data/themes.json').success(function (data) {
        $scope.themesInfo = data;
        $cookies.themeInUse = ($cookies.themeInUse === null || $cookies.themeInUse === undefined) ? data.currentKey : $cookies.themeInUse;
        $scope.themeInUse = $scope.themeBackup = $cookies.themeInUse;
        themer.styles.pop();
        var i = 0;
        for (i = 0; i < data.themes.length; i += 1) {
            themer.styles.push(data.themes[i]);
        }
        themer.setSelected($cookies.themeInUse);
    });
    if ($cookies.themeInUse !== null && $cookies.themeInUse !== undefined) {
        selTheme = themer.getSelected();
        $cookies.themeLabel = selTheme.label;
        $cookies.themeHref = selTheme.href;
    }
    $scope.closeThemeSelector = function () {
        $scope.themePanelOpen = false;
        document.removeEventListener('click', closeThemeHandler);
    };
    $scope.cancelTheme = function () {
        $scope.themeInUse = $scope.themeBackup;
        $scope.closeThemeSelector();
    };
    $scope.applyTheme = function () {
        var selectedTheme = themer.getSelected();
        $scope.themeBackup = $cookies.themeInUse = $scope.themeInUse;
        themer.setSelected($scope.themeInUse);
        selectedTheme = themer.getSelected();
        $cookies.themeLabel = selectedTheme.label;
        $cookies.themeHref = selectedTheme.href;
        $scope.closeThemeSelector();
    };
    $scope.openThemeSelector = function (event) {
        $scope.closeQtip();
        if ($scope.themePanelOpen) {
            $scope.cancelTheme();
            return;
        }
        $scope.themeInUse = $scope.themeBackup;
        $scope.themePanelOpen = true;
        // close if clicked outside of the panel
        document.addEventListener('click', closeThemeHandler);
        event.stopPropagation();
    };
    // theme selector ends

    // notification starts
    // indicate whether the notification list is open
    $scope.isReading = false;
    // for child scopes to use notificationService
    $scope.notificationService = notificationService;
    // the notification list is a qtip, see directives/meesageArena.js for details
    $scope.qtipNoti = $('#qtipNoti');
    // close the notification list
    $scope.closeQtip = function () {
        $scope.qtipNoti.qtip('toggle', false);
    };
    window.onresize = function () {
        $scope.closeQtip();
    };
    // notification ends
    // check window size, reset message arena's position
    function checkPosition() {
        if (document.body.clientWidth > 991) {
            $scope.qtipNoti.qtip('api').set({
                'position.my': 'top right',
                'position.at': 'bottom right',
                'position.adjust.x': 46
            });
        }
        if (document.body.clientWidth < 992) {
            $scope.qtipNoti.qtip('api').set({
                'position.my': 'top center',
                'position.at': 'bottom center',
                'position.adjust.x': -2
            });
        }
        if (document.body.clientWidth < 361) {
            $scope.qtipNoti.qtip('api').set({
                'position.adjust.x': -25
            });
        }
        if (document.body.clientWidth < 332) {
            $scope.qtipNoti.qtip('api').set({
                'position.adjust.x': -37
            });
        }
    }
    $scope.onClickMessageArena = function () {
        notificationService.clearUnRead();
        checkPosition();
    };

    /**
     * This function returns the css class of rating value.
     *
     * @param {number} rating the rating
     * @returns {string} the CSS class to show different colors
     */
    $scope.getRatingClass = function (rating) {
        if (rating >= 2200) {
            return "rating-red";
        }
        if (rating >= 1500) {
            return "rating-yellow";
        }
        if (rating >= 1200) {
            return "rating-blue";
        }
        if (rating >= 900) {
            return "rating-green";
        }
        if (rating >= 1) {
            return "rating-grey";
        }
        if (rating === 0) {
            return "rating-none";
        }
        if (rating < 0) {
            return "rating-admin";
        }
        return "";
    };

    /**
     * Opens pop up with notificatino details.
     *
     * @param notification the notification being opened
     */
    $scope.showNotificationDetails = function (notification) {
        var okClicked = function () {
                if (angular.isDefined(notification.action) && angular.isDefined(notification.action.target)
                        && notification.action.target.length > 0) {
                    $window.location.href = notification.action.target;
                }
            },
            buttons = ((angular.isDefined(notification.action) && angular.isDefined(notification.action.target)
                    && notification.action.target.length > 0)) ? ['Yes', 'No'] : [];
        $scope.openModal({
            title: helper.NOTIFICATION_TITLES[notification.type],
            message: notification.messageHTML,
            buttons: buttons,
            enableClose: true
        }, okClicked);
    };

    // open contest creation wizard
    $scope.createContest = function () {
        // data, handle, finish, templateUrl
        // if ($rootScope.currentModal) {
        //     $rootScope.currentModal.dismiss('cancel');
        //     $rootScope.currentModal = undefined;
        // }
        // 
        $rootScope.currentModal = $modal.open({
            templateUrl: '../../../partials/contestCreationWizard.html',
            controller: contestCreationCtrl,
            backdrop: 'static',
            size: 'lg',
            resolve: {
                ok: function () {
                    return function () {
                        $rootScope.currentModal = undefined;
                    };
                },
                cancel: function () {
                    return function () {
                        $rootScope.currentModal = undefined;
                    };
                }
            }
        });
    };
}];

module.exports = baseCtrl;