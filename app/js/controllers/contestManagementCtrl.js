/*jshint -W097*/
/*jshint strict:false*/
'use strict';
/*jshint -W097*/
/*jshint strict:false*/
/*jslint plusplus: true*/
/*global document, angular:false, $:false, module, window, require*/

var contestManagementCtrl = ['$scope', '$http', '$timeout', function ($scope, $http, $timeout) {
    $scope.contests = {};
    $scope.currentContests = [];
    $scope.contestKeys = [];
    $scope.problemKeys = [];
    $scope.key = 'active';
    $scope.numOfPage = 10;
    $scope.currentPage = 0;
    // filter function
    $scope.keys = {
        managementKeys: ['-start', 'title'],
        managementFilterKey: {
            type: 'Any',
            status: 'Any'
        },
        managementFilter: {
            type: '',
            status: ''
        },
        assignmentFilterKey: {
            type: 'Any',
            status: 'Any'
        },
        assignmentFilter: {
            type: '',
            status: ''
        }
    };
    // assignment
    $scope.problems = [];
    $scope.assignedProblems = [];
    $scope.problemsToAssign = [];
    $scope.problemDict = {};
    $scope.tags = [];

    var // filter
        filter = $('.filterToggle'),
        managementFilter = $('#managementFilter'),
        assignmentFilter = $('#assignmentFilter'),
        // popup functions 
        showPopup = function (panel) {
            switch (panel) {
            case 'assignmentPanel':
                $('#problemAssignmentPanel').show();
                $('body').addClass('popupOpen');
                break;
            case 'assignment':
                $('#problemAssignment').show();
                $('body').addClass('popupOpen');
                break;
            default:
                return;
            }
        },
        hidePopup = function (panel) {
            switch (panel) {
            case 'assignmentPanel':
                $('#problemAssignmentPanel').hide();
                $('body').removeClass('popupOpen');
                break;
            case 'assignment':
                $('#problemAssignment').hide();
                break;
            default:
                return;
            }
        },
        // filter
        clearFilter = function () {
            $scope.keys.assignmentFilterKey = {
                type: 'Any',
                status: 'Any'
            };
            $scope.keys.assignmentFilter = {
                type: '',
                status: ''
            };
            $timeout(function () {
                $scope.$broadcast('reload:availableProblems');
            }, 50);
        },
        removeFilter = function (key) {
            key = key.substring(0, 1).toLowerCase() + key.substring(1);
            $scope.keys.assignmentFilter[key] = '';
            $scope.keys.assignmentFilterKey[key] = 'Any';
            $timeout(function () {
                $scope.$broadcast('reload:availableProblems');
            }, 50);
        },
        // search tags
        addTags = function (val, key) {
            var item = {
                type: key.substring(0, 1).toUpperCase() + key.substring(1),
                value: val.substring(0, 1).toUpperCase() + val.substring(1)
            };
            $scope.tags.push(item);
        },
        clearTags = function () {
            $scope.tags = [];
        },
        removeTag = function (index) {
            removeFilter($scope.tags[index].type);
            $scope.tags.splice(index, 1);
        },
        clearSelection = function () {
            $scope.problemCheckedID = -1;
        };

    // get data
    // keys
    $http.get('data/management-keys.json').success(function (data) {
        $scope.contestKeys = data.contest;
        $scope.problemKeys = data.problem;
        // Add the 'Any' filter
        $scope.contestKeys.type.unshift('Any');
        $scope.contestKeys.status.unshift('Any');
        $scope.problemKeys.type.unshift('Any');
        $scope.problemKeys.status.unshift('Any');
    });
    // contests data
    $http.get('data/management-activeContests.json').success(function (data) {
        $scope.contests.active = data;
        $scope.currentContests = $scope.contests.active;
    });
    $http.get('data/management-pastContests.json').success(function (data) {
        $scope.contests.past = data;
    });
    $http.get('data/management-hiddenContests.json').success(function (data) {
        $scope.contests.hidden = data;
    });
    // problems data
    $http.get('data/problems.json').success(function (data) {
        $scope.problems = data;
        var i;
        for (i = 0; i < data.length; i += 1) {
            $scope.problemDict[data[i].id] = data[i];
        }
    });

    // change data
    $scope.setDataTo = function (key) {
        $scope.currentContests = $scope.contests[key];
        $scope.key = key;
        $scope.currentPage = 0;
    };

    // get contests
    $scope.getContests = function () {
        return $scope.currentContests;
    };

    // get pagination index
    $scope.range = function (data, num) {
        if (num === 0) {
            return [];
        }
        var len = data.length % num !== 0 ?
                    (data.length - data.length % num) / num + 1 : (data.length - data.length % num) / num;
        return new [].constructor(len);
    };
    $scope.setCurrentPage = function (index) {
        $scope.currentPage = index;
    };

    // qtip here
    // use qtip to create filter panel and modal
    filter.qtip({
        content: {
            text: ''
        },
        position: {
            my: 'top right',
            at: 'bottom right',
            target: filter,
            adjust: {
                x: 17,
                y: -26
            }
        },
        show: {
            event: 'click',
            solo: true
        },
        hide: {
            event: 'click unfocus',
            effect: function () {
                // $('#problemAssignmentPanel').css({
                //     'overflow-y': 'auto'
                // });
            }
        },
        style: {
            classes: 'filterPanel contestFilter'
        },
        events: {
            visible: function () {
                // $('#problemAssignmentPanel').css({
                //     'overflow-y': 'hidden'
                // });
            }
        }
    });
    managementFilter.qtip('api').set('content.text', managementFilter.next());
    managementFilter.qtip('api').set('position.target', managementFilter);
    assignmentFilter.qtip('api').set('content.text', assignmentFilter.next());
    assignmentFilter.qtip('api').set('position.target', assignmentFilter);
    assignmentFilter.qtip('api').set('stype.classes', 'filterPanel contestFilter problemFilter');
    assignmentFilter.qtip('api').set('position.container', $('#problemAssignmentPanel .customQtip'));
    $scope.closeQtip = function (panel) {
        switch (panel) {
        case 'management':
            managementFilter.qtip('api').toggle(false);
            break;
        case 'assignment':
            assignmentFilter.qtip('api').toggle(false);
            break;
        default:
            return;
        }
    };

    // dropdown functions
    $scope.getFilterKey = function (panel, key) {
        function translate(val) {
            return val === '' ? 'Any' : val;
        }
        switch (panel) {
        case 'management':
            return translate($scope.keys.managementFilterKey[key]);
        case 'assignment':
            return translate($scope.keys.assignmentFilterKey[key]);
        default:
            return;
        }
    };
    $scope.setFilterKey = function (panel, key, index) {
        switch (panel) {
        case 'management':
            $scope.keys.managementFilterKey[key] = $scope.contestKeys[key][index];
            break;
        case 'assignment':
            $scope.keys.assignmentFilterKey[key] = $scope.problemKeys[key][index];
            break;
        default:
            return;
        }
    };

    // filter the data
    $scope.filterBegin = function (panel) {
        clearSelection();
        $scope.closeQtip(panel);
        switch (panel) {
        case 'management':
            angular.forEach($scope.keys.managementFilterKey, function (val, key) {
                $scope.keys.managementFilter[key] = val === 'Any' ? '' : val;
            });
            $scope.currentPage = 0;
            break;
        case 'assignment':
            clearTags();
            angular.forEach($scope.keys.assignmentFilterKey, function (val, key) {
                if (val !== 'Any' && val !== '') {
                    addTags(val, key);
                    $scope.keys.assignmentFilter[key] = val;
                } else {
                    $scope.keys.assignmentFilter[key] = '';
                }
            });
            $timeout(function () {
                $scope.$broadcast('reload:availableProblems');
            }, 50);
            break;
        default:
            return;
        }
    };

    // sort
    $scope.toggleSortKey = function (keywords, key) {
        var index = keywords.indexOf(key),
            i,
            targetKey = key,
            toggleKey = function (key) {
                return key[0] === '-' ? key.substring(1, key.length) : ('-' + key);
            };
        if (index < 0) {
            index = keywords.indexOf('-' + key);
            targetKey = '-' + key;
            if (index < 0) {
                return;
            }
        }
        if (index === 0) {
            targetKey = toggleKey(targetKey);
        } else {
            for (i = index; i > 0; i -= 1) {
                keywords[i] = keywords[i - 1];
            }
        }
        keywords[0] = targetKey;
    };

    $scope.currentContest = undefined;
    // open the assign problem popup
    $scope.openAssignProblem = function (contest) {
        $scope.currentContest = contest;
        $scope.problemsToAssign = [];
        $scope.assignedProblems = [];
        $scope.assignedProblemDict = {};
        angular.forEach(contest.problems, function (assignedProblem) {
            $scope.assignedProblemDict[assignedProblem.id] = assignedProblem;
        });
        angular.forEach($scope.problems, function (problem) {
            var newProblem = angular.copy(problem);
            if (angular.isDefined($scope.assignedProblemDict[problem.id])) {
                // the problem is already assigned to the contest
                angular.extend(newProblem, $scope.assignedProblemDict[problem.id]);
                $scope.assignedProblems.push(newProblem);
            } else {
                $scope.problemsToAssign.push(problem);
            }
        });
        showPopup('assignmentPanel');
        $timeout(function () {
            $scope.$broadcast('reload:assignedProblems');
            $scope.$broadcast('reload:availableProblems');
        }, 50);
    };
    // submit the problem assignments for a contest
    $scope.submitProblemAssignments = function () {
        if (angular.isDefined($scope.currentContest)) {
            $scope.currentContest.problems = angular.copy($scope.assignedProblems);
        }
        hidePopup('assignmentPanel');
        $timeout(function () {
            $scope.$broadcast('reload:assignedProblems');
            $scope.$broadcast('reload:availableProblems');
        }, 50);
    };
    // cancel or close the popup for problem assignments for a contest
    $scope.cancelProblemAssignments = function () {
        $scope.currentContest = undefined;
        hidePopup('assignmentPanel');
    };

    clearSelection();
    $scope.assignProblem = function () {
        if (angular.isUndefined($scope.problemDict[$scope.problemCheckedID])) {
            $scope.openModal({
                title: 'Error',
                message: 'Please select a problem.',
                enableClose: true
            });
        } else {
            $scope.problemToAssign = angular.copy($scope.problemDict[$scope.problemCheckedID]);
            showPopup('assignment');
        }
    };
    $scope.startEditProblem = function (problem) {
        $scope.problemToAssign = angular.copy(problem);
        showPopup('assignment');
    };
    $scope.removeProblem = function (problem) {
        $scope.problemsToAssign.push($scope.problemDict[problem.id]);
        var index = $scope.assignedProblems.indexOf(problem);
        if (index >= 0) {
            $scope.assignedProblems.splice(index, 1);
            $timeout(function () {
                $scope.$broadcast('reload:assignedProblems');
                $scope.$broadcast('reload:availableProblems');                
            }, 50);
        }
    };

    // close the popup for a problem assignment
    $scope.cancelProblemAssignment = function () {
        // clear problem configuration
        $scope.problemToAssign = {};
        hidePopup('assignment');
    };
    $scope.saveProblemAssignment = function () {
        var i;
        if (angular.isUndefined($scope.problemToAssign.division) ||
                angular.isUndefined($scope.problemToAssign.difficulty) ||
                angular.isUndefined($scope.problemToAssign.points) ||
                angular.isUndefined($scope.problemToAssign.openOrder) ||
                angular.isUndefined($scope.problemToAssign.submitOrder)) {
            $scope.openModal({
                title: 'Error',
                message: 'Please fill in the fields with valid values.',
                enableClose: true
            });
            return;
        }
        clearSelection();
        for (i = 0; i < $scope.assignedProblems.length; i += 1) {
            if ($scope.assignedProblems[i].id === $scope.problemToAssign.id) {
                // update problem configuration
                angular.extend($scope.assignedProblems[i], $scope.problemToAssign);
                hidePopup('assignment');
                return;
            }
        }
        // save problem configuration
        $scope.assignedProblems.push(angular.copy($scope.problemToAssign));
        // remove from the list of problems to assign
        for (i = 0; i < $scope.problemsToAssign.length; i += 1) {
            if ($scope.problemsToAssign[i].id === $scope.problemToAssign.id) {
                $scope.problemsToAssign.splice(i, 1);
            }
        }
        hidePopup('assignment');
        $timeout(function () {
            $scope.$broadcast('reload:assignedProblems');
            $scope.$broadcast('reload:availableProblems');
        }, 50);
    };

    // search
    $scope.searchText = '';
    $scope.removeTag = removeTag;
    $scope.clearSearchArea = function () {
        clearTags();
        clearFilter();
        $scope.searchText = '';
    };

    $scope.caseSensitiveCmp = function (actual, expected) {
        return expected === '' || actual.indexOf(expected) >= 0;
    };

    $scope.stringsEqual = function (actual, expected) {
        return expected === '' || expected === actual;
    };

    $scope.reloadScrollBar = function () {
        $timeout(function () {
            $scope.$broadcast('reload:availableProblems');
        }, 50);
    };
}];

module.exports = contestManagementCtrl;