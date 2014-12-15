import QtQuick 2.2
import QtQuick.Controls 1.1
import "base"

ScrollView {
    property alias model: projectList.model
    frameVisible: false

    ListView {
        id: projectList
        anchors.fill: parent
        anchors.margins: spacing
        boundsBehavior: Flickable.StopAtBounds
        focus: true

        add: Transition {
            SequentialAnimation {
                NumberAnimation {
                    property: 'opacity';
                    from: 0;
                    to: 0;
                    duration: 1
                }
                PauseAnimation { duration: 100 }
                NumberAnimation {
                    property: 'opacity';
                    from: 0;
                    to: 1;
                    duration: 200
                }
            }
        }

        displaced: Transition {
            NumberAnimation { properties: "x,y"; duration: 200; }
        }
        remove: Transition {
            NumberAnimation { property: 'height'; to: 0; duration: 200 }
            NumberAnimation {
                property: 'opacity';
                from: 1;
                to: 0;
                duration: 150
            }
        }

        delegate:  ProjectListItem {}

        Loader {
            anchors.fill: parent
            active: !projectListModel.count
            source: "ProjectListEmpty.qml"
        }

        Menu {
            id: contextMenu
            property ProjectListItem target

            MenuItem {
                text: qsTr('Edit Hostname')
                onTriggered: contextMenu.target.editHost();
            }

            MenuItem {
                text: qsTr('Delete')
                onTriggered: contextMenu.target.remove();
            }
        }

        MouseArea {
            anchors.fill: parent
            acceptedButtons: Qt.RightButton
            onClicked: {
                var item = parent.itemAt(mouse.x, mouse.y);
                if(!item) return;

                var project = model.get(parent.indexAt(mouse.x, mouse.y));

                if(!project.dynamic) {
                    contextMenu.target = item;
                    contextMenu.popup()
                }
            }
        }


        // When we are at the top displaying 1px line
        Rectangle {
            width: parent.width
            height: 1
            color: '#ccc'
            anchors.top: parent.top
            visible: projectList.atYBeginning
            z: 1
        }

        // When we are not at the top displaying nice shadow
        Rectangle {
            height: 5
            anchors.top: parent.top
            width: parent.width
            visible: !projectList.atYBeginning
            gradient: Gradient {
                GradientStop { position: 0; color: '#55000000'}
                GradientStop { position: 1; color: '#00000000'}
            }
            z: 1
        }
    }
}
