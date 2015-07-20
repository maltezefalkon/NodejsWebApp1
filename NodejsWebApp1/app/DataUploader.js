var list = [
    'Address',
    'AddressType',
    'DocumentDefinition',
    'DocumentInstance',
    'Educator',
    'EducatorAddress',
    'OrganizationType',
    'User',
    'Organization',
    'OrganizationAddress',
    'Tenure',
    'UserEducatorAuthorization',
    'UserOrganizationAuthorization'
];

if (WScript.Arguments.length > 0) {
    list = [];
    for (var i = 0; i < WScript.Arguments.length; i++) {
        list.push(WScript.Arguments.item(i));
    }
}

var written = 0;

var fso = WScript.CreateObject("Scripting.FileSystemObject");
for (var i = 0; i < list.length; i++) {
    var tk = list[i];
    var url = 'http://localhost:1337/' + tk;
    var path = 'C:\\Users\\Dan\\Documents\\Visual Studio 2013\\Projects\\NodejsWebApp1\\NodejsWebApp1\\data\\' + tk + '.json';
    var file = fso.OpenTextFile(path, 1, false);
    var contents = file.ReadAll();
    if (contents.length > 6) {
        var request = WScript.CreateObject("MSXML2.XMLHTTP");
        request.open("POST", url, false);
        request.setRequestHeader("Content-type", "application/json");
        request.onreadystatechange = createCallback(request, tk, url);
        WScript.Echo('POSTing to ' + url);
        request.send(contents); // Send the request now
    }
}

function createCallback(request, tk, url) {
    return function () {
        if (request.readyState === 4 && request.status === 200) {
            WScript.Echo('Successfully posted ' + tk + ' data to ' + url);
            written++;
        }
    };
}
