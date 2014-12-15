# Add more folders to ship with the application, here
server_folder.source = ../node/server
server_folder.target = ./
node_chokidar.source = ../node/node_modules/chokidar
node_chokidar.target = ./server/node_modules
node_minimist.source = ../node/node_modules/minimist
node_minimist.target = ./server/node_modules
client_folder.source = ../js/dist
client_folder.target = ./js
DEPLOYMENTFOLDERS = server_folder node_chokidar node_minimist client_folder

QT += sql svg

macx {
  TARGET = "Live HTML"
  ICON = "mac/AppIcon.icns"
  QMAKE_INFO_PLIST = "mac/Info.plist"
}

win32 {
  RC_ICONS = "win/AppIcon.ico"
}

# Getting version from git
include(gitversion.pri)

# Please do not modify the following two lines. Required for deployment.
include(qtquick2controlsapplicationviewer/qtquick2controlsapplicationviewer.pri)
qtcAddDeployment()

SOURCES += main.cpp

macx {
OBJECTIVE_SOURCES += \
    qtquick2controlsapplicationviewer/qtquick2controlsapplicationviewer.mm
} else {
SOURCES += \
    qtquick2controlsapplicationviewer/qtquick2controlsapplicationviewer.cpp
}

OTHER_FILES += \
    gitversion.pri

HEADERS += \
    process.h \
    platforminformation.h \
    clipboard.h \
    qtquick2controlsapplicationviewer/qtquick2controlsapplicationviewer.h \
    qtquick2controlsapplicationviewer/customqmlnetworkaccessfactory.h \
    qtquick2controlsapplicationviewer/customnetworkaccessmanager.h \
    qmlfile.h

RESOURCES += \
    resources.qrc

