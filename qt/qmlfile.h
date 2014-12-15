#ifndef QMLFILE_H
#define QMLFILE_H

#include <QFile>
#include <QFileInfo>
#include <QtQml>

/**
 * @brief Small library for dealing with files
 */
class QmlFile : public QObject
{
    Q_OBJECT

public:
    explicit QmlFile(QObject *parent = NULL) : QObject(parent) {

    }

    Q_INVOKABLE bool exists(QString path) {
        return QFileInfo::exists(path);
    }

    Q_INVOKABLE bool copy(QString srcFilePath, QString tgtFilePath) {
        QFileInfo srcFileInfo(srcFilePath);
        if (srcFileInfo.isDir()) {
            QDir targetDir(tgtFilePath);
            targetDir.cdUp();
            if (!targetDir.mkdir(QFileInfo(tgtFilePath).fileName()))
                return false;
            QDir sourceDir(srcFilePath);
            QStringList fileNames = sourceDir.entryList(QDir::Files | QDir::Dirs | QDir::NoDotAndDotDot | QDir::Hidden | QDir::System);
            foreach (const QString &fileName, fileNames) {
                const QString newSrcFilePath
                        = srcFilePath + QLatin1Char('/') + fileName;
                const QString newTgtFilePath
                        = tgtFilePath + QLatin1Char('/') + fileName;
                if (!copy(newSrcFilePath, newTgtFilePath))
                    return false;
            }
        } else {
            return QFile::copy(srcFilePath, tgtFilePath);
        }
        return true;
    }

    static void registerQmlSingleton(const char *uri = "Native", int majorVersion = 1, int minorVersion = 0) {
        // @uri Native
        qmlRegisterSingletonType<QmlFile>(uri, majorVersion, minorVersion, "File", qmlProvider);
    }

private:

    static QObject* qmlProvider(QQmlEngine *engine, QJSEngine *scriptEngine)
    {
        Q_UNUSED(engine)
        Q_UNUSED(scriptEngine)
        return new QmlFile();
    }

};

#endif // QMLFILE_H
