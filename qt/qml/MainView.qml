import QtQuick 2.0
import QtQuick.Dialogs 1.1
import QtQuick.Controls 1.1
import Native 1.0
import "base"
import "../js/WindowManager.js" as WindowManager
import "../js/LocalStorage.js" as LocalStorage

Item {
    anchors.fill: parent
    ServerProcess {
        id: serverProcess
        onConnected: projectListModel.addConnectionTo(project);
        onDisconnected: projectListModel.removeConnectionTo(project);
        onRunningChanged: {
            listToolbar.online = running ? 'online' : 'offline';
        }
    }

    OverlayMessage { id: overlay }

    Updater {
        auto: LocalStorage.get("checkUpdatesOnStartup", true)
        onUpdateAvailable: {
            WindowManager.showSingletonWindow("UpdateWindow.qml", { updateInfo: update });
        }
    }

    FileDialog {
        id: openDialog
        title: qsTr("Choose project folder")
        selectExisting: true
        selectFolder: true
        selectMultiple: false
        onAccepted: {
            var url = openDialog.fileUrls[0];
            var data = {
                name: url.replace(/^.*?([^\/\\]+?)$/, '$1'),
                path: url.replace('file://', '')
            };
            projectListModel.appendProject(data);
        }
    }

    ProjectListToolbar {
        id: listToolbar
        onSnippetCopied: overlay.flash(qsTr("Snippet copied"));
    }

    ProjectListView {
        model: projectListModel
        anchors.top: listToolbar.bottom
        anchors.left: parent.left
        anchors.right: parent.right
        anchors.bottom: parent.bottom
    }
}
