import QtQuick 2.2
import QtQuick.Controls 1.1

Label {
    property var target: null

    MouseArea {
        anchors.fill: parent
        onClicked: {
            if(!target) return;
            target.forceActiveFocus();
        }
    }
}
