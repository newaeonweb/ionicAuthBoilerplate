// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('lab', ['ionic', 'lab.controllers', 'lab.services', 'ngStorage'])

    .config(function ($stateProvider, $urlRouterProvider, $httpProvider) {
        $stateProvider

            .state('loading', {
                url: '/loading',
                templateUrl: 'templates/loading.html',
                controller: 'LoadingCtrl'
            })

            .state('login', {
                url: '/login',
                templateUrl: 'templates/login.html',
                controller: 'LoginCtrl'
            })


            .state('app', {
                url: '/app',
                abstract: true,
                templateUrl: 'templates/menu.html',
                controller: 'AppCtrl'
            })


            .state('app.page1', {
                url: '/page1',
                views: {
                    'menuContent': {
                        templateUrl: 'templates/page1.html'
                    }
                }
            })

            .state('app.page2', {
                url: '/page2',
                views: {
                    'menuContent': {
                        templateUrl: 'templates/page2.html'
                    }
                }
            })

            .state('app.list', {
                url: '/list',
                views: {
                    'menuContent': {
                        templateUrl: 'templates/list.html',
                        controller: 'ListsCtrl'
                    }
                }
            })

            .state('app.single', {
                url: '/detail/:listId',
                views: {
                    'menuContent': {
                        templateUrl: 'templates/list-detail.html',
                        controller: 'DetailCtrl'
                    }
                }
            });
        // if none of the above states are matched, use this as the fallback
        $urlRouterProvider.otherwise('/loading');

        // configure $http requests according to authentication
        $httpProvider.interceptors.push('AuthInterceptor');
    })
    .factory('AuthInterceptor', function ($rootScope, $q, $window, $location) {

        return {
            request: function (config) {
                //console.log(config);

                return config;
            },

            response: function (response) {
                //console.log(response);

                return response;
            },

            responseError: function(response) {

                console.log('Failed with', response.status, 'status' );

                if (response.status === 401 || response.status === 403) {
                    // user is not authenticated
                    $location.path('/login');
                }
                return $q.reject(response);
            }
        };
    })

    .run(function ($ionicPlatform) {

        $ionicPlatform.ready(function () {
            // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
            // for form inputs)
            if (window.cordova && window.cordova.plugins.Keyboard) {
                cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
                cordova.plugins.Keyboard.disableScroll(true);

            }
            if (window.StatusBar) {
                // org.apache.cordova.statusbar required
                StatusBar.styleDefault();
            }
        });

    });
