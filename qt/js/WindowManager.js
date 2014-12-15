.pragma library
.import QtQuick 2.0 as QtQuick

var singletonWindows = {};
var basePath = Qt.resolvedUrl("../qml/");
var parent = null;

function destroyAll() {
    for(var key in singletonWindows) {
        if(singletonWindows[key]) {
            singletonWindows[key].destroy();
            singletonWindows[key] = null;
        }
    }
}

function showSingletonWindow(qmlPath, options) {
    options = options || {};
    options.destroyOnClose = true;
    qmlPath = basePath + qmlPath;

    // if such a window is already open we only focus it
    var win = singletonWindows[qmlPath];
    if(win) {
        win.raise();
        win.requestActivate();
    } else {
        var component = Qt.createComponent(qmlPath);
        win = component.createObject(parent, options);
        singletonWindows[qmlPath] = win;
        win.onAboutToBeDestroyed.connect(function removeRef(){
            singletonWindows[qmlPath] = null;
            win.onAboutToBeDestroyed.disconnect(removeRef);
        });
    }
}
