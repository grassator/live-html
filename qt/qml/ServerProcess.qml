import QtQuick 2.2
import Native 1.0
import "../js/WindowManager.js" as WindowManager
import "../js/LocalStorage.js" as LocalStorage

Process {
    property bool running: false
    property bool autoStart: true
    signal connected(var project)
    signal disconnected(var project)
    signal message(string message)

    property ListModel model: projectListModel

    function normalizePath(path) {
        if(Platform.name === 'OSX') {
            path = '../Resources/' + path;
        }
        return cwd() + '/' + path;
    }

    function startServer() {
        if(running) {
            console.warn("Server already running");
            return;
        }
        var mainJsPath = normalizePath('server/server.js');
        var processArgs = [mainJsPath,
                           "--port", LocalStorage.get("port", 55555)];
        start(LocalStorage.get("nodePath"), processArgs);
    }

    function killServer() {
        kill();
    }

    function writeResponse(request, data) {
        data = {
            type: "response",
            guid: request.guid,
            data: data
        };
        write(JSON.stringify(data));
    }

    function writeData(type, data) {
        data = {
            type: type,
            data: data
        };
        write(JSON.stringify(data));
    }

    function processRequest(request) {
        if(request.name === "projectByHost") {
            var found = false;
            model.processHost(request.parameters.host, function(project){
                found = true;
                writeResponse(request, project);
            });
            if(!found) {
                writeResponse(request, false);
            }
        } else if(request.name === "heartbeat") {
            writeResponse(request);
        }
    }

    function removeProject(project) {
        model.clearConnectionsTo(project);
        writeData("remove", project);
    }

    Component.onCompleted: {
        if(autoStart) {
            startServer();
        }

        projectListModel.removed.connect(removeProject);

        // TODO ideally there should be a special udpate action
        // but since we are handling reconnections quite gracefully
        // we can just remove the project and it will be ok
        projectListModel.updated.connect(removeProject);
    }

    onStandardOutput: {
        data = data.trim();
//        console.log(data);

        var dataPieces = data.split("\n\n");
        dataPieces.forEach(function(piece){
            if(!piece.trim()) return;
            piece = JSON.parse(piece);
            switch(piece.type) {
            case "request":
                processRequest(piece.message);
                break;
            case "online":
                running = true;
                break;
            case "connect":
                connected(piece.message.project);
                break;
            case "disconnect":
                disconnected(piece.message.project);
                break;
            default:
                console.log(JSON.stringify(piece));
            }
        });
    }

    onStandardError: {
        console.log(data);
    }

    onFinished: {
        model.clearAllConnections();
        running = false;
    }

    onError: {
        // FIXME If error happened before server has been started it probably
        // means that node hasn't been found, a check for "node -v" should
        // be used instead to avoid case where server.js is crashing
        if(!running) {
            var options = {
                message: qsTr("Live HTML needs <a href='http://nodejs.org'>" +
                              "<font color='#900'>node.js</font></a> to work.<br>" +
                              "Please check the path below and restart Live HTML.")
            };
            WindowManager.showSingletonWindow("PreferencesWindow.qml", options);
        } else {
            model.clearAllConnections();
            running = false;
        }
    }
}
