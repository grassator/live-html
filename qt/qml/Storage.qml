import QtQuick 2.0
import QtQuick.LocalStorage 2.0

QtObject {
    readonly property var db: LocalStorage.openDatabaseSync("main", "0.1", "Storage", 100000);
    property string tableName: 'keyvalue'
    property var data: ({})

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

    function init() {
        // Initializing table if needed
        db.transaction(function(tx){
            var sql = 'CREATE TABLE IF NOT EXISTS ' + tableName;
            sql += '(id INTEGER PRIMARY KEY ASC, key TEXT, value TEXT)';
            tx.executeSql(sql);
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

    Component.onCompleted: {
        init();
        refresh();
    }
}
