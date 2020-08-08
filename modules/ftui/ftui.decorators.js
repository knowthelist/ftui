/**
 * Decorates the method with isAction 
 */
export const action = (method, self, args) => {

  self.isAction = true;
  const result = method(...args);
  self.isAction = false;
  return result;
};