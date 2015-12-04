angular.module('lab.controllers', [])

    .controller('LoadingCtrl', function ($scope, $timeout, $state) {

        // To listen for when this page is active (for example, to refresh data)
        $scope.$on('$ionicView.enter', function (viewInfo) {
            redirect();
        });

        function redirect() {
            $timeout(function () {

                var isAccessToken = window.localStorage.getItem('ngStorage-google_access_token');

                if ( isAccessToken == 'false' ) {
                    $state.go('login');
                } else {
                    $state.go('app.page1');
                }
            }, 300);
        }

    })

    .controller('LoginCtrl', function ($scope, $state, Auth, $ionicLoading) {

        $scope.error = null;

        $scope.login = function () {
            console.log('running from login button');

            $ionicLoading.show({ template: 'Carregando...' });

            Auth.startLogin().then(function(res){

                window.localStorage.setItem('currentUser', JSON.stringify(res));
                $state.go('app.page1');
                $ionicLoading.hide();

            }, function (res){

                $scope.error = res;
                $state.go('login');
                $ionicLoading.hide();
            });

        };
    })

    .controller('AppCtrl', function ($scope, $ionicModal, $timeout, $state, Auth) {

        // get currentUser
        $scope.currentUser = JSON.parse(window.localStorage.getItem('currentUser'));

        // Logout
        $scope.logout = function () {

            Auth.disconnectUser();

            window.localStorage.removeItem('currentUser');

            $state.go('login');

        };
    })

    .controller('ListsCtrl', function ($scope) {
        $scope.listItems = [
            {title: 'Item 1', id: 1},
            {title: 'Item 2', id: 2},
            {title: 'Item 3', id: 3},
            {title: 'Item 4', id: 4},
            {title: 'Item 5', id: 5},
            {title: 'Item 6', id: 6}
        ];
    })

    .controller('DetailCtrl', function ($scope, $stateParams) {
    });
