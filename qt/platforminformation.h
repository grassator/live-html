#ifndef PLATFORMINFORMATION_H
#define PLATFORMINFORMATION_H

#include <QObject>
#include <QtQml>

class PlatformInformation : public QObject
{
    Q_OBJECT
    Q_PROPERTY (QString name READ name NOTIFY nameChanged)
public:
    explicit PlatformInformation(QObject *parent = 0)
        : QObject(parent)
    {
#ifdef Q_OS_WIN
        m_platformName = "Windows";
#endif

#ifdef Q_OS_OSX
        m_platformName = "OSX";
#else
#ifdef Q_OS_UNIX
        m_platformName = "Linux";
#endif
#endif
    }

    QString name() const { return m_platformName; }

    static void registerQmlSingleton(const char *uri = "Native", int majorVersion = 1, int minorVersion = 0) {
        // @uri Native
        qmlRegisterSingletonType<PlatformInformation>(uri,
                                                      majorVersion,
                                                      minorVersion,
                                                      "Platform",
                                                      platformInformationProvider);
    }

signals:
    void nameChanged();

private:
    QString m_platformName;

    static QObject* platformInformationProvider(QQmlEngine *engine, QJSEngine *scriptEngine)
    {
        Q_UNUSED(engine)
        Q_UNUSED(scriptEngine)
        return new PlatformInformation();
    }

};



#endif // PLATFORMINFORMATION_H
