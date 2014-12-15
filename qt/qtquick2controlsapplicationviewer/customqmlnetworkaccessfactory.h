#ifndef CUSTOMQMLNETWORKACCESSFACTORY_H
#define CUSTOMQMLNETWORKACCESSFACTORY_H

#include <QQmlNetworkAccessManagerFactory>
#include "customnetworkaccessmanager.h"

class CustomQmlNetworkAccessManagerFactory : QQmlNetworkAccessManagerFactory {
    virtual ~CustomQmlNetworkAccessManagerFactory() {}
    virtual QNetworkAccessManager * create(QObject * parent) {
        return (QNetworkAccessManager *) new CustomNetworkAccessManager(parent);
    }
};

#endif // CUSTOMQMLNETWORKACCESSFACTORY_H
