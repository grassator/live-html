import QtQuick 2.2
import QtQuick.Controls 1.1
import Native 1.0
import "../js/WindowManager.js" as WindowManager
import "../js/LocalStorage.js" as LocalStorage

ApplicationWindow {
    title: "Live HTML"
    width: 400
    height: 230
    maximumWidth: 400
    minimumHeight: 100
    minimumWidth: 300
    color: '#fff'
    visible: false

    menuBar: MainMenuBar {}

    ProjectListModel { id: projectListModel }

    Item {
        id: mainViewHolder
        anchors.fill: parent
    }

    function saveGeometry() {
        var geometry = { x: x,  y: y, width: width, height: height }
        LocalStorage.set("mainWindowGeometry", geometry)
    }

    function restoreGeometry() {
        var geometry = LocalStorage.get("mainWindowGeometry", false);
        if(geometry) {
            x = geometry.x;
            y = geometry.y;
            width = geometry.width;
            height = geometry.height;
        }
    }

    Component.onDestruction: {
        saveGeometry();
    }

    Component.onCompleted: {
        restoreGeometry();

        // Have to manually load once storage is ready
        projectListModel.load();

        // and when project list is ready we can show everything
        Qt.createComponent("MainView.qml").createObject(mainViewHolder);

        // Now we are ready to show the window
        visible = true;
    }


}
