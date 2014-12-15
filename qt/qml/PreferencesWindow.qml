import QtQuick 2.2
import QtQuick.Controls 1.1
import QtQuick.Dialogs 1.1
import "../js/LocalStorage.js" as LocalStorage
import "base"

BaseWindow {
    title: qsTr("Preferences")
    property int margin: 20
    property string message: qsTr("Restart is required for preferences to take effect")
    minimumWidth: 500
    minimumHeight: 320
    maximumWidth: minimumWidth
    maximumHeight: minimumHeight
    closeOnEscape: true
    flags: Qt.Dialog

    FocusScope {
        anchors.fill: parent

        MouseArea {
            anchors.fill: parent
            onClicked: columnLayout.focus = true;
        }

        Column {
            id: columnLayout
            anchors.fill: parent
            anchors.margins: margin
            spacing: 15

            Rectangle {
                color: "#f3c4d0"
                border.color: "#d5a2a4"
                border.width: 1
                height: 50
                width: parent.width
                radius: 3

                RichText {
                    anchors.fill: parent
                    horizontalAlignment: Text.AlignHCenter
                    verticalAlignment: Text.AlignVCenter
                    font.pixelSize: 14
                    text: message
                }
            }

            Grid {
                columns: 2
                width: parent.width
                columnSpacing: 10
                rowSpacing: parent.spacing
                verticalItemAlignment: Grid.AlignVCenter

                BaseLabel {
                    id: nodePathLabel
                    target: nodePathField
                    text: qsTr("Path to node") + ":"
                }
                Row {
                    width: parent.width - nodePathLabel.width - parent.columnSpacing

                    TextField {
                        id: nodePathField
                        width: parent.width - nodeBrowseButton.width - parent.spacing
                        anchors.verticalCenter: parent.verticalCenter
                        text: LocalStorage.get("nodePath")
                        onAccepted: updatePath()

                        function updatePath() {
                            LocalStorage.set("nodePath", text)
                        }

                        FileDialog {
                            id: nodePathDialog
                            title: qsTr("Path to node")
                            selectExisting: true
                            selectMultiple: false
                            onAccepted: {
                                var url = (fileUrl + "").replace('file://', '').replace(/\/([A-Z]:)/g, '$1');
                                nodePathField.text = url;
                                nodePathField.updatePath();
                            }
                        }
                    }
                    Button {
                        id: nodeBrowseButton
                        anchors.verticalCenter: parent.verticalCenter
                        text: qsTr("Browse...")
                        onClicked: {
                            if(nodePathField.text) {
                                nodePathDialog.folder = nodePathField.text;
                            }
                            nodePathDialog.open()
                        }
                    }
                }


                BaseLabel {
                    id: portLabel
                    target: portField
                    text: qsTr("Server Port") + ":"
                }
                TextField {
                    id: portField
                    width: 55
                    validator: IntValidator { bottom: 1; top: 99999 }
                    text: LocalStorage.get("port")
                    onAccepted: {
                        LocalStorage.set("port", text);
                    }
                }

                Item { width: 1; height: 1 } // empty cell in grid
                CheckBox {
                    text: qsTr("Check updates on application start")
                    checked: LocalStorage.get("checkUpdatesOnStartup", true)
                    onCheckedChanged: {
                        LocalStorage.set("checkUpdatesOnStartup", checked)
                    }
                }
            }

            // separator
            Rectangle {
                height: 1
                color: "#33000000"
                width: parent.width
            }

            Row {
                spacing: 20

                property string packagesPath;

                FileDialog {
                    id: sublimePathDialog
                    title: qsTr("Path to Sublime Text Packages Folder")
                    selectExisting: true
                    selectMultiple: false
                    selectFolder: true
                    onAccepted: {
                        var url = (fileUrl + "").replace('file://', '');
                    }
                }

                Image {
                    width: 100
                    height: width
                    source: 'images/icons/sublime-text.png'
                    sourceSize.width: width * 2
                    sourceSize.height: height * 2
                    transform: Translate {
                        y: -5
                    }
                }

                Column {
                    spacing: 10
                    BaseText {
                        font.bold: true
                        text: qsTr("Live HTML extension for Sublime Text 2/3")
                    }
                    BaseText {
                        opacity: 0.8
                        text: qsTr("To install clone / download repository\n" +
                                   "below to your packages folder:")
                    }
                    RichText {
                        text: qsTr("<a href='https://github.com/grassator/sublime-live-html'>https://github.com/grassator/sublime-live-html</a>")
                    }
                }
            }
        }
    }


}
