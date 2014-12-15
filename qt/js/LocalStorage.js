.pragma library
.import QtQuick.LocalStorage 2.0 as QtQuick
.import Native 1.0 as Native

var db = QtQuick.LocalStorage.openDatabaseSync("localstorage", "0.2", "LocalStorage", 100000);
var tableName = 'keyvalue';
var data = {};

// Initializing table if needed
db.transaction(function(tx){
    var sql = 'CREATE TABLE IF NOT EXISTS ' + tableName;
    sql += '(id INTEGER PRIMARY KEY ASC, key TEXT, value TEXT)';
    tx.executeSql(sql);
});

refresh();

// Saving defaults orupgrading if needed
var version = get("version");
if(version) {
    // TODO check for updates to DB structure
} else { // first launch
    set("version", Native.AppInfo.version);
    set("port", 55555);
    if(Native.Platform.name === 'Windows') {
        set("nodePath", "C:/Program Files/nodejs/node");
    } else {
        set("nodePath", "/usr/local/bin/node");
    }
}

function get(key, defaultValue) {
    return (key in data) ? JSON.parse(data[key]) : defaultValue;
}

function set(key, value) {
    value = JSON.stringify(value);
    if(data[key] === value) {
        return;
    }

    db.transaction(function(tx){
        if(key in data) {
            tx.executeSql('UPDATE ' + tableName + ' SET value=? WHERE key=?', [value, key]);
        } else {
            tx.executeSql('INSERT INTO ' + tableName + '(key,value) VALUES (?,?)', [key, value]);
        }
        data[key] = value;
    });
}

function remove(key) {
    if(!key || !(key in data)) return;
    db.transaction(function(tx){
        tx.executeSql('DELETE FROM ' + tableName + ' WHERE key=?', [key]);
        delete data[key];
    });
}

function refresh() {
    data = {};
    db.transaction(function(tx){
        var rs = tx.executeSql('SELECT * FROM ' + tableName);
        var item;
        for(var i = 0; i < rs.rows.length; i++) {
            item = rs.rows.item(i);
            data[item.key] = item.value;
        }
    });
}
