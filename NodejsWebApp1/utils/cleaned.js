Sequelize.transaction(function (txn) {
    var promise = null;
    req.body.forEach(function (o) {
        if (null == promise) {
            promise = saveObject(o, txn);
        } else {
            promise = promise.then(function () {
                saveObject(o, txn);
            }, function (err) {
                completeError('Error saving object at index ' + i.toString() + ': ' + err);
            });
        }
    });
