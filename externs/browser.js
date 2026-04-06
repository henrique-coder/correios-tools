/**
 * @fileoverview
 * @externs
 */
const browser = {};
browser.runtime = {};
/** @type {function(*, function(*)=)} */
browser.runtime.sendMessage = function (msg, cb) {};
browser.storage = {};
browser.storage.local = {};
/** @type {function(Object): Promise} */
browser.storage.local.set = function (items) {};
/** @type {function((string|Array<string>)): Promise} */
browser.storage.local.get = function (keys) {};
