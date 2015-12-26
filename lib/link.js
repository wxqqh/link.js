(function(global) {
    "use strict";
    // 进行特性检测
    if (!Function.bind || !Object.defineProperty) {
        throw new TypeError("Function.bind or Object.defineProperty is undefined!");
    }
    var distribute = function(instance, context) {
        var interceptors = instance.$config.interceptors;
        var route = context.route;

        var current = 0;
        var totalLength = interceptors.length;

        // var getNextInterceptor = function() {
        //     var interceptor = interceptors[current];
        //     current++;
        //     if (interceptor && interceptor.cmd && interceptor.intercept) {
        //         // 如果命令是一个正则表达式
        //         if (interceptor.cmd.constructor === RegExp && interceptor.cmd.test(route)) {
        //             return interceptor;
        //         }
        //         // 如果命令是一个字符串, 怎直接判断相等
        //         if (typeof interceptor.cmd === "string" && interceptor.cmd === route) {
        //             return interceptor;
        //         }
        //     }
        //     return current < totalLength ? getNextInterceptor() : null;
        // };
        var next = function() {
            var interceptor = interceptors[current];
            current++;
            if (interceptor) {
                interceptor.intercept.call(instance, context, next)
            }
        };
        next();
    }
    var proxy = function(model, source, instance, propertyPath) {
        // 获取当前绑定对象的配置路由
        var routes = instance.$config.routes;

        if (!propertyPath) propertyPath = [];

        Object.getOwnPropertyNames(source).forEach(function(key) {
            var value = source[key];
            // 当前路径model路径 
            var absolutePath = [].concat(propertyPath, key).join(".");
            var getContext = function(type, value, oldValue) {
                return {value: value, oldValue: oldValue, route: routes[absolutePath], data: {rawValue: value}, type: type }
            };

            Object.defineProperty(model, key, {
                enumerable: true,
                configurable: true,
                get: function() {
                    console.log("defineProperty get: key(%s) value(%s)", key, value);
                    var context = getContext("get", value);
                    distribute(instance, context);
                    return context.value;
                },
                set: function(newValue) {
                    console.log("defineProperty set: key(%s) value(%s) old: %s", key, newValue, value);
                    var context = getContext("set", newValue, value);
                    distribute(instance, context);
                    source[key] = value = context.value;
                }
            });
        });
    };
    // 
    var Link = function(obj, routes, interceptors) {
        var self = this;
        // 保存配置的路由和拦截器
        this.$config = {
            rawObj: obj,
            routes: routes || {},
            interceptors: [].concat(Link.globalInterceptors, interceptors || [])
        };

        this.init();
    };

    Link.prototype.init = function() {


        proxy(this, this.$config.rawObj, this);
    };

    // Link.prototype.$get = function(cmd, interceptors) {
    //     this.interceptors.push({
    //         cmd: cmd,
    //         interceptors: [].concat(interceptors)
    //     })
    //     return this;
    // };

    // Link.prototype.$set = function(cmd, interceptors) {
    //     this.interceptors.push({
    //         cmd: cmd,
    //         interceptors: [].concat(interceptors)
    //     })
    //     return this;
    // };
    Link.prototype.intercept = function(cmd, interceptor) {
        Link.addIntercept(this.interceptors, cmd, interceptor);
        return this;
    };

    Link.intercept = function(cmd, interceptor) {
        this.addIntercept(this.globalInterceptors, cmd, interceptor);
    };

    Link.addIntercept = function(container, cmd, interceptor) {
        if (container.push) {
            container.push({
                cmd: cmd,
                intercept: interceptor
            });
        }
    }

    Link.globalInterceptors = [];

    Link.instance = {};

    global.Link = Link;
})(window);