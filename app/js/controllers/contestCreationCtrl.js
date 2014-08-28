'use strict';
/*jshint -W097*/
/*jshint strict:false*/
/*global FileReader, document, console, angular, $:false, module*/

var contestCreationCtrl = ['$scope', '$http', '$modalInstance', 'ok', 'cancel', '$timeout', '$filter', 'appHelper', function ($scope, $http, $modalInstance, ok, cancel, $timeout, $filter, appHelper) {
    var limits = {
            regLimit: {
                min: 1
            },
            regStartH: {
                min: 0,
                max: 23
            },
            regStartMm: {
                min: 0,
                max: 59
            },
            codeLengthH: {
                min: 0
            },
            codeLengthMm: {
                min: 0,
                max: 59
            },
            intermissionLengthH: {
                min: 0
            },
            intermissionLengthMm: {
                min: 0,
                max: 59
            },
            challengeLengthH: {
                min: 0
            },
            challengeLengthMm: {
                min: 0,
                max: 59
            },
            coderPerRoom: {
                min: 1
            },
            startHh: {
                min: 1,
                max: 12
            },
            startMm: {
                min: 0,
                max: 59
            }
        },
        reader = new FileReader();


    // get data
    $scope.languages = {};
    $scope.languageChoice = [];
    $http.get('data/languages.json').success(function (data) {
        $scope.languages = data;
        angular.forEach(data.all, function (language) {
            var item = {};
            item.language = language;
            if (language === 'Java' || language === 'C#' || language === 'VB') {
                item.checked = true;
            } else {
                item.checked = false;
            }
            $scope.languageChoice.push(item);
        });
    });
    // lauch contest
    $scope.ok = function () {
        ok();
        $modalInstance.close();
    };
    // cancel creation
    $scope.cancel = function () {
        cancel();
        $modalInstance.dismiss('cancel');
    };
    // set page to show
    $scope.index = 1;
    $scope.setPage = function (index) {
        $scope.index = index;
    };
    $scope.navTo = function (index) {
        if ($scope.index === 4) {
            $scope.setPage(index);
        }
    };
    // go to next step. 
    // if it is step-1, do validate.
    $scope.hasError = false;
    $scope.formValid = {
        contestName: true,
        type: true,
        regLimit: true,
        startDate: true,
        language: true,
        startHh: true,
        startMm: true
    };
    $scope.next = function (form) {
        function isValid(target) {
            if (!$scope[target]) {
                return false;
            }
            var value = +$scope[target];
            //console.log(target + ' ' + value + ' ' + $scope.startHh);
            if (angular.isDefined(limits[target].min) && value < limits[target].min) {
                return false;
            }
            if (angular.isDefined(limits[target].max) && value > limits[target].max) {
                return false;
            }
            return true;
        }
        if ($scope.index === 1) {
            //console.log($scope.startHh);
            // if (!form.$valid || $scope.languageCount <= 0 ||
            //         !isValid('startHh') || !isValid('startMm')) {
            $scope.formValid.contestName = form.contestName.$valid ? true : false;
            $scope.formValid.type = form.type.$valid ? true : false;
            $scope.formValid.regLimit = form.regLimit.$valid ? true : false;
            $scope.formValid.startDate = form.startDate.$valid ? true : false;
            $scope.formValid.language = $scope.languageCount > 0 ? true : false;
            $scope.formValid.startHh = isValid('startHh') ? true : false;
            $scope.formValid.startMm = isValid('startMm') ? true : false;
            var noError = true;
            /*jslint unparam:false*/
            angular.forEach($scope.formValid, function (value, item) {
                /*jslint unparam:true*/
                console.log(item+"  "+value);
                noError = noError && value;
                console.log('item-'+item+"--noError: "+noError);
            });
            console.log('error '+noError);
            if (noError) {
                $scope.hasError = false;
                $scope.setPage(2);
            } else {
                 $scope.hasError = true;
            }
            return;
            // } else {
            //     
            //     $scope.setPage($scope.index + 1);
            // }
            // return;
        }
        $scope.setPage($scope.index + 1);
    };
    // go to previous step
    $scope.prev = function () {
        $scope.setPage($scope.index - 1);
    };
    // get choosed language
    $scope.getChoice = function () {
        var string = '';
        $scope.languageCount = 0;
        angular.forEach($scope.languageChoice, function (item) {
            if (item.checked) {
                $scope.languageCount += 1;
                if (string === '' || string === undefined) {
                    string = ' ' + item.language;
                } else {
                    string += ', ' + item.language;
                }
            }
        });
        return '(' + $scope.languageCount + '):' + string;
    };
    $scope.selectAll = function (event) {
        var checked = !!event.target.checked;
        angular.forEach($scope.languageChoice, function (item) {
            item.checked = checked;
        });
    };
    // Check if all languages are selected.
    $scope.isSelectedAll = function () {
        var i;
        for (i = 0; i < $scope.languageChoice.length; i += 1) {
            if (!$scope.languageChoice[i].checked) {
                return false;
            }
        }
        return true;
    };
    function isCommonLanguage(lang, commonSet) {
        return commonSet.indexOf(lang) > -1;
    }
    $scope.selectSet = function (event) {
        var checked = !!event.target.checked;
        angular.forEach($scope.languageChoice, function (item) {
            item.checked = checked && isCommonLanguage(item.language, $scope.languages.commonSet);
        });
    };
    $scope.isSelectedSet = function () {
        var i, item, isCommon;
        for (i = 0; i < $scope.languageChoice.length; i += 1) {
            item = $scope.languageChoice[i];
            isCommon = isCommonLanguage(item.language, $scope.languages.commonSet);
            if (($scope.languageChoice[i].checked && !isCommon) ||
                    (!$scope.languageChoice[i].checked && isCommon)) {
                return false;
            }
        }
        return true;
    };
    // toggle selector 
    $scope.langToggle = false;
    $scope.toggleLangPanel = function (event) {
        var closeLangPanel = function (event) {
            // the depth of DOM tree rooted at the element with id 'themePanel'
            var panelDOMDepth = 4;
            if (!appHelper.clickOnTarget(event.target, 'langPanel', panelDOMDepth)) {
                $scope.langToggle = false;
            }
        };
        if ($scope.langToggle) {
            $scope.langToggle = false;
            document.removeEventListener('click', closeLangPanel);
        } else {
            $scope.langToggle = true;
            document.addEventListener('click', closeLangPanel);
            event.stopPropagation();
        }
    };

    $scope.openPhaseSchedule = false;
    $scope.openRoomAssignment = false;
    $scope.toggle = function (target) {
        $scope[target] = !$scope[target];
        // only one section can be open
        if (target === 'openPhaseSchedule' && $scope.openPhaseSchedule) {
            $scope.openRoomAssignment = false;
        } else if (target === 'openRoomAssignment' && $scope.openRoomAssignment) {
            $scope.openPhaseSchedule = false;
        }
    };

    // default value
    $scope.officialRated = true;
    $scope.assignByDiv = true;
    // handle registration limit
    $scope.regLimit = 2600;
    $scope.regStartH = 2;
    $scope.regStartMm = '00';
    $scope.codeLengthH = 1;
    $scope.codeLengthMm = '15';
    $scope.intermissionLengthH = 0;
    $scope.intermissionLengthMm = '05';
    $scope.challengeLengthH = 0;
    $scope.challengeLengthMm = 15;
    $scope.coderPerRoom = 1;
    $scope.startHh = '';
    $scope.startMm = '';

    function applyConstraints(value, limit) {
        if (limit && angular.isDefined(limit.min) && value < limit.min) {
            return limit.min;
        }
        if (limit && angular.isDefined(limit.max) && value > limit.max) {
            return limit.max;
        }
        return value;
    }

    $scope.changeStr = function (target, delta) {
        var result = applyConstraints((+$scope[target]) + delta, limits[target]);
        $scope[target] = (result < 10 ? '0' : '') + result;
    };
    $scope.addStr = function (target) {
        if ($scope.removeInter && (target === 'intermissionLengthMm' || target === 'challengeLengthMm')) {
            // disable click
            return;
        }
        $scope.changeStr(target, +1);
    };
    $scope.minusStr = function (target) {
        if ($scope.removeInter && (target === 'intermissionLengthMm' || target === 'challengeLengthMm')) {
            // disable click
            return;
        }
        $scope.changeStr(target, -1);
    };
    $scope.add = function (target) {
        if ($scope.removeInter && (target === 'intermissionLengthH' || target === 'challengeLengthH')) {
            // disable click
            return;
        }
        $scope[target] = applyConstraints($scope[target] + 1);
    };
    $scope.minus = function (target) {
        if ($scope.removeInter && (target === 'intermissionLengthH' || target === 'challengeLengthH')) {
            // disable click
            return;
        }
        $scope[target] = applyConstraints($scope[target] - 1);
    };
    $scope.trimLeadingZero = function (str) {
        return +str;
    };

    $scope.contestCalendarEvents = [];
    $scope.contestCalendarEventSources = [$scope.contestCalendarEvents];
    // calendar
    function parseDate(dateString) {
        var date = new Date();
        // ignore Timezone
        date.setFullYear(+dateString.substring(0, 4));
        date.setMonth((+dateString.substring(5, 7)) - 1);
        date.setDate(+dateString.substring(8, 10));
        date.setHours(+dateString.substring(11, 13));
        date.setMinutes(+dateString.substring(14, 16));
        return date;
    }
    $http.get('data/contest-plan.json').success(function (data) {
        data.contests.forEach(function (contest) {
            $timeout(function () {
                $scope.contestCalendarEvents.push({
                    title: contest.title,
                    start: parseDate(contest.start),
                    allDay: false
                });
            }, 0);
        });

        // config calendar plugin
        $scope.contestCalConfig = {
            calendar: {
                height: 241,
                editable: false,
                header: {
                    left: 'title',
                    center: '',
                    right: 'month, prev, next'
                },
                titleFormat: {
                    month: 'MMMM yyyy',
                    day: 'MMM d, yyyy'
                },
                eventRender: $scope.eventRender, // add color tag and events number qtip to day number when events are loading
                dayClick: $scope.selectDay // change to day view when clicking day number
            }
        };
    });
    // add color info to day number
    /*jslint unparam: true*/
    $scope.eventRender = function (event, element, monthView) {
        var date = event.start.getFullYear() + '-' +
                (event.start.getMonth() > 8 ? '' : '0') + (event.start.getMonth() + 1) + '-' +
                (event.start.getDate() > 9 ? '' : '0') + event.start.getDate(),
            target = $('#contestCalendar .fc-view-month').find('[data-date=' + date + ']');
        target.addClass('eventColor');
    };
    // select the day
    $scope.selectDay = function (date, allDay, jsEvent, view) {
        $scope.startDate = $filter('date')(date, 'MM/dd/yyyy');
        $scope.startDateSum = $filter('date')(date, 'dd MMM yyyy');
        var dateSelect = $filter('date')(date, 'yyyy-MM-dd'),
            day = $filter('date')(date, 'd');
        $('#contestCalendar').find('.selectedDate').removeClass('selectedDate');
        $('#contestCalendar .fc-view-month')
            .find('[data-date=' + dateSelect + ']')
            .addClass('selectedDate')
            .find('.fc-day-number')
            .attr('day', day);
    };
    /*jslint unparam: false*/

    // handle am/pm marker
    $scope.marker = 'AM';
    $scope.setMarker = function (marker) {
        $scope.marker = marker;
    };
    $scope.getMarker = function () {
        return $scope.marker;
    };

    $scope.logoData = '';
    $scope.logoFile = undefined;
    reader.onload = function (event) {
        $scope.logoData = event.target.result;
    };
    $(document).on('change', '#logoFile', function () {
        if (this.files && this.files[0]) {
            $scope.logoFile = this.files[0];
            reader.readAsDataURL(this.files[0]);
        }
    });

    $http.get('data/assignmentMethod.json').success(function (data) {
        $scope.assignMethods = data;
    });
    $scope.roomAssignmentMethod = 'None';
    $scope.getMethod = function () {
        return $scope.roomAssignmentMethod;
    };
    $scope.setMethod = function (method) {
        $scope.roomAssignmentMethod = method;
    };
}];

module.exports = contestCreationCtrl;