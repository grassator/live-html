import QtQuick 2.2
import Native 1.0
import "base"

BaseWindow {
    width: 600
    height: 230
    title: qsTr("About Live HTML")
    closeOnEscape: true
    flags: Qt.Dialog

    Image {
        x: 25
        y: 38
        width: 150
        height: width
        source: "images/logo.png"
    }

    BaseText {
        x: 200
        y: 40
        font.pixelSize: 24
        font.bold: true
        text: "Live HTML"
    }

    BaseText {
        x: 200
        y: 70
        color: "#777"
        text: AppInfo.version
    }

    BaseText {
        x: 200
        y: 104
        text: qsTr("© 2014 Dmitriy Kubyshkin. All rights reserved.")
    }

    BaseText {
        x: 200
        y: 135
        width: parent.width - x - 30
        text: qsTr("The program is provided AS IS with NO WARRANTY OF ANY KIND, INCLUDING THE WARRANTY OF DESIGN, MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE.")
    }

}
