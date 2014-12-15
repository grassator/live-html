import QtQuick 2.2

/*!
    \qmltype RichText
    \brief Displays a line rich text (html) with hoverable and clickable links.
    \sa Text
*/

BaseText {
    textFormat: Text.RichText
    onLinkHovered: {
        if(link) {
            extraTextMouseArea.cursorShape = Qt.PointingHandCursor;
        } else {
            extraTextMouseArea.cursorShape = Qt.ArrowCursor;
        }
    }

    MouseArea {
        id: extraTextMouseArea
        anchors.fill: parent
        onClicked: {
            var link = parent.linkAt(mouse.x, mouse.y);
            if(link) {
                Qt.openUrlExternally(link);
            }
        }
    }
}
