/**
 * Created by yashrajchhabra on 30/03/17.
 */
var spaces = angular.module('spaces', ['ngMaterial', 'ui.router', 'angular-jwt', 'ngFileUpload']);

spaces.config(function Config($stateProvider, $urlRouterProvider, $locationProvider, jwtInterceptorProvider, $httpProvider) {

    $urlRouterProvider.otherwise('/');
    $locationProvider.html5Mode(true);
    jwtInterceptorProvider.tokenGetter = ['config', function (config) {
        var user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            return user.token;
        } else {
            return null;
        }
    }];
    $httpProvider.interceptors.push('jwtInterceptor');
    $stateProvider
        .state('auth', {
            url: '/',
            templateUrl: '/auth.html',
            controller: 'authController',
            requireLogin: false
        })
        .state('dashboard', {
            url: '/app/dashboard',
            templateUrl: '/dashboard.html',
            controller: 'dashboardController',
            requireLogin: true
        })
        .state('form', {
            url: '/app/form/:shareId',
            templateUrl: '/form.html',
            controller: 'formController',
            requireLogin: false
        });
});

spaces.service('SessionService', function ($rootScope) {
    var user = localStorage.getItem('user');

    this.getUser = function () {
        return JSON.parse(localStorage.getItem('user'));
    };

    this.setUser = function (newUser) {
        localStorage.setItem('user', JSON.stringify(newUser));
        this.broadcastLogin();
    };

    this.updateUser = function (user) {
        localStorage.setItem('user', JSON.stringify(user));
    };

    this.removeUser = function () {
        localStorage.clear();
        this.broadcastLogout();
    };

    this.broadcastLogout = function () {
        $rootScope.$broadcast('logout');
    };

    this.broadcastLogin = function () {
        $rootScope.$broadcast('loginSuccess');
    };

    this.isLoggedIn = function () {
        user = this.getUser();
        return user && user.hasOwnProperty('token');
    };

});

spaces.run(function ($rootScope, SessionService, $state, $mdToast) {
    var theme = localStorage.getItem('theme');

    $rootScope.theme = theme ? theme : 'theme-indigo';
    $rootScope.$state = $state;

    $rootScope.$on('$stateChangeStart', function (event, next) {
        if (!SessionService.isLoggedIn() && next.hasOwnProperty('requireLogin') && next.requireLogin) {
            event.preventDefault();
            $state.go('auth');
        } else if (SessionService.isLoggedIn() && next.name == 'auth') {
            event.preventDefault();
            $state.go('dashboard');
        }
    });

    $rootScope.$on('toast', function (event, title) {
        $mdToast.show(
            $mdToast.simple()
                .textContent(title)
                .position('top right')
                .hideDelay(3000)
        );
    })
});

spaces.controller('navController', ['$scope', '$rootScope', '$state', 'SessionService',
    function ($scope, $rootScope, $state, SessionService) {

        $rootScope.$on('loginSuccess', function () {
            $scope.isLoggedIn = true;
        });

        $rootScope.$on('logout', function () {
            $scope.isLoggedIn = false;
        });

        if (SessionService.isLoggedIn()) {
            SessionService.broadcastLogin();
        }

        $scope.themes = [
            {name: 'Indigo', class: 'theme-indigo'},
            {name: 'Green', class: 'theme-green'},
            {name: 'Cyan', class: 'theme-cyan'},
            {name: 'Deep Purple', class: 'theme-deep-purple'}
        ];

        $scope.setTheme = function (theme) {
            $rootScope.theme = theme.class;
            localStorage.setItem('theme', theme.class);
        };

        $scope.logout = function () {
            SessionService.removeUser();
            $state.go('auth');
        };

    }]);


spaces.controller('authController', ['$scope', '$rootScope', '$state', 'authApi', 'SessionService',
    function ($scope, $rootScope, $state, authApi, SessionService) {
        $scope.user = {};
        $scope.authState = 'login';

        $scope.setAuthState = function (state) {
            $scope.authState = state;
        };

        $scope.submit = function () {
            if ($scope.authState === 'login') {
                login();
            } else {
                signUp();
            }
        };

        var signUp = function () {
            authApi.signUp($scope.user).then(function (result) {
                var data = result.data;
                if (data.hasOwnProperty('message')) {
                    $rootScope.$broadcast('toast', 'Email already exists');
                } else if (data && data.hasOwnProperty('token')) {
                    SessionService.setUser(data);
                    $state.go('dashboard');
                }
            }, function (error) {

            })
        };

        var login = function () {
            authApi.login($scope.user).then(function (result) {
                var data = result.data;
                if (data.hasOwnProperty('message')) {
                    if (data.message === 'wrongPassword') {
                        $rootScope.$broadcast('toast', 'Wrong Password');
                    } else {
                        $rootScope.$broadcast('toast', 'No user found with this email');
                    }
                } else if (data && data.length > 0 && data[0].hasOwnProperty('token')) {
                    SessionService.setUser(data[0]);
                    $state.go('dashboard');
                }
            }, function (error) {

            })
        };
    }]);

spaces.controller('dashboardController', ['$scope', '$rootScope', 'spacesApi', '$mdDialog',
    function ($scope, $rootScope, spacesApi, $mdDialog) {
        $scope.fields = [0];
        $scope.space = {};

        $scope.setFieldType = function (index, type) {
            if (type === null && $scope.space.fields[index].hasOwnProperty('done')) {
                delete $scope.space.fields[index];
                var position;
                for (var i in $scope.fields) {
                    if ($scope.fields[i] === index) {
                        position = i;
                        break;
                    }
                }
                if (position) {
                    $scope.fields.splice(position, 1);
                }
                return;
            }
            if ($scope.space.fields && $scope.space.fields.hasOwnProperty(index) && $scope.space.fields[index].name) {
                $scope.space.fields[index].type = type;
                if (type === null && $scope.space.fields[index].hasOwnProperty('done')) {
                    delete $scope.space.fields[index].done;
                }
            } else {
                $rootScope.$broadcast('toast', 'Add field name to confirm');
            }
        };

        $scope.addFieldType = function (index) {
            if ($scope.space.fields && $scope.space.fields[index].name) {
                $scope.space.fields[index].done = true;
                $scope.fields.push(index + 1);
            } else {
                $rootScope.$broadcast('toast', 'Add field name to confirm');
            }
        };

        $scope.getBtnStatus = function () {
            if (!$scope.space.fields) {
                return true;
            } else if (!Object.keys($scope.space.fields).length) {
                return true;
            }
            var isDisabled = false;
            for (var i in $scope.space.fields) {
                var field = $scope.space.fields[i];
                if (field && field.hasOwnProperty('name') && field.name === '') {
                    continue;
                } else if ((field && !field.hasOwnProperty('name') && field.name !== '')
                    || (!field.hasOwnProperty('type')) || (!field.type || !field.name)) {
                    isDisabled = true;
                    break;
                }
            }
            return isDisabled;
        };

        $scope.createSpace = function () {
            spacesApi.create($scope.space).then(function (result) {
                getSpaces('active');
                $scope.showCreate = false;
                $scope.space = {};
                $scope.fields = [0];
            }, function (error) {

            })
        };

        $scope.getWidgetColor = function (index) {
            if ($scope.space.fields && $scope.space.fields[index] && $scope.space.fields[index].hasOwnProperty('done')) {
                return 'input-widget-trash'
            } else if ($scope.space.fields && $scope.space.fields[index] && $scope.space.fields[index].hasOwnProperty('type')) {
                return 'input-widget-check';
            } else {
                return $rootScope.theme;
            }
        };

        $scope.share = function (index, ev) {
            $mdDialog.show({
                controller: function ($scope, $rootScope, $mdDialog, space, spacesApi) {
                    $scope.space = space;
                    $scope.getShareUrl = function () {
                        return document.location.origin + '/app/form/' + space.shareId;
                    };

                    $scope.copy = function () {
                        $rootScope.$broadcast('toast', 'Link Copied');
                    };

                    $scope.done = function () {
                        $mdDialog.hide($scope.space);
                    };

                    $scope.shareSpace = function (email) {
                        var payload = {
                            id: space.id,
                            email: email
                        };
                        spacesApi.shareSpace(payload).then(function (result) {
                            var data = result.data;
                            if (data.hasOwnProperty('sharedWith')) {
                                $scope.space = data;
                            }
                            $scope.email = null;
                            $rootScope.$broadcast('toast', 'Link has been sent to users email');
                        });
                    };
                },
                templateUrl: '/shareDialog.html',
                targetEvent: ev,
                clickOutsideToClose: false,
                locals: {
                    space: $scope.spaces[index]
                }
            }).then(function (space) {
                $scope.spaces[index] = space;
            }, function () {

            });
        };

        $scope.download = function (space, type) {
            var anchor = angular.element('<a/>');
            if (type === 'json') {
                anchor.attr({
                    href: 'data:attachment/json;charset=utf-8,' + JSON.stringify(createJson(space.fields)),
                    target: '_blank',
                    download: space.title + '.json'
                })[0].click();
            } else {
                anchor.attr({
                    href: 'data:attachment/csv;charset=utf-8,' + createCsv(space.fields),
                    target: '_blank',
                    download: space.title + '.csv'
                })[0].click();
            }
        };

        $scope.archive = function (index, ev) {
            var confirm = $mdDialog.confirm()
                .title('Archive this Space')
                .textContent('Are your sure you want to archive this space?')
                .targetEvent(ev)
                .ok('Yes')
                .cancel('Cancel');

            $mdDialog.show(confirm).then(function () {
                var space = $scope.spaces[index];
                var payload = {
                    id: space.id,
                    type: 'archive'
                };
                spacesApi.update(payload).then(function () {
                    $scope.spaces.splice(index, 1);
                }, function () {

                })
            }, function () {

            });
        };

        $scope.showSpaceDetail = function (index, ev) {
            $mdDialog.show({
                controller: function ($scope, $rootScope, $mdDialog, space, spacesApi) {
                    $scope.space = space;
                    $scope.done = function () {
                        $mdDialog.hide();
                    };
                },
                templateUrl: '/spaceDetail.html',
                targetEvent: ev,
                clickOutsideToClose: false,
                locals: {
                    space: $scope.spaces[index]
                }
            });
        };

        $scope.getProgress = function (space) {
            var fieldKeys = Object.keys(space.fields);
            space.progress = 0;
            space.noFields = 0;
            for (var j in fieldKeys) {
                if (space.fields[fieldKeys[j]].hasOwnProperty('answer')) {
                    space.progress += 1;
                } else if (space.fields[fieldKeys[j]].hasOwnProperty('file')) {
                    space.progress += 1;
                }
                space.noFields += 1;
            }
            return (space.progress / space.noFields) * 100;
        };

        var createCsv = function (fields) {
            var csv = 'Name,Answer,Image URL, \n';
            for (var i in fields) {
                var f = fields[i];
                csv += f.name + ',' + (f.answer ? f.answer : '-') + ',' + (f.file ? ('/file/' + f.file) : '-') + ',\n';
            }
            return encodeURI(csv);
        };

        var createJson = function (fields) {
            var json = [];
            for (var i in fields) {
                var f = fields[i];
                json.push({
                    name: f.name,
                    answer: (f.answer ? f.answer : '-'),
                    file: (f.file ? ('/file/' + f.file) : '-')
                });
            }
            return json;
        };

        var getSpaces = function (status) {
            spacesApi.get({status: status}).then(function (result) {
                if (result && result.hasOwnProperty('data') && result.data) {
                    $scope.spaces = result.data;
                }
            }, function (error) {
                console.log(error);
            })
        };

        getSpaces('active');

    }]);

spaces.controller('formController', ['$scope', '$rootScope', 'spacesApi', '$stateParams', 'Upload',
    function ($scope, $rootScope, spacesApi, $stateParams, Upload) {

        var getFormData = function () {
            spacesApi.getFormData($stateParams).then(function (result) {
                var data = result.data;
                if (data && data.length > 0) {
                    $scope.space = data[0];
                    checkProgress();
                } else {
                    $scope.message = '404, Space not found';
                }
            }).then(function (error) {

            });
        };

        $scope.uploadImage = function (file, invalidFile, key) {
            if (!file) {
                return;
            }
            Upload.upload({
                url: '/api/v1/space/file-upload',
                data: {
                    file: file,
                    id: $scope.space.id
                }
            }).then(function (result) {
                var data = result.data;
                if (data && data.hasOwnProperty('message') && data.message === 'success') {
                    $scope.space.fields[key].file = file.name;
                    $rootScope.$broadcast('toast', file.name + ' uploaded');
                } else {
                    $rootScope.$broadcast('toast', 'File upload failed');
                }
            }, function (resp) {
                $rootScope.$broadcast('toast', 'Error uploading File');
            }, function (evt) {
                $scope.space.fields[key].progress = parseInt(100.0 * evt.loaded / evt.total);
            });
        };

        $scope.submit = function () {
            var data = {
                id: $scope.space.id,
                type: 'field',
                fields: $scope.space.fields
            };
            spacesApi.update(data).then(function () {
                $rootScope.$broadcast('toast', 'Data updated');
                checkProgress();
            }, function () {

            });
        };

        var checkProgress = function () {
            var fieldKeys = Object.keys($scope.space.fields);
            $scope.space.progress = 0;
            $scope.space.noFields = 0;
            for (var j in fieldKeys) {
                if ($scope.space.fields[fieldKeys[j]].hasOwnProperty('answer')) {
                    $scope.space.progress += 1;
                } else if ($scope.space.fields[fieldKeys[j]].hasOwnProperty('file')) {
                    $scope.space.progress += 1;
                }
                $scope.space.noFields += 1;
            }
            var progressPercent = ($scope.space.progress / $scope.space.noFields) * 100;
            if (progressPercent === 100) {
                $scope.message = 'All Data has been updated. Thank You!';
            }
        };

        if ($stateParams && $stateParams.hasOwnProperty('shareId')) {
            getFormData();
        } else {
            $scope.message = '404, Space not found';
        }

    }]);

spaces.service('authApi', ['$http', function ($http) {

    this.login = function (params) {
        if (!params)
            params = {};
        return $http.post('/auth/login', params).then(function successCallback(response) {
            return response;
        }, function errorCallback() {
        });
    };

    this.signUp = function (params) {
        if (!params)
            params = {};
        return $http.post('/auth/signup', params).then(function successCallback(response) {
            return response;
        }, function errorCallback() {
        });
    };

}]);

spaces.service('spacesApi', ['$http', function ($http) {

    var BASE_URL = '/api/v1/space';

    this.create = function (params) {
        if (!params)
            params = {};
        return $http.post(BASE_URL, params).then(function successCallback(response) {
            return response;
        }, function errorCallback() {

        });
    };

    this.get = function (params) {
        if (!params)
            params = {};
        return $http.get(BASE_URL, {params: params}).then(function successCallback(response) {
            return response;
        }, function errorCallback() {

        });
    };

    this.getFormData = function (params) {
        if (!params)
            params = {};
        return $http.get(BASE_URL + '/form-date', {params: params}).then(function successCallback(response) {
            return response;
        }, function errorCallback() {

        });
    };

    this.update = function (params) {
        if (!params)
            params = {};
        return $http.put(BASE_URL, params).then(function successCallback(response) {
            return response;
        }, function errorCallback() {

        });
    };

    this.shareSpace = function (params) {
        if (!params)
            params = {};
        return $http.post(BASE_URL + '/share', params).then(function successCallback(response) {
            return response;
        }, function errorCallback() {

        });
    };

    this.download = function (params) {
        if (!params)
            params = {};
        return $http.post(BASE_URL + '/download', params).then(function successCallback(response) {
            return response;
        }, function errorCallback() {

        });
    };

}]);

spaces.service('ngCopy', ['$window', function ($window) {
    var body = angular.element($window.document.body);
    var textarea = angular.element('<textarea/>');
    textarea.css({
        position: 'fixed',
        opacity: '0'
    });
    return function (toCopy) {
        textarea.val(toCopy);
        body.append(textarea);
        textarea[0].select();
        try {
            var successful = document.execCommand('copy');
            if (!successful) throw successful;
        } catch (err) {
            window.prompt("Copy to clipboard: Ctrl+C, Enter", toCopy);
        }
        textarea.remove();
    }
}]);

spaces.directive('ngClickCopy', ['ngCopy', function (ngCopy) {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            element.bind('click', function (e) {
                ngCopy(attrs.ngClickCopy);
            });
        }
    }
}]);