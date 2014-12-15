import QtQuick 2.0
import "base"

Rectangle {
    color: "#ccffffff"
    z: 100
    anchors.fill: parent
    visible: false
    opacity: 0

    function flash(text) {
        overlayText.text = text;
        visible = true;
        opacity = 1.0;
        overlayTimer.start();
    }

    Timer {
        id: overlayTimer
        running: false
        interval: 800
        onTriggered: overlayFadeOutAnimation.start()
    }

    NumberAnimation {
        id: overlayFadeOutAnimation
        running: false
        target: overlay;
        property: "opacity";
        to: 0;
        duration: 300;
        onStopped: target.visible = false
    }

    BaseText {
        id: overlayText
        anchors.centerIn: parent
        width: parent.width - 20
        horizontalAlignment: Text.AlignHCenter
        font.pixelSize: 20
        color: '#333'
    }
}
