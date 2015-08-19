function LoginController($scope, $http, $location) {
    var dict = parseQueryString();
    $scope.Message = dict.message;
}


function parseQueryString() {
    var args = document.location.search.substring(1).split('&');
    var ret = {};

    for (i = 0; i < args.length; i++) {
        var arg = decodeURIComponent(args[i]);

        if (arg.indexOf('=') == -1) {
            ret[arg.trim()] = true;
        }
        else {
            var kvp = arg.split('=');
            ret[kvp[0].trim()] = kvp[1].trim();
        }
    }
    return ret;
}
