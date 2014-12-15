#include <QtQml>
#include "qtquick2controlsapplicationviewer.h"
#include "clipboard.h"
#include "process.h"
#include "platforminformation.h"
#include "qmlfile.h"
#include <QDebug>

static QJSValue appVersionSingletonProvider(QQmlEngine *engine, QJSEngine *scriptEngine)
{
    Q_UNUSED(engine)

    QJSValue appInfo = scriptEngine->newObject();
    appInfo.setProperty("version", GIT_VERSION);
    return appInfo;
}

int main(int argc, char *argv[])
{
    QCoreApplication::setOrganizationDomain("ru.kubyshkin");
    QCoreApplication::setApplicationName("Live HTML");
    QCoreApplication::setApplicationVersion(GIT_VERSION);

    Application app(argc, argv);

    app.setAttribute(Qt::AA_UseHighDpiPixmaps, true);

    Process::registerQmlType();
    Clipboard::registerQmlSingleton();
    PlatformInformation::registerQmlSingleton();
    QmlFile::registerQmlSingleton();
    qmlRegisterSingletonType("Native", 1, 0, "AppInfo", appVersionSingletonProvider);
    QtQuick2ControlsApplicationViewer viewer;
    viewer.setMainQmlFile(QUrl(QStringLiteral("qrc:/qml/MainWindow.qml")));
    viewer.show();

    return app.exec();
}
