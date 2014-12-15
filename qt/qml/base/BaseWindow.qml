import QtQuick 2.2
import QtQuick.Window 2.1

Window {

    property bool closeOnEscape: false
    property bool destroyOnClose: false
    property bool autoShow: true

    signal aboutToBeDestroyed()
    color: systemPalette.window

    SystemPalette {
        id: systemPalette
        colorGroup: SystemPalette.Active
    }

    Item {
        focus: true
        anchors.fill: parent

        Keys.onPressed: {
            if(event.key === Qt.Key_W && (event.modifiers & Qt.ControlModifier)) {
                close();
            }
            if(closeOnEscape && event.key === Qt.Key_Escape) {
                close();
            }
        }
    }


    onVisibleChanged: {
        if(!visible && destroyOnClose) {
            // FIXME Due to some obscure bug Qt doesn't always allow
            // to destroy window so we just pretend that it did for now
            try {
                destroy();
            } catch(e) {
                console.warn(e.message);
                aboutToBeDestroyed();
            }
        }
    }

    Component.onDestruction: {
        aboutToBeDestroyed();
    }

    Component.onCompleted: {
        if(autoShow) {
            show();
        }
    }
}
