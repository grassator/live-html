import QtQuick 2.2
import "base"

Rectangle {
    id: root
    width: (addButtonLabel.width + paddingX * 2) | 1
    height: (addButtonLabel.height + paddingY * 2) | 1
    radius: 5
    border.width: 1

    property int paddingX: 10
    property int paddingY: 7
    property color defaultColor: '#999'
    property color hoverColor: '#08f'
    property alias text: addButtonLabel.text

    signal clicked;

    state: 'default'

    states: [
        State {
            name: "default"
            PropertyChanges {
                target: root
                border.color: defaultColor
            }
            PropertyChanges {
                target: addButtonLabel
                color: '#333'
            }
        },
        State {
            name: "hover"
            PropertyChanges {
                target: root
                border.color: hoverColor
            }
            PropertyChanges {
                target: addButtonLabel
                color: root.hoverColor
            }
        }
    ]

    BaseText {
        id: addButtonLabel
        anchors.centerIn: parent
    }

    MouseArea {
        id: mouseArea
        anchors.fill: parent
        hoverEnabled: true
        onEntered: root.state = 'hover'
        onExited: root.state = 'default'
        onClicked: root.clicked(mouse)
    }
}
