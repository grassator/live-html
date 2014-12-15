#include <QProcess>
#include <QtQml>
#include <QApplication>

/**
 * @brief Simple Wrapper around QProcess for QML usage
 */
class Process : public QObject
{
    Q_OBJECT

public:

    enum ProcessState {
        NotRunning = QProcess::NotRunning,
        Starting = QProcess::Starting,
        Running = QProcess::Running
    };

    Q_ENUMS(ProcessState)

    explicit Process(QObject *parent = NULL) : QObject(parent) {
        m_process = new QProcess(this);
        m_process->setProcessEnvironment(QProcessEnvironment::systemEnvironment());
        connect(m_process, SIGNAL(started()), this, SIGNAL(started()));
        connect(m_process, SIGNAL(finished(int)), this, SIGNAL(finished(int)));
        connect(m_process, SIGNAL(error(QProcess::ProcessError)), this, SIGNAL(error()));
        connect(m_process, SIGNAL(readyReadStandardOutput()), this, SLOT(emitStandardOutput()));
        connect(m_process, SIGNAL(readyReadStandardError()), this, SLOT(emitStandardError()));
    }

    ~Process() {
        if(m_process->state() == QProcess::Running) {
            kill();
        }
    }

    Q_INVOKABLE QString cwd() { return QApplication::applicationDirPath(); }
    Q_INVOKABLE ProcessState state() { return (ProcessState) m_process->state(); }
    Q_INVOKABLE void write(QString data) { m_process->write(data.toUtf8());}

    static void registerQmlType(const char *uri = "Native", int majorVersion = 1, int minorVersion = 0) {
        // @uri Native
        qmlRegisterType<Process>(uri, majorVersion, minorVersion, "Process");
    }

private slots:
    void emitStandardOutput() { emit standardOutput(m_process->readAllStandardOutput()); }
    void emitStandardError() { emit standardError(m_process->readAllStandardError()); }

public slots:
    void start(QString program, QStringList args = QStringList()) {
        m_process->start(program, args);
    }

    void kill() {
        m_process->kill();
        m_process->waitForFinished(-1);
    }
    void terminate() { m_process->terminate(); }

signals:
    void started();
    void error();
    void finished(int state);
    void standardOutput(QString data);
    void standardError(QString data);

private:
    QProcess *m_process;

};
