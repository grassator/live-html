import QtQuick 2.2
import Native 1.0
import "base"
import "../js/LocalStorage.js" as LocalStorage

Rectangle {
    signal snippetCopied()
    property string online: "loading"

    height: addButton.height + 20
    width: parent.width
    color: '#fff'

    Row {
        spacing: 10
        y: 10
        x: 10

        FlatButton {
            id: addButton
            text: qsTr("Add Project")
            onClicked: openDialog.open()
        }

        FlatButton {
            id: copySnippetButton
            text: qsTr("Copy Snippet")
            onClicked: {
                Clipboard.setText('<script src="http://127.0.0.1:' +
                                  LocalStorage.get("port") +
                                  '/live.js" data-debug></script>');
                snippetCopied()
            }
        }
    }

    Rectangle {
        y: 15
        x: parent.width - width - 15
        height: 20
        width: statusText.width + 20
        color: online === 'loading' ? '#f4c935' : (online === 'online' ? '#092' : '#c33')
        radius: height / 2

        BaseText {
            id: statusText
            anchors.centerIn: parent
            color: '#fff'
            text: online === 'loading' ? qsTr("loading") : (online === 'online' ? qsTr("online") : qsTr("offline"))
        }
    }
}
