(function(global) {
    "use strict";
    // 进行特性检测
    if (!Function.bind || !Object.defineProperty) {
        throw new TypeError("Function.bind or Object.defineProperty is undefined!");
    }
    var distribute = function(instance, context) {
        var interceptors = instance.$config.interceptors;
        var current = 0;
        var totalLength = interceptors.length;
        
        var next = function() {
            var interceptor = interceptors[current];
            current++;
            if (interceptor && (!interceptor.type || interceptor.type === context.type)) {
                interceptor.intercept.call(instance, context, next);
            } else if(current < totalLength) {
                next();
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
        // 保存配置的路由和拦截器
        this.$config = {
            rawObj: obj,
            routes: routes || {},
            interceptors: [].concat(Link.globalInterceptors, interceptors || [])
        };

        proxy(this, this.$config.rawObj, this);
            
    };

    Link.prototype.use = function(interceptor) {
        Link.addIntercept(this.$config.interceptors, null, interceptor);
        return this;
    };
    
    Link.prototype.$get = function(interceptor) {
        Link.addIntercept(this.$config.interceptors, "get", interceptor);
        return this;
    };
    
    Link.prototype.$set = function(interceptor) {
        Link.addIntercept(this.$config.interceptors, "set", interceptor);
        return this;
    };
    

    Link.use = function(interceptor) {
        Link.addIntercept(Link.globalInterceptors, null, interceptor);
    };
    
    Link.$get = function(interceptor) {
        Link.addIntercept(Link.globalInterceptors, "get", interceptor);
    };
    
    Link.$set = function(interceptor) {
        Link.addIntercept(Link.globalInterceptors, "set", interceptor);
    };

    Link.addIntercept = function(container, type, interceptor) {
        if (container.push) {
            container.push({
                type: type,
                intercept: interceptor
            });
        }
    }

    Link.globalInterceptors = [];

    Link.instance = {};

    global.Link = Link;
})(window);