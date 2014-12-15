# Live HTML

> **WARNING:** this is unsupported project
 
Live HTML was developed in hopes of providing true live editing of an HTML file starting from nothing and then properly handling CSS and JS insertion, and other quirky changes, but while it was developed a lot has changed in a way I approach code and the ecosystem that is available to developer.

## So what should I use instead?

If you want to have live updates for simple static HTML files I would recommend using [Brackets](http://brackets.io/)(Free) or [WebStorm](https://www.jetbrains.com/webstorm/)(Paid).

With more complex and dynamic UI my favorite combination right now is [React](http://facebook.github.io/react/) with [Webpack Hot Module Loader](http://gaearon.github.io/react-hot-loader/). It provides on-save updates to your dynamic app without loosing the state of the application, which is very useful for tweaking the behavior withing some corner case of your business logic. To get you started faster I made a [seed project](https://github.com/grassator/gulp-webpack-react) that has it all put together and configured.

## Why publish a failed project?

While there is no immediate usefulness for this project and I'm outright ashamed of almost all of the source code (event though it was written as a prototype), this repo still contains a lot of interesting pieces that took hours and hours of research to figure out, for example:

* How to disable FullScreen button in Qt on Mac?
* Why does XMLHttpRequest not work properly in QML for cross-domain requests?
* How to write a simple update checker?
* What is server-sent events and how to use it to push changes to client without web sockets?
* How to get access to clipboard from QML?

## License

All source code and graphics is available under MIT-style license, unless stated otherwise.
