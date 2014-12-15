import QtQuick 2.0
import QtQuick.XmlListModel 2.0
import Native 1.0
import "../js/Utils.js" as Utils

QtObject {
    signal updateAvailable(var update)
    signal noUpdateAvailable()
    signal error(string error)

    property bool auto: true
    property string appcastUrl: 'http://livehtml/updates.xml'
//    property string appcastUrl: 'http://everythingfrontend.com/live-html/api/updates.xml'

    property var model: null
    property Component modelComponent: XmlListModel {
        id: xmlModel
        query: "/rss/channel/item"
        namespaceDeclarations: "declare namespace sparkle = 'http://www.andymatuschak.org/xml-namespaces/sparkle';"
        XmlRole { name: "title";  query: "title/string()" }
        XmlRole { name: "description";  query: "description/string()" }
        XmlRole { name: "pubDate";  query: "pubDate/string()" }
        XmlRole { name: "version";  query: "enclosure/@sparkle:version/string()" }
        XmlRole { name: "url";  query: "enclosure/@url/string()" }
    }

    function _checkVersion(update) {
        if(Utils.compareVersions(update.version, AppInfo.version, 4) > 0) {
            updateAvailable(update);
        } else {
            noUpdateAvailable();
        }
    }

    function check() {
        if(!appcastUrl) {
            console.error("You need to specify appcastUrl");
            return;
        }

        if(model) {
            model.destroy();
        }
        model = modelComponent.createObject(null, { source: appcastUrl })
        model.onStatusChanged.connect(function() {
            if(model.status === XmlListModel.Ready && model.count > 0) {
                _checkVersion(model.get(0));
            } else if (model.status === XmlListModel.Error) {
                console.error(model.errorString())
                error(model.errorString());
            }
        });
    }

    Component.onCompleted: {
        if(!auto) return;
        check();
    }
}
