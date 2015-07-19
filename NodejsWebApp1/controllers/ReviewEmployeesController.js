function GetData($scope)
{
    $scope.Organization = {
        "name": "Elm Wood Charter School",
        "entity": "organization",
        "address": {
            "address1": "123 School St.",
            "city": "Philadelphia",
            "state": "PA",
            "zip": "19000"
        },
        "activeTenures": 
            [
                {
                    "title": "Mrs.",
                    "firstName": "Luann",
                    "lastName": "Milford",
                    "startDate": "19990101",
                    "endDate": null,
                    "position": "School Nurse"
                },
                {
                    "title": "Ms.",
                    "firstName": "Marsha",
                    "lastName": "Brady",
                    "startDate": "20030101",
                    "endDate": null,
                    "position": "4th Grade"
                },
                {
                    "title": "Ms.",
                    "firstName": "Fran",
                    "lastName": "Rorie",
                    "startDate": "20050101",
                    "endDate": null,
                    "position": "Speech Therapist"
                }
            ]
    };

}