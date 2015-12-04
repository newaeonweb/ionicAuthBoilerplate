angular.module('lab.services', [])

    .factory('lStorage', function ($localStorage) {

        return {
            cleanUp: function () {

                var cur_time = new Date().getTime();

                for (var i = 0; i < localStorage.length; i++) {
                    var key = localStorage.key(i);
                    if (key.indexOf('_expire') === -1) {
                        var new_key = key + "_expire";
                        var value = localStorage.getItem(new_key);
                        if (value && cur_time > value) {
                            localStorage.removeItem(key);
                            localStorage.removeItem(new_key);
                        }
                    }
                }
            },
            remove: function (key) {

                this.cleanUp();

                var time_key = key + '_expire';
                $localStorage[key] = false;
                $localStorage[time_key] = false;
            },
            get: function (key) {

                this.cleanUp();

                var time_key = key + "_expire";
                if (!$localStorage[time_key]) {
                    return false;
                }
                var expire = $localStorage[time_key] * 1;
                if (new Date().getTime() > expire) {
                    $localStorage[key] = null;
                    $localStorage[time_key] = null;
                    return false;
                }
                return $localStorage[key];
            },
            set: function (key, data, hours) {
                this.cleanUp();

                $localStorage[key] = data;
                var time_key = key + '_expire';
                var time = new Date().getTime();
                time = time + (hours * 1 * 60 * 60 * 1000);
                $localStorage[time_key] = time;
            }
        }


    })

    .factory('Auth', function ($q, $interval, $log, $http, lStorage) {

        var access_token = false;
        var redirect_url = 'http://localhost/callback';
        var client_id = '836933074591-du4ab0ffmdi1rotcnvh36uhfs197ju2u.apps.googleusercontent.com';
        var secret = '_md1t4CNIWZ5l1RnWgXKjrYm';
        var scope = 'https://www.googleapis.com/auth/urlshortener https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/plus.me';
        var gulp = function (url) {
            url = url.substring(url.indexOf('?') + 1, url.length);
                return url.replace('code=', '');
        };


        return {
            access_token: access_token,
            redirect_url: redirect_url,
            client_id: client_id,
            secret: secret,
            scope: scope,
            gulp: gulp,

            authorize: function (options) {
                var def = $q.defer();
                var self = this;

                var access_token = lStorage.get('google_access_token');

                if (access_token) {
                    $log.info('Direct Access Token :' + access_token);
                    this.getUserInfo(access_token, def);

                } else {

                    var params = 'client_id=' + encodeURIComponent(options.client_id);
                    params += '&redirect_uri=' + encodeURIComponent(options.redirect_uri);
                    params += '&response_type=code';
                    params += '&scope=' + encodeURIComponent(options.scope);
                    var authUrl = 'https://accounts.google.com/o/oauth2/auth?' + params;

                    var win = window.open(authUrl, '_blank', 'location=no,toolbar=no,width=800, height=800');
                    var context = this;

                    if (ionic.Platform.isWebView()) {
                        console.log('using in app browser');
                        win.addEventListener('loadstart', function (data) {
                            console.log('load start');
                            if (data.url.indexOf(context.redirect_url) === 0) {
                                console.log('redirect url found ' + context.redirect_url);
                                console.log('window url found ' + data.url);
                                win.close();
                                var url = data.url;
                                var access_code = context.gulp(url, 'code');
                                if (access_code) {
                                    context.validateToken(access_code, def);
                                } else {
                                    def.reject({error: 'Access Code Not Found'});
                                }
                            }

                        });
                    } else {
                        console.log('InAppBrowser not found11');
                        var pollTimer = $interval(function () {
                            try {
                                console.log("google window url " + win.document.URL);
                                if (win.document.URL.indexOf(context.redirect_url) === 0) {
                                    console.log('redirect url found');
                                    win.close();
                                    $interval.cancel(pollTimer);
                                    pollTimer = false;
                                    var url = win.document.URL;
                                    $log.debug('Final URL ' + url);
                                    var access_code = context.gulp(url, 'code');
                                    if (access_code) {
                                        $log.info('Access Code: ' + access_code);
                                        context.validateToken(access_code, def);
                                    } else {
                                        def.reject({error: 'Access Code Not Found'});
                                    }
                                }
                            } catch (e) {
                            }
                        }, 100);
                    }
                }
                return def.promise;
            },
            validateToken: function (token, def) {
                $log.info('Code: ' + token);

                var http = $http({
                    url: 'https://www.googleapis.com/oauth2/v3/token',
                    method: 'POST',
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                    params: {
                        code: token,
                        client_id: this.client_id,
                        client_secret: this.secret,
                        redirect_uri: this.redirect_url,
                        grant_type: 'authorization_code',
                        scope: ''
                    }
                });
                var context = this;

                http.then(function (data) {
                    $log.debug(data);
                    var access_token = data.data.access_token;
                    var expires_in = data.data.expires_in;
                    expires_in = expires_in * 1 / (60 * 60);

                    lStorage.set('google_access_token', access_token, expires_in);

                    if (access_token) {
                        $log.info('Access Token :' + access_token);
                        context.getUserInfo(access_token, def);
                    } else {
                        def.reject({error: 'Access Token Not Found'});
                    }
                });
            },
            getUserInfo: function (access_token, def) {
                var http = $http({
                    url: 'https://www.googleapis.com/oauth2/v3/userinfo',
                    method: 'GET',
                    params: {
                        access_token: access_token
                    }
                });
                http.then(function (data) {
                    $log.debug(data);
                    var user_data = data.data;
                    var user = {
                        name: user_data.name,
                        gender: user_data.gender,
                        email: user_data.email,
                        google_id: user_data.sub,
                        picture: user_data.picture,
                        profile: user_data.profile
                    };
                    def.resolve(user);

                });
            },
            startLogin: function () {
                var def = $q.defer();
                var promise = this.authorize({
                    client_id: this.client_id,
                    client_secret: this.secret,
                    redirect_uri: this.redirect_url,
                    scope: this.scope
                });
                promise.then(function (data) {
                    def.resolve(data);
                }, function (data) {
                    $log.error(data);
                    def.reject(data.error);
                });
                return def.promise;
            },
            disconnectUser: function () {

                var token = lStorage.get('google_access_token');

                var http = $http({
                    url: 'https://accounts.google.com/o/oauth2/revoke?token=' + token,
                    method: 'GET'
                });
                http.then(function (data) {
                    $log.debug(data);

                    lStorage.remove('google_access_token');

                });

            }
        }


    });
