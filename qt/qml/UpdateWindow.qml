import QtQuick 2.2
import QtQuick.Controls 1.1
import "base"

BaseWindow {
    id: window
    width: 400
    height: 110
    title: qsTr("Live HTML Updater")
    flags: Qt.Dialog | Qt.CustomizeWindowHint | Qt.WindowTitleHint
    closeOnEscape: true

    property var updateInfo: null

    function stopProgress() {
        progressBar.visible = false;
        extraText.visible = true;
        closeButton.text = qsTr("Close");
    }

    function showUpdate(update) {
        stopProgress();
        statusText.text = qsTr("New version available") + "(" + update.version + ")";
        extraText.text = "<a href='" + update.url + "'>" + update.url + "</a>";
    }

    function showLatest() {
        stopProgress();
        statusText.text = qsTr("You have the latest version.");
        extraText.text = qsTr("Check again later.");
    }

    // not sure why Item is needed, probably has something to do
    // with aliasing children inside DefaultWindow
    Updater {
        id: manualUpdater
        auto: false
        onUpdateAvailable: showUpdate(update)
        onNoUpdateAvailable: showLatest()
        // TODO show error message
        onError: showLatest()
    }

    Component.onCompleted: {
        if(updateInfo) {
            showUpdate(updateInfo);
        } else {
            manualUpdater.check();
        }
    }

    Image {
        x: 20
        y: 20
        width: 70
        height: width
        smooth: true
        source: "images/logo.png"
        // necessary for smooth scaling
        sourceSize.width: width * 2
        sourceSize.height: height* 2
    }

    BaseText {
        id: statusText
        font.pixelSize: 13
        x: 110
        y: 20
        font.bold: true
        text: qsTr("Checking for updates...")
    }

    ProgressBar {
        id: progressBar
        indeterminate: true
        anchors.top: statusText.bottom
        anchors.topMargin: 8
        anchors.left: statusText.left
        anchors.right: parent.right
        anchors.rightMargin: 20
    }

    Button {
        id: closeButton
        anchors.bottom: parent.bottom
        anchors.bottomMargin: 15
        anchors.right: parent.right
        anchors.rightMargin: 17
        text: qsTr("Cancel")
        onClicked: {
            window.close()
        }
    }

    RichText {
        id: extraText
        visible: false
        anchors.top: statusText.bottom
        anchors.topMargin: 5
        anchors.left: statusText.left
        anchors.right: parent.right
        anchors.rightMargin: 20
        elide: Text.ElideMiddle
    }
}
