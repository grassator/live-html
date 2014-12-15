import QtQuick 2.2
import QtQuick.Controls 1.1
import "base"

Rectangle {
    id: root
    width: parent.width
    height: listDelegateLayout.height + 20
    color: model.connectionCount > 0 ? '#ddffe2' : '#f9f9f9'
    clip: true

    function remove() {
        root.ListView.view.model.removeProject(model.guid);
    }

    function editHost() {
        if(model.dynamic) return;
        editField.text = model.name;
        editField.visible = true;
        editField.forceActiveFocus();
    }

    Rectangle {
        id: activityIndicator
        width: 3
        height: parent.height
        color: '#092'
        visible: model.connectionCount > 0
    }

    Column {
        id: listDelegateLayout
        y: 10
        x: 10
        width: parent.width - x * 2
        spacing: 6

        BaseText {
            id: hostInput
            text: model.dynamic ? (qsTr("File:") + " " + model.name) : (qsTr("Server:") + " " + model.name)
            font.bold: true
            focus: true
            font.pixelSize: 12
            width: parent.width - x * 4 - closeIcon.width
            color: '#222'
            horizontalAlignment: Text.AlignLeft
            wrapMode: Text.NoWrap

            MouseArea {
                anchors.fill: parent
                onDoubleClicked: editHost()
            }

            TextField {
                id: editField
                anchors.bottom: parent.bottom
                anchors.left: parent.left
                anchors.right: parent.right
                anchors.rightMargin: 10
                visible: false
                onAccepted: {
                    if(text) {
                        editField.visible = false;
                        root.ListView.view.model.updateProject(model.guid, "name", text);
                    }
                }
                Keys.onPressed: {
                    if(event.key === Qt.Key_Escape) {
                        editField.visible = false;
                    }
                }
            }

            Item {
                visible: !model.dynamic
                x: parent.parent.width - width
                y: 0

                width: 12
                height: width
                state: 'default'

                states: [
                    State {
                        name: 'default'
                        PropertyChanges {
                            target: closeIcon
                            opacity: 0.3
                        }
                    },
                    State {
                        name: 'hover'
                        PropertyChanges {
                            target: closeIcon
                            opacity: 0.6
                        }
                    }
                ]

                Image {
                    id: closeIcon
                    anchors.fill: parent
                    source: 'images/cross.svg'
                    sourceSize.width: parent.width * 2
                    sourceSize.height: parent.height * 2
                }

                Timer {
                    interval: 100
                    running: true
                }

                MouseArea {
                    anchors.fill: parent
                    hoverEnabled: true
                    onEntered: parent.state = 'hover'
                    onExited: parent.state = 'default'
                    onClicked: remove()
                }
            }
        }

        BaseText {
            id: pathText
            text: model.path
            renderType: Text.NativeRendering
            font.pixelSize: 11
            color: '#999'
        }
    }

    Rectangle {
        width: parent.width
        height: 1
        color: '#ccc'
        anchors.bottom: parent.bottom
    }
}
