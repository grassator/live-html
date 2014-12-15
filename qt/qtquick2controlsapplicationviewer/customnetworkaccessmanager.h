#ifndef CUSTOMNETWORKACCESSMANAGER_H
#define CUSTOMNETWORKACCESSMANAGER_H

#include <QNetworkAccessManager>
#include <QNetworkConfiguration>
#include <QNetworkRequest>

class CustomNetworkAccessManager : QNetworkAccessManager {
    QNetworkReply *createRequest(Operation operation, const QNetworkRequest &request, QIODevice *device) {
        QNetworkRequest newRequest(request);
        newRequest.setHeader(QNetworkRequest::UserAgentHeader, "curl/7.30.0");
        return QNetworkAccessManager::createRequest(operation, newRequest, device);
    }

public:
    CustomNetworkAccessManager(QObject *parent = 0) : QNetworkAccessManager(parent) {}
};

#endif // CUSTOMNETWORKACCESSMANAGER_H
