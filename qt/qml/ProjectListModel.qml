import QtQuick 2.2
import "../js/LocalStorage.js" as LocalStorage

ListModel {

    signal added(var project)
    signal removed(var project)
    signal updated(var project)

    Component.onCompleted: {
        added.connect(persist);
        removed.connect(persist);
        updated.connect(persist);
    }

    function guid() {
        var d = new Date().getTime();
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = (d + Math.random()*16)%16 | 0;
            d = Math.floor(d/16);
            return (c === 'x' ? r : (r&0x7|0x8)).toString(16);
        });
    }

    function persist() {
        var data = [];
        for(var i = 0, project; i < count; ++i) {
            project = get(i);
            if(!project.dynamic) {
                // FIXME need more efficient object clone
                data.push(JSON.parse(JSON.stringify(project)));
            }
        }
        LocalStorage.set("projects", data);
    }

    function appendProject(project) {
        project.guid = guid();
        append(project);
        added(project);
        return project.guid;
    }

    function removeProject(guid) {
        for(var i = 0, project; i < count; ++i) {
            project = get(i);
            if(guid === project.guid) {
                remove(i);
                removed(project);
                return true;
            }
        }
        return false;
    }

    function updateProject(guid, key, value) {
        for(var i = 0, project; i < count; ++i) {
            project = get(i);
            if(guid === project.guid) {
                setProperty(i, key, value);
                updated(project);
                return true;
            }
        }
        return false;
    }

    function processHost(host, callback) {
        for(var i = 0; i < count; ++i) {
            var item = get(i);
            if(item.name === host) {
                callback(item, i);
                return;
            }
        }
    }

    function processProject(project, callback) {
        for(var i = 0; i < count; ++i) {
            var item = get(i);
            if(     // saved project
                    (project.guid && item.guid === project.guid) ||
                    // dynamic project
                    (item.dynamic && item.name === project.name)) {
                callback(item, i);
                return;
            }
        }
    }

    function addConnectionTo(project) {
        var found = false;
        processProject(project, function(item, index){
            found = true;
            setProperty(index, "connectionCount", item.connectionCount + 1);
        });

        // If we didn't find the host it means that a file:// is opened
        if(!found) {
            project.dynamic = true;
            project.connectionCount = 1;
            append(project);
        }
    }

    function removeConnectionTo(project) {
        processProject(project, function(item, index){
            // If we dynamically created an item then we need
            // to remove it when last browser disconnect
            if(item.connectionCount === 1 && item.dynamic) {
                remove(index, 1);
            } else {
                setProperty(index, "connectionCount", item.connectionCount - 1);
            }
        });
    }

    function clearConnectionsTo(project) {
        processProject(project, function(item, index){
            // If we dynamically created an item then we need to remove it
            if(item.dynamic) {
                remove(index, 1);
            } else {
                setProperty(index, "connectionCount", 0);
            }
        });
    }

    function clearAllConnections() {
        for(var i = 0; i < count; ++i) {
            if(get(i).dynamic) {
                remove(i, 1);
                i--;
            } else {
                setProperty(i, "connectionCount", 0);
            }
        }
    }

    function load() {
        LocalStorage.get("projects", []).forEach(function(project){
            project.connectionCount = 0;
            project.dynamic = false;
            append(project);
        });
    }
}
