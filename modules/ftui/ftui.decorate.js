/**
 * Workaround for (still) missing @decorator functionality in plain javascript
 * https://github.com/tc39/proposal-decorators
 * 
 */

export const decorate = (className, handler) => {
 
  Object.keys(handler).forEach(property => {
     
      const decorators = handler[property].reverse();

      decorators.forEach(decorator => {
          const method = className.prototype[property];
          className.prototype[property] = function (...args) {
              return decorator(method.bind(this), this, args);
          }; 
      });
  });   
};