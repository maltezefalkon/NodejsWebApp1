function ReviewEmployeesController($scope, $http, $location)
{
    FetchData($scope, $http, $location);
}

function FetchData($scope, $http, $location)
{
    var url = 'http://localhost:1337/Organization/Addresses.Details,Tenures.Educator?OrganizationID=07489674-98D7-48F2-B357-08AE033E181A';
    $http.get(url)
        .success(function (data, status, headers, config) {
        $scope.Organization = data[0];
    })
        .error(function (data, status, headers, config) {
        alert('Error ' + status);
    });
}