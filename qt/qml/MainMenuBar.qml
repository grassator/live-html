import QtQuick.Controls 1.1
import "../js/WindowManager.js" as WindowManager

MenuBar {
    Menu {
        title: qsTr("File")
        MenuItem {
            text: qsTr("Preferences")
            onTriggered: {
                WindowManager.showSingletonWindow("PreferencesWindow.qml");
            }
        }
        MenuItem {
            text: qsTr("Exit")
            onTriggered: Qt.quit();
        }
    }
    Menu {

        title: qsTr("Help")
        MenuItem {
            text: qsTr("About Live HTML")
            onTriggered: WindowManager.showSingletonWindow("AboutWindow.qml");
        }
        MenuItem {
            text: qsTr("Check for Updates...")
            onTriggered: WindowManager.showSingletonWindow("UpdateWindow.qml");
        }
        MenuItem {
            text: qsTr("Report a Bug")
            onTriggered: {

            }
        }
    }
}
