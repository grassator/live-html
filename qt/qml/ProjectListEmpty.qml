import QtQuick 2.2
import "base"

Item {
    opacity: 0

    NumberAnimation on opacity {
        id: showAnimation
        running: true
        to: 1;
        duration: 300
    }

    Image {
        id: arrowImage
        x: 30
        y: 0
        opacity: 0.2
        width: 70
        height: width
        source: "images/arrow.png"
        sourceSize.height: height * 2
        sourceSize.width: width * 2
    }

    BaseText {
        anchors.left: arrowImage.right
        anchors.leftMargin: 20
        anchors.top: parent.top
        anchors.topMargin: arrowImage.height - 10 - height / 2
        width: parent.width - x - 20
        font.pixelSize: 18
        color: '#999'
        text: qsTr("No projects yet :(\nClick on this button to add one.")
    }
}
