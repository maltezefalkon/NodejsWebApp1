function ReviewEmployeesController($scope, $http)
{
    FetchData($scope, $http);
}

function FetchData($scope, $http)
{
    var url = 'http://localhost:1337/Organization/Addresses.Details,Tenures.Educator';
    $http.get(url)
        .success(function (data, status, headers, config) {
        $scope.Organization = data[0];
    })
        .error(function (data, status, headers, config) {
        alert('Error ' + status);
    });
}