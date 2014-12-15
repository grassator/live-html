import QtQuick 2.2

Text {
    SystemPalette { id: systemPalette; colorGroup: SystemPalette.Active }

    font.family: "Arial"
    font.pixelSize: 12
    color: systemPalette.windowText
    wrapMode: Text.Wrap
    textFormat: Text.PlainText
    renderType: Text.NativeRendering
}
