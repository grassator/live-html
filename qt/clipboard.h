#ifndef CLIPBOARD_H
#define CLIPBOARD_H

#include <QClipboard>
#include <QApplication>
#include <QtQml>

/**
 * @brief Simple Wrapper around QProcess for QML usage
 */
class Clipboard : public QObject
{
    Q_OBJECT

public:
    explicit Clipboard(QObject *parent = NULL) : QObject(parent) {
        m_clipboard = QApplication::clipboard();
    }

    Q_INVOKABLE void setText(QString text){
        m_clipboard->setText(text, QClipboard::Clipboard);
    }

    static void registerQmlSingleton(const char *uri = "Native", int majorVersion = 1, int minorVersion = 0) {
        // @uri Native
        qmlRegisterSingletonType<Clipboard>(uri, majorVersion, minorVersion, "Clipboard", qmlProvider);
    }

private:
    QClipboard *m_clipboard;

    static QObject* qmlProvider(QQmlEngine *engine, QJSEngine *scriptEngine)
    {
        Q_UNUSED(engine)
        Q_UNUSED(scriptEngine)
        return new Clipboard();
    }

};

#endif // CLIPBOARD_H
