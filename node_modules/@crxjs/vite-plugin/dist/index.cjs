'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var rollup = require('rollup');
var acornWalk = require('acorn-walk');
var crypto = require('crypto');
var debug$5 = require('debug');
var fg = require('fast-glob');
var v8 = require('v8');
var fs = require('fs');
var MagicString = require('magic-string');
var path = require('path');
var fsExtra = require('fs-extra');
var perf_hooks = require('perf_hooks');
var colors = require('picocolors');
var vite = require('vite');
var module$1 = require('module');
var cheerio = require('cheerio');
var jsesc = require('jsesc');
var injector = require('connect-injector');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n["default"] = e;
  return Object.freeze(n);
}

var debug__default = /*#__PURE__*/_interopDefaultLegacy(debug$5);
var fg__default = /*#__PURE__*/_interopDefaultLegacy(fg);
var v8__default = /*#__PURE__*/_interopDefaultLegacy(v8);
var MagicString__default = /*#__PURE__*/_interopDefaultLegacy(MagicString);
var fsExtra__default = /*#__PURE__*/_interopDefaultLegacy(fsExtra);
var colors__default = /*#__PURE__*/_interopDefaultLegacy(colors);
var jsesc__default = /*#__PURE__*/_interopDefaultLegacy(jsesc);
var injector__default = /*#__PURE__*/_interopDefaultLegacy(injector);

const _debug = (id) => debug__default["default"]("crx").extend(id);
const structuredClone = (obj) => {
  return v8__default["default"].deserialize(v8__default["default"].serialize(obj));
};
const createHash = (data, length = 5) => crypto.createHash("sha1").update(data).digest("base64").replace(/[^A-Za-z0-9]/g, "").slice(0, length);
const isString = (x) => typeof x === "string";
const isTruthy = (x) => !!x;
function isObject(value) {
  return Object.prototype.toString.call(value) === "[object Object]";
}
const isResourceByMatch = (x) => "matches" in x;
async function manifestFiles(manifest, options = {}) {
  let locales = [];
  if (manifest.default_locale)
    locales = await fg__default["default"]("_locales/**/messages.json", options);
  const rulesets = manifest.declarative_net_request?.rule_resources.flatMap(({ path }) => path) ?? [];
  const contentScripts = manifest.content_scripts?.flatMap(({ js }) => js) ?? [];
  const contentStyles = manifest.content_scripts?.flatMap(({ css }) => css);
  const serviceWorker = manifest.background?.service_worker;
  const htmlPages = htmlFiles(manifest);
  const icons = [
    Object.values(isString(manifest.icons) ? [manifest.icons] : manifest.icons ?? {}),
    Object.values(isString(manifest.action?.default_icon) ? [manifest.action?.default_icon] : manifest.action?.default_icon ?? {})
  ].flat();
  let webAccessibleResources = [];
  if (manifest.web_accessible_resources) {
    const resources = await Promise.all(manifest.web_accessible_resources.flatMap(({ resources: resources2 }) => resources2).map(async (r) => {
      if (["*", "**/*"].includes(r))
        return void 0;
      if (fg__default["default"].isDynamicPattern(r))
        return fg__default["default"](r, options);
      return r;
    }));
    webAccessibleResources = resources.flat().filter(isString);
  }
  return {
    contentScripts: [...new Set(contentScripts)].filter(isString),
    contentStyles: [...new Set(contentStyles)].filter(isString),
    html: htmlPages,
    icons: [...new Set(icons)].filter(isString),
    locales: [...new Set(locales)].filter(isString),
    rulesets: [...new Set(rulesets)].filter(isString),
    background: [serviceWorker].filter(isString),
    webAccessibleResources
  };
}
function htmlFiles(manifest) {
  const files = [
    manifest.action?.default_popup,
    Object.values(manifest.chrome_url_overrides ?? {}),
    manifest.devtools_page,
    manifest.options_page,
    manifest.options_ui?.page,
    manifest.sandbox?.pages
  ].flat().filter(isString).map((s) => s.split("#")[0]).sort();
  return [...new Set(files)];
}
function decodeManifest(code) {
  const tree = this.parse(code);
  let literal;
  let templateElement;
  acornWalk.simple(tree, {
    Literal(node) {
      literal = node;
    },
    TemplateElement(node) {
      templateElement = node;
    }
  });
  let manifestJson = literal?.value;
  if (!manifestJson)
    manifestJson = templateElement?.value?.cooked;
  if (!manifestJson)
    throw new Error("unable to parse manifest code");
  let result = JSON.parse(manifestJson);
  if (typeof result === "string")
    result = JSON.parse(result);
  return result;
}
function encodeManifest(manifest) {
  const json = JSON.stringify(JSON.stringify(manifest));
  return `export default ${json}`;
}
const stubMatchPattern = (pattern) => {
  if (pattern === "<all_urls>") {
    return pattern;
  }
  const [schema, rest] = pattern.split("://");
  const [origin, pathname] = rest.split("/");
  const root = `${schema}://${origin}`;
  return pathname ? `${root}/*` : root;
};

const idBySource = /* @__PURE__ */ new Map();
const idByUrl = /* @__PURE__ */ new Map();
const urlById = /* @__PURE__ */ new Map();
function setUrlMeta({
  id,
  source,
  url
}) {
  idBySource.set(source, id);
  idByUrl.set(url, id);
  urlById.set(id, url);
}
const fileById = /* @__PURE__ */ new Map();
const fileByUrl = /* @__PURE__ */ new Map();
const pathById = /* @__PURE__ */ new Map();
const pathByUrl = /* @__PURE__ */ new Map();
const setFileMeta = ({ file, id }) => {
  const url = urlById.get(id);
  if (!url)
    return;
  fileById.set(id, file);
  fileByUrl.set(url, file);
  const pathName = `/${file}`;
  pathById.set(id, pathName);
  pathByUrl.set(url, pathName);
};
const ownerById = /* @__PURE__ */ new Map();
const pathByOwner = /* @__PURE__ */ new Map();
const ownersByFile = /* @__PURE__ */ new Map();
const setOwnerMeta = ({ owner, id }) => {
  const pathName = pathById.get(id);
  if (!pathName)
    return;
  pathByOwner.set(owner, pathName);
  ownerById.set(id, owner);
  const fileName = fileById.get(id);
  const owners = ownersByFile.get(fileName) ?? /* @__PURE__ */ new Set();
  owners.add(owner);
  ownersByFile.set(fileName, owners);
};
const outputById = /* @__PURE__ */ new Map();
const outputByOwner = /* @__PURE__ */ new Map();
const setOutputMeta = ({
  output,
  id
}) => {
  const ownerName = ownerById.get(id);
  if (!ownerName)
    return;
  outputByOwner.set(ownerName, output);
  outputById.set(id, output);
};
const transformResultByOwner = /* @__PURE__ */ new Map();

const {
  basename,
  dirname,
  extname,
  delimiter,
  format,
  isAbsolute,
  join,
  normalize,
  parse,
  relative,
  resolve,
  toNamespacedPath,
  sep
} = path.posix;

const viteClientId = "/@vite/client";
const customElementsId = "@webcomponents/custom-elements";
const reactRefreshId = "/@react-refresh";
const contentHmrPortId = "/crx-client-port";
const manifestId = "/crx-manifest";
const preambleId = "/crx-client-preamble";
const stubId = "/crx-stub";
const workerClientId = "/crx-client-worker";

const { readFile: readFile$2 } = fs.promises;
const debug$4 = _debug("file-writer").extend("chunks");
for (const source of [viteClientId, customElementsId]) {
  setUrlMeta(sourceToUrlMeta(source));
}
setUrlMeta({
  source: reactRefreshId,
  id: "/react-refresh",
  url: reactRefreshId
});
function sourceToUrlMeta(source) {
  const [p, query = ""] = source.split("?");
  const pathname = p.replace(/^\/@id\//, "").replace(/^\/@fs/, "");
  const url = [pathname, query].filter(isTruthy).join("?");
  const hash = createHash(url);
  const base = p.split("/").slice(-4).filter(isTruthy).join("-");
  const id = `/${base}-${hash}.js`.replace(/[@]/g, "");
  return { id, url, source };
}
const pluginFileWriterChunks = () => {
  let server;
  return {
    name: "crx:file-writer-chunks",
    apply: "build",
    fileWriterStart(_server) {
      server = _server;
    },
    async resolveId(source, importer) {
      if (this.meta.watchMode) {
        if (idBySource.has(source)) {
          const id = idBySource.get(source);
          debug$4(`resolved cached ${source} -> ${id}`);
          return id;
        } else if (importer) {
          const meta = sourceToUrlMeta(source);
          setUrlMeta(meta);
          const { id } = meta;
          debug$4(`resolved ${source} -> ${id}`);
          return id;
        } else {
          const [rawUrl] = await server.moduleGraph.resolveUrl(source);
          const name = rawUrl.split("/").join("-").replace(/^-/, "");
          const url = rawUrl.startsWith("/") ? rawUrl : `/${rawUrl}`;
          const id = `/${name}-${createHash(url)}.js`;
          setUrlMeta({ url, id, source });
          debug$4(`resolved entry ${source} -> ${id}`);
          return id;
        }
      }
    },
    async load(id) {
      if (this.meta.watchMode && urlById.has(id)) {
        const url = urlById.get(id);
        let serverModule = await server.moduleGraph.getModuleByUrl(url);
        let transformResult = null;
        if (!serverModule) {
          transformResult = await server.transformRequest(url);
          serverModule = await server.moduleGraph.getModuleByUrl(url);
        }
        if (!serverModule)
          throw new Error(`Unable to load "${url}" from server.`);
        const { file, url: owner } = serverModule;
        transformResult = transformResult ?? transformResultByOwner.get(owner) ?? serverModule.transformResult;
        if (!transformResult)
          transformResult = await server.transformRequest(url);
        if (!transformResult)
          throw new TypeError(`Unable to load "${url}" from server.`);
        transformResultByOwner.set(owner, transformResult);
        if (file) {
          setFileMeta({ id, file });
          this.addWatchFile(file);
          if (urlById.get(id).includes("?import"))
            this.emitFile({
              type: "asset",
              fileName: relative(server.config.root, file),
              source: await readFile$2(file)
            });
        }
        if (url)
          setOwnerMeta({ id, owner });
        return { code: transformResult.code, map: transformResult.map };
      }
      return null;
    },
    outputOptions(options) {
      const cacheDir = relative(server.config.root, server.config.cacheDir);
      const fileNameById = /* @__PURE__ */ new Map();
      fileNameById.set("/react-refresh", "vendor/react-refresh.js");
      function fileNames(info) {
        const id = info.type === "chunk" ? info.facadeModuleId : info.name;
        if (id && fileNameById.has(id))
          return fileNameById.get(id);
        let fileName = info.type === "chunk" ? "assets/[name].js" : "assets/[name].[ext]";
        if (id && fileById.has(id)) {
          fileName = fileById.get(id);
          const url = new URL(urlById.get(id), "stub://stub");
          if (url.searchParams.has("type"))
            fileName += `.${url.searchParams.get("type")}`;
          if (url.searchParams.has("index"))
            fileName += `.${url.searchParams.get("index")}`;
        }
        if (id?.startsWith("/@crx/"))
          fileName = `vendor/${id.slice("/@crx/".length).split("/").join("-")}`;
        if (fileName.startsWith(server.config.root))
          fileName = fileName.slice(server.config.root.length + 1);
        if (fileName.startsWith(cacheDir))
          fileName = `vendor/${fileName.slice(cacheDir.length + 1)}`;
        if (fileName.includes("/node_modules/"))
          fileName = `vendor/${fileName.split("/node_modules/").pop().split("/").join("-").replace("vite-dist-client", "vite")}`;
        if (fileName.startsWith("/"))
          fileName = fileName.slice(1);
        if (!fileName.endsWith(".js"))
          fileName += ".js";
        if (id)
          fileNameById.set(id, fileName);
        fileName = fileName.replace(/:/g, "-").replace(/@/, "");
        return fileName;
      }
      return {
        ...options,
        preserveModules: true,
        assetFileNames: fileNames,
        entryFileNames: fileNames
      };
    },
    generateBundle(options, bundle) {
      for (const chunk of Object.values(bundle))
        if (chunk.type === "chunk") {
          const { facadeModuleId: id, modules, code, fileName } = chunk;
          if (!id || Object.keys(modules).length !== 1)
            continue;
          const url = urlById.get(id);
          if (url === viteClientId)
            continue;
          const ownerPath = ownerById.get(id);
          if (!ownerPath)
            continue;
          const index = code.indexOf("createHotContext(");
          if (index === -1)
            continue;
          const start = code.indexOf(ownerPath, index);
          const end = start + ownerPath.length;
          if (start > 0) {
            const outputName = `/${fileName}`;
            setOutputMeta({ id, output: outputName });
            const magic = new MagicString__default["default"](code);
            magic.overwrite(start, end, outputName);
            chunk.code = magic.toString();
          }
        }
    }
  };
};

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
    return extendStatics(d, b);
};

function __extends(d, b) {
    if (typeof b !== "function" && b !== null)
        throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

function __generator(thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
}

function __values(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
}

function __read(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
}

function __spreadArray(to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
}

function __await(v) {
    return this instanceof __await ? (this.v = v, this) : new __await(v);
}

function __asyncGenerator(thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
}

function __asyncValues(o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
}

function isFunction(value) {
    return typeof value === 'function';
}

function createErrorClass(createImpl) {
    var _super = function (instance) {
        Error.call(instance);
        instance.stack = new Error().stack;
    };
    var ctorFunc = createImpl(_super);
    ctorFunc.prototype = Object.create(Error.prototype);
    ctorFunc.prototype.constructor = ctorFunc;
    return ctorFunc;
}

var UnsubscriptionError = createErrorClass(function (_super) {
    return function UnsubscriptionErrorImpl(errors) {
        _super(this);
        this.message = errors
            ? errors.length + " errors occurred during unsubscription:\n" + errors.map(function (err, i) { return i + 1 + ") " + err.toString(); }).join('\n  ')
            : '';
        this.name = 'UnsubscriptionError';
        this.errors = errors;
    };
});

function arrRemove(arr, item) {
    if (arr) {
        var index = arr.indexOf(item);
        0 <= index && arr.splice(index, 1);
    }
}

var Subscription = (function () {
    function Subscription(initialTeardown) {
        this.initialTeardown = initialTeardown;
        this.closed = false;
        this._parentage = null;
        this._finalizers = null;
    }
    Subscription.prototype.unsubscribe = function () {
        var e_1, _a, e_2, _b;
        var errors;
        if (!this.closed) {
            this.closed = true;
            var _parentage = this._parentage;
            if (_parentage) {
                this._parentage = null;
                if (Array.isArray(_parentage)) {
                    try {
                        for (var _parentage_1 = __values(_parentage), _parentage_1_1 = _parentage_1.next(); !_parentage_1_1.done; _parentage_1_1 = _parentage_1.next()) {
                            var parent_1 = _parentage_1_1.value;
                            parent_1.remove(this);
                        }
                    }
                    catch (e_1_1) { e_1 = { error: e_1_1 }; }
                    finally {
                        try {
                            if (_parentage_1_1 && !_parentage_1_1.done && (_a = _parentage_1.return)) _a.call(_parentage_1);
                        }
                        finally { if (e_1) throw e_1.error; }
                    }
                }
                else {
                    _parentage.remove(this);
                }
            }
            var initialFinalizer = this.initialTeardown;
            if (isFunction(initialFinalizer)) {
                try {
                    initialFinalizer();
                }
                catch (e) {
                    errors = e instanceof UnsubscriptionError ? e.errors : [e];
                }
            }
            var _finalizers = this._finalizers;
            if (_finalizers) {
                this._finalizers = null;
                try {
                    for (var _finalizers_1 = __values(_finalizers), _finalizers_1_1 = _finalizers_1.next(); !_finalizers_1_1.done; _finalizers_1_1 = _finalizers_1.next()) {
                        var finalizer = _finalizers_1_1.value;
                        try {
                            execFinalizer(finalizer);
                        }
                        catch (err) {
                            errors = errors !== null && errors !== void 0 ? errors : [];
                            if (err instanceof UnsubscriptionError) {
                                errors = __spreadArray(__spreadArray([], __read(errors)), __read(err.errors));
                            }
                            else {
                                errors.push(err);
                            }
                        }
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (_finalizers_1_1 && !_finalizers_1_1.done && (_b = _finalizers_1.return)) _b.call(_finalizers_1);
                    }
                    finally { if (e_2) throw e_2.error; }
                }
            }
            if (errors) {
                throw new UnsubscriptionError(errors);
            }
        }
    };
    Subscription.prototype.add = function (teardown) {
        var _a;
        if (teardown && teardown !== this) {
            if (this.closed) {
                execFinalizer(teardown);
            }
            else {
                if (teardown instanceof Subscription) {
                    if (teardown.closed || teardown._hasParent(this)) {
                        return;
                    }
                    teardown._addParent(this);
                }
                (this._finalizers = (_a = this._finalizers) !== null && _a !== void 0 ? _a : []).push(teardown);
            }
        }
    };
    Subscription.prototype._hasParent = function (parent) {
        var _parentage = this._parentage;
        return _parentage === parent || (Array.isArray(_parentage) && _parentage.includes(parent));
    };
    Subscription.prototype._addParent = function (parent) {
        var _parentage = this._parentage;
        this._parentage = Array.isArray(_parentage) ? (_parentage.push(parent), _parentage) : _parentage ? [_parentage, parent] : parent;
    };
    Subscription.prototype._removeParent = function (parent) {
        var _parentage = this._parentage;
        if (_parentage === parent) {
            this._parentage = null;
        }
        else if (Array.isArray(_parentage)) {
            arrRemove(_parentage, parent);
        }
    };
    Subscription.prototype.remove = function (teardown) {
        var _finalizers = this._finalizers;
        _finalizers && arrRemove(_finalizers, teardown);
        if (teardown instanceof Subscription) {
            teardown._removeParent(this);
        }
    };
    Subscription.EMPTY = (function () {
        var empty = new Subscription();
        empty.closed = true;
        return empty;
    })();
    return Subscription;
}());
var EMPTY_SUBSCRIPTION = Subscription.EMPTY;
function isSubscription(value) {
    return (value instanceof Subscription ||
        (value && 'closed' in value && isFunction(value.remove) && isFunction(value.add) && isFunction(value.unsubscribe)));
}
function execFinalizer(finalizer) {
    if (isFunction(finalizer)) {
        finalizer();
    }
    else {
        finalizer.unsubscribe();
    }
}

var config = {
    onUnhandledError: null,
    onStoppedNotification: null,
    Promise: undefined,
    useDeprecatedSynchronousErrorHandling: false,
    useDeprecatedNextContext: false,
};

var timeoutProvider = {
    setTimeout: function (handler, timeout) {
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        var delegate = timeoutProvider.delegate;
        if (delegate === null || delegate === void 0 ? void 0 : delegate.setTimeout) {
            return delegate.setTimeout.apply(delegate, __spreadArray([handler, timeout], __read(args)));
        }
        return setTimeout.apply(void 0, __spreadArray([handler, timeout], __read(args)));
    },
    clearTimeout: function (handle) {
        var delegate = timeoutProvider.delegate;
        return ((delegate === null || delegate === void 0 ? void 0 : delegate.clearTimeout) || clearTimeout)(handle);
    },
    delegate: undefined,
};

function reportUnhandledError(err) {
    timeoutProvider.setTimeout(function () {
        {
            throw err;
        }
    });
}

function noop() { }

var COMPLETE_NOTIFICATION = (function () { return createNotification('C', undefined, undefined); })();
function errorNotification(error) {
    return createNotification('E', undefined, error);
}
function nextNotification(value) {
    return createNotification('N', value, undefined);
}
function createNotification(kind, value, error) {
    return {
        kind: kind,
        value: value,
        error: error,
    };
}

var context = null;
function errorContext(cb) {
    if (config.useDeprecatedSynchronousErrorHandling) {
        var isRoot = !context;
        if (isRoot) {
            context = { errorThrown: false, error: null };
        }
        cb();
        if (isRoot) {
            var _a = context, errorThrown = _a.errorThrown, error = _a.error;
            context = null;
            if (errorThrown) {
                throw error;
            }
        }
    }
    else {
        cb();
    }
}

var Subscriber = (function (_super) {
    __extends(Subscriber, _super);
    function Subscriber(destination) {
        var _this = _super.call(this) || this;
        _this.isStopped = false;
        if (destination) {
            _this.destination = destination;
            if (isSubscription(destination)) {
                destination.add(_this);
            }
        }
        else {
            _this.destination = EMPTY_OBSERVER;
        }
        return _this;
    }
    Subscriber.create = function (next, error, complete) {
        return new SafeSubscriber(next, error, complete);
    };
    Subscriber.prototype.next = function (value) {
        if (this.isStopped) {
            handleStoppedNotification(nextNotification(value), this);
        }
        else {
            this._next(value);
        }
    };
    Subscriber.prototype.error = function (err) {
        if (this.isStopped) {
            handleStoppedNotification(errorNotification(err), this);
        }
        else {
            this.isStopped = true;
            this._error(err);
        }
    };
    Subscriber.prototype.complete = function () {
        if (this.isStopped) {
            handleStoppedNotification(COMPLETE_NOTIFICATION, this);
        }
        else {
            this.isStopped = true;
            this._complete();
        }
    };
    Subscriber.prototype.unsubscribe = function () {
        if (!this.closed) {
            this.isStopped = true;
            _super.prototype.unsubscribe.call(this);
            this.destination = null;
        }
    };
    Subscriber.prototype._next = function (value) {
        this.destination.next(value);
    };
    Subscriber.prototype._error = function (err) {
        try {
            this.destination.error(err);
        }
        finally {
            this.unsubscribe();
        }
    };
    Subscriber.prototype._complete = function () {
        try {
            this.destination.complete();
        }
        finally {
            this.unsubscribe();
        }
    };
    return Subscriber;
}(Subscription));
var _bind = Function.prototype.bind;
function bind(fn, thisArg) {
    return _bind.call(fn, thisArg);
}
var ConsumerObserver = (function () {
    function ConsumerObserver(partialObserver) {
        this.partialObserver = partialObserver;
    }
    ConsumerObserver.prototype.next = function (value) {
        var partialObserver = this.partialObserver;
        if (partialObserver.next) {
            try {
                partialObserver.next(value);
            }
            catch (error) {
                handleUnhandledError(error);
            }
        }
    };
    ConsumerObserver.prototype.error = function (err) {
        var partialObserver = this.partialObserver;
        if (partialObserver.error) {
            try {
                partialObserver.error(err);
            }
            catch (error) {
                handleUnhandledError(error);
            }
        }
        else {
            handleUnhandledError(err);
        }
    };
    ConsumerObserver.prototype.complete = function () {
        var partialObserver = this.partialObserver;
        if (partialObserver.complete) {
            try {
                partialObserver.complete();
            }
            catch (error) {
                handleUnhandledError(error);
            }
        }
    };
    return ConsumerObserver;
}());
var SafeSubscriber = (function (_super) {
    __extends(SafeSubscriber, _super);
    function SafeSubscriber(observerOrNext, error, complete) {
        var _this = _super.call(this) || this;
        var partialObserver;
        if (isFunction(observerOrNext) || !observerOrNext) {
            partialObserver = {
                next: observerOrNext !== null && observerOrNext !== void 0 ? observerOrNext : undefined,
                error: error !== null && error !== void 0 ? error : undefined,
                complete: complete !== null && complete !== void 0 ? complete : undefined,
            };
        }
        else {
            var context_1;
            if (_this && config.useDeprecatedNextContext) {
                context_1 = Object.create(observerOrNext);
                context_1.unsubscribe = function () { return _this.unsubscribe(); };
                partialObserver = {
                    next: observerOrNext.next && bind(observerOrNext.next, context_1),
                    error: observerOrNext.error && bind(observerOrNext.error, context_1),
                    complete: observerOrNext.complete && bind(observerOrNext.complete, context_1),
                };
            }
            else {
                partialObserver = observerOrNext;
            }
        }
        _this.destination = new ConsumerObserver(partialObserver);
        return _this;
    }
    return SafeSubscriber;
}(Subscriber));
function handleUnhandledError(error) {
    {
        reportUnhandledError(error);
    }
}
function defaultErrorHandler(err) {
    throw err;
}
function handleStoppedNotification(notification, subscriber) {
    var onStoppedNotification = config.onStoppedNotification;
    onStoppedNotification && timeoutProvider.setTimeout(function () { return onStoppedNotification(notification, subscriber); });
}
var EMPTY_OBSERVER = {
    closed: true,
    next: noop,
    error: defaultErrorHandler,
    complete: noop,
};

var observable = (function () { return (typeof Symbol === 'function' && Symbol.observable) || '@@observable'; })();

function identity(x) {
    return x;
}

function pipeFromArray(fns) {
    if (fns.length === 0) {
        return identity;
    }
    if (fns.length === 1) {
        return fns[0];
    }
    return function piped(input) {
        return fns.reduce(function (prev, fn) { return fn(prev); }, input);
    };
}

var Observable = (function () {
    function Observable(subscribe) {
        if (subscribe) {
            this._subscribe = subscribe;
        }
    }
    Observable.prototype.lift = function (operator) {
        var observable = new Observable();
        observable.source = this;
        observable.operator = operator;
        return observable;
    };
    Observable.prototype.subscribe = function (observerOrNext, error, complete) {
        var _this = this;
        var subscriber = isSubscriber(observerOrNext) ? observerOrNext : new SafeSubscriber(observerOrNext, error, complete);
        errorContext(function () {
            var _a = _this, operator = _a.operator, source = _a.source;
            subscriber.add(operator
                ?
                    operator.call(subscriber, source)
                : source
                    ?
                        _this._subscribe(subscriber)
                    :
                        _this._trySubscribe(subscriber));
        });
        return subscriber;
    };
    Observable.prototype._trySubscribe = function (sink) {
        try {
            return this._subscribe(sink);
        }
        catch (err) {
            sink.error(err);
        }
    };
    Observable.prototype.forEach = function (next, promiseCtor) {
        var _this = this;
        promiseCtor = getPromiseCtor(promiseCtor);
        return new promiseCtor(function (resolve, reject) {
            var subscriber = new SafeSubscriber({
                next: function (value) {
                    try {
                        next(value);
                    }
                    catch (err) {
                        reject(err);
                        subscriber.unsubscribe();
                    }
                },
                error: reject,
                complete: resolve,
            });
            _this.subscribe(subscriber);
        });
    };
    Observable.prototype._subscribe = function (subscriber) {
        var _a;
        return (_a = this.source) === null || _a === void 0 ? void 0 : _a.subscribe(subscriber);
    };
    Observable.prototype[observable] = function () {
        return this;
    };
    Observable.prototype.pipe = function () {
        var operations = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            operations[_i] = arguments[_i];
        }
        return pipeFromArray(operations)(this);
    };
    Observable.prototype.toPromise = function (promiseCtor) {
        var _this = this;
        promiseCtor = getPromiseCtor(promiseCtor);
        return new promiseCtor(function (resolve, reject) {
            var value;
            _this.subscribe(function (x) { return (value = x); }, function (err) { return reject(err); }, function () { return resolve(value); });
        });
    };
    Observable.create = function (subscribe) {
        return new Observable(subscribe);
    };
    return Observable;
}());
function getPromiseCtor(promiseCtor) {
    var _a;
    return (_a = promiseCtor !== null && promiseCtor !== void 0 ? promiseCtor : config.Promise) !== null && _a !== void 0 ? _a : Promise;
}
function isObserver(value) {
    return value && isFunction(value.next) && isFunction(value.error) && isFunction(value.complete);
}
function isSubscriber(value) {
    return (value && value instanceof Subscriber) || (isObserver(value) && isSubscription(value));
}

function hasLift(source) {
    return isFunction(source === null || source === void 0 ? void 0 : source.lift);
}
function operate(init) {
    return function (source) {
        if (hasLift(source)) {
            return source.lift(function (liftedSource) {
                try {
                    return init(liftedSource, this);
                }
                catch (err) {
                    this.error(err);
                }
            });
        }
        throw new TypeError('Unable to lift unknown Observable type');
    };
}

function createOperatorSubscriber(destination, onNext, onComplete, onError, onFinalize) {
    return new OperatorSubscriber(destination, onNext, onComplete, onError, onFinalize);
}
var OperatorSubscriber = (function (_super) {
    __extends(OperatorSubscriber, _super);
    function OperatorSubscriber(destination, onNext, onComplete, onError, onFinalize, shouldUnsubscribe) {
        var _this = _super.call(this, destination) || this;
        _this.onFinalize = onFinalize;
        _this.shouldUnsubscribe = shouldUnsubscribe;
        _this._next = onNext
            ? function (value) {
                try {
                    onNext(value);
                }
                catch (err) {
                    destination.error(err);
                }
            }
            : _super.prototype._next;
        _this._error = onError
            ? function (err) {
                try {
                    onError(err);
                }
                catch (err) {
                    destination.error(err);
                }
                finally {
                    this.unsubscribe();
                }
            }
            : _super.prototype._error;
        _this._complete = onComplete
            ? function () {
                try {
                    onComplete();
                }
                catch (err) {
                    destination.error(err);
                }
                finally {
                    this.unsubscribe();
                }
            }
            : _super.prototype._complete;
        return _this;
    }
    OperatorSubscriber.prototype.unsubscribe = function () {
        var _a;
        if (!this.shouldUnsubscribe || this.shouldUnsubscribe()) {
            var closed_1 = this.closed;
            _super.prototype.unsubscribe.call(this);
            !closed_1 && ((_a = this.onFinalize) === null || _a === void 0 ? void 0 : _a.call(this));
        }
    };
    return OperatorSubscriber;
}(Subscriber));

var ObjectUnsubscribedError = createErrorClass(function (_super) {
    return function ObjectUnsubscribedErrorImpl() {
        _super(this);
        this.name = 'ObjectUnsubscribedError';
        this.message = 'object unsubscribed';
    };
});

var Subject = (function (_super) {
    __extends(Subject, _super);
    function Subject() {
        var _this = _super.call(this) || this;
        _this.closed = false;
        _this.currentObservers = null;
        _this.observers = [];
        _this.isStopped = false;
        _this.hasError = false;
        _this.thrownError = null;
        return _this;
    }
    Subject.prototype.lift = function (operator) {
        var subject = new AnonymousSubject(this, this);
        subject.operator = operator;
        return subject;
    };
    Subject.prototype._throwIfClosed = function () {
        if (this.closed) {
            throw new ObjectUnsubscribedError();
        }
    };
    Subject.prototype.next = function (value) {
        var _this = this;
        errorContext(function () {
            var e_1, _a;
            _this._throwIfClosed();
            if (!_this.isStopped) {
                if (!_this.currentObservers) {
                    _this.currentObservers = Array.from(_this.observers);
                }
                try {
                    for (var _b = __values(_this.currentObservers), _c = _b.next(); !_c.done; _c = _b.next()) {
                        var observer = _c.value;
                        observer.next(value);
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
            }
        });
    };
    Subject.prototype.error = function (err) {
        var _this = this;
        errorContext(function () {
            _this._throwIfClosed();
            if (!_this.isStopped) {
                _this.hasError = _this.isStopped = true;
                _this.thrownError = err;
                var observers = _this.observers;
                while (observers.length) {
                    observers.shift().error(err);
                }
            }
        });
    };
    Subject.prototype.complete = function () {
        var _this = this;
        errorContext(function () {
            _this._throwIfClosed();
            if (!_this.isStopped) {
                _this.isStopped = true;
                var observers = _this.observers;
                while (observers.length) {
                    observers.shift().complete();
                }
            }
        });
    };
    Subject.prototype.unsubscribe = function () {
        this.isStopped = this.closed = true;
        this.observers = this.currentObservers = null;
    };
    Object.defineProperty(Subject.prototype, "observed", {
        get: function () {
            var _a;
            return ((_a = this.observers) === null || _a === void 0 ? void 0 : _a.length) > 0;
        },
        enumerable: false,
        configurable: true
    });
    Subject.prototype._trySubscribe = function (subscriber) {
        this._throwIfClosed();
        return _super.prototype._trySubscribe.call(this, subscriber);
    };
    Subject.prototype._subscribe = function (subscriber) {
        this._throwIfClosed();
        this._checkFinalizedStatuses(subscriber);
        return this._innerSubscribe(subscriber);
    };
    Subject.prototype._innerSubscribe = function (subscriber) {
        var _this = this;
        var _a = this, hasError = _a.hasError, isStopped = _a.isStopped, observers = _a.observers;
        if (hasError || isStopped) {
            return EMPTY_SUBSCRIPTION;
        }
        this.currentObservers = null;
        observers.push(subscriber);
        return new Subscription(function () {
            _this.currentObservers = null;
            arrRemove(observers, subscriber);
        });
    };
    Subject.prototype._checkFinalizedStatuses = function (subscriber) {
        var _a = this, hasError = _a.hasError, thrownError = _a.thrownError, isStopped = _a.isStopped;
        if (hasError) {
            subscriber.error(thrownError);
        }
        else if (isStopped) {
            subscriber.complete();
        }
    };
    Subject.prototype.asObservable = function () {
        var observable = new Observable();
        observable.source = this;
        return observable;
    };
    Subject.create = function (destination, source) {
        return new AnonymousSubject(destination, source);
    };
    return Subject;
}(Observable));
var AnonymousSubject = (function (_super) {
    __extends(AnonymousSubject, _super);
    function AnonymousSubject(destination, source) {
        var _this = _super.call(this) || this;
        _this.destination = destination;
        _this.source = source;
        return _this;
    }
    AnonymousSubject.prototype.next = function (value) {
        var _a, _b;
        (_b = (_a = this.destination) === null || _a === void 0 ? void 0 : _a.next) === null || _b === void 0 ? void 0 : _b.call(_a, value);
    };
    AnonymousSubject.prototype.error = function (err) {
        var _a, _b;
        (_b = (_a = this.destination) === null || _a === void 0 ? void 0 : _a.error) === null || _b === void 0 ? void 0 : _b.call(_a, err);
    };
    AnonymousSubject.prototype.complete = function () {
        var _a, _b;
        (_b = (_a = this.destination) === null || _a === void 0 ? void 0 : _a.complete) === null || _b === void 0 ? void 0 : _b.call(_a);
    };
    AnonymousSubject.prototype._subscribe = function (subscriber) {
        var _a, _b;
        return (_b = (_a = this.source) === null || _a === void 0 ? void 0 : _a.subscribe(subscriber)) !== null && _b !== void 0 ? _b : EMPTY_SUBSCRIPTION;
    };
    return AnonymousSubject;
}(Subject));

var BehaviorSubject = (function (_super) {
    __extends(BehaviorSubject, _super);
    function BehaviorSubject(_value) {
        var _this = _super.call(this) || this;
        _this._value = _value;
        return _this;
    }
    Object.defineProperty(BehaviorSubject.prototype, "value", {
        get: function () {
            return this.getValue();
        },
        enumerable: false,
        configurable: true
    });
    BehaviorSubject.prototype._subscribe = function (subscriber) {
        var subscription = _super.prototype._subscribe.call(this, subscriber);
        !subscription.closed && subscriber.next(this._value);
        return subscription;
    };
    BehaviorSubject.prototype.getValue = function () {
        var _a = this, hasError = _a.hasError, thrownError = _a.thrownError, _value = _a._value;
        if (hasError) {
            throw thrownError;
        }
        this._throwIfClosed();
        return _value;
    };
    BehaviorSubject.prototype.next = function (value) {
        _super.prototype.next.call(this, (this._value = value));
    };
    return BehaviorSubject;
}(Subject));

var dateTimestampProvider = {
    now: function () {
        return (dateTimestampProvider.delegate || Date).now();
    },
    delegate: undefined,
};

var Action = (function (_super) {
    __extends(Action, _super);
    function Action(scheduler, work) {
        return _super.call(this) || this;
    }
    Action.prototype.schedule = function (state, delay) {
        return this;
    };
    return Action;
}(Subscription));

var intervalProvider = {
    setInterval: function (handler, timeout) {
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        var delegate = intervalProvider.delegate;
        if (delegate === null || delegate === void 0 ? void 0 : delegate.setInterval) {
            return delegate.setInterval.apply(delegate, __spreadArray([handler, timeout], __read(args)));
        }
        return setInterval.apply(void 0, __spreadArray([handler, timeout], __read(args)));
    },
    clearInterval: function (handle) {
        var delegate = intervalProvider.delegate;
        return ((delegate === null || delegate === void 0 ? void 0 : delegate.clearInterval) || clearInterval)(handle);
    },
    delegate: undefined,
};

var AsyncAction = (function (_super) {
    __extends(AsyncAction, _super);
    function AsyncAction(scheduler, work) {
        var _this = _super.call(this, scheduler, work) || this;
        _this.scheduler = scheduler;
        _this.work = work;
        _this.pending = false;
        return _this;
    }
    AsyncAction.prototype.schedule = function (state, delay) {
        if (delay === void 0) { delay = 0; }
        if (this.closed) {
            return this;
        }
        this.state = state;
        var id = this.id;
        var scheduler = this.scheduler;
        if (id != null) {
            this.id = this.recycleAsyncId(scheduler, id, delay);
        }
        this.pending = true;
        this.delay = delay;
        this.id = this.id || this.requestAsyncId(scheduler, this.id, delay);
        return this;
    };
    AsyncAction.prototype.requestAsyncId = function (scheduler, _id, delay) {
        if (delay === void 0) { delay = 0; }
        return intervalProvider.setInterval(scheduler.flush.bind(scheduler, this), delay);
    };
    AsyncAction.prototype.recycleAsyncId = function (_scheduler, id, delay) {
        if (delay === void 0) { delay = 0; }
        if (delay != null && this.delay === delay && this.pending === false) {
            return id;
        }
        intervalProvider.clearInterval(id);
        return undefined;
    };
    AsyncAction.prototype.execute = function (state, delay) {
        if (this.closed) {
            return new Error('executing a cancelled action');
        }
        this.pending = false;
        var error = this._execute(state, delay);
        if (error) {
            return error;
        }
        else if (this.pending === false && this.id != null) {
            this.id = this.recycleAsyncId(this.scheduler, this.id, null);
        }
    };
    AsyncAction.prototype._execute = function (state, _delay) {
        var errored = false;
        var errorValue;
        try {
            this.work(state);
        }
        catch (e) {
            errored = true;
            errorValue = e ? e : new Error('Scheduled action threw falsy error');
        }
        if (errored) {
            this.unsubscribe();
            return errorValue;
        }
    };
    AsyncAction.prototype.unsubscribe = function () {
        if (!this.closed) {
            var _a = this, id = _a.id, scheduler = _a.scheduler;
            var actions = scheduler.actions;
            this.work = this.state = this.scheduler = null;
            this.pending = false;
            arrRemove(actions, this);
            if (id != null) {
                this.id = this.recycleAsyncId(scheduler, id, null);
            }
            this.delay = null;
            _super.prototype.unsubscribe.call(this);
        }
    };
    return AsyncAction;
}(Action));

var Scheduler = (function () {
    function Scheduler(schedulerActionCtor, now) {
        if (now === void 0) { now = Scheduler.now; }
        this.schedulerActionCtor = schedulerActionCtor;
        this.now = now;
    }
    Scheduler.prototype.schedule = function (work, delay, state) {
        if (delay === void 0) { delay = 0; }
        return new this.schedulerActionCtor(this, work).schedule(state, delay);
    };
    Scheduler.now = dateTimestampProvider.now;
    return Scheduler;
}());

var AsyncScheduler = (function (_super) {
    __extends(AsyncScheduler, _super);
    function AsyncScheduler(SchedulerAction, now) {
        if (now === void 0) { now = Scheduler.now; }
        var _this = _super.call(this, SchedulerAction, now) || this;
        _this.actions = [];
        _this._active = false;
        _this._scheduled = undefined;
        return _this;
    }
    AsyncScheduler.prototype.flush = function (action) {
        var actions = this.actions;
        if (this._active) {
            actions.push(action);
            return;
        }
        var error;
        this._active = true;
        do {
            if ((error = action.execute(action.state, action.delay))) {
                break;
            }
        } while ((action = actions.shift()));
        this._active = false;
        if (error) {
            while ((action = actions.shift())) {
                action.unsubscribe();
            }
            throw error;
        }
    };
    return AsyncScheduler;
}(Scheduler));

var asyncScheduler = new AsyncScheduler(AsyncAction);
var async = asyncScheduler;

var EMPTY = new Observable(function (subscriber) { return subscriber.complete(); });

function isScheduler(value) {
    return value && isFunction(value.schedule);
}

function last(arr) {
    return arr[arr.length - 1];
}
function popResultSelector(args) {
    return isFunction(last(args)) ? args.pop() : undefined;
}
function popScheduler(args) {
    return isScheduler(last(args)) ? args.pop() : undefined;
}
function popNumber(args, defaultValue) {
    return typeof last(args) === 'number' ? args.pop() : defaultValue;
}

var isArrayLike = (function (x) { return x && typeof x.length === 'number' && typeof x !== 'function'; });

function isPromise(value) {
    return isFunction(value === null || value === void 0 ? void 0 : value.then);
}

function isInteropObservable(input) {
    return isFunction(input[observable]);
}

function isAsyncIterable(obj) {
    return Symbol.asyncIterator && isFunction(obj === null || obj === void 0 ? void 0 : obj[Symbol.asyncIterator]);
}

function createInvalidObservableTypeError(input) {
    return new TypeError("You provided " + (input !== null && typeof input === 'object' ? 'an invalid object' : "'" + input + "'") + " where a stream was expected. You can provide an Observable, Promise, ReadableStream, Array, AsyncIterable, or Iterable.");
}

function getSymbolIterator() {
    if (typeof Symbol !== 'function' || !Symbol.iterator) {
        return '@@iterator';
    }
    return Symbol.iterator;
}
var iterator = getSymbolIterator();

function isIterable(input) {
    return isFunction(input === null || input === void 0 ? void 0 : input[iterator]);
}

function readableStreamLikeToAsyncGenerator(readableStream) {
    return __asyncGenerator(this, arguments, function readableStreamLikeToAsyncGenerator_1() {
        var reader, _a, value, done;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    reader = readableStream.getReader();
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, , 9, 10]);
                    _b.label = 2;
                case 2:
                    return [4, __await(reader.read())];
                case 3:
                    _a = _b.sent(), value = _a.value, done = _a.done;
                    if (!done) return [3, 5];
                    return [4, __await(void 0)];
                case 4: return [2, _b.sent()];
                case 5: return [4, __await(value)];
                case 6: return [4, _b.sent()];
                case 7:
                    _b.sent();
                    return [3, 2];
                case 8: return [3, 10];
                case 9:
                    reader.releaseLock();
                    return [7];
                case 10: return [2];
            }
        });
    });
}
function isReadableStreamLike(obj) {
    return isFunction(obj === null || obj === void 0 ? void 0 : obj.getReader);
}

function innerFrom(input) {
    if (input instanceof Observable) {
        return input;
    }
    if (input != null) {
        if (isInteropObservable(input)) {
            return fromInteropObservable(input);
        }
        if (isArrayLike(input)) {
            return fromArrayLike(input);
        }
        if (isPromise(input)) {
            return fromPromise(input);
        }
        if (isAsyncIterable(input)) {
            return fromAsyncIterable(input);
        }
        if (isIterable(input)) {
            return fromIterable(input);
        }
        if (isReadableStreamLike(input)) {
            return fromReadableStreamLike(input);
        }
    }
    throw createInvalidObservableTypeError(input);
}
function fromInteropObservable(obj) {
    return new Observable(function (subscriber) {
        var obs = obj[observable]();
        if (isFunction(obs.subscribe)) {
            return obs.subscribe(subscriber);
        }
        throw new TypeError('Provided object does not correctly implement Symbol.observable');
    });
}
function fromArrayLike(array) {
    return new Observable(function (subscriber) {
        for (var i = 0; i < array.length && !subscriber.closed; i++) {
            subscriber.next(array[i]);
        }
        subscriber.complete();
    });
}
function fromPromise(promise) {
    return new Observable(function (subscriber) {
        promise
            .then(function (value) {
            if (!subscriber.closed) {
                subscriber.next(value);
                subscriber.complete();
            }
        }, function (err) { return subscriber.error(err); })
            .then(null, reportUnhandledError);
    });
}
function fromIterable(iterable) {
    return new Observable(function (subscriber) {
        var e_1, _a;
        try {
            for (var iterable_1 = __values(iterable), iterable_1_1 = iterable_1.next(); !iterable_1_1.done; iterable_1_1 = iterable_1.next()) {
                var value = iterable_1_1.value;
                subscriber.next(value);
                if (subscriber.closed) {
                    return;
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (iterable_1_1 && !iterable_1_1.done && (_a = iterable_1.return)) _a.call(iterable_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        subscriber.complete();
    });
}
function fromAsyncIterable(asyncIterable) {
    return new Observable(function (subscriber) {
        process$1(asyncIterable, subscriber).catch(function (err) { return subscriber.error(err); });
    });
}
function fromReadableStreamLike(readableStream) {
    return fromAsyncIterable(readableStreamLikeToAsyncGenerator(readableStream));
}
function process$1(asyncIterable, subscriber) {
    var asyncIterable_1, asyncIterable_1_1;
    var e_2, _a;
    return __awaiter(this, void 0, void 0, function () {
        var value, e_2_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 5, 6, 11]);
                    asyncIterable_1 = __asyncValues(asyncIterable);
                    _b.label = 1;
                case 1: return [4, asyncIterable_1.next()];
                case 2:
                    if (!(asyncIterable_1_1 = _b.sent(), !asyncIterable_1_1.done)) return [3, 4];
                    value = asyncIterable_1_1.value;
                    subscriber.next(value);
                    if (subscriber.closed) {
                        return [2];
                    }
                    _b.label = 3;
                case 3: return [3, 1];
                case 4: return [3, 11];
                case 5:
                    e_2_1 = _b.sent();
                    e_2 = { error: e_2_1 };
                    return [3, 11];
                case 6:
                    _b.trys.push([6, , 9, 10]);
                    if (!(asyncIterable_1_1 && !asyncIterable_1_1.done && (_a = asyncIterable_1.return))) return [3, 8];
                    return [4, _a.call(asyncIterable_1)];
                case 7:
                    _b.sent();
                    _b.label = 8;
                case 8: return [3, 10];
                case 9:
                    if (e_2) throw e_2.error;
                    return [7];
                case 10: return [7];
                case 11:
                    subscriber.complete();
                    return [2];
            }
        });
    });
}

function executeSchedule(parentSubscription, scheduler, work, delay, repeat) {
    if (delay === void 0) { delay = 0; }
    if (repeat === void 0) { repeat = false; }
    var scheduleSubscription = scheduler.schedule(function () {
        work();
        if (repeat) {
            parentSubscription.add(this.schedule(null, delay));
        }
        else {
            this.unsubscribe();
        }
    }, delay);
    parentSubscription.add(scheduleSubscription);
    if (!repeat) {
        return scheduleSubscription;
    }
}

function observeOn(scheduler, delay) {
    if (delay === void 0) { delay = 0; }
    return operate(function (source, subscriber) {
        source.subscribe(createOperatorSubscriber(subscriber, function (value) { return executeSchedule(subscriber, scheduler, function () { return subscriber.next(value); }, delay); }, function () { return executeSchedule(subscriber, scheduler, function () { return subscriber.complete(); }, delay); }, function (err) { return executeSchedule(subscriber, scheduler, function () { return subscriber.error(err); }, delay); }));
    });
}

function subscribeOn(scheduler, delay) {
    if (delay === void 0) { delay = 0; }
    return operate(function (source, subscriber) {
        subscriber.add(scheduler.schedule(function () { return source.subscribe(subscriber); }, delay));
    });
}

function scheduleObservable(input, scheduler) {
    return innerFrom(input).pipe(subscribeOn(scheduler), observeOn(scheduler));
}

function schedulePromise(input, scheduler) {
    return innerFrom(input).pipe(subscribeOn(scheduler), observeOn(scheduler));
}

function scheduleArray(input, scheduler) {
    return new Observable(function (subscriber) {
        var i = 0;
        return scheduler.schedule(function () {
            if (i === input.length) {
                subscriber.complete();
            }
            else {
                subscriber.next(input[i++]);
                if (!subscriber.closed) {
                    this.schedule();
                }
            }
        });
    });
}

function scheduleIterable(input, scheduler) {
    return new Observable(function (subscriber) {
        var iterator$1;
        executeSchedule(subscriber, scheduler, function () {
            iterator$1 = input[iterator]();
            executeSchedule(subscriber, scheduler, function () {
                var _a;
                var value;
                var done;
                try {
                    (_a = iterator$1.next(), value = _a.value, done = _a.done);
                }
                catch (err) {
                    subscriber.error(err);
                    return;
                }
                if (done) {
                    subscriber.complete();
                }
                else {
                    subscriber.next(value);
                }
            }, 0, true);
        });
        return function () { return isFunction(iterator$1 === null || iterator$1 === void 0 ? void 0 : iterator$1.return) && iterator$1.return(); };
    });
}

function scheduleAsyncIterable(input, scheduler) {
    if (!input) {
        throw new Error('Iterable cannot be null');
    }
    return new Observable(function (subscriber) {
        executeSchedule(subscriber, scheduler, function () {
            var iterator = input[Symbol.asyncIterator]();
            executeSchedule(subscriber, scheduler, function () {
                iterator.next().then(function (result) {
                    if (result.done) {
                        subscriber.complete();
                    }
                    else {
                        subscriber.next(result.value);
                    }
                });
            }, 0, true);
        });
    });
}

function scheduleReadableStreamLike(input, scheduler) {
    return scheduleAsyncIterable(readableStreamLikeToAsyncGenerator(input), scheduler);
}

function scheduled(input, scheduler) {
    if (input != null) {
        if (isInteropObservable(input)) {
            return scheduleObservable(input, scheduler);
        }
        if (isArrayLike(input)) {
            return scheduleArray(input, scheduler);
        }
        if (isPromise(input)) {
            return schedulePromise(input, scheduler);
        }
        if (isAsyncIterable(input)) {
            return scheduleAsyncIterable(input, scheduler);
        }
        if (isIterable(input)) {
            return scheduleIterable(input, scheduler);
        }
        if (isReadableStreamLike(input)) {
            return scheduleReadableStreamLike(input, scheduler);
        }
    }
    throw createInvalidObservableTypeError(input);
}

function from(input, scheduler) {
    return scheduler ? scheduled(input, scheduler) : innerFrom(input);
}

var EmptyError = createErrorClass(function (_super) { return function EmptyErrorImpl() {
    _super(this);
    this.name = 'EmptyError';
    this.message = 'no elements in sequence';
}; });

function firstValueFrom(source, config) {
    var hasConfig = typeof config === 'object';
    return new Promise(function (resolve, reject) {
        var subscriber = new SafeSubscriber({
            next: function (value) {
                resolve(value);
                subscriber.unsubscribe();
            },
            error: reject,
            complete: function () {
                if (hasConfig) {
                    resolve(config.defaultValue);
                }
                else {
                    reject(new EmptyError());
                }
            },
        });
        source.subscribe(subscriber);
    });
}

function isValidDate(value) {
    return value instanceof Date && !isNaN(value);
}

function map(project, thisArg) {
    return operate(function (source, subscriber) {
        var index = 0;
        source.subscribe(createOperatorSubscriber(subscriber, function (value) {
            subscriber.next(project.call(thisArg, value, index++));
        }));
    });
}

function mergeInternals(source, subscriber, project, concurrent, onBeforeNext, expand, innerSubScheduler, additionalFinalizer) {
    var buffer = [];
    var active = 0;
    var index = 0;
    var isComplete = false;
    var checkComplete = function () {
        if (isComplete && !buffer.length && !active) {
            subscriber.complete();
        }
    };
    var outerNext = function (value) { return (active < concurrent ? doInnerSub(value) : buffer.push(value)); };
    var doInnerSub = function (value) {
        expand && subscriber.next(value);
        active++;
        var innerComplete = false;
        innerFrom(project(value, index++)).subscribe(createOperatorSubscriber(subscriber, function (innerValue) {
            onBeforeNext === null || onBeforeNext === void 0 ? void 0 : onBeforeNext(innerValue);
            if (expand) {
                outerNext(innerValue);
            }
            else {
                subscriber.next(innerValue);
            }
        }, function () {
            innerComplete = true;
        }, undefined, function () {
            if (innerComplete) {
                try {
                    active--;
                    var _loop_1 = function () {
                        var bufferedValue = buffer.shift();
                        if (innerSubScheduler) {
                            executeSchedule(subscriber, innerSubScheduler, function () { return doInnerSub(bufferedValue); });
                        }
                        else {
                            doInnerSub(bufferedValue);
                        }
                    };
                    while (buffer.length && active < concurrent) {
                        _loop_1();
                    }
                    checkComplete();
                }
                catch (err) {
                    subscriber.error(err);
                }
            }
        }));
    };
    source.subscribe(createOperatorSubscriber(subscriber, outerNext, function () {
        isComplete = true;
        checkComplete();
    }));
    return function () {
        additionalFinalizer === null || additionalFinalizer === void 0 ? void 0 : additionalFinalizer();
    };
}

function mergeMap(project, resultSelector, concurrent) {
    if (concurrent === void 0) { concurrent = Infinity; }
    if (isFunction(resultSelector)) {
        return mergeMap(function (a, i) { return map(function (b, ii) { return resultSelector(a, b, i, ii); })(innerFrom(project(a, i))); }, concurrent);
    }
    else if (typeof resultSelector === 'number') {
        concurrent = resultSelector;
    }
    return operate(function (source, subscriber) { return mergeInternals(source, subscriber, project, concurrent); });
}

function mergeAll(concurrent) {
    if (concurrent === void 0) { concurrent = Infinity; }
    return mergeMap(identity, concurrent);
}

function timer(dueTime, intervalOrScheduler, scheduler) {
    if (dueTime === void 0) { dueTime = 0; }
    if (scheduler === void 0) { scheduler = async; }
    var intervalDuration = -1;
    if (intervalOrScheduler != null) {
        if (isScheduler(intervalOrScheduler)) {
            scheduler = intervalOrScheduler;
        }
        else {
            intervalDuration = intervalOrScheduler;
        }
    }
    return new Observable(function (subscriber) {
        var due = isValidDate(dueTime) ? +dueTime - scheduler.now() : dueTime;
        if (due < 0) {
            due = 0;
        }
        var n = 0;
        return scheduler.schedule(function () {
            if (!subscriber.closed) {
                subscriber.next(n++);
                if (0 <= intervalDuration) {
                    this.schedule(undefined, intervalDuration);
                }
                else {
                    subscriber.complete();
                }
            }
        }, due);
    });
}

function merge() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    var scheduler = popScheduler(args);
    var concurrent = popNumber(args, Infinity);
    var sources = args;
    return !sources.length
        ?
            EMPTY
        : sources.length === 1
            ?
                innerFrom(sources[0])
            :
                mergeAll(concurrent)(from(sources, scheduler));
}

function filter(predicate, thisArg) {
    return operate(function (source, subscriber) {
        var index = 0;
        source.subscribe(createOperatorSubscriber(subscriber, function (value) { return predicate.call(thisArg, value, index++) && subscriber.next(value); }));
    });
}

function buffer(closingNotifier) {
    return operate(function (source, subscriber) {
        var currentBuffer = [];
        source.subscribe(createOperatorSubscriber(subscriber, function (value) { return currentBuffer.push(value); }, function () {
            subscriber.next(currentBuffer);
            subscriber.complete();
        }));
        closingNotifier.subscribe(createOperatorSubscriber(subscriber, function () {
            var b = currentBuffer;
            currentBuffer = [];
            subscriber.next(b);
        }, noop));
        return function () {
            currentBuffer = null;
        };
    });
}

function debounce(durationSelector) {
    return operate(function (source, subscriber) {
        var hasValue = false;
        var lastValue = null;
        var durationSubscriber = null;
        var emit = function () {
            durationSubscriber === null || durationSubscriber === void 0 ? void 0 : durationSubscriber.unsubscribe();
            durationSubscriber = null;
            if (hasValue) {
                hasValue = false;
                var value = lastValue;
                lastValue = null;
                subscriber.next(value);
            }
        };
        source.subscribe(createOperatorSubscriber(subscriber, function (value) {
            durationSubscriber === null || durationSubscriber === void 0 ? void 0 : durationSubscriber.unsubscribe();
            hasValue = true;
            lastValue = value;
            durationSubscriber = createOperatorSubscriber(subscriber, emit, noop);
            innerFrom(durationSelector(value)).subscribe(durationSubscriber);
        }, function () {
            emit();
            subscriber.complete();
        }, undefined, function () {
            lastValue = durationSubscriber = null;
        }));
    });
}

function defaultIfEmpty(defaultValue) {
    return operate(function (source, subscriber) {
        var hasValue = false;
        source.subscribe(createOperatorSubscriber(subscriber, function (value) {
            hasValue = true;
            subscriber.next(value);
        }, function () {
            if (!hasValue) {
                subscriber.next(defaultValue);
            }
            subscriber.complete();
        }));
    });
}

function take(count) {
    return count <= 0
        ?
            function () { return EMPTY; }
        : operate(function (source, subscriber) {
            var seen = 0;
            source.subscribe(createOperatorSubscriber(subscriber, function (value) {
                if (++seen <= count) {
                    subscriber.next(value);
                    if (count <= seen) {
                        subscriber.complete();
                    }
                }
            }));
        });
}

function throwIfEmpty(errorFactory) {
    if (errorFactory === void 0) { errorFactory = defaultErrorFactory; }
    return operate(function (source, subscriber) {
        var hasValue = false;
        source.subscribe(createOperatorSubscriber(subscriber, function (value) {
            hasValue = true;
            subscriber.next(value);
        }, function () { return (hasValue ? subscriber.complete() : subscriber.error(errorFactory())); }));
    });
}
function defaultErrorFactory() {
    return new EmptyError();
}

function first(predicate, defaultValue) {
    var hasDefaultValue = arguments.length >= 2;
    return function (source) {
        return source.pipe(predicate ? filter(function (v, i) { return predicate(v, i, source); }) : identity, take(1), hasDefaultValue ? defaultIfEmpty(defaultValue) : throwIfEmpty(function () { return new EmptyError(); }));
    };
}

function switchMap(project, resultSelector) {
    return operate(function (source, subscriber) {
        var innerSubscriber = null;
        var index = 0;
        var isComplete = false;
        var checkComplete = function () { return isComplete && !innerSubscriber && subscriber.complete(); };
        source.subscribe(createOperatorSubscriber(subscriber, function (value) {
            innerSubscriber === null || innerSubscriber === void 0 ? void 0 : innerSubscriber.unsubscribe();
            var innerIndex = 0;
            var outerIndex = index++;
            innerFrom(project(value, outerIndex)).subscribe((innerSubscriber = createOperatorSubscriber(subscriber, function (innerValue) { return subscriber.next(resultSelector ? resultSelector(value, innerValue, outerIndex, innerIndex++) : innerValue); }, function () {
                innerSubscriber = null;
                checkComplete();
            })));
        }, function () {
            isComplete = true;
            checkComplete();
        }));
    });
}

function withLatestFrom() {
    var inputs = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        inputs[_i] = arguments[_i];
    }
    var project = popResultSelector(inputs);
    return operate(function (source, subscriber) {
        var len = inputs.length;
        var otherValues = new Array(len);
        var hasValue = inputs.map(function () { return false; });
        var ready = false;
        var _loop_1 = function (i) {
            innerFrom(inputs[i]).subscribe(createOperatorSubscriber(subscriber, function (value) {
                otherValues[i] = value;
                if (!ready && !hasValue[i]) {
                    hasValue[i] = true;
                    (ready = hasValue.every(identity)) && (hasValue = null);
                }
            }, noop));
        };
        for (var i = 0; i < len; i++) {
            _loop_1(i);
        }
        source.subscribe(createOperatorSubscriber(subscriber, function (value) {
            if (ready) {
                var values = __spreadArray([value], __read(otherValues));
                subscriber.next(project ? project.apply(void 0, __spreadArray([], __read(values))) : values);
            }
        }));
    });
}

const { pathExistsSync, outputFile, statSync } = fsExtra__default["default"];
const debug$3 = _debug("file-writer").extend("events");
const writerEvent$ = new BehaviorSubject({
  type: "init"
});
writerEvent$.subscribe((event) => {
  debug$3("watcher event %O", event.type);
  if (event.type === "error") {
    debug$3("watcher error %O", event.error);
  }
});
const filesError$ = writerEvent$.pipe(filter((x) => {
  return x.type === "error";
}));
const filesStart$ = writerEvent$.pipe(filter((x) => {
  return x.type === "buildStart";
}));
const filesStart = () => firstValueFrom(filesStart$);
const filesReady$ = writerEvent$.pipe(filter((x) => {
  return x.type === "writeBundle";
}), switchMap((event) => timer(0, 100).pipe(map(() => event), first(({ bundle, options, timestamp }) => {
  const result = Object.keys(bundle).every((p) => {
    const stats = statSync(join(options.dir, p));
    return stats.mtimeMs > timestamp;
  });
  return result;
}))));
const filesReady = () => firstValueFrom(filesReady$);
const server$ = new Subject();
const triggerName = firstValueFrom(server$.pipe(map(({ config: { cacheDir } }) => cacheDir), filter(isString), map((dir) => join(dir, ".crx-watch-trigger"))));
const rebuildFiles = async () => {
  debug$3("rebuildFiles start");
  await filesReady();
  await Promise.all([
    outputFile(await triggerName, Date.now().toString()),
    filesStart()
  ]);
  await filesReady();
  debug$3("rebuildFiles end");
};
function startLogger(server) {
  const logger = vite.createLogger(server.config.logLevel, {
    prefix: "[crx]"
  });
  const subs = [
    filesStart$.subscribe(() => {
      const message = colors__default["default"].green("files start");
      const outDir = colors__default["default"].dim(relative(server.config.root, server.config.build.outDir));
      logger.info(`${message} ${outDir}`, { timestamp: true });
    }),
    filesReady$.subscribe(({ duration: d }) => {
      const message = colors__default["default"].green("files ready");
      const duration = colors__default["default"].dim(`in ${colors__default["default"].bold(`${d}ms`)}`);
      logger.info(`${message} ${duration}`, { timestamp: true });
    }),
    filesError$.subscribe(({ error }) => {
      logger.error(colors__default["default"].dim("error from file writer:"), { timestamp: true });
      if (error) {
        const message = error?.stack ?? error.message;
        logger.error(colors__default["default"].red(message));
      }
    })
  ];
  return () => subs.forEach((sub) => sub.unsubscribe());
}
const pluginFileWriterEvents = () => {
  let start = perf_hooks.performance.now();
  let stopLogger;
  return {
    name: "crx:file-writer-events",
    enforce: "post",
    apply: "build",
    fileWriterStart(server) {
      debug$3("fileWriterStart");
      stopLogger = startLogger(server);
    },
    closeWatcher() {
      debug$3("closeWatcher");
      stopLogger();
    },
    async buildStart(options) {
      start = perf_hooks.performance.now();
      const filename = await triggerName;
      if (!pathExistsSync(filename)) {
        await outputFile(filename, Date.now().toString());
      }
      this.addWatchFile(filename);
      writerEvent$.next({ type: "buildStart", options });
      debug$3("buildStart");
    },
    writeBundle(options, bundle) {
      const timestamp = perf_hooks.performance.now();
      const duration = Math.round(timestamp - start);
      writerEvent$.next({
        type: "writeBundle",
        options,
        bundle,
        duration,
        timestamp
      });
      debug$3("writeBundle");
    },
    renderError(error) {
      writerEvent$.next({ type: "error", error });
    },
    watchChange(id, { event }) {
      writerEvent$.next({ type: "change", id, event });
    }
  };
};

var precontrollerScript = "const id = setInterval(() => location.reload(), 100);\nsetTimeout(() => clearInterval(id), 5e3);\n";

var precontrollerHtml = "<!DOCTYPE html>\n<html lang=\"en\">\n  <head>\n    <title>Waiting for the extension service worker...</title>\n    <script src=\"%PATH%\"></script>\n  </head>\n  <body>\n    <h1>Waiting for service worker</h1>\n\n    <p>\n      If you see this message, it means the service worker has not loaded fully.\n    </p>\n\n    <p>This page is never added in production.</p>\n  </body>\n</html>\n";

const pluginFileWriterHtml = () => {
  let precontrollerName;
  return {
    name: "crx:file-writer-html",
    apply: "build",
    fileWriterStart(server) {
      const plugins = server.config.plugins;
      const i = plugins.findIndex(({ name }) => name === "alias");
      plugins.splice(i, 0, {
        name: "crx:load-precontroller",
        apply: "serve",
        load(id) {
          if (id === `/${precontrollerName}`)
            return "location.reload();";
        }
      });
    },
    renderCrxManifest(manifest) {
      if (this.meta.watchMode) {
        const refId = this.emitFile({
          type: "asset",
          name: "precontroller.js",
          source: precontrollerScript
        });
        precontrollerName = this.getFileName(refId);
        for (const fileName of htmlFiles(manifest)) {
          this.emitFile({
            type: "asset",
            fileName,
            source: precontrollerHtml.replace("%PATH%", `/${precontrollerName}`)
          });
        }
      }
      return manifest;
    }
  };
};

const { readFile: readFile$1 } = fs.promises;
const pluginFileWriterPublic = () => {
  let config;
  return {
    name: "crx:file-writer-public",
    apply: "build",
    configResolved(_config) {
      config = _config;
    },
    async buildStart() {
      if (this.meta.watchMode) {
        this.addWatchFile(config.publicDir);
        const publicFiles = await fg__default["default"](`${config.publicDir}/**/*`);
        for (const file of publicFiles) {
          const source = await readFile$1(file);
          const fileName = relative(config.publicDir, file);
          this.emitFile({ type: "asset", fileName, source });
        }
      }
    }
  };
};

const _require = typeof require === "undefined" ? module$1.createRequire((typeof document === 'undefined' ? new (require('u' + 'rl').URL)('file:' + __filename).href : (document.currentScript && document.currentScript.src || new URL('index.cjs', document.baseURI).href))) : require;
const customElementsPath = _require.resolve(customElementsId);
const customElementsCode = fs.readFileSync(customElementsPath, "utf8");
const customElementsMap = fs.readFileSync(`${customElementsPath}.map`, "utf8");
const pluginFileWriterPolyfill = () => {
  return {
    name: "crx:file-writer-polyfill",
    apply: "build",
    enforce: "pre",
    load(id) {
      if (id === idByUrl.get(customElementsId)) {
        return { code: customElementsCode, map: customElementsMap };
      }
    },
    transform(code, id) {
      if (id === idByUrl.get(viteClientId)) {
        const magic = new MagicString__default["default"](code);
        magic.prepend(`import '${customElementsId}';`);
        magic.prepend(`import { HMRPort } from '${contentHmrPortId}';`);
        const ws = "new WebSocket";
        const index = code.indexOf(ws);
        magic.overwrite(index, index + ws.length, "new HMRPort");
        return { code: magic.toString(), map: magic.generateMap() };
      }
    }
  };
};

function isUpdatePayload(p) {
  return p.type === "update";
}
function isFullReloadPayload(p) {
  return p.type === "full-reload";
}
function isPrunePayload(p) {
  return p.type === "prune";
}
function isCrxHMRPayload(x) {
  return x.type === "custom" && x.event.startsWith("crx:");
}
const hmrPayload$ = new Subject();
const hmrPrune$ = hmrPayload$.pipe(filter(isPrunePayload));
const hmrFullReload$ = hmrPayload$.pipe(filter(isFullReloadPayload));
const hmrUpdate$ = hmrPayload$.pipe(filter(isUpdatePayload));
const payload$ = merge(hmrFullReload$, hmrPrune$, hmrUpdate$);
const rebuildSignal$ = payload$.pipe(buffer(payload$.pipe(debounce(() => filesReady$))), map((payloads) => {
  if (payloads.every(isUpdatePayload)) {
    const owners = /* @__PURE__ */ new Set();
    for (const { updates } of payloads)
      for (const { path } of updates)
        if (transformResultByOwner.has(path))
          owners.add(path);
    return { type: "partial", owners };
  }
  return { type: "full" };
}), filter((rebuild) => rebuild.type === "partial" ? rebuild.owners.size > 0 : true));
const crxHmrPayload$ = hmrPayload$.pipe(filter((p) => !isCrxHMRPayload(p)), buffer(filesReady$), mergeMap((pps) => {
  let fullReload;
  const payloads = [];
  for (const p of pps.slice(-50))
    if (p.type === "full-reload") {
      fullReload = p;
    } else {
      payloads.push(p);
    }
  if (fullReload)
    payloads.push(fullReload);
  return payloads;
}), map((p) => {
  switch (p.type) {
    case "full-reload": {
      const path = p.path && outputByOwner.get(p.path);
      const fullReload = {
        type: "full-reload",
        path
      };
      return fullReload;
    }
    case "prune": {
      const paths = [];
      for (const owner of p.paths)
        if (outputByOwner.has(owner))
          paths.push(outputByOwner.get(owner));
      return { type: "prune", paths };
    }
    case "update": {
      const updates = [];
      for (const { acceptedPath, path, ...rest } of p.updates)
        if (outputByOwner.has(acceptedPath) && outputByOwner.has(path))
          updates.push({
            ...rest,
            acceptedPath: outputByOwner.get(acceptedPath),
            path: outputByOwner.get(path)
          });
      return { type: "update", updates };
    }
    default:
      return p;
  }
}), withLatestFrom(filesReady$), filter(([p, { bundle }]) => {
  switch (p.type) {
    case "full-reload":
      return typeof p.path === "undefined" || p.path in bundle;
    case "prune":
      return p.paths.length > 0;
    case "update":
      return p.updates.length > 0;
    default:
      return true;
  }
}), map(([p]) => ({
  type: "custom",
  event: "crx:content-script-payload",
  data: p
})));

function sortPlugins(plugins, command) {
  const pre = [];
  const mid = [];
  const post = [];
  for (const p of plugins) {
    if (p.apply === command || !p.apply || !command) {
      if (p.enforce === "pre")
        pre.push(p);
      else if (p.enforce === "post")
        post.push(p);
      else
        mid.push(p);
    }
  }
  return { pre, mid, post };
}
const pluginFileWriter = (crxPlugins) => (options) => {
  const chunks = pluginFileWriterChunks();
  const html = pluginFileWriterHtml();
  const events = pluginFileWriterEvents();
  const publicDir = pluginFileWriterPublic();
  const polyfill = pluginFileWriterPolyfill();
  const { pre, mid, post } = sortPlugins(crxPlugins, "build");
  const plugins = [
    ...pre,
    ...mid,
    polyfill,
    chunks,
    html,
    publicDir,
    ...post,
    events
  ].flat();
  let watcher;
  return {
    name: "crx:file-writer",
    apply: "serve",
    async config(_config, env) {
      let config = _config;
      for (const p of plugins) {
        const r = await p.config?.(config, env);
        config = r ?? config;
      }
      return config;
    },
    async configResolved(config) {
      await Promise.all(plugins.map((p) => p.configResolved?.(config)));
    },
    configureServer(server) {
      server.httpServer?.once("listening", async () => {
        server$.next(server);
        const optimizedDeps = server._optimizedDeps;
        await optimizedDeps?.scanProcessing;
        const { pre: pre2, mid: mid2, post: post2 } = sortPlugins([
          ...server.config.plugins,
          ...plugins
        ]);
        const allPlugins = [...pre2, ...mid2, ...post2];
        await Promise.all(allPlugins.map(async (p) => {
          try {
            await p.fileWriterStart?.(server);
          } catch (e) {
            const hook = `[${p.name}].fileWriterStart`;
            let error = new Error(`Error in plugin ${hook}`);
            if (e instanceof Error) {
              error = e;
              error.message = `${hook} ${error.message}`;
            } else if (typeof e === "string") {
              error = new Error(`${hook} ${e}`);
            }
            writerEvent$.next({ type: "error", error });
          }
        }));
        watcher = rollup.watch({
          input: stubId,
          context: "this",
          output: {
            dir: server.config.build.outDir,
            format: "es"
          },
          plugins,
          treeshake: false
        });
        watcher.on("event", (event) => {
          if (event.code === "ERROR") {
            const { message, parserError, stack, id, loc, code, frame } = event.error;
            const error = parserError ?? new Error(message);
            if (parserError && message.startsWith("Unexpected token")) {
              const m = `Unexpected token in ${loc?.file ?? id}`;
              error.message = [m, loc?.line, loc?.column].filter(isTruthy).join(":");
            }
            error.stack = (stack ?? error.stack)?.replace(/.+?\n/, `Error: ${error.message}
`);
            writerEvent$.next({ type: "error", error, code, frame });
          }
        });
        const rebuildSub = rebuildSignal$.subscribe((rebuild) => {
          if (rebuild.type === "partial") {
            for (const owner of rebuild.owners)
              transformResultByOwner.delete(owner);
          } else {
            transformResultByOwner.clear();
          }
          rebuildFiles();
        });
        watcher.on("close", () => {
          rebuildSub.unsubscribe();
        });
      });
    },
    closeBundle() {
      watcher?.close();
    }
  };
};

function isImporter(file) {
  const seen = /* @__PURE__ */ new Set();
  const pred = (changedNode) => {
    seen.add(changedNode);
    if (changedNode.file === file)
      return true;
    for (const parentNode of changedNode.importers) {
      const unseen = !seen.has(parentNode);
      if (unseen && pred(parentNode))
        return true;
    }
    return false;
  };
  return pred;
}

const debug$2 = _debug("hmr");
const crxRuntimeReload = {
  type: "custom",
  event: "crx:runtime-reload"
};
const pluginHMR = () => {
  let files;
  let decoratedSend;
  return [
    {
      name: "crx:hmr",
      apply: "build",
      enforce: "post",
      async renderCrxManifest(manifest) {
        if (this.meta.watchMode) {
          files = await manifestFiles(manifest);
        }
        return null;
      }
    },
    {
      name: "crx:hmr",
      apply: "serve",
      enforce: "pre",
      config({ server = {}, ...config }) {
        if (server.hmr === false)
          return;
        if (server.hmr === true)
          server.hmr = {};
        server.hmr = server.hmr ?? {};
        server.hmr.host = "localhost";
        return { server, ...config };
      },
      configResolved(config) {
        const { watch = {} } = config.server;
        config.server.watch = watch;
        watch.ignored = watch.ignored ? [...new Set([watch.ignored].flat())] : [];
        const outDir = isAbsolute(config.build.outDir) ? config.build.outDir : join(config.root, config.build.outDir, "**/*");
        watch.ignored.push(outDir);
      },
      configureServer(server) {
        if (server.ws.send !== decoratedSend) {
          const { send } = server.ws;
          decoratedSend = (payload) => {
            hmrPayload$.next(payload);
            send(payload);
          };
          server.ws.send = decoratedSend;
          crxHmrPayload$.subscribe((payload) => {
            send(payload);
          });
        }
      },
      handleHotUpdate({ file, modules, server }) {
        const background = files.background[0] && join(server.config.root, files.background[0]);
        if (background) {
          if (file === background || modules.some(isImporter(background))) {
            debug$2("sending runtime reload");
            server.ws.send(crxRuntimeReload);
            return [];
          }
        }
      }
    }
  ];
};

var loader = "try {\n  for (const p of JSON.parse(SCRIPTS)) {\n    const url = new URL(p, \"https://stub\");\n    url.searchParams.set(\"t\", Date.now().toString());\n    const req = url.pathname + url.search;\n    await import(\n      /* @vite-ignore */\n      req\n    );\n  }\n} catch (error) {\n  console.error(error);\n}\n";

const pluginName = "crx:html-inline-scripts";
const debug$1 = _debug(pluginName);
const prefix = "@crx/inline-script";
const isInlineTag = (t) => t.tag === "script" && !t.attrs?.src;
const toKey = (ctx) => {
  const { dir, name } = parse(ctx.path);
  return join(prefix, dir, name);
};
const pluginHtmlAuditor = () => {
  const pages = /* @__PURE__ */ new Map();
  const auditTransformIndexHtml = (p) => {
    let transform;
    if (typeof p.transformIndexHtml === "function") {
      transform = p.transformIndexHtml;
      p.transformIndexHtml = auditor;
    } else if (typeof p.transformIndexHtml === "object") {
      transform = p.transformIndexHtml.transform;
      p.transformIndexHtml.transform = auditor;
    }
    async function auditor(_html, ctx) {
      const result = await transform(_html, ctx);
      if (!result || typeof result === "string")
        return result;
      let html;
      let tags;
      if (Array.isArray(result)) {
        tags = new Set(result);
      } else {
        tags = new Set(result.tags);
        html = result.html;
      }
      const scripts = [];
      for (const t of tags)
        if (t.tag === "script") {
          tags.delete(t);
          scripts.push(t);
        }
      const key = toKey(ctx);
      const page = pages.get(key);
      page.scripts.push(...scripts);
      pages.set(key, page);
      return html ? { html, tags: [...tags] } : [...tags];
    }
  };
  let base;
  const prePlugin = {
    name: "crx:html-auditor-pre",
    transformIndexHtml(html, ctx) {
      const key = toKey(ctx);
      pages.set(key, {
        ...ctx,
        scripts: [
          {
            tag: "script",
            attrs: {
              type: "module",
              src: join(base, "@vite/client")
            },
            injectTo: "head-prepend"
          }
        ]
      });
    }
  };
  const postPlugin = {
    name: "crx:html-auditor-post",
    transformIndexHtml(html, ctx) {
      const key = toKey(ctx);
      const p = pages.get(key);
      if (p?.scripts.some(isInlineTag)) {
        const $ = cheerio.load(html);
        p.scripts.push(...$("script").toArray().map((el) => ({
          tag: "script",
          attrs: { src: $(el).attr("src"), type: "module" }
        })));
        $("script").remove();
        const loader2 = {
          tag: "script",
          attrs: { src: `${key}?t=${Date.now()}`, type: "module" }
        };
        return { html: $.html(), tags: [loader2] };
      }
      return p?.scripts ?? void 0;
    }
  };
  return {
    name: "crx:html-auditor",
    apply: "serve",
    configResolved(config) {
      base = config.base;
      const plugins = config.plugins;
      for (const p of plugins)
        auditTransformIndexHtml(p);
      plugins.unshift(prePlugin);
      plugins.push(postPlugin);
    },
    configureServer(server) {
      const { transformIndexHtml } = server;
      server.transformIndexHtml = async function auditor(url, html, originalUrl) {
        let result = await transformIndexHtml(url, html, originalUrl);
        if (result.includes(prefix))
          result = result.replace(/\s+<script.+?@vite\/client.+?script>/, "");
        return result;
      };
    },
    resolveId(source) {
      const i = source.indexOf(prefix);
      if (i > -1)
        return source.slice(i);
    },
    load(id) {
      if (id.startsWith(prefix)) {
        const page = pages.get(id);
        if (page) {
          const inline = page.scripts.filter(isInlineTag).map((t) => t.children).join("\n");
          const dir = dirname(page.path);
          const scripts = page.scripts.map(({ attrs }) => attrs?.src).filter(isString).filter((src) => src !== "/@vite/client").map((src) => src.startsWith(".") ? resolve(dir, src) : src);
          const json = `"${jsesc__default["default"](JSON.stringify(scripts), {
            quotes: "double"
          })}"`;
          return [inline, loader.replace("SCRIPTS", json)].join("\n");
        } else {
          debug$1("page missing %s", id);
        }
      }
    }
  };
};

const { readFile } = fs.promises;
const pluginManifest = (_manifest) => () => {
  let manifest;
  let plugins;
  let refId;
  let config;
  return [
    {
      name: "crx:manifest-init",
      enforce: "pre",
      async config(config2, env) {
        manifest = await (typeof _manifest === "function" ? _manifest(env) : _manifest);
        if (manifest.manifest_version !== 3)
          throw new Error(`CRXJS does not support Manifest v${manifest.manifest_version}, please use Manifest v3`);
        if (env.command === "serve") {
          const {
            contentScripts: js,
            background: sw,
            html
          } = await manifestFiles(manifest);
          const { entries = [] } = config2.optimizeDeps ?? {};
          let { input = [] } = config2.build?.rollupOptions ?? {};
          if (typeof input === "string")
            input = [input];
          else
            input = Object.values(input);
          input = input.map((f) => {
            let result = f;
            if (isAbsolute(f)) {
              result = relative(config2.root ?? process.cwd(), f);
            }
            return result;
          });
          const set = new Set([entries, input].flat());
          for (const x of [js, sw, html].flat())
            set.add(x);
          return {
            ...config2,
            optimizeDeps: {
              ...config2.optimizeDeps,
              entries: [...set]
            }
          };
        }
      },
      buildStart(options) {
        if (options.plugins)
          plugins = options.plugins;
      }
    },
    {
      name: "crx:manifest-loader",
      apply: "build",
      enforce: "pre",
      buildStart() {
        refId = this.emitFile({
          type: "chunk",
          id: manifestId,
          name: "crx-manifest.js",
          preserveSignature: "strict"
        });
      },
      resolveId(source) {
        if (source === manifestId)
          return manifestId;
        return null;
      },
      load(id) {
        if (id === manifestId)
          return encodeManifest(manifest);
        return null;
      }
    },
    {
      name: "crx:stub-input",
      apply: "build",
      enforce: "pre",
      options({ input, ...options }) {
        return {
          input: isString(input) && input.endsWith("index.html") ? stubId : input,
          ...options
        };
      },
      resolveId(source) {
        if (source === stubId)
          return stubId;
        return null;
      },
      load(id) {
        if (id === stubId)
          return `console.log('stub')`;
        return null;
      },
      generateBundle(options, bundle) {
        for (const [key, chunk] of Object.entries(bundle)) {
          if (chunk.type === "chunk" && chunk.facadeModuleId === stubId) {
            delete bundle[key];
            break;
          }
        }
      }
    },
    {
      name: "crx:manifest-post",
      apply: "build",
      enforce: "post",
      configResolved(_config) {
        config = _config;
        const plugins2 = config.plugins;
        const crx = plugins2.findIndex(({ name }) => name === "crx:manifest-post");
        const [plugin] = plugins2.splice(crx, 1);
        plugins2.push(plugin);
      },
      async transform(code, id) {
        if (id !== manifestId)
          return;
        let manifest2 = decodeManifest.call(this, code);
        for (const plugin of plugins) {
          try {
            const m = structuredClone(manifest2);
            const result = await plugin.transformCrxManifest?.call(this, m);
            manifest2 = result ?? manifest2;
          } catch (error) {
            if (error instanceof Error)
              error.message = `[${plugin.name}] ${error.message}`;
            throw error;
          }
        }
        if (manifest2.content_scripts?.length) {
          manifest2.content_scripts = manifest2.content_scripts.map(({ js = [], ...rest }) => {
            const refJS = js.map((file) => this.emitFile({
              type: "chunk",
              id: file,
              name: basename(file)
            }));
            return { js: refJS, ...rest };
          });
        }
        if (!this.meta.watchMode) {
          if (manifest2.background?.service_worker) {
            const file = manifest2.background.service_worker;
            const refId2 = this.emitFile({
              type: "chunk",
              id: file,
              name: basename(file)
            });
            manifest2.background.service_worker = refId2;
          }
          for (const file of htmlFiles(manifest2)) {
            this.emitFile({
              type: "chunk",
              id: file,
              name: basename(file)
            });
          }
        }
        const encoded = encodeManifest(manifest2);
        return encoded;
      },
      async generateBundle(options, bundle) {
        const manifestName = this.getFileName(refId);
        const manifestJs = bundle[manifestName];
        let manifest2 = decodeManifest.call(this, manifestJs.code);
        if (manifest2.background?.service_worker && !this.meta.watchMode) {
          const ref = manifest2.background.service_worker;
          const name = this.getFileName(ref);
          manifest2.background.service_worker = name;
        }
        manifest2.content_scripts = manifest2.content_scripts?.map(({ js = [], ...rest }) => {
          const refJS = js.map((ref) => this.getFileName(ref));
          return { js: refJS, ...rest };
        });
        for (const plugin of plugins) {
          try {
            const m = structuredClone(manifest2);
            const result = await plugin.renderCrxManifest?.call(this, m, bundle);
            manifest2 = result ?? manifest2;
          } catch (error) {
            const name = `[${plugin.name}]`;
            let message = error;
            if (error instanceof Error) {
              message = colors__default["default"].red(`${name} ${error.stack ? error.stack : error.message}`);
            } else if (typeof error === "string") {
              message = colors__default["default"].red(`${name} ${error}`);
            }
            console.log(message);
            throw new Error(`Error in ${plugin.name}.renderCrxManifest`);
          }
        }
        const assetTypes = [
          "icons",
          "locales",
          "rulesets",
          "webAccessibleResources"
        ];
        const files = await manifestFiles(manifest2);
        await Promise.all(assetTypes.map((k) => files[k]).flat().map(async (f) => {
          if (typeof bundle[f] === "undefined") {
            let filename = join(config.root, f);
            if (!fs.existsSync(filename))
              filename = join(config.publicDir, f);
            if (!fs.existsSync(filename))
              throw new Error(`ENOENT: Could not load manifest asset "${f}".
Manifest assets must exist in one of these directories:
Project root: "${config.root}"
Public dir: "${config.publicDir}"`);
            this.emitFile({
              type: "asset",
              fileName: f,
              source: await readFile(filename)
            });
          }
        }));
        const manifestJson = bundle["manifest.json"];
        if (typeof manifestJson === "undefined") {
          this.emitFile({
            type: "asset",
            fileName: "manifest.json",
            source: JSON.stringify(manifest2, null, 2)
          });
        } else {
          manifestJson.source = JSON.stringify(manifest2, null, 2);
        }
        delete bundle[manifestName];
      }
    }
  ];
};

var contentHmrPort = "function isCrxHMRPayload(x) {\n  return x.type === \"custom\" && x.event.startsWith(\"crx:\");\n}\nclass HMRPort {\n  port;\n  callbacks = /* @__PURE__ */ new Map();\n  constructor() {\n    setInterval(() => {\n      try {\n        this.port?.postMessage({ data: \"ping\" });\n      } catch (error) {\n        if (error instanceof Error && error.message.includes(\"Extension context invalidated.\")) {\n          location.reload();\n        } else\n          throw error;\n      }\n    }, __CRX_HMR_TIMEOUT__);\n    setInterval(this.initPort, 5 * 60 * 1e3);\n    this.initPort();\n  }\n  initPort = () => {\n    this.port?.disconnect();\n    this.port = chrome.runtime.connect({ name: \"@crx/client\" });\n    this.port.onDisconnect.addListener(this.handleDisconnect.bind(this));\n    this.port.onMessage.addListener(this.handleMessage.bind(this));\n    this.port.postMessage({ type: \"connected\" });\n  };\n  handleDisconnect = () => {\n    if (this.callbacks.has(\"close\"))\n      for (const cb of this.callbacks.get(\"close\")) {\n        cb({ wasClean: true });\n      }\n  };\n  handleMessage = (message) => {\n    const forward = (data) => {\n      if (this.callbacks.has(\"message\"))\n        for (const cb of this.callbacks.get(\"message\")) {\n          cb({ data });\n        }\n    };\n    const payload = JSON.parse(message.data);\n    if (isCrxHMRPayload(payload)) {\n      if (payload.event === \"crx:runtime-reload\") {\n        console.log(\"[crx] runtime reload\");\n        setTimeout(() => location.reload(), 500);\n      } else {\n        forward(JSON.stringify(payload.data));\n      }\n    } else {\n      forward(message.data);\n    }\n  };\n  addEventListener = (event, callback) => {\n    const cbs = this.callbacks.get(event) ?? /* @__PURE__ */ new Set();\n    cbs.add(callback);\n    this.callbacks.set(event, cbs);\n  };\n  send = (data) => {\n    if (this.port)\n      this.port.postMessage({ data });\n    else\n      throw new Error(\"HMRPort is not initialized\");\n  };\n}\n\nexport { HMRPort };\n";

var contentDevLoader = "(function () {\n  'use strict';\n\n  (async () => {\n    if (__PREAMBLE__)\n      await import(\n        /* @vite-ignore */\n        chrome.runtime.getURL(__PREAMBLE__)\n      );\n    await import(\n      /* @vite-ignore */\n      chrome.runtime.getURL(__CLIENT__)\n    );\n    await import(\n      /* @vite-ignore */\n      chrome.runtime.getURL(__SCRIPT__)\n    );\n  })().catch(console.error);\n\n})();\n";

var contentProLoader = "(function () {\n  'use strict';\n\n  (async () => {\n    await import(\n      /* @vite-ignore */\n      chrome.runtime.getURL(__SCRIPT__)\n    );\n  })().catch(console.error);\n\n})();\n";

function getScriptId({
  format,
  id
}) {
  return crypto.createHash("sha1").update(format).update(id).digest("base64").replace(/[^A-Za-z0-9]/g, "").slice(0, 8);
}
const debug = _debug("content-scripts");
const dynamicResourcesName = "<dynamic_resource>";
const pluginResources = ({ contentScripts = {} }) => {
  const { hmrTimeout = 5e3, injectCss = true } = contentScripts;
  const dynamicScriptsById = /* @__PURE__ */ new Map();
  const dynamicScriptsByLoaderRefId = /* @__PURE__ */ new Map();
  const dynamicScriptsByRefId = /* @__PURE__ */ new Map();
  const dynamicScriptsByScriptId = /* @__PURE__ */ new Map();
  function emitDynamicScript(data) {
    if (data.format === "iife") {
      throw new Error(`Dynamic script format IIFE is unimplemented (imported in file: ${data.importer})`.trim());
    } else {
      data.refId = this.emitFile({ type: "chunk", id: data.id });
      dynamicScriptsByRefId.set(data.refId, data);
    }
    if (data.format === "loader") {
      data.loaderRefId = this.emitFile({
        type: "asset",
        name: `content-script-loader.${parse(data.id).name}.js`,
        source: JSON.stringify(data)
      });
      dynamicScriptsByLoaderRefId.set(data.loaderRefId, data);
    }
  }
  async function resolveDynamicScript(_source, importer) {
    if (importer && _source.includes("?script")) {
      const url = new URL(_source, "stub://stub");
      if (url.searchParams.has("scriptId")) {
        const scriptId = url.searchParams.get("scriptId");
        const { finalId } = dynamicScriptsByScriptId.get(scriptId);
        return finalId;
      } else if (url.searchParams.has("script")) {
        const [source] = _source.split("?");
        const resolved = await this.resolve(source, importer, {
          skipSelf: true
        });
        if (!resolved)
          throw new Error(`Could not resolve dynamic script: "${_source}" from "${importer}"`);
        const { id } = resolved;
        let format = "loader";
        if (url.searchParams.has("module")) {
          format = "module";
        } else if (url.searchParams.has("iife")) {
          format = "iife";
        }
        const scriptId = getScriptId({ format, id });
        const finalId = `${id}?scriptId=${scriptId}`;
        const data = dynamicScriptsByScriptId.get(scriptId) ?? {
          format,
          id,
          importer,
          scriptId,
          finalId
        };
        dynamicScriptsByScriptId.set(scriptId, data);
        dynamicScriptsById.set(finalId, data);
        return finalId;
      }
    }
  }
  function loadDynamicScript(id) {
    const data = dynamicScriptsById.get(id);
    if (data)
      return `export default import.meta.CRX_DYNAMIC_SCRIPT_${data.scriptId};`;
  }
  let port;
  let server;
  let { preambleCode } = contentScripts;
  let preambleRefId;
  let contentClientRefId;
  return [
    {
      name: "crx:content-scripts-pre",
      apply: "build",
      enforce: "pre",
      async fileWriterStart(_server) {
        server = _server;
        port = server.config.server.port.toString();
        if (process.env.NODE_ENV !== "test" && typeof preambleCode === "undefined" && server.config.plugins.some(({ name }) => name.toLowerCase().includes("react"))) {
          try {
            const react = await Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespace(require('@vitejs/plugin-react')); });
            preambleCode = react.default.preambleCode;
          } catch (error) {
            preambleCode = false;
          }
        }
      },
      buildStart() {
        if (this.meta.watchMode) {
          if (preambleCode) {
            preambleRefId = this.emitFile({
              type: "chunk",
              id: preambleId,
              name: "content-script-preamble.js"
            });
          }
          contentClientRefId = this.emitFile({
            type: "chunk",
            id: "/@vite/client",
            name: "content-script-client.js"
          });
        }
      },
      resolveId(source) {
        if (source === preambleId)
          return preambleId;
        if (source === contentHmrPortId)
          return contentHmrPortId;
      },
      load(id) {
        if (server && id === preambleId && typeof preambleCode === "string") {
          const defined = preambleCode.replace(/__BASE__/g, server.config.base);
          return defined;
        }
        if (id === contentHmrPortId) {
          const defined = contentHmrPort.replace("__CRX_HMR_TIMEOUT__", JSON.stringify(hmrTimeout));
          return defined;
        }
      }
    },
    {
      name: "crx:dynamic-scripts-load",
      apply: "serve",
      enforce: "pre",
      resolveId: resolveDynamicScript,
      load: loadDynamicScript
    },
    {
      name: "crx:dynamic-scripts-load",
      apply: "build",
      enforce: "pre",
      resolveId(id, importer) {
        if (!this.meta.watchMode)
          return resolveDynamicScript.call(this, id, importer);
      },
      load(id) {
        if (!this.meta.watchMode)
          return loadDynamicScript.call(this, id);
      }
    },
    {
      name: "crx:dynamic-scripts-build",
      apply: "build",
      buildStart() {
        dynamicScriptsByLoaderRefId.clear();
        dynamicScriptsByRefId.clear();
        for (const [, data] of dynamicScriptsByScriptId) {
          emitDynamicScript.call(this, data);
        }
      },
      async transform(code) {
        if (code.includes("import.meta.CRX_DYNAMIC_SCRIPT_")) {
          const match = code.match(/import.meta.CRX_DYNAMIC_SCRIPT_(.+?);/);
          const index = match.index;
          const [statement, scriptId] = match;
          const data = dynamicScriptsByScriptId.get(scriptId);
          if (!data.refId)
            emitDynamicScript.call(this, data);
          const magic = new MagicString__default["default"](code);
          magic.overwrite(index, index + statement.length, `import.meta.ROLLUP_FILE_URL_${data.loaderRefId ?? data.refId};`);
          return { code: magic.toString(), map: magic.generateMap() };
        }
      },
      resolveFileUrl({ referenceId, fileName, moduleId }) {
        if (moduleId && referenceId) {
          if (dynamicScriptsByRefId.has(referenceId) || dynamicScriptsByLoaderRefId.has(referenceId)) {
            return `"/${fileName}"`;
          }
        }
      },
      generateBundle(options, bundle) {
        const preambleName = this.meta.watchMode && preambleRefId ? this.getFileName(preambleRefId) : "";
        const contentClientName = this.meta.watchMode && contentClientRefId ? this.getFileName(contentClientRefId) : "";
        for (const data of dynamicScriptsByScriptId.values()) {
          if (data.refId && data.loaderRefId) {
            const scriptName = this.getFileName(data.refId);
            const loaderName = this.getFileName(data.loaderRefId);
            const source = this.meta.watchMode ? contentDevLoader.replace(/__PREAMBLE__/g, JSON.stringify(preambleName)).replace(/__CLIENT__/g, JSON.stringify(contentClientName)).replace(/__SCRIPT__/g, JSON.stringify(scriptName)) : contentProLoader.replace(/__SCRIPT__/g, JSON.stringify(scriptName));
            const asset = bundle[loaderName];
            if (asset?.type === "asset")
              asset.source = source;
          }
        }
      },
      writeBundle() {
        for (const [, data] of dynamicScriptsByScriptId) {
          if (data.refId) {
            data.fileName = this.getFileName(data.refId);
            delete data.refId;
          }
          if (data.loaderRefId) {
            data.loaderName = this.getFileName(data.loaderRefId);
            delete data.loaderRefId;
          }
        }
      }
    },
    {
      name: "crx:dynamic-scripts-serve",
      apply: "serve",
      configureServer(server2) {
        server2.middlewares.use(injector__default["default"]((req) => {
          return !!req.url?.includes("?scriptId");
        }, async (content, req, res, callback) => {
          const code = isString(content) ? content : content.toString();
          if (code.includes("import.meta.CRX_DYNAMIC_SCRIPT_")) {
            const matches = Array.from(code.matchAll(/import.meta.CRX_DYNAMIC_SCRIPT_(.+?);/g)).map((m) => ({
              statement: m[0],
              index: m.index,
              data: dynamicScriptsByScriptId.get(m[1])
            }));
            if (matches.some(({ data }) => data.refId))
              await filesReady();
            if (matches.some(({ data }) => !(data.loaderName ?? data.fileName))) {
              await rebuildFiles();
              server2.ws.send(crxRuntimeReload);
            }
            const magic = new MagicString__default["default"](code);
            for (const { index, statement, data } of matches)
              if (typeof index === "number") {
                magic.overwrite(index, index + statement.length, `"/${data.loaderName ?? data.fileName}"`);
              }
            callback(null, magic.toString());
          } else {
            callback(null, code);
          }
        }));
      }
    },
    {
      name: "crx:content-script-resources",
      apply: "build",
      enforce: "post",
      config({ build, ...config }, { command }) {
        return { ...config, build: { ...build, manifest: command === "build" } };
      },
      renderCrxManifest(manifest, bundle) {
        manifest.web_accessible_resources = manifest.web_accessible_resources ?? [];
        if (manifest.content_scripts?.length || dynamicScriptsByRefId.size)
          if (this.meta.watchMode) {
            manifest.web_accessible_resources = manifest.web_accessible_resources.map(({ resources, ...rest }) => ({
              resources: resources.filter((r) => r !== dynamicResourcesName),
              ...rest
            })).filter(({ resources }) => resources.length);
            manifest.web_accessible_resources.push({
              use_dynamic_url: true,
              matches: ["<all_urls>"],
              resources: ["**/*", "*"]
            });
          } else {
            const vmAsset = bundle["manifest.json"];
            if (!vmAsset)
              throw new Error("vite manifest is missing");
            const viteManifest = JSON.parse(vmAsset.source);
            debug("vite manifest %O", viteManifest);
            if (Object.keys(viteManifest).length === 0)
              return;
            const filesByName = /* @__PURE__ */ new Map();
            for (const file of Object.values(viteManifest))
              filesByName.set(file.file, file);
            const chunksById = /* @__PURE__ */ new Map();
            for (const [name, chunk] of Object.entries(bundle))
              if (chunk.type === "chunk" && chunk.facadeModuleId)
                chunksById.set(chunk.facadeModuleId, name);
            const getChunkResources = (chunk) => {
              const chunks = /* @__PURE__ */ new Set();
              const assets = /* @__PURE__ */ new Set();
              if (chunk.type === "asset")
                return { chunks, assets };
              const { dynamicImports, imports, modules } = chunk;
              for (const i of dynamicImports)
                chunks.add(i);
              for (const i of imports)
                chunks.add(i);
              for (const id of Object.keys(modules))
                if (dynamicScriptsById.has(id)) {
                  const data = dynamicScriptsById.get(id);
                  const fileName = this.getFileName(data.refId);
                  const chunk2 = bundle[fileName];
                  if (chunk2.type === "chunk")
                    chunks.add(fileName);
                  else
                    assets.add(fileName);
                }
              return { chunks, assets };
            };
            const getResources = (name, sets = {
              assets: /* @__PURE__ */ new Set(),
              css: /* @__PURE__ */ new Set(),
              imports: /* @__PURE__ */ new Set()
            }) => {
              const {
                assets = [],
                css = [],
                dynamicImports = [],
                imports = [],
                file
              } = filesByName.get(name) ?? viteManifest[name] ?? {};
              const chunk = bundle[file];
              if (chunk?.type === "chunk") {
                const r = getChunkResources(chunk);
                assets.push(...r.assets);
                for (const chunk2 of r.chunks) {
                  sets.imports.add(chunk2);
                  getResources(chunk2, sets);
                }
              }
              for (const a of assets)
                sets.assets.add(a);
              for (const c of css)
                sets.css.add(c);
              for (const key of [...dynamicImports, ...imports]) {
                const i = viteManifest[key].file;
                sets.imports.add(i);
                getResources(key, sets);
              }
              return sets;
            };
            for (const script of manifest.content_scripts ?? [])
              if (script.js?.length) {
                for (const name of script.js)
                  if (script.matches?.length) {
                    const { assets, css, imports } = getResources(name);
                    imports.add(name);
                    const resource = {
                      matches: script.matches,
                      resources: [...assets, ...imports],
                      use_dynamic_url: true
                    };
                    if (css.size)
                      if (injectCss) {
                        script.css = script.css ?? [];
                        script.css.push(...css);
                      } else {
                        resource.resources.push(...css);
                      }
                    if (resource.resources.length) {
                      resource.matches = resource.matches.map(stubMatchPattern);
                      manifest.web_accessible_resources.push(resource);
                    }
                  }
              }
            const dynamicResourceSet = /* @__PURE__ */ new Set();
            for (const [refId, { format }] of dynamicScriptsByRefId)
              if (format === "loader") {
                const name = this.getFileName(refId);
                const { assets, css, imports } = getResources(name);
                dynamicResourceSet.add(name);
                for (const a of assets)
                  dynamicResourceSet.add(a);
                for (const c of css)
                  dynamicResourceSet.add(c);
                for (const i of imports)
                  dynamicResourceSet.add(i);
              }
            if (dynamicResourceSet.size) {
              let resource = manifest.web_accessible_resources.find(({ resources: [r] }) => r === dynamicResourcesName);
              if (!resource) {
                resource = {
                  resources: [dynamicResourcesName],
                  matches: ["http://*/*", "https://*/*"]
                };
                manifest.web_accessible_resources.push(resource);
              }
              resource.resources = [...dynamicResourceSet];
            }
          }
        if (manifest.web_accessible_resources?.length) {
          const war = manifest.web_accessible_resources;
          manifest.web_accessible_resources = [];
          const map = /* @__PURE__ */ new Map();
          for (const r of war)
            if (isResourceByMatch(r)) {
              const { matches, resources, use_dynamic_url = false } = r;
              const key = [use_dynamic_url, matches.sort()].map((x) => JSON.stringify(x)).join("::");
              const set = map.get(key) ?? /* @__PURE__ */ new Set();
              resources.forEach((r2) => set.add(r2));
              map.set(key, set);
            } else {
              manifest.web_accessible_resources.push(r);
            }
          for (const [key, set] of map) {
            const [use_dynamic_url, matches] = key.split("::").map((x) => JSON.parse(x));
            manifest.web_accessible_resources.push({
              matches,
              resources: [...set],
              use_dynamic_url
            });
          }
        } else {
          delete manifest.web_accessible_resources;
        }
        return manifest;
      }
    },
    {
      name: "crx:content-scripts-post",
      apply: "build",
      enforce: "post",
      renderCrxManifest(manifest, bundle) {
        if (this.meta.watchMode && typeof port === "undefined")
          throw new Error("server port is undefined");
        const preambleName = this.meta.watchMode && preambleRefId ? this.getFileName(preambleRefId) : "";
        const contentClientName = this.meta.watchMode && contentClientRefId ? this.getFileName(contentClientRefId) : "";
        if (!manifest.content_scripts?.length && !dynamicScriptsByRefId.size) {
          delete bundle[contentClientName];
          return manifest;
        }
        manifest.content_scripts = manifest.content_scripts?.map(({ js, ...rest }) => ({
          js: js?.map((f) => {
            const name = `content-script-loader.${parse(f).name}.js`;
            const source = this.meta.watchMode ? contentDevLoader.replace(/__PREAMBLE__/g, JSON.stringify(preambleName)).replace(/__CLIENT__/g, JSON.stringify(contentClientName)).replace(/__SCRIPT__/g, JSON.stringify(f)).replace(/__TIMESTAMP__/g, JSON.stringify(Date.now())) : contentProLoader.replace(/__SCRIPT__/g, JSON.stringify(f));
            const refId = this.emitFile({
              type: "asset",
              name,
              source
            });
            return this.getFileName(refId);
          }),
          ...rest
        }));
        return manifest;
      }
    }
  ];
};

var workerHmrClient = "const ownOrigin = new URL(chrome.runtime.getURL(\"/\")).origin;\nself.addEventListener(\"fetch\", (fetchEvent) => {\n  const url = new URL(fetchEvent.request.url);\n  if (url.origin === ownOrigin) {\n    fetchEvent.respondWith(sendToServer(url));\n  }\n});\nasync function sendToServer(url) {\n  url.protocol = \"http:\";\n  url.host = \"localhost\";\n  url.port = __SERVER_PORT__;\n  url.searchParams.set(\"t\", Date.now().toString());\n  const response = await fetch(url.href.replace(/=$|=(?=&)/g, \"\"));\n  return new Response(response.body, {\n    headers: {\n      \"Content-Type\": response.headers.get(\"Content-Type\") ?? \"text/javascript\"\n    }\n  });\n}\nconst ports = /* @__PURE__ */ new Set();\nchrome.runtime.onConnect.addListener((port) => {\n  if (port.name === \"@crx/client\") {\n    ports.add(port);\n    port.onDisconnect.addListener((port2) => ports.delete(port2));\n    port.onMessage.addListener((message) => {\n    });\n    port.postMessage({ data: JSON.stringify({ type: \"connected\" }) });\n  }\n});\nfunction notifyContentScripts(payload) {\n  const data = JSON.stringify(payload);\n  for (const port of ports)\n    port.postMessage({ data });\n}\nconsole.log(\"[vite] connecting...\");\nconst socketProtocol = __HMR_PROTOCOL__ || (location.protocol === \"https:\" ? \"wss\" : \"ws\");\nconst socketHost = `${__HMR_HOSTNAME__ || location.hostname}:${__HMR_PORT__}`;\nconst socket = new WebSocket(`${socketProtocol}://${socketHost}`, \"vite-hmr\");\nconst base = __BASE__ || \"/\";\nsocket.addEventListener(\"message\", async ({ data }) => {\n  handleSocketMessage(JSON.parse(data));\n});\nfunction isCrxHmrPayload(x) {\n  return x.type === \"custom\" && x.event.startsWith(\"crx:\");\n}\nfunction handleSocketMessage(payload) {\n  if (isCrxHmrPayload(payload)) {\n    handleCrxHmrPayload(payload);\n  } else if (payload.type === \"connected\") {\n    console.log(`[vite] connected.`);\n    const interval = setInterval(() => socket.send(\"ping\"), __HMR_TIMEOUT__);\n    socket.addEventListener(\"close\", () => clearInterval(interval));\n  }\n}\nfunction handleCrxHmrPayload(payload) {\n  notifyContentScripts(payload);\n  switch (payload.event) {\n    case \"crx:runtime-reload\":\n      console.log(\"[crx] runtime reload\");\n      chrome.runtime.reload();\n      break;\n  }\n}\nasync function waitForSuccessfulPing(ms = 1e3) {\n  while (true) {\n    try {\n      await fetch(`${base}__vite_ping`);\n      break;\n    } catch (e) {\n      await new Promise((resolve) => setTimeout(resolve, ms));\n    }\n  }\n}\nsocket.addEventListener(\"close\", async ({ wasClean }) => {\n  if (wasClean)\n    return;\n  console.log(`[vite] server connection lost. polling for restart...`);\n  await waitForSuccessfulPing();\n  chrome.runtime.reload();\n});\n";

function defineClientValues(code, config) {
  let options = config.server.hmr;
  options = options && typeof options !== "boolean" ? options : {};
  const host = options.host || null;
  const protocol = options.protocol || null;
  const timeout = options.timeout || 3e4;
  const overlay = options.overlay !== false;
  let hmrPort;
  if (isObject(config.server.hmr)) {
    hmrPort = config.server.hmr.clientPort || config.server.hmr.port;
  }
  if (config.server.middlewareMode) {
    hmrPort = String(hmrPort || 24678);
  } else {
    hmrPort = String(hmrPort || options.port || config.server.port);
  }
  let hmrBase = config.base;
  if (options.path) {
    hmrBase = join(hmrBase, options.path);
  }
  if (hmrBase !== "/") {
    hmrPort = normalize(`${hmrPort}${hmrBase}`);
  }
  return code.replace(`__MODE__`, JSON.stringify(config.mode)).replace(`__BASE__`, JSON.stringify(config.base)).replace(`__DEFINES__`, serializeDefine(config.define || {})).replace(`__HMR_PROTOCOL__`, JSON.stringify(protocol)).replace(`__HMR_HOSTNAME__`, JSON.stringify(host)).replace(`__HMR_PORT__`, JSON.stringify(hmrPort)).replace(`__HMR_TIMEOUT__`, JSON.stringify(timeout)).replace(`__HMR_ENABLE_OVERLAY__`, JSON.stringify(overlay)).replace(`__SERVER_PORT__`, JSON.stringify(config.server.port?.toString()));
  function serializeDefine(define) {
    let res = `{`;
    for (const key in define) {
      const val = define[key];
      res += `${JSON.stringify(key)}: ${typeof val === "string" ? `(${val})` : JSON.stringify(val)}, `;
    }
    return res + `}`;
  }
}

const pluginBackground = () => {
  let port;
  let server;
  return [
    {
      name: "crx:background-client",
      apply: "serve",
      configureServer(_server) {
        server = _server;
      },
      resolveId(source) {
        if (source === `/${workerClientId}`)
          return workerClientId;
      },
      load(id) {
        if (id === workerClientId) {
          const base = `http://localhost:${server.config.server.port}/`;
          return defineClientValues(workerHmrClient.replace("__BASE__", JSON.stringify(base)), server.config);
        }
      }
    },
    {
      name: "crx:background-loader-file",
      apply: "build",
      enforce: "post",
      fileWriterStart(server2) {
        port = server2.config.server.port.toString();
      },
      renderCrxManifest(manifest) {
        const worker = manifest.background?.service_worker;
        let loader;
        if (this.meta.watchMode) {
          if (typeof port === "undefined")
            throw new Error("server port is undefined in watch mode");
          loader = `import 'http:/localhost:${port}/@vite/env';
`;
          loader += `import 'http://localhost:${port}${workerClientId}';
`;
          if (worker)
            loader += `import 'http://localhost:${port}/${worker}';
`;
        } else if (worker) {
          loader = `import './${worker}';
`;
        } else {
          return null;
        }
        const refId = this.emitFile({
          type: "asset",
          fileName: "service-worker-loader.js",
          source: loader
        });
        manifest.background = {
          service_worker: this.getFileName(refId),
          type: "module"
        };
        return manifest;
      }
    }
  ];
};

const defineManifest = (manifest) => manifest;
const defineDynamicResource = ({
  matches = ["http://*/*", "https://*/*"],
  use_dynamic_url = true
}) => ({
  matches,
  resources: [dynamicResourcesName],
  use_dynamic_url
});

function init(options, plugins) {
  return plugins.map((p) => p?.(options)).flat().filter((p) => !!p && typeof p.name === "string");
}
const crx = ({
  manifest,
  ...options
}) => {
  const plugins = init(options, [
    pluginHMR,
    pluginHtmlAuditor,
    pluginResources,
    pluginBackground,
    pluginManifest(manifest)
  ]);
  plugins.unshift(...init(options, [pluginFileWriter(plugins)]));
  return plugins;
};
const chromeExtension = crx;

exports.chromeExtension = chromeExtension;
exports.crx = crx;
exports.defineDynamicResource = defineDynamicResource;
exports.defineManifest = defineManifest;
exports.filesReady = filesReady;
exports.rebuildFiles = rebuildFiles;
