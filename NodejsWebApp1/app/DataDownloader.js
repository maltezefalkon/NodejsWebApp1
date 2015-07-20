var request = WScript.CreateObject("MSXML2.XMLHTTP");

var list = [
    'Address',
    'AddressType',
    'DocumentDefinition',
    'DocumentInstance',
    'Educator',
    'EducatorAddress',
    'Organization',
    'OrganizationAddress',
    'OrganizationType',
    'Tenure',
    'User',
    'UserEducatorAuthorization',
    'UserOrganizationAuthorization'
];

var written = 0;

var fso = WScript.CreateObject("Scripting.FileSystemObject");
for (var i = 0; i < list.length; i++) {
    var tk = list[i];
    var url = 'http://localhost:1337/' + tk;
    request.open("GET", url);
    request.onreadystatechange = createCallback(request, tk, url);
    request.send(null); // Send the request now
    WScript.Echo(url);
}

WScript.Echo('Spooled');

function createCallback(request, tk, url) {
    return function () {
        if (request.readyState === 4 && request.status === 200) {
            var path = 'C:\\Users\\Dan\\Documents\\Visual Studio 2013\\Projects\\NodejsWebApp1\\NodejsWebApp1\\data\\' + tk + '.json';
            var file = fso.CreateTextFile(path, true);
            file.WriteLine(request.responseText);
            file.Close();
            WScript.Echo(path);
            written++;
        }
    };
}