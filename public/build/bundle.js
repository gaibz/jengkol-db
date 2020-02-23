
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
'use strict';

function noop() { }
function assign(tar, src) {
    // @ts-ignore
    for (const k in src)
        tar[k] = src[k];
    return tar;
}
function add_location(element, file, line, column, char) {
    element.__svelte_meta = {
        loc: { file, line, column, char }
    };
}
function run(fn) {
    return fn();
}
function blank_object() {
    return Object.create(null);
}
function run_all(fns) {
    fns.forEach(run);
}
function is_function(thing) {
    return typeof thing === 'function';
}
function safe_not_equal(a, b) {
    return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
}
function create_slot(definition, ctx, $$scope, fn) {
    if (definition) {
        const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
        return definition[0](slot_ctx);
    }
}
function get_slot_context(definition, ctx, $$scope, fn) {
    return definition[1] && fn
        ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
        : $$scope.ctx;
}
function get_slot_changes(definition, $$scope, dirty, fn) {
    if (definition[2] && fn) {
        const lets = definition[2](fn(dirty));
        if (typeof $$scope.dirty === 'object') {
            const merged = [];
            const len = Math.max($$scope.dirty.length, lets.length);
            for (let i = 0; i < len; i += 1) {
                merged[i] = $$scope.dirty[i] | lets[i];
            }
            return merged;
        }
        return $$scope.dirty | lets;
    }
    return $$scope.dirty;
}
function exclude_internal_props(props) {
    const result = {};
    for (const k in props)
        if (k[0] !== '$')
            result[k] = props[k];
    return result;
}

function append(target, node) {
    target.appendChild(node);
}
function insert(target, node, anchor) {
    target.insertBefore(node, anchor || null);
}
function detach(node) {
    node.parentNode.removeChild(node);
}
function element(name) {
    return document.createElement(name);
}
function text(data) {
    return document.createTextNode(data);
}
function space() {
    return text(' ');
}
function empty() {
    return text('');
}
function listen(node, event, handler, options) {
    node.addEventListener(event, handler, options);
    return () => node.removeEventListener(event, handler, options);
}
function attr(node, attribute, value) {
    if (value == null)
        node.removeAttribute(attribute);
    else if (node.getAttribute(attribute) !== value)
        node.setAttribute(attribute, value);
}
function set_attributes(node, attributes) {
    // @ts-ignore
    const descriptors = Object.getOwnPropertyDescriptors(node.__proto__);
    for (const key in attributes) {
        if (attributes[key] == null) {
            node.removeAttribute(key);
        }
        else if (key === 'style') {
            node.style.cssText = attributes[key];
        }
        else if (descriptors[key] && descriptors[key].set) {
            node[key] = attributes[key];
        }
        else {
            attr(node, key, attributes[key]);
        }
    }
}
function children(element) {
    return Array.from(element.childNodes);
}
function custom_event(type, detail) {
    const e = document.createEvent('CustomEvent');
    e.initCustomEvent(type, false, false, detail);
    return e;
}

let current_component;
function set_current_component(component) {
    current_component = component;
}
function get_current_component() {
    if (!current_component)
        throw new Error(`Function called outside component initialization`);
    return current_component;
}
function onMount(fn) {
    get_current_component().$$.on_mount.push(fn);
}
function afterUpdate(fn) {
    get_current_component().$$.after_update.push(fn);
}
function onDestroy(fn) {
    get_current_component().$$.on_destroy.push(fn);
}
function createEventDispatcher() {
    const component = get_current_component();
    return (type, detail) => {
        const callbacks = component.$$.callbacks[type];
        if (callbacks) {
            // TODO are there situations where events could be dispatched
            // in a server (non-DOM) environment?
            const event = custom_event(type, detail);
            callbacks.slice().forEach(fn => {
                fn.call(component, event);
            });
        }
    };
}

const dirty_components = [];
const binding_callbacks = [];
const render_callbacks = [];
const flush_callbacks = [];
const resolved_promise = Promise.resolve();
let update_scheduled = false;
function schedule_update() {
    if (!update_scheduled) {
        update_scheduled = true;
        resolved_promise.then(flush);
    }
}
function tick() {
    schedule_update();
    return resolved_promise;
}
function add_render_callback(fn) {
    render_callbacks.push(fn);
}
let flushing = false;
const seen_callbacks = new Set();
function flush() {
    if (flushing)
        return;
    flushing = true;
    do {
        // first, call beforeUpdate functions
        // and update components
        for (let i = 0; i < dirty_components.length; i += 1) {
            const component = dirty_components[i];
            set_current_component(component);
            update(component.$$);
        }
        dirty_components.length = 0;
        while (binding_callbacks.length)
            binding_callbacks.pop()();
        // then, once components are updated, call
        // afterUpdate functions. This may cause
        // subsequent updates...
        for (let i = 0; i < render_callbacks.length; i += 1) {
            const callback = render_callbacks[i];
            if (!seen_callbacks.has(callback)) {
                // ...so guard against infinite loops
                seen_callbacks.add(callback);
                callback();
            }
        }
        render_callbacks.length = 0;
    } while (dirty_components.length);
    while (flush_callbacks.length) {
        flush_callbacks.pop()();
    }
    update_scheduled = false;
    flushing = false;
    seen_callbacks.clear();
}
function update($$) {
    if ($$.fragment !== null) {
        $$.update();
        run_all($$.before_update);
        const dirty = $$.dirty;
        $$.dirty = [-1];
        $$.fragment && $$.fragment.p($$.ctx, dirty);
        $$.after_update.forEach(add_render_callback);
    }
}
const outroing = new Set();
let outros;
function group_outros() {
    outros = {
        r: 0,
        c: [],
        p: outros // parent group
    };
}
function check_outros() {
    if (!outros.r) {
        run_all(outros.c);
    }
    outros = outros.p;
}
function transition_in(block, local) {
    if (block && block.i) {
        outroing.delete(block);
        block.i(local);
    }
}
function transition_out(block, local, detach, callback) {
    if (block && block.o) {
        if (outroing.has(block))
            return;
        outroing.add(block);
        outros.c.push(() => {
            outroing.delete(block);
            if (callback) {
                if (detach)
                    block.d(1);
                callback();
            }
        });
        block.o(local);
    }
}
function outro_and_destroy_block(block, lookup) {
    transition_out(block, 1, 1, () => {
        lookup.delete(block.key);
    });
}
function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
    let o = old_blocks.length;
    let n = list.length;
    let i = o;
    const old_indexes = {};
    while (i--)
        old_indexes[old_blocks[i].key] = i;
    const new_blocks = [];
    const new_lookup = new Map();
    const deltas = new Map();
    i = n;
    while (i--) {
        const child_ctx = get_context(ctx, list, i);
        const key = get_key(child_ctx);
        let block = lookup.get(key);
        if (!block) {
            block = create_each_block(key, child_ctx);
            block.c();
        }
        else if (dynamic) {
            block.p(child_ctx, dirty);
        }
        new_lookup.set(key, new_blocks[i] = block);
        if (key in old_indexes)
            deltas.set(key, Math.abs(i - old_indexes[key]));
    }
    const will_move = new Set();
    const did_move = new Set();
    function insert(block) {
        transition_in(block, 1);
        block.m(node, next);
        lookup.set(block.key, block);
        next = block.first;
        n--;
    }
    while (o && n) {
        const new_block = new_blocks[n - 1];
        const old_block = old_blocks[o - 1];
        const new_key = new_block.key;
        const old_key = old_block.key;
        if (new_block === old_block) {
            // do nothing
            next = new_block.first;
            o--;
            n--;
        }
        else if (!new_lookup.has(old_key)) {
            // remove old block
            destroy(old_block, lookup);
            o--;
        }
        else if (!lookup.has(new_key) || will_move.has(new_key)) {
            insert(new_block);
        }
        else if (did_move.has(old_key)) {
            o--;
        }
        else if (deltas.get(new_key) > deltas.get(old_key)) {
            did_move.add(new_key);
            insert(new_block);
        }
        else {
            will_move.add(old_key);
            o--;
        }
    }
    while (o--) {
        const old_block = old_blocks[o];
        if (!new_lookup.has(old_block.key))
            destroy(old_block, lookup);
    }
    while (n)
        insert(new_blocks[n - 1]);
    return new_blocks;
}
function validate_each_keys(ctx, list, get_context, get_key) {
    const keys = new Set();
    for (let i = 0; i < list.length; i++) {
        const key = get_key(get_context(ctx, list, i));
        if (keys.has(key)) {
            throw new Error(`Cannot have duplicate keys in a keyed each`);
        }
        keys.add(key);
    }
}

function get_spread_update(levels, updates) {
    const update = {};
    const to_null_out = {};
    const accounted_for = { $$scope: 1 };
    let i = levels.length;
    while (i--) {
        const o = levels[i];
        const n = updates[i];
        if (n) {
            for (const key in o) {
                if (!(key in n))
                    to_null_out[key] = 1;
            }
            for (const key in n) {
                if (!accounted_for[key]) {
                    update[key] = n[key];
                    accounted_for[key] = 1;
                }
            }
            levels[i] = n;
        }
        else {
            for (const key in o) {
                accounted_for[key] = 1;
            }
        }
    }
    for (const key in to_null_out) {
        if (!(key in update))
            update[key] = undefined;
    }
    return update;
}
function get_spread_object(spread_props) {
    return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
}
function create_component(block) {
    block && block.c();
}
function mount_component(component, target, anchor) {
    const { fragment, on_mount, on_destroy, after_update } = component.$$;
    fragment && fragment.m(target, anchor);
    // onMount happens before the initial afterUpdate
    add_render_callback(() => {
        const new_on_destroy = on_mount.map(run).filter(is_function);
        if (on_destroy) {
            on_destroy.push(...new_on_destroy);
        }
        else {
            // Edge case - component was destroyed immediately,
            // most likely as a result of a binding initialising
            run_all(new_on_destroy);
        }
        component.$$.on_mount = [];
    });
    after_update.forEach(add_render_callback);
}
function destroy_component(component, detaching) {
    const $$ = component.$$;
    if ($$.fragment !== null) {
        run_all($$.on_destroy);
        $$.fragment && $$.fragment.d(detaching);
        // TODO null out other refs, including component.$$ (but need to
        // preserve final state?)
        $$.on_destroy = $$.fragment = null;
        $$.ctx = [];
    }
}
function make_dirty(component, i) {
    if (component.$$.dirty[0] === -1) {
        dirty_components.push(component);
        schedule_update();
        component.$$.dirty.fill(0);
    }
    component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
}
function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
    const parent_component = current_component;
    set_current_component(component);
    const prop_values = options.props || {};
    const $$ = component.$$ = {
        fragment: null,
        ctx: null,
        // state
        props,
        update: noop,
        not_equal,
        bound: blank_object(),
        // lifecycle
        on_mount: [],
        on_destroy: [],
        before_update: [],
        after_update: [],
        context: new Map(parent_component ? parent_component.$$.context : []),
        // everything else
        callbacks: blank_object(),
        dirty
    };
    let ready = false;
    $$.ctx = instance
        ? instance(component, prop_values, (i, ret, ...rest) => {
            const value = rest.length ? rest[0] : ret;
            if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                if ($$.bound[i])
                    $$.bound[i](value);
                if (ready)
                    make_dirty(component, i);
            }
            return ret;
        })
        : [];
    $$.update();
    ready = true;
    run_all($$.before_update);
    // `false` as a special case of no DOM component
    $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
    if (options.target) {
        if (options.hydrate) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment && $$.fragment.l(children(options.target));
        }
        else {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment && $$.fragment.c();
        }
        if (options.intro)
            transition_in(component.$$.fragment);
        mount_component(component, options.target, options.anchor);
        flush();
    }
    set_current_component(parent_component);
}
class SvelteComponent {
    $destroy() {
        destroy_component(this, 1);
        this.$destroy = noop;
    }
    $on(type, callback) {
        const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
        callbacks.push(callback);
        return () => {
            const index = callbacks.indexOf(callback);
            if (index !== -1)
                callbacks.splice(index, 1);
        };
    }
    $set() {
        // overridden by instance, if it has props
    }
}

function dispatch_dev(type, detail) {
    document.dispatchEvent(custom_event(type, Object.assign({ version: '3.18.2' }, detail)));
}
function append_dev(target, node) {
    dispatch_dev("SvelteDOMInsert", { target, node });
    append(target, node);
}
function insert_dev(target, node, anchor) {
    dispatch_dev("SvelteDOMInsert", { target, node, anchor });
    insert(target, node, anchor);
}
function detach_dev(node) {
    dispatch_dev("SvelteDOMRemove", { node });
    detach(node);
}
function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
    const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
    if (has_prevent_default)
        modifiers.push('preventDefault');
    if (has_stop_propagation)
        modifiers.push('stopPropagation');
    dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
    const dispose = listen(node, event, handler, options);
    return () => {
        dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
        dispose();
    };
}
function attr_dev(node, attribute, value) {
    attr(node, attribute, value);
    if (value == null)
        dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
    else
        dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
}
function set_data_dev(text, data) {
    data = '' + data;
    if (text.data === data)
        return;
    dispatch_dev("SvelteDOMSetData", { node: text, data });
    text.data = data;
}
class SvelteComponentDev extends SvelteComponent {
    constructor(options) {
        if (!options || (!options.target && !options.$$inline)) {
            throw new Error(`'target' is a required option`);
        }
        super();
    }
    $destroy() {
        super.$destroy();
        this.$destroy = () => {
            console.warn(`Component was already destroyed`); // eslint-disable-line no-console
        };
    }
}

const Utils = {
  text(text) {
    if (typeof text === 'undefined' || text === null) return '';
    return text;
  },
  noUndefinedProps(obj) {
    const o = {};
    Object.keys(obj).forEach((key) => {
      if (typeof obj[key] !== 'undefined') o[key] = obj[key];
    });
    return o;
  },
  isTrueProp(val) {
    return val === true || val === '';
  },
  isStringProp(val) {
    return typeof val === 'string' && val !== '';
  },
  isObject(o) {
    return typeof o === 'object' && o !== null && o.constructor && o.constructor === Object;
  },
  now() {
    return Date.now();
  },
  extend(...args) {
    let deep = true;
    let to;
    let from;
    if (typeof args[0] === 'boolean') {
      [deep, to] = args;
      args.splice(0, 2);
      from = args;
    } else {
      [to] = args;
      args.splice(0, 1);
      from = args;
    }
    for (let i = 0; i < from.length; i += 1) {
      const nextSource = args[i];
      if (nextSource !== undefined && nextSource !== null) {
        const keysArray = Object.keys(Object(nextSource));
        for (let nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex += 1) {
          const nextKey = keysArray[nextIndex];
          const desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
          if (desc !== undefined && desc.enumerable) {
            if (!deep) {
              to[nextKey] = nextSource[nextKey];
            } else if (Utils.isObject(to[nextKey]) && Utils.isObject(nextSource[nextKey])) {
              Utils.extend(to[nextKey], nextSource[nextKey]);
            } else if (!Utils.isObject(to[nextKey]) && Utils.isObject(nextSource[nextKey])) {
              to[nextKey] = {};
              Utils.extend(to[nextKey], nextSource[nextKey]);
            } else {
              to[nextKey] = nextSource[nextKey];
            }
          }
        }
      }
    }
    return to;
  },
  flattenArray(...args) {
    const arr = [];
    args.forEach((arg) => {
      if (Array.isArray(arg)) arr.push(...Utils.flattenArray(...arg));
      else arr.push(arg);
    });
    return arr;
  },
  classNames(...args) {
    const classes = [];
    args.forEach((arg) => {
      if (typeof arg === 'object' && arg.constructor === Object) {
        Object.keys(arg).forEach((key) => {
          if (arg[key]) classes.push(key);
        });
      } else if (arg) classes.push(arg);
    });
    const uniqueClasses = [];
    classes.forEach((c) => {
      if (uniqueClasses.indexOf(c) < 0) uniqueClasses.push(c);
    });
    return uniqueClasses.join(' ');
  },
  bindMethods(context, methods = []) {
    for (let i = 0; i < methods.length; i += 1) {
      if (context[methods[i]]) context[methods[i]] = context[methods[i]].bind(context);
    }
  },
};

const Mixins = {
  colorProps: {
    color: String,
    colorTheme: String,
    textColor: String,
    bgColor: String,
    borderColor: String,
    rippleColor: String,
    themeDark: Boolean,
  },
  colorClasses(props) {
    const {
      color,
      colorTheme,
      textColor,
      bgColor,
      borderColor,
      rippleColor,
      themeDark,
    } = props;

    return {
      'theme-dark': themeDark,
      [`color-${color}`]: color,
      [`color-theme-${colorTheme}`]: colorTheme,
      [`text-color-${textColor}`]: textColor,
      [`bg-color-${bgColor}`]: bgColor,
      [`border-color-${borderColor}`]: borderColor,
      [`ripple-color-${rippleColor}`]: rippleColor,
    };
  },
  linkIconProps: {
    icon: String,
    iconMaterial: String,
    iconF7: String,
    iconIos: String,
    iconMd: String,
    iconAurora: String,
    iconColor: String,
    iconSize: [String, Number],
  },
  linkRouterProps: {
    back: Boolean,
    external: Boolean,
    force: Boolean,
    animate: {
      type: Boolean,
      default: undefined,
    },
    ignoreCache: Boolean,
    reloadCurrent: Boolean,
    reloadAll: Boolean,
    reloadPrevious: Boolean,
    reloadDetail: {
      type: Boolean,
      default: undefined,
    },
    routeTabId: String,
    view: String,
    routeProps: Object,
    preventRouter: Boolean,
    transition: String,
  },
  linkRouterAttrs(props) {
    const {
      force,
      reloadCurrent,
      reloadPrevious,
      reloadAll,
      reloadDetail,
      animate,
      ignoreCache,
      routeTabId,
      view,
      transition,
    } = props;

    let dataAnimate;
    if ('animate' in props && typeof animate !== 'undefined') {
      dataAnimate = animate.toString();
    }

    let dataReloadDetail;
    if ('reloadDetail' in props && typeof reloadDetail !== 'undefined') {
      dataReloadDetail = reloadDetail.toString();
    }

    return {
      'data-force': force || undefined,
      'data-reload-current': reloadCurrent || undefined,
      'data-reload-all': reloadAll || undefined,
      'data-reload-previous': reloadPrevious || undefined,
      'data-reload-detail': dataReloadDetail,
      'data-animate': dataAnimate,
      'data-ignore-cache': ignoreCache || undefined,
      'data-route-tab-id': routeTabId || undefined,
      'data-view': Utils.isStringProp(view) ? view : undefined,
      'data-transition': Utils.isStringProp(transition) ? transition : undefined,
    };
  },
  linkRouterClasses(props) {
    const { back, linkBack, external, preventRouter } = props;

    return {
      back: back || linkBack,
      external,
      'prevent-router': preventRouter,
    };
  },
  linkActionsProps: {
    searchbarEnable: [Boolean, String],
    searchbarDisable: [Boolean, String],

    searchbarClear: [Boolean, String],
    searchbarToggle: [Boolean, String],

    // Panel
    panelOpen: [Boolean, String],
    panelClose: [Boolean, String],
    panelToggle: [Boolean, String],

    // Popup
    popupOpen: [Boolean, String],
    popupClose: [Boolean, String],

    // Actions
    actionsOpen: [Boolean, String],
    actionsClose: [Boolean, String],

    // Popover
    popoverOpen: [Boolean, String],
    popoverClose: [Boolean, String],

    // Login Screen
    loginScreenOpen: [Boolean, String],
    loginScreenClose: [Boolean, String],

    // Picker
    sheetOpen: [Boolean, String],
    sheetClose: [Boolean, String],

    // Sortable
    sortableEnable: [Boolean, String],
    sortableDisable: [Boolean, String],
    sortableToggle: [Boolean, String],

    // Card
    cardOpen: [Boolean, String],
    cardPreventOpen: [Boolean, String],
    cardClose: [Boolean, String],

    // Menu
    menuClose: {
      type: [Boolean, String],
      default: undefined,
    },
  },
  linkActionsAttrs(props) {
    const {
      searchbarEnable,
      searchbarDisable,
      searchbarClear,
      searchbarToggle,
      panelOpen,
      panelClose,
      panelToggle,
      popupOpen,
      popupClose,
      actionsOpen,
      actionsClose,
      popoverOpen,
      popoverClose,
      loginScreenOpen,
      loginScreenClose,
      sheetOpen,
      sheetClose,
      sortableEnable,
      sortableDisable,
      sortableToggle,
      cardOpen,
      cardClose,
    } = props;

    return {
      'data-searchbar': (Utils.isStringProp(searchbarEnable) && searchbarEnable)
                        || (Utils.isStringProp(searchbarDisable) && searchbarDisable)
                        || (Utils.isStringProp(searchbarClear) && searchbarClear)
                        || (Utils.isStringProp(searchbarToggle) && searchbarToggle) || undefined,
      'data-panel': (Utils.isStringProp(panelOpen) && panelOpen)
                    || (Utils.isStringProp(panelClose) && panelClose)
                    || (Utils.isStringProp(panelToggle) && panelToggle) || undefined,
      'data-popup': (Utils.isStringProp(popupOpen) && popupOpen)
                    || (Utils.isStringProp(popupClose) && popupClose) || undefined,
      'data-actions': (Utils.isStringProp(actionsOpen) && actionsOpen)
                    || (Utils.isStringProp(actionsClose) && actionsClose) || undefined,
      'data-popover': (Utils.isStringProp(popoverOpen) && popoverOpen)
                      || (Utils.isStringProp(popoverClose) && popoverClose) || undefined,
      'data-sheet': (Utils.isStringProp(sheetOpen) && sheetOpen)
                    || (Utils.isStringProp(sheetClose) && sheetClose) || undefined,
      'data-login-screen': (Utils.isStringProp(loginScreenOpen) && loginScreenOpen)
                           || (Utils.isStringProp(loginScreenClose) && loginScreenClose) || undefined,
      'data-sortable': (Utils.isStringProp(sortableEnable) && sortableEnable)
                       || (Utils.isStringProp(sortableDisable) && sortableDisable)
                       || (Utils.isStringProp(sortableToggle) && sortableToggle) || undefined,
      'data-card': (Utils.isStringProp(cardOpen) && cardOpen)
                    || (Utils.isStringProp(cardClose) && cardClose) || undefined,
    };
  },
  linkActionsClasses(props) {
    const {
      searchbarEnable,
      searchbarDisable,
      searchbarClear,
      searchbarToggle,
      panelOpen,
      panelClose,
      panelToggle,
      popupOpen,
      popupClose,
      actionsClose,
      actionsOpen,
      popoverOpen,
      popoverClose,
      loginScreenOpen,
      loginScreenClose,
      sheetOpen,
      sheetClose,
      sortableEnable,
      sortableDisable,
      sortableToggle,
      cardOpen,
      cardPreventOpen,
      cardClose,
      menuClose,
    } = props;

    return {
      'searchbar-enable': searchbarEnable || searchbarEnable === '',
      'searchbar-disable': searchbarDisable || searchbarDisable === '',
      'searchbar-clear': searchbarClear || searchbarClear === '',
      'searchbar-toggle': searchbarToggle || searchbarToggle === '',
      'panel-close': panelClose || panelClose === '',
      'panel-open': panelOpen || panelOpen === '',
      'panel-toggle': panelToggle || panelToggle === '',
      'popup-close': popupClose || popupClose === '',
      'popup-open': popupOpen || popupOpen === '',
      'actions-close': actionsClose || actionsClose === '',
      'actions-open': actionsOpen || actionsOpen === '',
      'popover-close': popoverClose || popoverClose === '',
      'popover-open': popoverOpen || popoverOpen === '',
      'sheet-close': sheetClose || sheetClose === '',
      'sheet-open': sheetOpen || sheetOpen === '',
      'login-screen-close': loginScreenClose || loginScreenClose === '',
      'login-screen-open': loginScreenOpen || loginScreenOpen === '',
      'sortable-enable': sortableEnable || sortableEnable === '',
      'sortable-disable': sortableDisable || sortableDisable === '',
      'sortable-toggle': sortableToggle || sortableToggle === '',
      'card-close': cardClose || cardClose === '',
      'card-open': cardOpen || cardOpen === '',
      'card-prevent-open': cardPreventOpen || cardPreventOpen === '',
      'menu-close': menuClose || menuClose === '',
    };
  },
};

const f7 = {
  instance: null,
  Framework7: null,
  events: null,
  init(rootEl, params = {}, routes) {
    const { events, Framework7 } = f7;
    const f7Params = Utils.extend({}, params, {
      root: rootEl,
    });
    if (routes && routes.length && !f7Params.routes) f7Params.routes = routes;

    const instance = new Framework7(f7Params);
    if (instance.initialized) {
      f7.instance = instance;
      events.emit('ready', f7.instance);
    } else {
      instance.on('init', () => {
        f7.instance = instance;
        events.emit('ready', f7.instance);
      });
    }
  },
  ready(callback) {
    if (!callback) return;
    if (f7.instance) callback(f7.instance);
    else {
      f7.events.once('ready', callback);
    }
  },
  routers: {
    views: [],
    tabs: [],
    modals: null,
  },
};

function hasSlots (args, name) {
  return args && args[1] && args[1].$$slots && args[1].$$slots[name] && args[1].$$slots[name].length > 0;
}

/* node_modules/framework7-svelte/components/routable-modals.svelte generated by Svelte v3.18.2 */
const file = "node_modules/framework7-svelte/components/routable-modals.svelte";

function get_each_context(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[4] = list[i];
	return child_ctx;
}

// (33:2) {#each modals as modal (modal.id)}
function create_each_block(key_1, ctx) {
	let first;
	let switch_instance_anchor;
	let current;
	const switch_instance_spread_levels = [/*modal*/ ctx[4].props];
	var switch_value = /*modal*/ ctx[4].component;

	function switch_props(ctx) {
		let switch_instance_props = {};

		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
		}

		return {
			props: switch_instance_props,
			$$inline: true
		};
	}

	if (switch_value) {
		var switch_instance = new switch_value(switch_props());
	}

	const block = {
		key: key_1,
		first: null,
		c: function create() {
			first = empty();
			if (switch_instance) create_component(switch_instance.$$.fragment);
			switch_instance_anchor = empty();
			this.first = first;
		},
		m: function mount(target, anchor) {
			insert_dev(target, first, anchor);

			if (switch_instance) {
				mount_component(switch_instance, target, anchor);
			}

			insert_dev(target, switch_instance_anchor, anchor);
			current = true;
		},
		p: function update(ctx, dirty) {
			const switch_instance_changes = (dirty & /*modals*/ 1)
			? get_spread_update(switch_instance_spread_levels, [get_spread_object(/*modal*/ ctx[4].props)])
			: {};

			if (switch_value !== (switch_value = /*modal*/ ctx[4].component)) {
				if (switch_instance) {
					group_outros();
					const old_component = switch_instance;

					transition_out(old_component.$$.fragment, 1, 0, () => {
						destroy_component(old_component, 1);
					});

					check_outros();
				}

				if (switch_value) {
					switch_instance = new switch_value(switch_props());
					create_component(switch_instance.$$.fragment);
					transition_in(switch_instance.$$.fragment, 1);
					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
				} else {
					switch_instance = null;
				}
			} else if (switch_value) {
				switch_instance.$set(switch_instance_changes);
			}
		},
		i: function intro(local) {
			if (current) return;
			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(first);
			if (detaching) detach_dev(switch_instance_anchor);
			if (switch_instance) destroy_component(switch_instance, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_each_block.name,
		type: "each",
		source: "(33:2) {#each modals as modal (modal.id)}",
		ctx
	});

	return block;
}

function create_fragment(ctx) {
	let div;
	let each_blocks = [];
	let each_1_lookup = new Map();
	let current;
	let each_value = /*modals*/ ctx[0];
	const get_key = ctx => /*modal*/ ctx[4].id;
	validate_each_keys(ctx, each_value, get_each_context, get_key);

	for (let i = 0; i < each_value.length; i += 1) {
		let child_ctx = get_each_context(ctx, each_value, i);
		let key = get_key(child_ctx);
		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
	}

	const block = {
		c: function create() {
			div = element("div");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			attr_dev(div, "class", "framework7-modals");
			add_location(div, file, 31, 0, 614);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, div, anchor);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(div, null);
			}

			/*div_binding*/ ctx[3](div);
			current = true;
		},
		p: function update(ctx, [dirty]) {
			const each_value = /*modals*/ ctx[0];
			group_outros();
			validate_each_keys(ctx, each_value, get_each_context, get_key);
			each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div, outro_and_destroy_block, create_each_block, null, get_each_context);
			check_outros();
		},
		i: function intro(local) {
			if (current) return;

			for (let i = 0; i < each_value.length; i += 1) {
				transition_in(each_blocks[i]);
			}

			current = true;
		},
		o: function outro(local) {
			for (let i = 0; i < each_blocks.length; i += 1) {
				transition_out(each_blocks[i]);
			}

			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(div);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].d();
			}

			/*div_binding*/ ctx[3](null);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance($$self, $$props, $$invalidate) {
	let modals = [];
	let el;
	let routerData;

	onMount(() => {
		routerData = {
			el,
			modals,
			setModals(m) {
				tick().then(() => {
					$$invalidate(0, modals = m);
				});
			}
		};

		f7.routers.modals = routerData;
	});

	afterUpdate(() => {
		if (!routerData) return;
		f7.events.emit("modalsRouterDidUpdate", routerData);
	});

	onDestroy(() => {
		if (!routerData) return;
		f7.routers.modals = null;
		routerData = null;
	});

	function div_binding($$value) {
		binding_callbacks[$$value ? "unshift" : "push"](() => {
			$$invalidate(1, el = $$value);
		});
	}

	$$self.$capture_state = () => {
		return {};
	};

	$$self.$inject_state = $$props => {
		if ("modals" in $$props) $$invalidate(0, modals = $$props.modals);
		if ("el" in $$props) $$invalidate(1, el = $$props.el);
		if ("routerData" in $$props) routerData = $$props.routerData;
	};

	return [modals, el, routerData, div_binding];
}

class Routable_modals extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance, create_fragment, safe_not_equal, {});

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Routable_modals",
			options,
			id: create_fragment.name
		});
	}
}

/* node_modules/framework7-svelte/components/app.svelte generated by Svelte v3.18.2 */
const file$1 = "node_modules/framework7-svelte/components/app.svelte";

function create_fragment$1(ctx) {
	let div;
	let t;
	let current;
	const default_slot_template = /*$$slots*/ ctx[9].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[8], null);
	const routablemodals = new Routable_modals({ $$inline: true });

	const block = {
		c: function create() {
			div = element("div");
			if (default_slot) default_slot.c();
			t = space();
			create_component(routablemodals.$$.fragment);
			attr_dev(div, "id", /*id*/ ctx[0]);
			attr_dev(div, "class", /*classes*/ ctx[3]);
			attr_dev(div, "style", /*style*/ ctx[1]);
			add_location(div, file$1, 34, 0, 789);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, div, anchor);

			if (default_slot) {
				default_slot.m(div, null);
			}

			append_dev(div, t);
			mount_component(routablemodals, div, null);
			/*div_binding*/ ctx[10](div);
			current = true;
		},
		p: function update(ctx, [dirty]) {
			if (default_slot && default_slot.p && dirty & /*$$scope*/ 256) {
				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[8], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[8], dirty, null));
			}

			if (!current || dirty & /*id*/ 1) {
				attr_dev(div, "id", /*id*/ ctx[0]);
			}

			if (!current || dirty & /*classes*/ 8) {
				attr_dev(div, "class", /*classes*/ ctx[3]);
			}

			if (!current || dirty & /*style*/ 2) {
				attr_dev(div, "style", /*style*/ ctx[1]);
			}
		},
		i: function intro(local) {
			if (current) return;
			transition_in(default_slot, local);
			transition_in(routablemodals.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(default_slot, local);
			transition_out(routablemodals.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(div);
			if (default_slot) default_slot.d(detaching);
			destroy_component(routablemodals);
			/*div_binding*/ ctx[10](null);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$1.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$1($$self, $$props, $$invalidate) {
	let { id = "framework7-root" } = $$props;
	let { params = {} } = $$props;
	let { routes = [] } = $$props;
	let { style = undefined } = $$props;
	let { class: className = undefined } = $$props;
	let el;

	onMount(() => {
		const parentEl = el.parentNode;

		if (parentEl && parentEl !== document.body && parentEl.parentNode === document.body) {
			parentEl.style.height = "100%";
		}

		if (f7.instance) return;
		f7.init(el, params, routes);
	});

	let { $$slots = {}, $$scope } = $$props;

	function div_binding($$value) {
		binding_callbacks[$$value ? "unshift" : "push"](() => {
			$$invalidate(2, el = $$value);
		});
	}

	$$self.$set = $$new_props => {
		$$invalidate(7, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
		if ("id" in $$new_props) $$invalidate(0, id = $$new_props.id);
		if ("params" in $$new_props) $$invalidate(4, params = $$new_props.params);
		if ("routes" in $$new_props) $$invalidate(5, routes = $$new_props.routes);
		if ("style" in $$new_props) $$invalidate(1, style = $$new_props.style);
		if ("class" in $$new_props) $$invalidate(6, className = $$new_props.class);
		if ("$$scope" in $$new_props) $$invalidate(8, $$scope = $$new_props.$$scope);
	};

	$$self.$capture_state = () => {
		return {
			id,
			params,
			routes,
			style,
			className,
			el,
			classes
		};
	};

	$$self.$inject_state = $$new_props => {
		$$invalidate(7, $$props = assign(assign({}, $$props), $$new_props));
		if ("id" in $$props) $$invalidate(0, id = $$new_props.id);
		if ("params" in $$props) $$invalidate(4, params = $$new_props.params);
		if ("routes" in $$props) $$invalidate(5, routes = $$new_props.routes);
		if ("style" in $$props) $$invalidate(1, style = $$new_props.style);
		if ("className" in $$props) $$invalidate(6, className = $$new_props.className);
		if ("el" in $$props) $$invalidate(2, el = $$new_props.el);
		if ("classes" in $$props) $$invalidate(3, classes = $$new_props.classes);
	};

	let classes;

	$$self.$$.update = () => {
		 $$invalidate(3, classes = Utils.classNames(className, "framework7-root", Mixins.colorClasses($$props)));
	};

	$$props = exclude_internal_props($$props);

	return [
		id,
		style,
		el,
		classes,
		params,
		routes,
		className,
		$$props,
		$$scope,
		$$slots,
		div_binding
	];
}

class App extends SvelteComponentDev {
	constructor(options) {
		super(options);

		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
			id: 0,
			params: 4,
			routes: 5,
			style: 1,
			class: 6
		});

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "App",
			options,
			id: create_fragment$1.name
		});
	}

	get id() {
		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set id(value) {
		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get params() {
		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set params(value) {
		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get routes() {
		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set routes(value) {
		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get style() {
		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set style(value) {
		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get class() {
		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set class(value) {
		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* node_modules/framework7-svelte/components/appbar.svelte generated by Svelte v3.18.2 */
const file$2 = "node_modules/framework7-svelte/components/appbar.svelte";
const get_after_inner_slot_changes = dirty => ({});
const get_after_inner_slot_context = ctx => ({});
const get_before_inner_slot_changes = dirty => ({});
const get_before_inner_slot_context = ctx => ({});

// (44:2) {:else}
function create_else_block(ctx) {
	let current;
	const default_slot_template = /*$$slots*/ ctx[12].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[11], null);

	const block = {
		c: function create() {
			if (default_slot) default_slot.c();
		},
		m: function mount(target, anchor) {
			if (default_slot) {
				default_slot.m(target, anchor);
			}

			current = true;
		},
		p: function update(ctx, dirty) {
			if (default_slot && default_slot.p && dirty & /*$$scope*/ 2048) {
				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[11], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[11], dirty, null));
			}
		},
		i: function intro(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(default_slot, local);
			current = false;
		},
		d: function destroy(detaching) {
			if (default_slot) default_slot.d(detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_else_block.name,
		type: "else",
		source: "(44:2) {:else}",
		ctx
	});

	return block;
}

// (40:2) {#if inner}
function create_if_block(ctx) {
	let div;
	let current;
	const default_slot_template = /*$$slots*/ ctx[12].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[11], null);

	const block = {
		c: function create() {
			div = element("div");
			if (default_slot) default_slot.c();
			attr_dev(div, "class", /*innerClasses*/ ctx[4]);
			add_location(div, file$2, 40, 4, 778);
		},
		m: function mount(target, anchor) {
			insert_dev(target, div, anchor);

			if (default_slot) {
				default_slot.m(div, null);
			}

			current = true;
		},
		p: function update(ctx, dirty) {
			if (default_slot && default_slot.p && dirty & /*$$scope*/ 2048) {
				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[11], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[11], dirty, null));
			}

			if (!current || dirty & /*innerClasses*/ 16) {
				attr_dev(div, "class", /*innerClasses*/ ctx[4]);
			}
		},
		i: function intro(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(default_slot, local);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(div);
			if (default_slot) default_slot.d(detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block.name,
		type: "if",
		source: "(40:2) {#if inner}",
		ctx
	});

	return block;
}

function create_fragment$2(ctx) {
	let div;
	let t0;
	let current_block_type_index;
	let if_block;
	let t1;
	let current;
	const before_inner_slot_template = /*$$slots*/ ctx[12]["before-inner"];
	const before_inner_slot = create_slot(before_inner_slot_template, ctx, /*$$scope*/ ctx[11], get_before_inner_slot_context);
	const if_block_creators = [create_if_block, create_else_block];
	const if_blocks = [];

	function select_block_type(ctx, dirty) {
		if (/*inner*/ ctx[2]) return 0;
		return 1;
	}

	current_block_type_index = select_block_type(ctx);
	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
	const after_inner_slot_template = /*$$slots*/ ctx[12]["after-inner"];
	const after_inner_slot = create_slot(after_inner_slot_template, ctx, /*$$scope*/ ctx[11], get_after_inner_slot_context);

	const block = {
		c: function create() {
			div = element("div");
			if (before_inner_slot) before_inner_slot.c();
			t0 = space();
			if_block.c();
			t1 = space();
			if (after_inner_slot) after_inner_slot.c();
			attr_dev(div, "id", /*id*/ ctx[0]);
			attr_dev(div, "style", /*style*/ ctx[1]);
			attr_dev(div, "class", /*classes*/ ctx[3]);
			add_location(div, file$2, 33, 0, 678);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, div, anchor);

			if (before_inner_slot) {
				before_inner_slot.m(div, null);
			}

			append_dev(div, t0);
			if_blocks[current_block_type_index].m(div, null);
			append_dev(div, t1);

			if (after_inner_slot) {
				after_inner_slot.m(div, null);
			}

			current = true;
		},
		p: function update(ctx, [dirty]) {
			if (before_inner_slot && before_inner_slot.p && dirty & /*$$scope*/ 2048) {
				before_inner_slot.p(get_slot_context(before_inner_slot_template, ctx, /*$$scope*/ ctx[11], get_before_inner_slot_context), get_slot_changes(before_inner_slot_template, /*$$scope*/ ctx[11], dirty, get_before_inner_slot_changes));
			}

			let previous_block_index = current_block_type_index;
			current_block_type_index = select_block_type(ctx);

			if (current_block_type_index === previous_block_index) {
				if_blocks[current_block_type_index].p(ctx, dirty);
			} else {
				group_outros();

				transition_out(if_blocks[previous_block_index], 1, 1, () => {
					if_blocks[previous_block_index] = null;
				});

				check_outros();
				if_block = if_blocks[current_block_type_index];

				if (!if_block) {
					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
					if_block.c();
				}

				transition_in(if_block, 1);
				if_block.m(div, t1);
			}

			if (after_inner_slot && after_inner_slot.p && dirty & /*$$scope*/ 2048) {
				after_inner_slot.p(get_slot_context(after_inner_slot_template, ctx, /*$$scope*/ ctx[11], get_after_inner_slot_context), get_slot_changes(after_inner_slot_template, /*$$scope*/ ctx[11], dirty, get_after_inner_slot_changes));
			}

			if (!current || dirty & /*id*/ 1) {
				attr_dev(div, "id", /*id*/ ctx[0]);
			}

			if (!current || dirty & /*style*/ 2) {
				attr_dev(div, "style", /*style*/ ctx[1]);
			}

			if (!current || dirty & /*classes*/ 8) {
				attr_dev(div, "class", /*classes*/ ctx[3]);
			}
		},
		i: function intro(local) {
			if (current) return;
			transition_in(before_inner_slot, local);
			transition_in(if_block);
			transition_in(after_inner_slot, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(before_inner_slot, local);
			transition_out(if_block);
			transition_out(after_inner_slot, local);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(div);
			if (before_inner_slot) before_inner_slot.d(detaching);
			if_blocks[current_block_type_index].d();
			if (after_inner_slot) after_inner_slot.d(detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$2.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$2($$self, $$props, $$invalidate) {
	let { id = undefined } = $$props;
	let { style = undefined } = $$props;
	let { class: className = undefined } = $$props;
	let { noShadow = undefined } = $$props;
	let { noHairline = undefined } = $$props;
	let { inner = true } = $$props;
	let { innerClass = undefined } = $$props;
	let { innerClassName = undefined } = $$props;
	let { $$slots = {}, $$scope } = $$props;

	$$self.$set = $$new_props => {
		$$invalidate(10, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
		if ("id" in $$new_props) $$invalidate(0, id = $$new_props.id);
		if ("style" in $$new_props) $$invalidate(1, style = $$new_props.style);
		if ("class" in $$new_props) $$invalidate(5, className = $$new_props.class);
		if ("noShadow" in $$new_props) $$invalidate(6, noShadow = $$new_props.noShadow);
		if ("noHairline" in $$new_props) $$invalidate(7, noHairline = $$new_props.noHairline);
		if ("inner" in $$new_props) $$invalidate(2, inner = $$new_props.inner);
		if ("innerClass" in $$new_props) $$invalidate(8, innerClass = $$new_props.innerClass);
		if ("innerClassName" in $$new_props) $$invalidate(9, innerClassName = $$new_props.innerClassName);
		if ("$$scope" in $$new_props) $$invalidate(11, $$scope = $$new_props.$$scope);
	};

	$$self.$capture_state = () => {
		return {
			id,
			style,
			className,
			noShadow,
			noHairline,
			inner,
			innerClass,
			innerClassName,
			classes,
			innerClasses
		};
	};

	$$self.$inject_state = $$new_props => {
		$$invalidate(10, $$props = assign(assign({}, $$props), $$new_props));
		if ("id" in $$props) $$invalidate(0, id = $$new_props.id);
		if ("style" in $$props) $$invalidate(1, style = $$new_props.style);
		if ("className" in $$props) $$invalidate(5, className = $$new_props.className);
		if ("noShadow" in $$props) $$invalidate(6, noShadow = $$new_props.noShadow);
		if ("noHairline" in $$props) $$invalidate(7, noHairline = $$new_props.noHairline);
		if ("inner" in $$props) $$invalidate(2, inner = $$new_props.inner);
		if ("innerClass" in $$props) $$invalidate(8, innerClass = $$new_props.innerClass);
		if ("innerClassName" in $$props) $$invalidate(9, innerClassName = $$new_props.innerClassName);
		if ("classes" in $$props) $$invalidate(3, classes = $$new_props.classes);
		if ("innerClasses" in $$props) $$invalidate(4, innerClasses = $$new_props.innerClasses);
	};

	let classes;
	let innerClasses;

	$$self.$$.update = () => {
		 $$invalidate(3, classes = Utils.classNames(
			className,
			"appbar",
			{
				"no-shadow": noShadow,
				"no-hairline": noHairline
			},
			Mixins.colorClasses($$props)
		));

		if ($$self.$$.dirty & /*innerClass, innerClassName*/ 768) {
			 $$invalidate(4, innerClasses = Utils.classNames("appbar-inner", innerClass, innerClassName));
		}
	};

	$$props = exclude_internal_props($$props);

	return [
		id,
		style,
		inner,
		classes,
		innerClasses,
		className,
		noShadow,
		noHairline,
		innerClass,
		innerClassName,
		$$props,
		$$scope,
		$$slots
	];
}

class Appbar extends SvelteComponentDev {
	constructor(options) {
		super(options);

		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
			id: 0,
			style: 1,
			class: 5,
			noShadow: 6,
			noHairline: 7,
			inner: 2,
			innerClass: 8,
			innerClassName: 9
		});

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Appbar",
			options,
			id: create_fragment$2.name
		});
	}

	get id() {
		throw new Error("<Appbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set id(value) {
		throw new Error("<Appbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get style() {
		throw new Error("<Appbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set style(value) {
		throw new Error("<Appbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get class() {
		throw new Error("<Appbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set class(value) {
		throw new Error("<Appbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get noShadow() {
		throw new Error("<Appbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set noShadow(value) {
		throw new Error("<Appbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get noHairline() {
		throw new Error("<Appbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set noHairline(value) {
		throw new Error("<Appbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get inner() {
		throw new Error("<Appbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set inner(value) {
		throw new Error("<Appbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get innerClass() {
		throw new Error("<Appbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set innerClass(value) {
		throw new Error("<Appbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get innerClassName() {
		throw new Error("<Appbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set innerClassName(value) {
		throw new Error("<Appbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* eslint no-underscore-dangle: "off" */

let routerComponentIdCounter = 0;

var componentsRouter = {
  proto: {
    pageComponentLoader(routerEl, component, componentUrl, options, resolve, reject) {
      const router = this;
      const el = routerEl;
      let viewRouter;
      f7.routers.views.forEach((data) => {
        if (data.el && data.el === routerEl) {
          viewRouter = data;
        }
      });

      if (!viewRouter) {
        reject();
        return;
      }

      const id = `${Utils.now()}_${(routerComponentIdCounter += 1)}`;
      const pageData = {
        component,
        id,
        props: Utils.extend(
          {
            f7route: options.route,
            $f7route: options.route,
            f7router: router,
            $f7router: router,
          },
          options.route.params,
          options.props || {},
        ),
      };
      if (viewRouter.component) {
        viewRouter.component.$f7router = router;
        viewRouter.component.$f7route = options.route;
      }

      let resolved;
      function onDidUpdate(componentRouterData) {
        if (componentRouterData !== viewRouter || resolved) return;
        f7.events.off('viewRouterDidUpdate', onDidUpdate);

        const pageEl = el.children[el.children.length - 1];
        pageData.el = pageEl;

        resolve(pageEl);
        resolved = true;
      }

      f7.events.on('viewRouterDidUpdate', onDidUpdate);

      viewRouter.pages.push(pageData);
      viewRouter.setPages(viewRouter.pages);
    },
    removePage($pageEl) {
      if (!$pageEl) return;
      const router = this;
      let f7Page;
      if ('length' in $pageEl && $pageEl[0]) f7Page = $pageEl[0].f7Page;
      else f7Page = $pageEl.f7Page;
      if (f7Page && f7Page.route && f7Page.route.route && f7Page.route.route.keepAlive) {
        router.app.$($pageEl).remove();
        return;
      }
      let viewRouter;
      f7.routers.views.forEach((data) => {
        if (data.el && data.el === router.el) {
          viewRouter = data;
        }
      });

      let pageEl;
      if ('length' in $pageEl) {
        // Dom7
        if ($pageEl.length === 0) return;
        pageEl = $pageEl[0];
      } else {
        pageEl = $pageEl;
      }
      if (!pageEl) return;

      let pageComponentFound;
      viewRouter.pages.forEach((page, index) => {
        if (page.el === pageEl) {
          pageComponentFound = true;
          viewRouter.pages.splice(index, 1);
          viewRouter.setPages(viewRouter.pages);
        }
      });
      if (!pageComponentFound) {
        pageEl.parentNode.removeChild(pageEl);
      }
    },
    tabComponentLoader(tabEl, component, componentUrl, options, resolve, reject) {
      const router = this;
      if (!tabEl) reject();

      let tabRouter;
      f7.routers.tabs.forEach((tabData) => {
        if (tabData.el && tabData.el === tabEl) {
          tabRouter = tabData;
        }
      });
      if (!tabRouter) {
        reject();
        return;
      }

      const id = `${Utils.now()}_${(routerComponentIdCounter += 1)}`;
      const tabContent = {
        id,
        component,
        props: Utils.extend(
          {
            f7route: options.route,
            $f7route: options.route,
            f7router: router,
            $f7router: router,
          },
          options.route.params,
          options.props || {},
        ),
      };

      if (tabRouter.component) {
        tabRouter.component.$f7router = router;
        tabRouter.component.$f7route = options.route;
      }

      let resolved;
      function onDidUpdate(componentRouterData) {
        if (componentRouterData !== tabRouter || resolved) return;
        f7.events.off('tabRouterDidUpdate', onDidUpdate);

        const tabContentEl = tabEl.children[0];
        resolve(tabContentEl);

        resolved = true;
      }

      f7.events.on('tabRouterDidUpdate', onDidUpdate);

      tabRouter.setTabContent(tabContent);
    },
    removeTabContent(tabEl) {
      if (!tabEl) return;

      let tabRouter;
      f7.routers.tabs.forEach((tabData) => {
        if (tabData.el && tabData.el === tabEl) {
          tabRouter = tabData;
        }
      });
      const hasComponent = tabRouter && tabRouter.component;
      if (!tabRouter || !hasComponent) {
        tabEl.innerHTML = ''; // eslint-disable-line
        return;
      }
      tabRouter.setTabContent(null);
    },
    modalComponentLoader(rootEl, component, componentUrl, options, resolve, reject) {
      const router = this;
      const modalsRouter = f7.routers.modals;

      if (!modalsRouter) {
        reject();
        return;
      }

      const id = `${Utils.now()}_${(routerComponentIdCounter += 1)}`;
      const modalData = {
        component,
        id,
        props: Utils.extend(
          {
            f7route: options.route,
            $f7route: options.route,
            f7router: router,
            $f7router: router,
          },
          options.route.params,
          options.props || {},
        ),
      };
      if (modalsRouter.component) {
        modalsRouter.component.$f7router = router;
        modalsRouter.component.$f7route = options.route;
      }

      let resolved;
      function onDidUpdate() {
        if (resolved) return;
        f7.events.off('modalsRouterDidUpdate', onDidUpdate);

        const modalEl = modalsRouter.el.children[modalsRouter.el.children.length - 1];
        modalData.el = modalEl;

        resolve(modalEl);
        resolved = true;
      }

      f7.events.on('modalsRouterDidUpdate', onDidUpdate);

      modalsRouter.modals.push(modalData);
      modalsRouter.setModals(modalsRouter.modals);
    },
    removeModal(modalEl) {
      const modalsRouter = f7.routers.modals;
      if (!modalsRouter) return;

      let modalDataToRemove;
      modalsRouter.modals.forEach((modalData) => {
        if (modalData.el === modalEl) modalDataToRemove = modalData;
      });

      modalsRouter.modals.splice(modalsRouter.modals.indexOf(modalDataToRemove), 1);
      modalsRouter.setModals(modalsRouter.modals);
    },
  },
};

/* eslint no-underscore-dangle: "off" */
function f7ready(callback) {
  f7.ready(callback);
}
const f7Theme = {};
const Plugin = {
  name: 'phenomePlugin',
  installed: false,
  install(params = {}) {
    if (Plugin.installed) return;
    Plugin.installed = true;
    const Framework7 = this;
    f7.Framework7 = Framework7;
    f7.events = new Framework7.Events();
    // eslint-disable-next-line
    
    const { theme } = params;
    if (theme === 'md') f7Theme.md = true;
    if (theme === 'ios') f7Theme.ios = true;
    if (theme === 'aurora') f7Theme.aurora = true;
    if (!theme || theme === 'auto') {
      f7Theme.ios = !!Framework7.device.ios;
      f7Theme.aurora = Framework7.device.desktop && Framework7.device.electron;
      f7Theme.md = !f7Theme.ios && !f7Theme.aurora;
    }
    f7.ready(() => {
      f7Theme.ios = f7.instance.theme === 'ios';
      f7Theme.md = f7.instance.theme === 'md';
      f7Theme.aurora = f7.instance.theme === 'aurora';
    });
    
    // Extend F7 Router
    Framework7.Router.use(componentsRouter);
  },
};

/* node_modules/framework7-svelte/components/icon.svelte generated by Svelte v3.18.2 */
const file$3 = "node_modules/framework7-svelte/components/icon.svelte";

function create_fragment$3(ctx) {
	let i;
	let t0_value = (/*iconText*/ ctx[3] || "") + "";
	let t0;
	let t1;
	let current;
	const default_slot_template = /*$$slots*/ ctx[26].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[25], null);

	const block = {
		c: function create() {
			i = element("i");
			t0 = text(t0_value);
			t1 = space();
			if (default_slot) default_slot.c();
			attr_dev(i, "id", /*id*/ ctx[0]);
			attr_dev(i, "style", /*iconStyle*/ ctx[4]);
			attr_dev(i, "class", /*iconClasses*/ ctx[2]);
			add_location(i, file$3, 135, 0, 3326);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, i, anchor);
			append_dev(i, t0);
			append_dev(i, t1);

			if (default_slot) {
				default_slot.m(i, null);
			}

			/*i_binding*/ ctx[27](i);
			current = true;
		},
		p: function update(ctx, [dirty]) {
			if ((!current || dirty & /*iconText*/ 8) && t0_value !== (t0_value = (/*iconText*/ ctx[3] || "") + "")) set_data_dev(t0, t0_value);

			if (default_slot && default_slot.p && dirty & /*$$scope*/ 33554432) {
				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[25], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[25], dirty, null));
			}

			if (!current || dirty & /*id*/ 1) {
				attr_dev(i, "id", /*id*/ ctx[0]);
			}

			if (!current || dirty & /*iconStyle*/ 16) {
				attr_dev(i, "style", /*iconStyle*/ ctx[4]);
			}

			if (!current || dirty & /*iconClasses*/ 4) {
				attr_dev(i, "class", /*iconClasses*/ ctx[2]);
			}
		},
		i: function intro(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(default_slot, local);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(i);
			if (default_slot) default_slot.d(detaching);
			/*i_binding*/ ctx[27](null);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$3.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$3($$self, $$props, $$invalidate) {
	let { id = undefined } = $$props;
	let { style = undefined } = $$props;
	let { class: className = undefined } = $$props;
	let { material = undefined } = $$props;
	let { f7: f7$1 = undefined } = $$props;
	let { icon = undefined } = $$props;
	let { ios = undefined } = $$props;
	let { aurora = undefined } = $$props;
	let { md = undefined } = $$props;
	let { tooltip = undefined } = $$props;
	let { tooltipTrigger = undefined } = $$props;
	let { size = undefined } = $$props;

	// eslint-disable-next-line
	let _theme = f7.instance ? f7Theme : null;

	let el;
	let f7Tooltip;
	let classes = { icon: true };

	if (!f7.instance) {
		f7.ready(() => {
			$$invalidate(16, _theme = f7Theme);
		});
	}

	let themeIcon;

	function iconTextComputed(t) {
		let textComputed = material || f7$1;

		if (md && t && t.md && (md.indexOf("material:") >= 0 || md.indexOf("f7:") >= 0)) {
			textComputed = md.split(":")[1];
		} else if (ios && t && t.ios && (ios.indexOf("material:") >= 0 || ios.indexOf("f7:") >= 0)) {
			textComputed = ios.split(":")[1];
		} else if (aurora && t && t.aurora && (aurora.indexOf("material:") >= 0 || aurora.indexOf("f7:") >= 0)) {
			textComputed = aurora.split(":")[1];
		}

		return textComputed;
	}

	let tooltipText = tooltip;

	function watchTooltip(newText) {
		const oldText = tooltipText;
		if (oldText === newText) return;
		tooltipText = newText;

		if (!newText && f7Tooltip) {
			f7Tooltip.destroy();
			f7Tooltip = null;
			return;
		}

		if (newText && !f7Tooltip && f7.instance) {
			f7Tooltip = f7.instance.tooltip.create({
				targetEl: el,
				text: newText,
				trigger: tooltipTrigger
			});

			return;
		}

		if (!newText || !f7Tooltip) return;
		f7Tooltip.setText(newText);
	}

	onMount(() => {
		if (!tooltip) return;

		f7.ready(() => {
			f7Tooltip = f7.instance.tooltip.create({
				targetEl: el,
				text: tooltip,
				trigger: tooltipTrigger
			});
		});
	});

	onDestroy(() => {
		if (f7Tooltip && f7Tooltip.destroy) {
			f7Tooltip.destroy();
			f7Tooltip = null;
		}
	});

	let { $$slots = {}, $$scope } = $$props;

	function i_binding($$value) {
		binding_callbacks[$$value ? "unshift" : "push"](() => {
			$$invalidate(1, el = $$value);
		});
	}

	$$self.$set = $$new_props => {
		$$invalidate(24, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
		if ("id" in $$new_props) $$invalidate(0, id = $$new_props.id);
		if ("style" in $$new_props) $$invalidate(5, style = $$new_props.style);
		if ("class" in $$new_props) $$invalidate(6, className = $$new_props.class);
		if ("material" in $$new_props) $$invalidate(7, material = $$new_props.material);
		if ("f7" in $$new_props) $$invalidate(8, f7$1 = $$new_props.f7);
		if ("icon" in $$new_props) $$invalidate(9, icon = $$new_props.icon);
		if ("ios" in $$new_props) $$invalidate(10, ios = $$new_props.ios);
		if ("aurora" in $$new_props) $$invalidate(11, aurora = $$new_props.aurora);
		if ("md" in $$new_props) $$invalidate(12, md = $$new_props.md);
		if ("tooltip" in $$new_props) $$invalidate(13, tooltip = $$new_props.tooltip);
		if ("tooltipTrigger" in $$new_props) $$invalidate(14, tooltipTrigger = $$new_props.tooltipTrigger);
		if ("size" in $$new_props) $$invalidate(15, size = $$new_props.size);
		if ("$$scope" in $$new_props) $$invalidate(25, $$scope = $$new_props.$$scope);
	};

	$$self.$capture_state = () => {
		return {
			id,
			style,
			className,
			material,
			f7: f7$1,
			icon,
			ios,
			aurora,
			md,
			tooltip,
			tooltipTrigger,
			size,
			_theme,
			el,
			f7Tooltip,
			classes,
			themeIcon,
			tooltipText,
			iconClasses,
			iconText,
			iconSize,
			iconStyle
		};
	};

	$$self.$inject_state = $$new_props => {
		$$invalidate(24, $$props = assign(assign({}, $$props), $$new_props));
		if ("id" in $$props) $$invalidate(0, id = $$new_props.id);
		if ("style" in $$props) $$invalidate(5, style = $$new_props.style);
		if ("className" in $$props) $$invalidate(6, className = $$new_props.className);
		if ("material" in $$props) $$invalidate(7, material = $$new_props.material);
		if ("f7" in $$props) $$invalidate(8, f7$1 = $$new_props.f7);
		if ("icon" in $$props) $$invalidate(9, icon = $$new_props.icon);
		if ("ios" in $$props) $$invalidate(10, ios = $$new_props.ios);
		if ("aurora" in $$props) $$invalidate(11, aurora = $$new_props.aurora);
		if ("md" in $$props) $$invalidate(12, md = $$new_props.md);
		if ("tooltip" in $$props) $$invalidate(13, tooltip = $$new_props.tooltip);
		if ("tooltipTrigger" in $$props) $$invalidate(14, tooltipTrigger = $$new_props.tooltipTrigger);
		if ("size" in $$props) $$invalidate(15, size = $$new_props.size);
		if ("_theme" in $$props) $$invalidate(16, _theme = $$new_props._theme);
		if ("el" in $$props) $$invalidate(1, el = $$new_props.el);
		if ("f7Tooltip" in $$props) f7Tooltip = $$new_props.f7Tooltip;
		if ("classes" in $$props) $$invalidate(18, classes = $$new_props.classes);
		if ("themeIcon" in $$props) $$invalidate(19, themeIcon = $$new_props.themeIcon);
		if ("tooltipText" in $$props) tooltipText = $$new_props.tooltipText;
		if ("iconClasses" in $$props) $$invalidate(2, iconClasses = $$new_props.iconClasses);
		if ("iconText" in $$props) $$invalidate(3, iconText = $$new_props.iconText);
		if ("iconSize" in $$props) $$invalidate(21, iconSize = $$new_props.iconSize);
		if ("iconStyle" in $$props) $$invalidate(4, iconStyle = $$new_props.iconStyle);
	};

	let iconClasses;
	let iconText;
	let iconSize;
	let iconStyle;

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*_theme, ios, md, aurora*/ 72704) {
			 if (_theme) {
				if (_theme.ios) $$invalidate(19, themeIcon = ios);
				if (_theme.md) $$invalidate(19, themeIcon = md);
				if (_theme.aurora) $$invalidate(19, themeIcon = aurora);
			}
		}

		if ($$self.$$.dirty & /*themeIcon, material, f7, icon*/ 525184) {
			 if (themeIcon) {
				const parts = themeIcon.split(":");
				const prop = parts[0];
				const value = parts[1];

				if (prop === "material" || prop === "f7") {
					$$invalidate(18, classes["material-icons"] = prop === "material", classes);
					$$invalidate(18, classes["f7-icons"] = prop === "f7", classes);
				}

				if (prop === "icon") {
					$$invalidate(18, classes[value] = true, classes);
				}
			} else {
				$$invalidate(18, classes = {
					icon: true,
					"material-icons": material,
					"f7-icons": f7$1
				});

				if (icon) $$invalidate(18, classes[icon] = true, classes);
			}
		}

		 $$invalidate(2, iconClasses = Utils.classNames(className, classes, Mixins.colorClasses($$props)));

		if ($$self.$$.dirty & /*_theme*/ 65536) {
			 $$invalidate(3, iconText = iconTextComputed(_theme));
		}

		if ($$self.$$.dirty & /*size*/ 32768) {
			 $$invalidate(21, iconSize = typeof size === "number" || parseFloat(size) === size * 1
			? `${size}px`
			: size);
		}

		if ($$self.$$.dirty & /*style, iconSize*/ 2097184) {
			 $$invalidate(4, iconStyle = (style || "") + (iconSize
			? `;font-size: ${iconSize}; width: ${iconSize}; height: ${iconSize}`.replace(";;", "")
			: ""));
		}

		if ($$self.$$.dirty & /*tooltip*/ 8192) {
			 watchTooltip(tooltip);
		}
	};

	$$props = exclude_internal_props($$props);

	return [
		id,
		el,
		iconClasses,
		iconText,
		iconStyle,
		style,
		className,
		material,
		f7$1,
		icon,
		ios,
		aurora,
		md,
		tooltip,
		tooltipTrigger,
		size,
		_theme,
		f7Tooltip,
		classes,
		themeIcon,
		tooltipText,
		iconSize,
		iconTextComputed,
		watchTooltip,
		$$props,
		$$scope,
		$$slots,
		i_binding
	];
}

class Icon extends SvelteComponentDev {
	constructor(options) {
		super(options);

		init(this, options, instance$3, create_fragment$3, safe_not_equal, {
			id: 0,
			style: 5,
			class: 6,
			material: 7,
			f7: 8,
			icon: 9,
			ios: 10,
			aurora: 11,
			md: 12,
			tooltip: 13,
			tooltipTrigger: 14,
			size: 15
		});

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Icon",
			options,
			id: create_fragment$3.name
		});
	}

	get id() {
		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set id(value) {
		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get style() {
		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set style(value) {
		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get class() {
		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set class(value) {
		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get material() {
		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set material(value) {
		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get f7() {
		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set f7(value) {
		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get icon() {
		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set icon(value) {
		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get ios() {
		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set ios(value) {
		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get aurora() {
		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set aurora(value) {
		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get md() {
		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set md(value) {
		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get tooltip() {
		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set tooltip(value) {
		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get tooltipTrigger() {
		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set tooltipTrigger(value) {
		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get size() {
		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set size(value) {
		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* node_modules/framework7-svelte/components/button.svelte generated by Svelte v3.18.2 */
const file$4 = "node_modules/framework7-svelte/components/button.svelte";

// (194:0) {:else}
function create_else_block$1(ctx) {
	let a;
	let t0;
	let t1;
	let current;
	let dispose;
	let if_block0 = /*hasIcon*/ ctx[7] && create_if_block_4(ctx);
	let if_block1 = typeof /*text*/ ctx[2] !== "undefined" && create_if_block_3(ctx);
	const default_slot_template = /*$$slots*/ ctx[50].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[49], null);

	let a_levels = [
		{ id: /*id*/ ctx[0] },
		{ style: /*style*/ ctx[1] },
		{ class: /*classes*/ ctx[5] },
		/*attrs*/ ctx[4]
	];

	let a_data = {};

	for (let i = 0; i < a_levels.length; i += 1) {
		a_data = assign(a_data, a_levels[i]);
	}

	const block = {
		c: function create() {
			a = element("a");
			if (if_block0) if_block0.c();
			t0 = space();
			if (if_block1) if_block1.c();
			t1 = space();
			if (default_slot) default_slot.c();
			set_attributes(a, a_data);
			add_location(a, file$4, 194, 2, 5116);
		},
		m: function mount(target, anchor) {
			insert_dev(target, a, anchor);
			if (if_block0) if_block0.m(a, null);
			append_dev(a, t0);
			if (if_block1) if_block1.m(a, null);
			append_dev(a, t1);

			if (default_slot) {
				default_slot.m(a, null);
			}

			/*a_binding*/ ctx[52](a);
			current = true;
			dispose = listen_dev(a, "click", /*onClick*/ ctx[8], false, false, false);
		},
		p: function update(ctx, dirty) {
			if (/*hasIcon*/ ctx[7]) {
				if (if_block0) {
					if_block0.p(ctx, dirty);
					transition_in(if_block0, 1);
				} else {
					if_block0 = create_if_block_4(ctx);
					if_block0.c();
					transition_in(if_block0, 1);
					if_block0.m(a, t0);
				}
			} else if (if_block0) {
				group_outros();

				transition_out(if_block0, 1, 1, () => {
					if_block0 = null;
				});

				check_outros();
			}

			if (typeof /*text*/ ctx[2] !== "undefined") {
				if (if_block1) {
					if_block1.p(ctx, dirty);
				} else {
					if_block1 = create_if_block_3(ctx);
					if_block1.c();
					if_block1.m(a, t1);
				}
			} else if (if_block1) {
				if_block1.d(1);
				if_block1 = null;
			}

			if (default_slot && default_slot.p && dirty[1] & /*$$scope*/ 262144) {
				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[49], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[49], dirty, null));
			}

			set_attributes(a, get_spread_update(a_levels, [
				dirty[0] & /*id*/ 1 && { id: /*id*/ ctx[0] },
				dirty[0] & /*style*/ 2 && { style: /*style*/ ctx[1] },
				dirty[0] & /*classes*/ 32 && { class: /*classes*/ ctx[5] },
				dirty[0] & /*attrs*/ 16 && /*attrs*/ ctx[4]
			]));
		},
		i: function intro(local) {
			if (current) return;
			transition_in(if_block0);
			transition_in(default_slot, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(if_block0);
			transition_out(default_slot, local);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(a);
			if (if_block0) if_block0.d();
			if (if_block1) if_block1.d();
			if (default_slot) default_slot.d(detaching);
			/*a_binding*/ ctx[52](null);
			dispose();
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_else_block$1.name,
		type: "else",
		source: "(194:0) {:else}",
		ctx
	});

	return block;
}

// (168:0) {#if tagName === 'button'}
function create_if_block$1(ctx) {
	let button;
	let t0;
	let t1;
	let current;
	let dispose;
	let if_block0 = /*hasIcon*/ ctx[7] && create_if_block_2(ctx);
	let if_block1 = typeof /*text*/ ctx[2] !== "undefined" && create_if_block_1(ctx);
	const default_slot_template = /*$$slots*/ ctx[50].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[49], null);

	let button_levels = [
		{ id: /*id*/ ctx[0] },
		{ style: /*style*/ ctx[1] },
		{ class: /*classes*/ ctx[5] },
		/*attrs*/ ctx[4]
	];

	let button_data = {};

	for (let i = 0; i < button_levels.length; i += 1) {
		button_data = assign(button_data, button_levels[i]);
	}

	const block = {
		c: function create() {
			button = element("button");
			if (if_block0) if_block0.c();
			t0 = space();
			if (if_block1) if_block1.c();
			t1 = space();
			if (default_slot) default_slot.c();
			set_attributes(button, button_data);
			add_location(button, file$4, 168, 2, 4571);
		},
		m: function mount(target, anchor) {
			insert_dev(target, button, anchor);
			if (if_block0) if_block0.m(button, null);
			append_dev(button, t0);
			if (if_block1) if_block1.m(button, null);
			append_dev(button, t1);

			if (default_slot) {
				default_slot.m(button, null);
			}

			/*button_binding*/ ctx[51](button);
			current = true;
			dispose = listen_dev(button, "click", /*onClick*/ ctx[8], false, false, false);
		},
		p: function update(ctx, dirty) {
			if (/*hasIcon*/ ctx[7]) {
				if (if_block0) {
					if_block0.p(ctx, dirty);
					transition_in(if_block0, 1);
				} else {
					if_block0 = create_if_block_2(ctx);
					if_block0.c();
					transition_in(if_block0, 1);
					if_block0.m(button, t0);
				}
			} else if (if_block0) {
				group_outros();

				transition_out(if_block0, 1, 1, () => {
					if_block0 = null;
				});

				check_outros();
			}

			if (typeof /*text*/ ctx[2] !== "undefined") {
				if (if_block1) {
					if_block1.p(ctx, dirty);
				} else {
					if_block1 = create_if_block_1(ctx);
					if_block1.c();
					if_block1.m(button, t1);
				}
			} else if (if_block1) {
				if_block1.d(1);
				if_block1 = null;
			}

			if (default_slot && default_slot.p && dirty[1] & /*$$scope*/ 262144) {
				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[49], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[49], dirty, null));
			}

			set_attributes(button, get_spread_update(button_levels, [
				dirty[0] & /*id*/ 1 && { id: /*id*/ ctx[0] },
				dirty[0] & /*style*/ 2 && { style: /*style*/ ctx[1] },
				dirty[0] & /*classes*/ 32 && { class: /*classes*/ ctx[5] },
				dirty[0] & /*attrs*/ 16 && /*attrs*/ ctx[4]
			]));
		},
		i: function intro(local) {
			if (current) return;
			transition_in(if_block0);
			transition_in(default_slot, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(if_block0);
			transition_out(default_slot, local);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(button);
			if (if_block0) if_block0.d();
			if (if_block1) if_block1.d();
			if (default_slot) default_slot.d(detaching);
			/*button_binding*/ ctx[51](null);
			dispose();
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block$1.name,
		type: "if",
		source: "(168:0) {#if tagName === 'button'}",
		ctx
	});

	return block;
}

// (203:4) {#if hasIcon}
function create_if_block_4(ctx) {
	let current;

	const icon = new Icon({
			props: {
				material: /*$$props*/ ctx[9].iconMaterial,
				f7: /*$$props*/ ctx[9].iconF7,
				icon: /*$$props*/ ctx[9].icon,
				md: /*$$props*/ ctx[9].iconMd,
				ios: /*$$props*/ ctx[9].iconIos,
				aurora: /*$$props*/ ctx[9].iconAurora,
				color: /*$$props*/ ctx[9].iconColor,
				size: /*$$props*/ ctx[9].iconSize
			},
			$$inline: true
		});

	const block = {
		c: function create() {
			create_component(icon.$$.fragment);
		},
		m: function mount(target, anchor) {
			mount_component(icon, target, anchor);
			current = true;
		},
		p: function update(ctx, dirty) {
			const icon_changes = {};
			if (dirty[0] & /*$$props*/ 512) icon_changes.material = /*$$props*/ ctx[9].iconMaterial;
			if (dirty[0] & /*$$props*/ 512) icon_changes.f7 = /*$$props*/ ctx[9].iconF7;
			if (dirty[0] & /*$$props*/ 512) icon_changes.icon = /*$$props*/ ctx[9].icon;
			if (dirty[0] & /*$$props*/ 512) icon_changes.md = /*$$props*/ ctx[9].iconMd;
			if (dirty[0] & /*$$props*/ 512) icon_changes.ios = /*$$props*/ ctx[9].iconIos;
			if (dirty[0] & /*$$props*/ 512) icon_changes.aurora = /*$$props*/ ctx[9].iconAurora;
			if (dirty[0] & /*$$props*/ 512) icon_changes.color = /*$$props*/ ctx[9].iconColor;
			if (dirty[0] & /*$$props*/ 512) icon_changes.size = /*$$props*/ ctx[9].iconSize;
			icon.$set(icon_changes);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(icon.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(icon.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			destroy_component(icon, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block_4.name,
		type: "if",
		source: "(203:4) {#if hasIcon}",
		ctx
	});

	return block;
}

// (215:4) {#if typeof text !== 'undefined'}
function create_if_block_3(ctx) {
	let span;
	let t_value = Utils.text(/*text*/ ctx[2]) + "";
	let t;

	const block = {
		c: function create() {
			span = element("span");
			t = text(t_value);
			add_location(span, file$4, 215, 6, 5579);
		},
		m: function mount(target, anchor) {
			insert_dev(target, span, anchor);
			append_dev(span, t);
		},
		p: function update(ctx, dirty) {
			if (dirty[0] & /*text*/ 4 && t_value !== (t_value = Utils.text(/*text*/ ctx[2]) + "")) set_data_dev(t, t_value);
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(span);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block_3.name,
		type: "if",
		source: "(215:4) {#if typeof text !== 'undefined'}",
		ctx
	});

	return block;
}

// (177:4) {#if hasIcon}
function create_if_block_2(ctx) {
	let current;

	const icon = new Icon({
			props: {
				material: /*$$props*/ ctx[9].iconMaterial,
				f7: /*$$props*/ ctx[9].iconF7,
				icon: /*$$props*/ ctx[9].icon,
				md: /*$$props*/ ctx[9].iconMd,
				ios: /*$$props*/ ctx[9].iconIos,
				aurora: /*$$props*/ ctx[9].iconAurora,
				color: /*$$props*/ ctx[9].iconColor,
				size: /*$$props*/ ctx[9].iconSize
			},
			$$inline: true
		});

	const block = {
		c: function create() {
			create_component(icon.$$.fragment);
		},
		m: function mount(target, anchor) {
			mount_component(icon, target, anchor);
			current = true;
		},
		p: function update(ctx, dirty) {
			const icon_changes = {};
			if (dirty[0] & /*$$props*/ 512) icon_changes.material = /*$$props*/ ctx[9].iconMaterial;
			if (dirty[0] & /*$$props*/ 512) icon_changes.f7 = /*$$props*/ ctx[9].iconF7;
			if (dirty[0] & /*$$props*/ 512) icon_changes.icon = /*$$props*/ ctx[9].icon;
			if (dirty[0] & /*$$props*/ 512) icon_changes.md = /*$$props*/ ctx[9].iconMd;
			if (dirty[0] & /*$$props*/ 512) icon_changes.ios = /*$$props*/ ctx[9].iconIos;
			if (dirty[0] & /*$$props*/ 512) icon_changes.aurora = /*$$props*/ ctx[9].iconAurora;
			if (dirty[0] & /*$$props*/ 512) icon_changes.color = /*$$props*/ ctx[9].iconColor;
			if (dirty[0] & /*$$props*/ 512) icon_changes.size = /*$$props*/ ctx[9].iconSize;
			icon.$set(icon_changes);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(icon.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(icon.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			destroy_component(icon, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block_2.name,
		type: "if",
		source: "(177:4) {#if hasIcon}",
		ctx
	});

	return block;
}

// (189:4) {#if typeof text !== 'undefined'}
function create_if_block_1(ctx) {
	let span;
	let t_value = Utils.text(/*text*/ ctx[2]) + "";
	let t;

	const block = {
		c: function create() {
			span = element("span");
			t = text(t_value);
			add_location(span, file$4, 189, 6, 5039);
		},
		m: function mount(target, anchor) {
			insert_dev(target, span, anchor);
			append_dev(span, t);
		},
		p: function update(ctx, dirty) {
			if (dirty[0] & /*text*/ 4 && t_value !== (t_value = Utils.text(/*text*/ ctx[2]) + "")) set_data_dev(t, t_value);
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(span);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block_1.name,
		type: "if",
		source: "(189:4) {#if typeof text !== 'undefined'}",
		ctx
	});

	return block;
}

function create_fragment$4(ctx) {
	let current_block_type_index;
	let if_block;
	let if_block_anchor;
	let current;
	const if_block_creators = [create_if_block$1, create_else_block$1];
	const if_blocks = [];

	function select_block_type(ctx, dirty) {
		if (/*tagName*/ ctx[6] === "button") return 0;
		return 1;
	}

	current_block_type_index = select_block_type(ctx);
	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

	const block = {
		c: function create() {
			if_block.c();
			if_block_anchor = empty();
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			if_blocks[current_block_type_index].m(target, anchor);
			insert_dev(target, if_block_anchor, anchor);
			current = true;
		},
		p: function update(ctx, dirty) {
			let previous_block_index = current_block_type_index;
			current_block_type_index = select_block_type(ctx);

			if (current_block_type_index === previous_block_index) {
				if_blocks[current_block_type_index].p(ctx, dirty);
			} else {
				group_outros();

				transition_out(if_blocks[previous_block_index], 1, 1, () => {
					if_blocks[previous_block_index] = null;
				});

				check_outros();
				if_block = if_blocks[current_block_type_index];

				if (!if_block) {
					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
					if_block.c();
				}

				transition_in(if_block, 1);
				if_block.m(if_block_anchor.parentNode, if_block_anchor);
			}
		},
		i: function intro(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},
		o: function outro(local) {
			transition_out(if_block);
			current = false;
		},
		d: function destroy(detaching) {
			if_blocks[current_block_type_index].d(detaching);
			if (detaching) detach_dev(if_block_anchor);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$4.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$4($$self, $$props, $$invalidate) {
	const dispatch = createEventDispatcher();
	let { id = undefined } = $$props;
	let { style = undefined } = $$props;
	let { class: className = undefined } = $$props;
	let { text = undefined } = $$props;
	let { tabLink = undefined } = $$props;
	let { tabLinkActive = false } = $$props;
	let { type = undefined } = $$props;
	let { href = "#" } = $$props;
	let { target = undefined } = $$props;
	let { round = false } = $$props;
	let { roundMd = false } = $$props;
	let { roundIos = false } = $$props;
	let { roundAurora = false } = $$props;
	let { fill = false } = $$props;
	let { fillMd = false } = $$props;
	let { fillIos = false } = $$props;
	let { fillAurora = false } = $$props;
	let { large = false } = $$props;
	let { largeMd = false } = $$props;
	let { largeIos = false } = $$props;
	let { largeAurora = false } = $$props;
	let { small = false } = $$props;
	let { smallMd = false } = $$props;
	let { smallIos = false } = $$props;
	let { smallAurora = false } = $$props;
	let { raised = false } = $$props;
	let { raisedMd = false } = $$props;
	let { raisedIos = false } = $$props;
	let { raisedAurora = false } = $$props;
	let { outline = false } = $$props;
	let { outlineMd = false } = $$props;
	let { outlineIos = false } = $$props;
	let { outlineAurora = false } = $$props;
	let { active = false } = $$props;
	let { disabled = false } = $$props;
	let { tooltip = undefined } = $$props;
	let { tooltipTrigger = undefined } = $$props;
	let el;
	let f7Tooltip;
	let tooltipText = tooltip;

	function watchTooltip(newText) {
		const oldText = tooltipText;
		if (oldText === newText) return;
		tooltipText = newText;

		if (!newText && f7Tooltip) {
			f7Tooltip.destroy();
			f7Tooltip = null;
			return;
		}

		if (newText && !f7Tooltip && f7.instance) {
			f7Tooltip = f7.instance.tooltip.create({
				targetEl: el,
				text: newText,
				trigger: tooltipTrigger
			});

			return;
		}

		if (!newText || !f7Tooltip) return;
		f7Tooltip.setText(newText);
	}

	function onClick() {
		dispatch("click");
		if (typeof $$props.onClick === "function") $$props.onClick();
	}

	onMount(() => {
		if ($$props.routeProps) {
			$$invalidate(3, el.f7RouteProps = $$props.routeProps, el);
		}

		if (!tooltip) return;

		f7.ready(() => {
			f7Tooltip = f7.instance.tooltip.create({
				targetEl: el,
				text: tooltip,
				trigger: tooltipTrigger
			});
		});
	});

	afterUpdate(() => {
		if ($$props.routeProps) {
			$$invalidate(3, el.f7RouteProps = $$props.routeProps, el);
		}
	});

	onDestroy(() => {
		if (el) delete el.f7RouteProps;

		if (f7Tooltip && f7Tooltip.destroy) {
			f7Tooltip.destroy();
			f7Tooltip = null;
		}
	});

	let { $$slots = {}, $$scope } = $$props;

	function button_binding($$value) {
		binding_callbacks[$$value ? "unshift" : "push"](() => {
			$$invalidate(3, el = $$value);
		});
	}

	function a_binding($$value) {
		binding_callbacks[$$value ? "unshift" : "push"](() => {
			$$invalidate(3, el = $$value);
		});
	}

	$$self.$set = $$new_props => {
		$$invalidate(9, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
		if ("id" in $$new_props) $$invalidate(0, id = $$new_props.id);
		if ("style" in $$new_props) $$invalidate(1, style = $$new_props.style);
		if ("class" in $$new_props) $$invalidate(10, className = $$new_props.class);
		if ("text" in $$new_props) $$invalidate(2, text = $$new_props.text);
		if ("tabLink" in $$new_props) $$invalidate(11, tabLink = $$new_props.tabLink);
		if ("tabLinkActive" in $$new_props) $$invalidate(12, tabLinkActive = $$new_props.tabLinkActive);
		if ("type" in $$new_props) $$invalidate(13, type = $$new_props.type);
		if ("href" in $$new_props) $$invalidate(14, href = $$new_props.href);
		if ("target" in $$new_props) $$invalidate(15, target = $$new_props.target);
		if ("round" in $$new_props) $$invalidate(16, round = $$new_props.round);
		if ("roundMd" in $$new_props) $$invalidate(17, roundMd = $$new_props.roundMd);
		if ("roundIos" in $$new_props) $$invalidate(18, roundIos = $$new_props.roundIos);
		if ("roundAurora" in $$new_props) $$invalidate(19, roundAurora = $$new_props.roundAurora);
		if ("fill" in $$new_props) $$invalidate(20, fill = $$new_props.fill);
		if ("fillMd" in $$new_props) $$invalidate(21, fillMd = $$new_props.fillMd);
		if ("fillIos" in $$new_props) $$invalidate(22, fillIos = $$new_props.fillIos);
		if ("fillAurora" in $$new_props) $$invalidate(23, fillAurora = $$new_props.fillAurora);
		if ("large" in $$new_props) $$invalidate(24, large = $$new_props.large);
		if ("largeMd" in $$new_props) $$invalidate(25, largeMd = $$new_props.largeMd);
		if ("largeIos" in $$new_props) $$invalidate(26, largeIos = $$new_props.largeIos);
		if ("largeAurora" in $$new_props) $$invalidate(27, largeAurora = $$new_props.largeAurora);
		if ("small" in $$new_props) $$invalidate(28, small = $$new_props.small);
		if ("smallMd" in $$new_props) $$invalidate(29, smallMd = $$new_props.smallMd);
		if ("smallIos" in $$new_props) $$invalidate(30, smallIos = $$new_props.smallIos);
		if ("smallAurora" in $$new_props) $$invalidate(31, smallAurora = $$new_props.smallAurora);
		if ("raised" in $$new_props) $$invalidate(32, raised = $$new_props.raised);
		if ("raisedMd" in $$new_props) $$invalidate(33, raisedMd = $$new_props.raisedMd);
		if ("raisedIos" in $$new_props) $$invalidate(34, raisedIos = $$new_props.raisedIos);
		if ("raisedAurora" in $$new_props) $$invalidate(35, raisedAurora = $$new_props.raisedAurora);
		if ("outline" in $$new_props) $$invalidate(36, outline = $$new_props.outline);
		if ("outlineMd" in $$new_props) $$invalidate(37, outlineMd = $$new_props.outlineMd);
		if ("outlineIos" in $$new_props) $$invalidate(38, outlineIos = $$new_props.outlineIos);
		if ("outlineAurora" in $$new_props) $$invalidate(39, outlineAurora = $$new_props.outlineAurora);
		if ("active" in $$new_props) $$invalidate(40, active = $$new_props.active);
		if ("disabled" in $$new_props) $$invalidate(41, disabled = $$new_props.disabled);
		if ("tooltip" in $$new_props) $$invalidate(42, tooltip = $$new_props.tooltip);
		if ("tooltipTrigger" in $$new_props) $$invalidate(43, tooltipTrigger = $$new_props.tooltipTrigger);
		if ("$$scope" in $$new_props) $$invalidate(49, $$scope = $$new_props.$$scope);
	};

	$$self.$capture_state = () => {
		return {
			id,
			style,
			className,
			text,
			tabLink,
			tabLinkActive,
			type,
			href,
			target,
			round,
			roundMd,
			roundIos,
			roundAurora,
			fill,
			fillMd,
			fillIos,
			fillAurora,
			large,
			largeMd,
			largeIos,
			largeAurora,
			small,
			smallMd,
			smallIos,
			smallAurora,
			raised,
			raisedMd,
			raisedIos,
			raisedAurora,
			outline,
			outlineMd,
			outlineIos,
			outlineAurora,
			active,
			disabled,
			tooltip,
			tooltipTrigger,
			el,
			f7Tooltip,
			tooltipText,
			hrefComputed,
			attrs,
			classes,
			tagName,
			hasIcon
		};
	};

	$$self.$inject_state = $$new_props => {
		$$invalidate(9, $$props = assign(assign({}, $$props), $$new_props));
		if ("id" in $$props) $$invalidate(0, id = $$new_props.id);
		if ("style" in $$props) $$invalidate(1, style = $$new_props.style);
		if ("className" in $$props) $$invalidate(10, className = $$new_props.className);
		if ("text" in $$props) $$invalidate(2, text = $$new_props.text);
		if ("tabLink" in $$props) $$invalidate(11, tabLink = $$new_props.tabLink);
		if ("tabLinkActive" in $$props) $$invalidate(12, tabLinkActive = $$new_props.tabLinkActive);
		if ("type" in $$props) $$invalidate(13, type = $$new_props.type);
		if ("href" in $$props) $$invalidate(14, href = $$new_props.href);
		if ("target" in $$props) $$invalidate(15, target = $$new_props.target);
		if ("round" in $$props) $$invalidate(16, round = $$new_props.round);
		if ("roundMd" in $$props) $$invalidate(17, roundMd = $$new_props.roundMd);
		if ("roundIos" in $$props) $$invalidate(18, roundIos = $$new_props.roundIos);
		if ("roundAurora" in $$props) $$invalidate(19, roundAurora = $$new_props.roundAurora);
		if ("fill" in $$props) $$invalidate(20, fill = $$new_props.fill);
		if ("fillMd" in $$props) $$invalidate(21, fillMd = $$new_props.fillMd);
		if ("fillIos" in $$props) $$invalidate(22, fillIos = $$new_props.fillIos);
		if ("fillAurora" in $$props) $$invalidate(23, fillAurora = $$new_props.fillAurora);
		if ("large" in $$props) $$invalidate(24, large = $$new_props.large);
		if ("largeMd" in $$props) $$invalidate(25, largeMd = $$new_props.largeMd);
		if ("largeIos" in $$props) $$invalidate(26, largeIos = $$new_props.largeIos);
		if ("largeAurora" in $$props) $$invalidate(27, largeAurora = $$new_props.largeAurora);
		if ("small" in $$props) $$invalidate(28, small = $$new_props.small);
		if ("smallMd" in $$props) $$invalidate(29, smallMd = $$new_props.smallMd);
		if ("smallIos" in $$props) $$invalidate(30, smallIos = $$new_props.smallIos);
		if ("smallAurora" in $$props) $$invalidate(31, smallAurora = $$new_props.smallAurora);
		if ("raised" in $$props) $$invalidate(32, raised = $$new_props.raised);
		if ("raisedMd" in $$props) $$invalidate(33, raisedMd = $$new_props.raisedMd);
		if ("raisedIos" in $$props) $$invalidate(34, raisedIos = $$new_props.raisedIos);
		if ("raisedAurora" in $$props) $$invalidate(35, raisedAurora = $$new_props.raisedAurora);
		if ("outline" in $$props) $$invalidate(36, outline = $$new_props.outline);
		if ("outlineMd" in $$props) $$invalidate(37, outlineMd = $$new_props.outlineMd);
		if ("outlineIos" in $$props) $$invalidate(38, outlineIos = $$new_props.outlineIos);
		if ("outlineAurora" in $$props) $$invalidate(39, outlineAurora = $$new_props.outlineAurora);
		if ("active" in $$props) $$invalidate(40, active = $$new_props.active);
		if ("disabled" in $$props) $$invalidate(41, disabled = $$new_props.disabled);
		if ("tooltip" in $$props) $$invalidate(42, tooltip = $$new_props.tooltip);
		if ("tooltipTrigger" in $$props) $$invalidate(43, tooltipTrigger = $$new_props.tooltipTrigger);
		if ("el" in $$props) $$invalidate(3, el = $$new_props.el);
		if ("f7Tooltip" in $$props) f7Tooltip = $$new_props.f7Tooltip;
		if ("tooltipText" in $$props) tooltipText = $$new_props.tooltipText;
		if ("hrefComputed" in $$props) $$invalidate(46, hrefComputed = $$new_props.hrefComputed);
		if ("attrs" in $$props) $$invalidate(4, attrs = $$new_props.attrs);
		if ("classes" in $$props) $$invalidate(5, classes = $$new_props.classes);
		if ("tagName" in $$props) $$invalidate(6, tagName = $$new_props.tagName);
		if ("hasIcon" in $$props) $$invalidate(7, hasIcon = $$new_props.hasIcon);
	};

	let hrefComputed;
	let attrs;
	let classes;
	let tagName;
	let hasIcon;

	$$self.$$.update = () => {
		if ($$self.$$.dirty[0] & /*href*/ 16384) {
			 $$invalidate(46, hrefComputed = href === true ? "#" : href || undefined);
		}

		 $$invalidate(4, attrs = Utils.extend(
			{
				href: hrefComputed,
				target,
				type,
				"data-tab": Utils.isStringProp(tabLink) && tabLink || undefined
			},
			Mixins.linkRouterAttrs($$props),
			Mixins.linkActionsAttrs($$props)
		));

		 $$invalidate(5, classes = Utils.classNames(
			className,
			"button",
			{
				"tab-link": tabLink || tabLink === "",
				"tab-link-active": tabLinkActive,
				"button-round": round,
				"button-round-ios": roundIos,
				"button-round-aurora": roundAurora,
				"button-round-md": roundMd,
				"button-fill": fill,
				"button-fill-ios": fillIos,
				"button-fill-aurora": fillAurora,
				"button-fill-md": fillMd,
				"button-large": large,
				"button-large-ios": largeIos,
				"button-large-aurora": largeAurora,
				"button-large-md": largeMd,
				"button-small": small,
				"button-small-ios": smallIos,
				"button-small-aurora": smallAurora,
				"button-small-md": smallMd,
				"button-raised": raised,
				"button-raised-ios": raisedIos,
				"button-raised-aurora": raisedAurora,
				"button-raised-md": raisedMd,
				"button-active": active,
				"button-outline": outline,
				"button-outline-ios": outlineIos,
				"button-outline-aurora": outlineAurora,
				"button-outline-md": outlineMd,
				disabled
			},
			Mixins.colorClasses($$props),
			Mixins.linkRouterClasses($$props),
			Mixins.linkActionsClasses($$props)
		));

		if ($$self.$$.dirty[0] & /*type*/ 8192) {
			 $$invalidate(6, tagName = type === "submit" || type === "reset" || type === "button"
			? "button"
			: "a");
		}

		 $$invalidate(7, hasIcon = $$props.icon || $$props.iconMaterial || $$props.iconF7 || $$props.iconMd || $$props.iconIos || $$props.iconAurora);

		if ($$self.$$.dirty[1] & /*tooltip*/ 2048) {
			 watchTooltip(tooltip);
		}
	};

	$$props = exclude_internal_props($$props);

	return [
		id,
		style,
		text,
		el,
		attrs,
		classes,
		tagName,
		hasIcon,
		onClick,
		$$props,
		className,
		tabLink,
		tabLinkActive,
		type,
		href,
		target,
		round,
		roundMd,
		roundIos,
		roundAurora,
		fill,
		fillMd,
		fillIos,
		fillAurora,
		large,
		largeMd,
		largeIos,
		largeAurora,
		small,
		smallMd,
		smallIos,
		smallAurora,
		raised,
		raisedMd,
		raisedIos,
		raisedAurora,
		outline,
		outlineMd,
		outlineIos,
		outlineAurora,
		active,
		disabled,
		tooltip,
		tooltipTrigger,
		f7Tooltip,
		tooltipText,
		hrefComputed,
		dispatch,
		watchTooltip,
		$$scope,
		$$slots,
		button_binding,
		a_binding
	];
}

class Button extends SvelteComponentDev {
	constructor(options) {
		super(options);

		init(
			this,
			options,
			instance$4,
			create_fragment$4,
			safe_not_equal,
			{
				id: 0,
				style: 1,
				class: 10,
				text: 2,
				tabLink: 11,
				tabLinkActive: 12,
				type: 13,
				href: 14,
				target: 15,
				round: 16,
				roundMd: 17,
				roundIos: 18,
				roundAurora: 19,
				fill: 20,
				fillMd: 21,
				fillIos: 22,
				fillAurora: 23,
				large: 24,
				largeMd: 25,
				largeIos: 26,
				largeAurora: 27,
				small: 28,
				smallMd: 29,
				smallIos: 30,
				smallAurora: 31,
				raised: 32,
				raisedMd: 33,
				raisedIos: 34,
				raisedAurora: 35,
				outline: 36,
				outlineMd: 37,
				outlineIos: 38,
				outlineAurora: 39,
				active: 40,
				disabled: 41,
				tooltip: 42,
				tooltipTrigger: 43
			},
			[-1, -1]
		);

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Button",
			options,
			id: create_fragment$4.name
		});
	}

	get id() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set id(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get style() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set style(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get class() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set class(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get text() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set text(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get tabLink() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set tabLink(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get tabLinkActive() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set tabLinkActive(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get type() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set type(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get href() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set href(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get target() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set target(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get round() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set round(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get roundMd() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set roundMd(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get roundIos() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set roundIos(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get roundAurora() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set roundAurora(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get fill() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set fill(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get fillMd() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set fillMd(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get fillIos() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set fillIos(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get fillAurora() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set fillAurora(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get large() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set large(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get largeMd() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set largeMd(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get largeIos() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set largeIos(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get largeAurora() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set largeAurora(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get small() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set small(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get smallMd() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set smallMd(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get smallIos() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set smallIos(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get smallAurora() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set smallAurora(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get raised() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set raised(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get raisedMd() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set raisedMd(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get raisedIos() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set raisedIos(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get raisedAurora() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set raisedAurora(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get outline() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set outline(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get outlineMd() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set outlineMd(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get outlineIos() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set outlineIos(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get outlineAurora() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set outlineAurora(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get active() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set active(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get disabled() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set disabled(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get tooltip() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set tooltip(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get tooltipTrigger() {
		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set tooltipTrigger(value) {
		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* node_modules/framework7-svelte/components/preloader.svelte generated by Svelte v3.18.2 */
const file$5 = "node_modules/framework7-svelte/components/preloader.svelte";

// (67:2) {:else}
function create_else_block$2(ctx) {
	let span;

	const block = {
		c: function create() {
			span = element("span");
			attr_dev(span, "class", "preloader-inner");
			add_location(span, file$5, 67, 2, 2042);
		},
		m: function mount(target, anchor) {
			insert_dev(target, span, anchor);
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(span);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_else_block$2.name,
		type: "else",
		source: "(67:2) {:else}",
		ctx
	});

	return block;
}

// (63:36) 
function create_if_block_2$1(ctx) {
	let span1;
	let span0;

	const block = {
		c: function create() {
			span1 = element("span");
			span0 = element("span");
			attr_dev(span0, "class", "preloader-inner-circle");
			add_location(span0, file$5, 64, 4, 1975);
			attr_dev(span1, "class", "preloader-inner");
			add_location(span1, file$5, 63, 2, 1940);
		},
		m: function mount(target, anchor) {
			insert_dev(target, span1, anchor);
			append_dev(span1, span0);
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(span1);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block_2$1.name,
		type: "if",
		source: "(63:36) ",
		ctx
	});

	return block;
}

// (48:33) 
function create_if_block_1$1(ctx) {
	let span12;
	let span0;
	let t0;
	let span1;
	let t1;
	let span2;
	let t2;
	let span3;
	let t3;
	let span4;
	let t4;
	let span5;
	let t5;
	let span6;
	let t6;
	let span7;
	let t7;
	let span8;
	let t8;
	let span9;
	let t9;
	let span10;
	let t10;
	let span11;

	const block = {
		c: function create() {
			span12 = element("span");
			span0 = element("span");
			t0 = space();
			span1 = element("span");
			t1 = space();
			span2 = element("span");
			t2 = space();
			span3 = element("span");
			t3 = space();
			span4 = element("span");
			t4 = space();
			span5 = element("span");
			t5 = space();
			span6 = element("span");
			t6 = space();
			span7 = element("span");
			t7 = space();
			span8 = element("span");
			t8 = space();
			span9 = element("span");
			t9 = space();
			span10 = element("span");
			t10 = space();
			span11 = element("span");
			attr_dev(span0, "class", "preloader-inner-line");
			add_location(span0, file$5, 49, 4, 1331);
			attr_dev(span1, "class", "preloader-inner-line");
			add_location(span1, file$5, 50, 4, 1378);
			attr_dev(span2, "class", "preloader-inner-line");
			add_location(span2, file$5, 51, 4, 1425);
			attr_dev(span3, "class", "preloader-inner-line");
			add_location(span3, file$5, 52, 4, 1472);
			attr_dev(span4, "class", "preloader-inner-line");
			add_location(span4, file$5, 53, 4, 1519);
			attr_dev(span5, "class", "preloader-inner-line");
			add_location(span5, file$5, 54, 4, 1566);
			attr_dev(span6, "class", "preloader-inner-line");
			add_location(span6, file$5, 55, 4, 1613);
			attr_dev(span7, "class", "preloader-inner-line");
			add_location(span7, file$5, 56, 4, 1660);
			attr_dev(span8, "class", "preloader-inner-line");
			add_location(span8, file$5, 57, 4, 1707);
			attr_dev(span9, "class", "preloader-inner-line");
			add_location(span9, file$5, 58, 4, 1754);
			attr_dev(span10, "class", "preloader-inner-line");
			add_location(span10, file$5, 59, 4, 1801);
			attr_dev(span11, "class", "preloader-inner-line");
			add_location(span11, file$5, 60, 4, 1848);
			attr_dev(span12, "class", "preloader-inner");
			add_location(span12, file$5, 48, 2, 1296);
		},
		m: function mount(target, anchor) {
			insert_dev(target, span12, anchor);
			append_dev(span12, span0);
			append_dev(span12, t0);
			append_dev(span12, span1);
			append_dev(span12, t1);
			append_dev(span12, span2);
			append_dev(span12, t2);
			append_dev(span12, span3);
			append_dev(span12, t3);
			append_dev(span12, span4);
			append_dev(span12, t4);
			append_dev(span12, span5);
			append_dev(span12, t5);
			append_dev(span12, span6);
			append_dev(span12, t6);
			append_dev(span12, span7);
			append_dev(span12, t7);
			append_dev(span12, span8);
			append_dev(span12, t8);
			append_dev(span12, span9);
			append_dev(span12, t9);
			append_dev(span12, span10);
			append_dev(span12, t10);
			append_dev(span12, span11);
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(span12);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block_1$1.name,
		type: "if",
		source: "(48:33) ",
		ctx
	});

	return block;
}

// (38:2) {#if _theme && _theme.md}
function create_if_block$2(ctx) {
	let span5;
	let span0;
	let t0;
	let span2;
	let span1;
	let t1;
	let span4;
	let span3;

	const block = {
		c: function create() {
			span5 = element("span");
			span0 = element("span");
			t0 = space();
			span2 = element("span");
			span1 = element("span");
			t1 = space();
			span4 = element("span");
			span3 = element("span");
			attr_dev(span0, "class", "preloader-inner-gap");
			add_location(span0, file$5, 39, 4, 1006);
			attr_dev(span1, "class", "preloader-inner-half-circle");
			add_location(span1, file$5, 41, 6, 1089);
			attr_dev(span2, "class", "preloader-inner-left");
			add_location(span2, file$5, 40, 4, 1047);
			attr_dev(span3, "class", "preloader-inner-half-circle");
			add_location(span3, file$5, 44, 6, 1193);
			attr_dev(span4, "class", "preloader-inner-right");
			add_location(span4, file$5, 43, 4, 1150);
			attr_dev(span5, "class", "preloader-inner");
			add_location(span5, file$5, 38, 2, 971);
		},
		m: function mount(target, anchor) {
			insert_dev(target, span5, anchor);
			append_dev(span5, span0);
			append_dev(span5, t0);
			append_dev(span5, span2);
			append_dev(span2, span1);
			append_dev(span5, t1);
			append_dev(span5, span4);
			append_dev(span4, span3);
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(span5);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block$2.name,
		type: "if",
		source: "(38:2) {#if _theme && _theme.md}",
		ctx
	});

	return block;
}

function create_fragment$5(ctx) {
	let span;

	function select_block_type(ctx, dirty) {
		if (/*_theme*/ ctx[1] && /*_theme*/ ctx[1].md) return create_if_block$2;
		if (/*_theme*/ ctx[1] && /*_theme*/ ctx[1].ios) return create_if_block_1$1;
		if (/*_theme*/ ctx[1] && /*_theme*/ ctx[1].aurora) return create_if_block_2$1;
		return create_else_block$2;
	}

	let current_block_type = select_block_type(ctx);
	let if_block = current_block_type(ctx);

	const block = {
		c: function create() {
			span = element("span");
			if_block.c();
			attr_dev(span, "id", /*id*/ ctx[0]);
			attr_dev(span, "style", /*preloaderStyle*/ ctx[2]);
			attr_dev(span, "class", /*classes*/ ctx[3]);
			add_location(span, file$5, 36, 0, 887);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, span, anchor);
			if_block.m(span, null);
		},
		p: function update(ctx, [dirty]) {
			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
				if_block.d(1);
				if_block = current_block_type(ctx);

				if (if_block) {
					if_block.c();
					if_block.m(span, null);
				}
			}

			if (dirty & /*id*/ 1) {
				attr_dev(span, "id", /*id*/ ctx[0]);
			}

			if (dirty & /*preloaderStyle*/ 4) {
				attr_dev(span, "style", /*preloaderStyle*/ ctx[2]);
			}

			if (dirty & /*classes*/ 8) {
				attr_dev(span, "class", /*classes*/ ctx[3]);
			}
		},
		i: noop,
		o: noop,
		d: function destroy(detaching) {
			if (detaching) detach_dev(span);
			if_block.d();
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$5.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$5($$self, $$props, $$invalidate) {
	let { class: className = undefined } = $$props;
	let { id = undefined } = $$props;
	let { style = undefined } = $$props;
	let { size = undefined } = $$props;

	// eslint-disable-next-line
	let _theme = f7.instance ? f7Theme : null;

	if (!f7.instance) {
		f7.ready(() => {
			$$invalidate(1, _theme = f7Theme);
		});
	}

	$$self.$set = $$new_props => {
		$$invalidate(8, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
		if ("class" in $$new_props) $$invalidate(4, className = $$new_props.class);
		if ("id" in $$new_props) $$invalidate(0, id = $$new_props.id);
		if ("style" in $$new_props) $$invalidate(5, style = $$new_props.style);
		if ("size" in $$new_props) $$invalidate(6, size = $$new_props.size);
	};

	$$self.$capture_state = () => {
		return {
			className,
			id,
			style,
			size,
			_theme,
			sizeComputed,
			preloaderStyle,
			classes
		};
	};

	$$self.$inject_state = $$new_props => {
		$$invalidate(8, $$props = assign(assign({}, $$props), $$new_props));
		if ("className" in $$props) $$invalidate(4, className = $$new_props.className);
		if ("id" in $$props) $$invalidate(0, id = $$new_props.id);
		if ("style" in $$props) $$invalidate(5, style = $$new_props.style);
		if ("size" in $$props) $$invalidate(6, size = $$new_props.size);
		if ("_theme" in $$props) $$invalidate(1, _theme = $$new_props._theme);
		if ("sizeComputed" in $$props) $$invalidate(7, sizeComputed = $$new_props.sizeComputed);
		if ("preloaderStyle" in $$props) $$invalidate(2, preloaderStyle = $$new_props.preloaderStyle);
		if ("classes" in $$props) $$invalidate(3, classes = $$new_props.classes);
	};

	let sizeComputed;
	let preloaderStyle;
	let classes;

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*size*/ 64) {
			 $$invalidate(7, sizeComputed = size && typeof size === "string" && size.indexOf("px") >= 0
			? size.replace("px", "")
			: size);
		}

		if ($$self.$$.dirty & /*style, sizeComputed*/ 160) {
			 $$invalidate(2, preloaderStyle = ((style || "") + (sizeComputed
			? `;width: ${sizeComputed}px; height: ${sizeComputed}px; --f7-preloader-size: ${sizeComputed}px`
			: "")).replace(";;", ";"));
		}

		 $$invalidate(3, classes = Utils.classNames(className, "preloader", Mixins.colorClasses($$props)));
	};

	$$props = exclude_internal_props($$props);
	return [id, _theme, preloaderStyle, classes, className, style, size];
}

class Preloader extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$5, create_fragment$5, safe_not_equal, { class: 4, id: 0, style: 5, size: 6 });

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Preloader",
			options,
			id: create_fragment$5.name
		});
	}

	get class() {
		throw new Error("<Preloader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set class(value) {
		throw new Error("<Preloader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get id() {
		throw new Error("<Preloader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set id(value) {
		throw new Error("<Preloader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get style() {
		throw new Error("<Preloader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set style(value) {
		throw new Error("<Preloader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get size() {
		throw new Error("<Preloader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set size(value) {
		throw new Error("<Preloader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* node_modules/framework7-svelte/components/page-content.svelte generated by Svelte v3.18.2 */
const file$6 = "node_modules/framework7-svelte/components/page-content.svelte";

// (150:2) {#if ptr && ptrPreloader && !ptrBottom}
function create_if_block_3$1(ctx) {
	let div1;
	let t;
	let div0;
	let current;
	const preloader = new Preloader({ $$inline: true });

	const block = {
		c: function create() {
			div1 = element("div");
			create_component(preloader.$$.fragment);
			t = space();
			div0 = element("div");
			attr_dev(div0, "class", "ptr-arrow");
			add_location(div0, file$6, 152, 6, 4502);
			attr_dev(div1, "class", "ptr-preloader");
			add_location(div1, file$6, 150, 4, 4448);
		},
		m: function mount(target, anchor) {
			insert_dev(target, div1, anchor);
			mount_component(preloader, div1, null);
			append_dev(div1, t);
			append_dev(div1, div0);
			current = true;
		},
		i: function intro(local) {
			if (current) return;
			transition_in(preloader.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(preloader.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(div1);
			destroy_component(preloader);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block_3$1.name,
		type: "if",
		source: "(150:2) {#if ptr && ptrPreloader && !ptrBottom}",
		ctx
	});

	return block;
}

// (156:2) {#if infinite && infiniteTop && infinitePreloader}
function create_if_block_2$2(ctx) {
	let current;

	const preloader = new Preloader({
			props: { class: "infinite-scroll-preloader" },
			$$inline: true
		});

	const block = {
		c: function create() {
			create_component(preloader.$$.fragment);
		},
		m: function mount(target, anchor) {
			mount_component(preloader, target, anchor);
			current = true;
		},
		i: function intro(local) {
			if (current) return;
			transition_in(preloader.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(preloader.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			destroy_component(preloader, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block_2$2.name,
		type: "if",
		source: "(156:2) {#if infinite && infiniteTop && infinitePreloader}",
		ctx
	});

	return block;
}

// (160:2) {#if infinite && !infiniteTop && infinitePreloader}
function create_if_block_1$2(ctx) {
	let current;

	const preloader = new Preloader({
			props: { class: "infinite-scroll-preloader" },
			$$inline: true
		});

	const block = {
		c: function create() {
			create_component(preloader.$$.fragment);
		},
		m: function mount(target, anchor) {
			mount_component(preloader, target, anchor);
			current = true;
		},
		i: function intro(local) {
			if (current) return;
			transition_in(preloader.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(preloader.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			destroy_component(preloader, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block_1$2.name,
		type: "if",
		source: "(160:2) {#if infinite && !infiniteTop && infinitePreloader}",
		ctx
	});

	return block;
}

// (163:2) {#if ptr && ptrPreloader && ptrBottom}
function create_if_block$3(ctx) {
	let div1;
	let t;
	let div0;
	let current;
	const preloader = new Preloader({ $$inline: true });

	const block = {
		c: function create() {
			div1 = element("div");
			create_component(preloader.$$.fragment);
			t = space();
			div0 = element("div");
			attr_dev(div0, "class", "ptr-arrow");
			add_location(div0, file$6, 165, 6, 4882);
			attr_dev(div1, "class", "ptr-preloader");
			add_location(div1, file$6, 163, 4, 4828);
		},
		m: function mount(target, anchor) {
			insert_dev(target, div1, anchor);
			mount_component(preloader, div1, null);
			append_dev(div1, t);
			append_dev(div1, div0);
			current = true;
		},
		i: function intro(local) {
			if (current) return;
			transition_in(preloader.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(preloader.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(div1);
			destroy_component(preloader);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block$3.name,
		type: "if",
		source: "(163:2) {#if ptr && ptrPreloader && ptrBottom}",
		ctx
	});

	return block;
}

function create_fragment$6(ctx) {
	let div;
	let t0;
	let t1;
	let t2;
	let t3;
	let div_data_ptr_mousewheel_value;
	let div_data_infinite_distance_value;
	let current;
	let if_block0 = /*ptr*/ ctx[2] && /*ptrPreloader*/ ctx[4] && !/*ptrBottom*/ ctx[5] && create_if_block_3$1(ctx);
	let if_block1 = /*infinite*/ ctx[7] && /*infiniteTop*/ ctx[8] && /*infinitePreloader*/ ctx[10] && create_if_block_2$2(ctx);
	const default_slot_template = /*$$slots*/ ctx[34].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[33], null);
	let if_block2 = /*infinite*/ ctx[7] && !/*infiniteTop*/ ctx[8] && /*infinitePreloader*/ ctx[10] && create_if_block_1$2(ctx);
	let if_block3 = /*ptr*/ ctx[2] && /*ptrPreloader*/ ctx[4] && /*ptrBottom*/ ctx[5] && create_if_block$3(ctx);

	const block = {
		c: function create() {
			div = element("div");
			if (if_block0) if_block0.c();
			t0 = space();
			if (if_block1) if_block1.c();
			t1 = space();
			if (default_slot) default_slot.c();
			t2 = space();
			if (if_block2) if_block2.c();
			t3 = space();
			if (if_block3) if_block3.c();
			attr_dev(div, "class", /*pageContentClasses*/ ctx[12]);
			attr_dev(div, "style", /*style*/ ctx[1]);
			attr_dev(div, "id", /*id*/ ctx[0]);
			attr_dev(div, "data-ptr-distance", /*ptrDistance*/ ctx[3]);
			attr_dev(div, "data-ptr-mousewheel", div_data_ptr_mousewheel_value = /*ptrMousewheel*/ ctx[6] || undefined);
			attr_dev(div, "data-infinite-distance", div_data_infinite_distance_value = /*infiniteDistance*/ ctx[9] || undefined);
			add_location(div, file$6, 140, 0, 4170);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, div, anchor);
			if (if_block0) if_block0.m(div, null);
			append_dev(div, t0);
			if (if_block1) if_block1.m(div, null);
			append_dev(div, t1);

			if (default_slot) {
				default_slot.m(div, null);
			}

			append_dev(div, t2);
			if (if_block2) if_block2.m(div, null);
			append_dev(div, t3);
			if (if_block3) if_block3.m(div, null);
			/*div_binding*/ ctx[35](div);
			current = true;
		},
		p: function update(ctx, dirty) {
			if (/*ptr*/ ctx[2] && /*ptrPreloader*/ ctx[4] && !/*ptrBottom*/ ctx[5]) {
				if (!if_block0) {
					if_block0 = create_if_block_3$1(ctx);
					if_block0.c();
					transition_in(if_block0, 1);
					if_block0.m(div, t0);
				} else {
					transition_in(if_block0, 1);
				}
			} else if (if_block0) {
				group_outros();

				transition_out(if_block0, 1, 1, () => {
					if_block0 = null;
				});

				check_outros();
			}

			if (/*infinite*/ ctx[7] && /*infiniteTop*/ ctx[8] && /*infinitePreloader*/ ctx[10]) {
				if (!if_block1) {
					if_block1 = create_if_block_2$2(ctx);
					if_block1.c();
					transition_in(if_block1, 1);
					if_block1.m(div, t1);
				} else {
					transition_in(if_block1, 1);
				}
			} else if (if_block1) {
				group_outros();

				transition_out(if_block1, 1, 1, () => {
					if_block1 = null;
				});

				check_outros();
			}

			if (default_slot && default_slot.p && dirty[1] & /*$$scope*/ 4) {
				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[33], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[33], dirty, null));
			}

			if (/*infinite*/ ctx[7] && !/*infiniteTop*/ ctx[8] && /*infinitePreloader*/ ctx[10]) {
				if (!if_block2) {
					if_block2 = create_if_block_1$2(ctx);
					if_block2.c();
					transition_in(if_block2, 1);
					if_block2.m(div, t3);
				} else {
					transition_in(if_block2, 1);
				}
			} else if (if_block2) {
				group_outros();

				transition_out(if_block2, 1, 1, () => {
					if_block2 = null;
				});

				check_outros();
			}

			if (/*ptr*/ ctx[2] && /*ptrPreloader*/ ctx[4] && /*ptrBottom*/ ctx[5]) {
				if (!if_block3) {
					if_block3 = create_if_block$3(ctx);
					if_block3.c();
					transition_in(if_block3, 1);
					if_block3.m(div, null);
				} else {
					transition_in(if_block3, 1);
				}
			} else if (if_block3) {
				group_outros();

				transition_out(if_block3, 1, 1, () => {
					if_block3 = null;
				});

				check_outros();
			}

			if (!current || dirty[0] & /*pageContentClasses*/ 4096) {
				attr_dev(div, "class", /*pageContentClasses*/ ctx[12]);
			}

			if (!current || dirty[0] & /*style*/ 2) {
				attr_dev(div, "style", /*style*/ ctx[1]);
			}

			if (!current || dirty[0] & /*id*/ 1) {
				attr_dev(div, "id", /*id*/ ctx[0]);
			}

			if (!current || dirty[0] & /*ptrDistance*/ 8) {
				attr_dev(div, "data-ptr-distance", /*ptrDistance*/ ctx[3]);
			}

			if (!current || dirty[0] & /*ptrMousewheel*/ 64 && div_data_ptr_mousewheel_value !== (div_data_ptr_mousewheel_value = /*ptrMousewheel*/ ctx[6] || undefined)) {
				attr_dev(div, "data-ptr-mousewheel", div_data_ptr_mousewheel_value);
			}

			if (!current || dirty[0] & /*infiniteDistance*/ 512 && div_data_infinite_distance_value !== (div_data_infinite_distance_value = /*infiniteDistance*/ ctx[9] || undefined)) {
				attr_dev(div, "data-infinite-distance", div_data_infinite_distance_value);
			}
		},
		i: function intro(local) {
			if (current) return;
			transition_in(if_block0);
			transition_in(if_block1);
			transition_in(default_slot, local);
			transition_in(if_block2);
			transition_in(if_block3);
			current = true;
		},
		o: function outro(local) {
			transition_out(if_block0);
			transition_out(if_block1);
			transition_out(default_slot, local);
			transition_out(if_block2);
			transition_out(if_block3);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(div);
			if (if_block0) if_block0.d();
			if (if_block1) if_block1.d();
			if (default_slot) default_slot.d(detaching);
			if (if_block2) if_block2.d();
			if (if_block3) if_block3.d();
			/*div_binding*/ ctx[35](null);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$6.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$6($$self, $$props, $$invalidate) {
	const dispatch = createEventDispatcher();
	let { id = undefined } = $$props;
	let { style = undefined } = $$props;
	let { tab = false } = $$props;
	let { tabActive = false } = $$props;
	let { ptr = false } = $$props;
	let { ptrDistance = undefined } = $$props;
	let { ptrPreloader = true } = $$props;
	let { ptrBottom = false } = $$props;
	let { ptrMousewheel = false } = $$props;
	let { infinite = false } = $$props;
	let { infiniteTop = false } = $$props;
	let { infiniteDistance = undefined } = $$props;
	let { infinitePreloader = true } = $$props;
	let { hideBarsOnScroll = false } = $$props;
	let { hideNavbarOnScroll = false } = $$props;
	let { hideToolbarOnScroll = false } = $$props;
	let { messagesContent = false } = $$props;
	let { loginScreen = false } = $$props;
	let { class: className = undefined } = $$props;
	let pageContentEl;

	// Event handlers
	function onPtrPullStart(ptrEl) {
		if (ptrEl !== pageContentEl) return;
		dispatch("ptrPullStart");
		if (typeof $$props.onPtrPullStart === "function") $$props.onPtrPullStart();
	}

	function onPtrPullMove(ptrEl) {
		if (ptrEl !== pageContentEl) return;
		dispatch("ptrPullMove");
		if (typeof $$props.onPtrPullMove === "function") $$props.onPtrPullMove();
	}

	function onPtrPullEnd(ptrEl) {
		if (ptrEl !== pageContentEl) return;
		dispatch("ptrPullEnd");
		if (typeof $$props.onPtrPullEnd === "function") $$props.onPtrPullEnd();
	}

	function onPtrRefresh(ptrEl, done) {
		if (ptrEl !== pageContentEl) return;
		dispatch("ptrRefresh", [done]);
		if (typeof $$props.onPtrRefresh === "function") $$props.onPtrRefresh(done);
	}

	function onPtrDone(ptrEl) {
		if (ptrEl !== pageContentEl) return;
		dispatch("ptrDone");
		if (typeof $$props.onPtrDone === "function") $$props.onPtrDone();
	}

	function onInfinite(infEl) {
		if (infEl !== pageContentEl) return;
		dispatch("infinite");
		if (typeof $$props.onInfinite === "function") $$props.onInfinite();
	}

	function onTabShow(tabEl) {
		if (pageContentEl !== tabEl) return;
		dispatch("tabShow");
		if (typeof $$props.onTabShow === "function") $$props.onTabShow();
	}

	function onTabHide(tabEl) {
		if (pageContentEl !== tabEl) return;
		dispatch("tabHide");
		if (typeof $$props.onTabHide === "function") $$props.onTabHide();
	}

	function mountPageContent() {
		if (ptr) {
			f7.instance.on("ptrPullStart", onPtrPullStart);
			f7.instance.on("ptrPullMove", onPtrPullMove);
			f7.instance.on("ptrPullEnd", onPtrPullEnd);
			f7.instance.on("ptrRefresh", onPtrRefresh);
			f7.instance.on("ptrDone", onPtrDone);
		}

		if (infinite) {
			f7.instance.on("infinite", onInfinite);
		}

		if (tab) {
			f7.instance.on("tabShow", onTabShow);
			f7.instance.on("tabHide", onTabHide);
		}
	}

	function destroyPageContent() {
		if (ptr) {
			f7.instance.off("ptrPullStart", onPtrPullStart);
			f7.instance.off("ptrPullMove", onPtrPullMove);
			f7.instance.off("ptrPullEnd", onPtrPullEnd);
			f7.instance.off("ptrRefresh", onPtrRefresh);
			f7.instance.off("ptrDone", onPtrDone);
		}

		if (infinite) {
			f7.instance.off("infinite", onInfinite);
		}

		if (tab) {
			f7.instance.off("tabShow", onTabShow);
			f7.instance.off("tabHide", onTabHide);
		}
	}

	onMount(() => {
		f7.ready(() => {
			mountPageContent();
		});
	});

	onDestroy(() => {
		if (!f7.instance) return;
		destroyPageContent();
	});

	let { $$slots = {}, $$scope } = $$props;

	function div_binding($$value) {
		binding_callbacks[$$value ? "unshift" : "push"](() => {
			$$invalidate(11, pageContentEl = $$value);
		});
	}

	$$self.$set = $$new_props => {
		$$invalidate(32, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
		if ("id" in $$new_props) $$invalidate(0, id = $$new_props.id);
		if ("style" in $$new_props) $$invalidate(1, style = $$new_props.style);
		if ("tab" in $$new_props) $$invalidate(13, tab = $$new_props.tab);
		if ("tabActive" in $$new_props) $$invalidate(14, tabActive = $$new_props.tabActive);
		if ("ptr" in $$new_props) $$invalidate(2, ptr = $$new_props.ptr);
		if ("ptrDistance" in $$new_props) $$invalidate(3, ptrDistance = $$new_props.ptrDistance);
		if ("ptrPreloader" in $$new_props) $$invalidate(4, ptrPreloader = $$new_props.ptrPreloader);
		if ("ptrBottom" in $$new_props) $$invalidate(5, ptrBottom = $$new_props.ptrBottom);
		if ("ptrMousewheel" in $$new_props) $$invalidate(6, ptrMousewheel = $$new_props.ptrMousewheel);
		if ("infinite" in $$new_props) $$invalidate(7, infinite = $$new_props.infinite);
		if ("infiniteTop" in $$new_props) $$invalidate(8, infiniteTop = $$new_props.infiniteTop);
		if ("infiniteDistance" in $$new_props) $$invalidate(9, infiniteDistance = $$new_props.infiniteDistance);
		if ("infinitePreloader" in $$new_props) $$invalidate(10, infinitePreloader = $$new_props.infinitePreloader);
		if ("hideBarsOnScroll" in $$new_props) $$invalidate(15, hideBarsOnScroll = $$new_props.hideBarsOnScroll);
		if ("hideNavbarOnScroll" in $$new_props) $$invalidate(16, hideNavbarOnScroll = $$new_props.hideNavbarOnScroll);
		if ("hideToolbarOnScroll" in $$new_props) $$invalidate(17, hideToolbarOnScroll = $$new_props.hideToolbarOnScroll);
		if ("messagesContent" in $$new_props) $$invalidate(18, messagesContent = $$new_props.messagesContent);
		if ("loginScreen" in $$new_props) $$invalidate(19, loginScreen = $$new_props.loginScreen);
		if ("class" in $$new_props) $$invalidate(20, className = $$new_props.class);
		if ("$$scope" in $$new_props) $$invalidate(33, $$scope = $$new_props.$$scope);
	};

	$$self.$capture_state = () => {
		return {
			id,
			style,
			tab,
			tabActive,
			ptr,
			ptrDistance,
			ptrPreloader,
			ptrBottom,
			ptrMousewheel,
			infinite,
			infiniteTop,
			infiniteDistance,
			infinitePreloader,
			hideBarsOnScroll,
			hideNavbarOnScroll,
			hideToolbarOnScroll,
			messagesContent,
			loginScreen,
			className,
			pageContentEl,
			pageContentClasses
		};
	};

	$$self.$inject_state = $$new_props => {
		$$invalidate(32, $$props = assign(assign({}, $$props), $$new_props));
		if ("id" in $$props) $$invalidate(0, id = $$new_props.id);
		if ("style" in $$props) $$invalidate(1, style = $$new_props.style);
		if ("tab" in $$props) $$invalidate(13, tab = $$new_props.tab);
		if ("tabActive" in $$props) $$invalidate(14, tabActive = $$new_props.tabActive);
		if ("ptr" in $$props) $$invalidate(2, ptr = $$new_props.ptr);
		if ("ptrDistance" in $$props) $$invalidate(3, ptrDistance = $$new_props.ptrDistance);
		if ("ptrPreloader" in $$props) $$invalidate(4, ptrPreloader = $$new_props.ptrPreloader);
		if ("ptrBottom" in $$props) $$invalidate(5, ptrBottom = $$new_props.ptrBottom);
		if ("ptrMousewheel" in $$props) $$invalidate(6, ptrMousewheel = $$new_props.ptrMousewheel);
		if ("infinite" in $$props) $$invalidate(7, infinite = $$new_props.infinite);
		if ("infiniteTop" in $$props) $$invalidate(8, infiniteTop = $$new_props.infiniteTop);
		if ("infiniteDistance" in $$props) $$invalidate(9, infiniteDistance = $$new_props.infiniteDistance);
		if ("infinitePreloader" in $$props) $$invalidate(10, infinitePreloader = $$new_props.infinitePreloader);
		if ("hideBarsOnScroll" in $$props) $$invalidate(15, hideBarsOnScroll = $$new_props.hideBarsOnScroll);
		if ("hideNavbarOnScroll" in $$props) $$invalidate(16, hideNavbarOnScroll = $$new_props.hideNavbarOnScroll);
		if ("hideToolbarOnScroll" in $$props) $$invalidate(17, hideToolbarOnScroll = $$new_props.hideToolbarOnScroll);
		if ("messagesContent" in $$props) $$invalidate(18, messagesContent = $$new_props.messagesContent);
		if ("loginScreen" in $$props) $$invalidate(19, loginScreen = $$new_props.loginScreen);
		if ("className" in $$props) $$invalidate(20, className = $$new_props.className);
		if ("pageContentEl" in $$props) $$invalidate(11, pageContentEl = $$new_props.pageContentEl);
		if ("pageContentClasses" in $$props) $$invalidate(12, pageContentClasses = $$new_props.pageContentClasses);
	};

	let pageContentClasses;

	$$self.$$.update = () => {
		 $$invalidate(12, pageContentClasses = Utils.classNames(
			className,
			"page-content",
			{
				tab,
				"tab-active": tabActive,
				"ptr-content": ptr,
				"ptr-bottom": ptrBottom,
				"infinite-scroll-content": infinite,
				"infinite-scroll-top": infiniteTop,
				"hide-bars-on-scroll": hideBarsOnScroll,
				"hide-navbar-on-scroll": hideNavbarOnScroll,
				"hide-toolbar-on-scroll": hideToolbarOnScroll,
				"messages-content": messagesContent,
				"login-screen-content": loginScreen
			},
			Mixins.colorClasses($$props)
		));
	};

	$$props = exclude_internal_props($$props);

	return [
		id,
		style,
		ptr,
		ptrDistance,
		ptrPreloader,
		ptrBottom,
		ptrMousewheel,
		infinite,
		infiniteTop,
		infiniteDistance,
		infinitePreloader,
		pageContentEl,
		pageContentClasses,
		tab,
		tabActive,
		hideBarsOnScroll,
		hideNavbarOnScroll,
		hideToolbarOnScroll,
		messagesContent,
		loginScreen,
		className,
		dispatch,
		onPtrPullStart,
		onPtrPullMove,
		onPtrPullEnd,
		onPtrRefresh,
		onPtrDone,
		onInfinite,
		onTabShow,
		onTabHide,
		mountPageContent,
		destroyPageContent,
		$$props,
		$$scope,
		$$slots,
		div_binding
	];
}

class Page_content extends SvelteComponentDev {
	constructor(options) {
		super(options);

		init(
			this,
			options,
			instance$6,
			create_fragment$6,
			safe_not_equal,
			{
				id: 0,
				style: 1,
				tab: 13,
				tabActive: 14,
				ptr: 2,
				ptrDistance: 3,
				ptrPreloader: 4,
				ptrBottom: 5,
				ptrMousewheel: 6,
				infinite: 7,
				infiniteTop: 8,
				infiniteDistance: 9,
				infinitePreloader: 10,
				hideBarsOnScroll: 15,
				hideNavbarOnScroll: 16,
				hideToolbarOnScroll: 17,
				messagesContent: 18,
				loginScreen: 19,
				class: 20
			},
			[-1, -1]
		);

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Page_content",
			options,
			id: create_fragment$6.name
		});
	}

	get id() {
		throw new Error("<Page_content>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set id(value) {
		throw new Error("<Page_content>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get style() {
		throw new Error("<Page_content>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set style(value) {
		throw new Error("<Page_content>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get tab() {
		throw new Error("<Page_content>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set tab(value) {
		throw new Error("<Page_content>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get tabActive() {
		throw new Error("<Page_content>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set tabActive(value) {
		throw new Error("<Page_content>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get ptr() {
		throw new Error("<Page_content>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set ptr(value) {
		throw new Error("<Page_content>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get ptrDistance() {
		throw new Error("<Page_content>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set ptrDistance(value) {
		throw new Error("<Page_content>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get ptrPreloader() {
		throw new Error("<Page_content>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set ptrPreloader(value) {
		throw new Error("<Page_content>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get ptrBottom() {
		throw new Error("<Page_content>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set ptrBottom(value) {
		throw new Error("<Page_content>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get ptrMousewheel() {
		throw new Error("<Page_content>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set ptrMousewheel(value) {
		throw new Error("<Page_content>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get infinite() {
		throw new Error("<Page_content>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set infinite(value) {
		throw new Error("<Page_content>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get infiniteTop() {
		throw new Error("<Page_content>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set infiniteTop(value) {
		throw new Error("<Page_content>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get infiniteDistance() {
		throw new Error("<Page_content>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set infiniteDistance(value) {
		throw new Error("<Page_content>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get infinitePreloader() {
		throw new Error("<Page_content>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set infinitePreloader(value) {
		throw new Error("<Page_content>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get hideBarsOnScroll() {
		throw new Error("<Page_content>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set hideBarsOnScroll(value) {
		throw new Error("<Page_content>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get hideNavbarOnScroll() {
		throw new Error("<Page_content>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set hideNavbarOnScroll(value) {
		throw new Error("<Page_content>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get hideToolbarOnScroll() {
		throw new Error("<Page_content>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set hideToolbarOnScroll(value) {
		throw new Error("<Page_content>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get messagesContent() {
		throw new Error("<Page_content>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set messagesContent(value) {
		throw new Error("<Page_content>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get loginScreen() {
		throw new Error("<Page_content>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set loginScreen(value) {
		throw new Error("<Page_content>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get class() {
		throw new Error("<Page_content>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set class(value) {
		throw new Error("<Page_content>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* node_modules/framework7-svelte/components/page.svelte generated by Svelte v3.18.2 */
const file$7 = "node_modules/framework7-svelte/components/page.svelte";
const get_static_slot_changes_1 = dirty => ({});
const get_static_slot_context_1 = ctx => ({});
const get_static_slot_changes = dirty => ({});
const get_static_slot_context = ctx => ({});
const get_fixed_slot_changes = dirty => ({});
const get_fixed_slot_context = ctx => ({});

// (332:2) {:else}
function create_else_block$3(ctx) {
	let t;
	let current;
	const static_slot_template = /*$$slots*/ ctx[69].static;
	const static_slot = create_slot(static_slot_template, ctx, /*$$scope*/ ctx[71], get_static_slot_context_1);
	const default_slot_template = /*$$slots*/ ctx[69].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[71], null);

	const block = {
		c: function create() {
			if (static_slot) static_slot.c();
			t = space();
			if (default_slot) default_slot.c();
		},
		m: function mount(target, anchor) {
			if (static_slot) {
				static_slot.m(target, anchor);
			}

			insert_dev(target, t, anchor);

			if (default_slot) {
				default_slot.m(target, anchor);
			}

			current = true;
		},
		p: function update(ctx, dirty) {
			if (static_slot && static_slot.p && dirty[2] & /*$$scope*/ 512) {
				static_slot.p(get_slot_context(static_slot_template, ctx, /*$$scope*/ ctx[71], get_static_slot_context_1), get_slot_changes(static_slot_template, /*$$scope*/ ctx[71], dirty, get_static_slot_changes_1));
			}

			if (default_slot && default_slot.p && dirty[2] & /*$$scope*/ 512) {
				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[71], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[71], dirty, null));
			}
		},
		i: function intro(local) {
			if (current) return;
			transition_in(static_slot, local);
			transition_in(default_slot, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(static_slot, local);
			transition_out(default_slot, local);
			current = false;
		},
		d: function destroy(detaching) {
			if (static_slot) static_slot.d(detaching);
			if (detaching) detach_dev(t);
			if (default_slot) default_slot.d(detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_else_block$3.name,
		type: "else",
		source: "(332:2) {:else}",
		ctx
	});

	return block;
}

// (306:2) {#if pageContent}
function create_if_block$4(ctx) {
	let current;

	const pagecontent = new Page_content({
			props: {
				ptr: /*ptr*/ ctx[4],
				ptrDistance: /*ptrDistance*/ ctx[5],
				ptrPreloader: /*ptrPreloader*/ ctx[6],
				ptrBottom: /*ptrBottom*/ ctx[7],
				ptrMousewheel: /*ptrMousewheel*/ ctx[8],
				infinite: /*infinite*/ ctx[9],
				infiniteTop: /*infiniteTop*/ ctx[10],
				infiniteDistance: /*infiniteDistance*/ ctx[11],
				infinitePreloader: /*infinitePreloader*/ ctx[12],
				hideBarsOnScroll: /*hideBarsOnScroll*/ ctx[13],
				hideNavbarOnScroll: /*hideNavbarOnScroll*/ ctx[14],
				hideToolbarOnScroll: /*hideToolbarOnScroll*/ ctx[15],
				messagesContent: /*messagesContent*/ ctx[16],
				loginScreen: /*loginScreen*/ ctx[17],
				onPtrPullStart: /*onPtrPullStart*/ ctx[20],
				onPtrPullMove: /*onPtrPullMove*/ ctx[21],
				onPtrPullEnd: /*onPtrPullEnd*/ ctx[22],
				onPtrRefresh: /*onPtrRefresh*/ ctx[23],
				onPtrDone: /*onPtrDone*/ ctx[24],
				onInfinite: /*onInfinite*/ ctx[25],
				$$slots: { default: [create_default_slot] },
				$$scope: { ctx }
			},
			$$inline: true
		});

	const block = {
		c: function create() {
			create_component(pagecontent.$$.fragment);
		},
		m: function mount(target, anchor) {
			mount_component(pagecontent, target, anchor);
			current = true;
		},
		p: function update(ctx, dirty) {
			const pagecontent_changes = {};
			if (dirty[0] & /*ptr*/ 16) pagecontent_changes.ptr = /*ptr*/ ctx[4];
			if (dirty[0] & /*ptrDistance*/ 32) pagecontent_changes.ptrDistance = /*ptrDistance*/ ctx[5];
			if (dirty[0] & /*ptrPreloader*/ 64) pagecontent_changes.ptrPreloader = /*ptrPreloader*/ ctx[6];
			if (dirty[0] & /*ptrBottom*/ 128) pagecontent_changes.ptrBottom = /*ptrBottom*/ ctx[7];
			if (dirty[0] & /*ptrMousewheel*/ 256) pagecontent_changes.ptrMousewheel = /*ptrMousewheel*/ ctx[8];
			if (dirty[0] & /*infinite*/ 512) pagecontent_changes.infinite = /*infinite*/ ctx[9];
			if (dirty[0] & /*infiniteTop*/ 1024) pagecontent_changes.infiniteTop = /*infiniteTop*/ ctx[10];
			if (dirty[0] & /*infiniteDistance*/ 2048) pagecontent_changes.infiniteDistance = /*infiniteDistance*/ ctx[11];
			if (dirty[0] & /*infinitePreloader*/ 4096) pagecontent_changes.infinitePreloader = /*infinitePreloader*/ ctx[12];
			if (dirty[0] & /*hideBarsOnScroll*/ 8192) pagecontent_changes.hideBarsOnScroll = /*hideBarsOnScroll*/ ctx[13];
			if (dirty[0] & /*hideNavbarOnScroll*/ 16384) pagecontent_changes.hideNavbarOnScroll = /*hideNavbarOnScroll*/ ctx[14];
			if (dirty[0] & /*hideToolbarOnScroll*/ 32768) pagecontent_changes.hideToolbarOnScroll = /*hideToolbarOnScroll*/ ctx[15];
			if (dirty[0] & /*messagesContent*/ 65536) pagecontent_changes.messagesContent = /*messagesContent*/ ctx[16];
			if (dirty[0] & /*loginScreen*/ 131072) pagecontent_changes.loginScreen = /*loginScreen*/ ctx[17];

			if (dirty[2] & /*$$scope*/ 512) {
				pagecontent_changes.$$scope = { dirty, ctx };
			}

			pagecontent.$set(pagecontent_changes);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(pagecontent.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(pagecontent.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			destroy_component(pagecontent, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block$4.name,
		type: "if",
		source: "(306:2) {#if pageContent}",
		ctx
	});

	return block;
}

// (307:2) <PageContent     ptr={ptr}     ptrDistance={ptrDistance}     ptrPreloader={ptrPreloader}     ptrBottom={ptrBottom}     ptrMousewheel={ptrMousewheel}     infinite={infinite}     infiniteTop={infiniteTop}     infiniteDistance={infiniteDistance}     infinitePreloader={infinitePreloader}     hideBarsOnScroll={hideBarsOnScroll}     hideNavbarOnScroll={hideNavbarOnScroll}     hideToolbarOnScroll={hideToolbarOnScroll}     messagesContent={messagesContent}     loginScreen={loginScreen}     onPtrPullStart={onPtrPullStart}     onPtrPullMove={onPtrPullMove}     onPtrPullEnd={onPtrPullEnd}     onPtrRefresh={onPtrRefresh}     onPtrDone={onPtrDone}     onInfinite={onInfinite}   >
function create_default_slot(ctx) {
	let t;
	let current;
	const static_slot_template = /*$$slots*/ ctx[69].static;
	const static_slot = create_slot(static_slot_template, ctx, /*$$scope*/ ctx[71], get_static_slot_context);
	const default_slot_template = /*$$slots*/ ctx[69].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[71], null);

	const block = {
		c: function create() {
			if (static_slot) static_slot.c();
			t = space();
			if (default_slot) default_slot.c();
		},
		m: function mount(target, anchor) {
			if (static_slot) {
				static_slot.m(target, anchor);
			}

			insert_dev(target, t, anchor);

			if (default_slot) {
				default_slot.m(target, anchor);
			}

			current = true;
		},
		p: function update(ctx, dirty) {
			if (static_slot && static_slot.p && dirty[2] & /*$$scope*/ 512) {
				static_slot.p(get_slot_context(static_slot_template, ctx, /*$$scope*/ ctx[71], get_static_slot_context), get_slot_changes(static_slot_template, /*$$scope*/ ctx[71], dirty, get_static_slot_changes));
			}

			if (default_slot && default_slot.p && dirty[2] & /*$$scope*/ 512) {
				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[71], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[71], dirty, null));
			}
		},
		i: function intro(local) {
			if (current) return;
			transition_in(static_slot, local);
			transition_in(default_slot, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(static_slot, local);
			transition_out(default_slot, local);
			current = false;
		},
		d: function destroy(detaching) {
			if (static_slot) static_slot.d(detaching);
			if (detaching) detach_dev(t);
			if (default_slot) default_slot.d(detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_default_slot.name,
		type: "slot",
		source: "(307:2) <PageContent     ptr={ptr}     ptrDistance={ptrDistance}     ptrPreloader={ptrPreloader}     ptrBottom={ptrBottom}     ptrMousewheel={ptrMousewheel}     infinite={infinite}     infiniteTop={infiniteTop}     infiniteDistance={infiniteDistance}     infinitePreloader={infinitePreloader}     hideBarsOnScroll={hideBarsOnScroll}     hideNavbarOnScroll={hideNavbarOnScroll}     hideToolbarOnScroll={hideToolbarOnScroll}     messagesContent={messagesContent}     loginScreen={loginScreen}     onPtrPullStart={onPtrPullStart}     onPtrPullMove={onPtrPullMove}     onPtrPullEnd={onPtrPullEnd}     onPtrRefresh={onPtrRefresh}     onPtrDone={onPtrDone}     onInfinite={onInfinite}   >",
		ctx
	});

	return block;
}

function create_fragment$7(ctx) {
	let div;
	let t;
	let current_block_type_index;
	let if_block;
	let current;
	const fixed_slot_template = /*$$slots*/ ctx[69].fixed;
	const fixed_slot = create_slot(fixed_slot_template, ctx, /*$$scope*/ ctx[71], get_fixed_slot_context);
	const if_block_creators = [create_if_block$4, create_else_block$3];
	const if_blocks = [];

	function select_block_type(ctx, dirty) {
		if (/*pageContent*/ ctx[3]) return 0;
		return 1;
	}

	current_block_type_index = select_block_type(ctx);
	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

	const block = {
		c: function create() {
			div = element("div");
			if (fixed_slot) fixed_slot.c();
			t = space();
			if_block.c();
			attr_dev(div, "id", /*id*/ ctx[0]);
			attr_dev(div, "style", /*style*/ ctx[1]);
			attr_dev(div, "class", /*classes*/ ctx[19]);
			attr_dev(div, "data-name", /*name*/ ctx[2]);
			add_location(div, file$7, 303, 0, 10452);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, div, anchor);

			if (fixed_slot) {
				fixed_slot.m(div, null);
			}

			append_dev(div, t);
			if_blocks[current_block_type_index].m(div, null);
			/*div_binding*/ ctx[70](div);
			current = true;
		},
		p: function update(ctx, dirty) {
			if (fixed_slot && fixed_slot.p && dirty[2] & /*$$scope*/ 512) {
				fixed_slot.p(get_slot_context(fixed_slot_template, ctx, /*$$scope*/ ctx[71], get_fixed_slot_context), get_slot_changes(fixed_slot_template, /*$$scope*/ ctx[71], dirty, get_fixed_slot_changes));
			}

			let previous_block_index = current_block_type_index;
			current_block_type_index = select_block_type(ctx);

			if (current_block_type_index === previous_block_index) {
				if_blocks[current_block_type_index].p(ctx, dirty);
			} else {
				group_outros();

				transition_out(if_blocks[previous_block_index], 1, 1, () => {
					if_blocks[previous_block_index] = null;
				});

				check_outros();
				if_block = if_blocks[current_block_type_index];

				if (!if_block) {
					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
					if_block.c();
				}

				transition_in(if_block, 1);
				if_block.m(div, null);
			}

			if (!current || dirty[0] & /*id*/ 1) {
				attr_dev(div, "id", /*id*/ ctx[0]);
			}

			if (!current || dirty[0] & /*style*/ 2) {
				attr_dev(div, "style", /*style*/ ctx[1]);
			}

			if (!current || dirty[0] & /*classes*/ 524288) {
				attr_dev(div, "class", /*classes*/ ctx[19]);
			}

			if (!current || dirty[0] & /*name*/ 4) {
				attr_dev(div, "data-name", /*name*/ ctx[2]);
			}
		},
		i: function intro(local) {
			if (current) return;
			transition_in(fixed_slot, local);
			transition_in(if_block);
			current = true;
		},
		o: function outro(local) {
			transition_out(fixed_slot, local);
			transition_out(if_block);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(div);
			if (fixed_slot) fixed_slot.d(detaching);
			if_blocks[current_block_type_index].d();
			/*div_binding*/ ctx[70](null);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$7.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$7($$self, $$props, $$invalidate) {
	const dispatch = createEventDispatcher();
	let { id = undefined } = $$props;
	let { style = undefined } = $$props;
	let { name = undefined } = $$props;
	let { stacked = undefined } = $$props;
	let { withSubnavbar = undefined } = $$props;
	let { subnavbar = undefined } = $$props;
	let { withNavbarLarge = undefined } = $$props;
	let { navbarLarge = undefined } = $$props;
	let { noNavbar = undefined } = $$props;
	let { noToolbar = undefined } = $$props;
	let { tabs = undefined } = $$props;
	let { pageContent = true } = $$props;
	let { noSwipeback = undefined } = $$props;
	let { ptr = undefined } = $$props;
	let { ptrDistance = undefined } = $$props;
	let { ptrPreloader = true } = $$props;
	let { ptrBottom = undefined } = $$props;
	let { ptrMousewheel = undefined } = $$props;
	let { infinite = undefined } = $$props;
	let { infiniteTop = undefined } = $$props;
	let { infiniteDistance = undefined } = $$props;
	let { infinitePreloader = true } = $$props;
	let { hideBarsOnScroll = undefined } = $$props;
	let { hideNavbarOnScroll = undefined } = $$props;
	let { hideToolbarOnScroll = undefined } = $$props;
	let { messagesContent = undefined } = $$props;
	let { loginScreen = undefined } = $$props;
	let { class: className = undefined } = $$props;

	// State
	let el;

	let hasSubnavbar = false;
	let hasNavbarLarge = false;
	let hasNavbarLargeCollapsed = false;
	let hasCardExpandableOpened = false;
	let routerPositionClass = "";
	let routerForceUnstack = false;
	let routerPageRole = null;
	let routerPageRoleDetailRoot = false;
	let routerPageMasterStack = false;

	// Handlers
	function onPtrPullStart() {
		dispatch("ptrPullStart");
		if (typeof $$props.onPtrPullStart === "function") $$props.onPtrPullStart();
	}

	function onPtrPullMove() {
		dispatch("ptrPullMove");
		if (typeof $$props.onPtrPullMove === "function") $$props.onPtrPullMove();
	}

	function onPtrPullEnd() {
		dispatch("ptrPullEnd");
		if (typeof $$props.onPtrPullEnd === "function") $$props.onPtrPullEnd();
	}

	function onPtrRefresh(done) {
		dispatch("ptrRefresh", [done]);
		if (typeof $$props.onPtrRefresh === "function") $$props.onPtrRefresh(done);
	}

	function onPtrDone() {
		dispatch("ptrDone");
		if (typeof $$props.onPtrDone === "function") $$props.onPtrDone();
	}

	function onInfinite() {
		dispatch("infinite");
		if (typeof $$props.onInfinite === "function") $$props.onInfinite();
	}

	// Main Page Events
	function onPageMounted(page) {
		if (el !== page.el) return;
		dispatch("pageMounted", [page]);
		if (typeof $$props.onPageMounted === "function") $$props.onPageMounted(page);
	}

	function onPageInit(page) {
		if (el !== page.el) return;

		if (typeof withSubnavbar === "undefined" && typeof subnavbar === "undefined") {
			if (page.$navbarEl && page.$navbarEl.length && page.$navbarEl.find(".subnavbar").length || page.$el.children(".navbar").find(".subnavbar").length) {
				$$invalidate(36, hasSubnavbar = true);
			}
		}

		if (typeof withNavbarLarge === "undefined" && typeof navbarLarge === "undefined") {
			if (page.$navbarEl && page.$navbarEl.hasClass("navbar-large") || page.$el.children(".navbar-large").length) {
				$$invalidate(37, hasNavbarLarge = true);
			}
		}

		dispatch("pageInit", [page]);
		if (typeof $$props.onPageInit === "function") $$props.onPageInit(page);
	}

	function onPageReinit(page) {
		if (el !== page.el) return;
		dispatch("pageReinit", [page]);
		if (typeof $$props.onPageReinit === "function") $$props.onPageReinit(page);
	}

	function onPageBeforeIn(page) {
		if (el !== page.el) return;

		if (!page.swipeBack) {
			if (page.from === "next") {
				$$invalidate(40, routerPositionClass = "page-next");
			}

			if (page.from === "previous") {
				$$invalidate(40, routerPositionClass = "page-previous");
			}
		}

		dispatch("pageBeforeIn", [page]);
		if (typeof $$props.onPageBeforeIn === "function") $$props.onPageBeforeIn(page);
	}

	function onPageBeforeOut(page) {
		if (el !== page.el) return;
		dispatch("pageBeforeOut", [page]);
		if (typeof $$props.onPageBeforeOut === "function") $$props.onPageBeforeOut(page);
	}

	function onPageAfterOut(page) {
		if (el !== page.el) return;

		if (page.to === "next") {
			$$invalidate(40, routerPositionClass = "page-next");
		}

		if (page.to === "previous") {
			$$invalidate(40, routerPositionClass = "page-previous");
		}

		dispatch("pageAfterOut", [page]);
		if (typeof $$props.onPageAfterOut === "function") $$props.onPageAfterOut(page);
	}

	function onPageAfterIn(page) {
		if (el !== page.el) return;
		$$invalidate(40, routerPositionClass = "page-current");
		dispatch("pageAfterIn", [page]);
		if (typeof $$props.onPageAfterIn === "function") $$props.onPageAfterIn(page);
	}

	function onPageBeforeRemove(page) {
		if (el !== page.el) return;

		if (page.$navbarEl && page.$navbarEl[0] && page.$navbarEl.parent()[0] && page.$navbarEl.parent()[0] !== el) {
			page.$el.prepend(page.$navbarEl);
		}

		dispatch("pageBeforeRemove", [page]);
		if (typeof $$props.onPageBeforeRemove === "function") $$props.onPageBeforeRemove(page);
	}

	// Helper events
	function onPageStack(pageEl) {
		if (el !== pageEl) return;
		$$invalidate(41, routerForceUnstack = false);
	}

	function onPageUnstack(pageEl) {
		if (el !== pageEl) return;
		$$invalidate(41, routerForceUnstack = true);
	}

	function onPagePosition(pageEl, position) {
		if (el !== pageEl) return;
		$$invalidate(40, routerPositionClass = `page-${position}`);
	}

	function onPageRole(pageEl, rolesData) {
		if (el !== pageEl) return;
		$$invalidate(42, routerPageRole = rolesData.role);
		$$invalidate(43, routerPageRoleDetailRoot = rolesData.detailRoot);
	}

	function onPageMasterStack(pageEl) {
		if (el !== pageEl) return;
		$$invalidate(44, routerPageMasterStack = true);
	}

	function onPageMasterUnstack(pageEl) {
		if (el !== pageEl) return;
		$$invalidate(44, routerPageMasterStack = false);
	}

	function onPageNavbarLargeCollapsed(pageEl) {
		if (el !== pageEl) return;
		$$invalidate(38, hasNavbarLargeCollapsed = true);
	}

	function onPageNavbarLargeExpanded(pageEl) {
		if (el !== pageEl) return;
		$$invalidate(38, hasNavbarLargeCollapsed = false);
	}

	function onCardOpened(cardEl, pageEl) {
		if (el !== pageEl) return;
		$$invalidate(39, hasCardExpandableOpened = true);
	}

	function onCardClose(cardEl, pageEl) {
		if (el !== pageEl) return;
		$$invalidate(39, hasCardExpandableOpened = false);
	}

	// Mount/destroy
	function mountPage() {
		f7.instance.on("pageMounted", onPageMounted);
		f7.instance.on("pageInit", onPageInit);
		f7.instance.on("pageReinit", onPageReinit);
		f7.instance.on("pageBeforeIn", onPageBeforeIn);
		f7.instance.on("pageBeforeOut", onPageBeforeOut);
		f7.instance.on("pageAfterOut", onPageAfterOut);
		f7.instance.on("pageAfterIn", onPageAfterIn);
		f7.instance.on("pageBeforeRemove", onPageBeforeRemove);
		f7.instance.on("pageStack", onPageStack);
		f7.instance.on("pageUnstack", onPageUnstack);
		f7.instance.on("pagePosition", onPagePosition);
		f7.instance.on("pageRole", onPageRole);
		f7.instance.on("pageMasterStack", onPageMasterStack);
		f7.instance.on("pageMasterUnstack", onPageMasterUnstack);
		f7.instance.on("pageNavbarLargeCollapsed", onPageNavbarLargeCollapsed);
		f7.instance.on("pageNavbarLargeExpanded", onPageNavbarLargeExpanded);
		f7.instance.on("cardOpened", onCardOpened);
		f7.instance.on("cardClose", onCardClose);
	}

	function destroyPage() {
		f7.instance.off("pageMounted", onPageMounted);
		f7.instance.off("pageInit", onPageInit);
		f7.instance.off("pageReinit", onPageReinit);
		f7.instance.off("pageBeforeIn", onPageBeforeIn);
		f7.instance.off("pageBeforeOut", onPageBeforeOut);
		f7.instance.off("pageAfterOut", onPageAfterOut);
		f7.instance.off("pageAfterIn", onPageAfterIn);
		f7.instance.off("pageBeforeRemove", onPageBeforeRemove);
		f7.instance.off("pageStack", onPageStack);
		f7.instance.off("pageUnstack", onPageUnstack);
		f7.instance.off("pagePosition", onPagePosition);
		f7.instance.off("pageRole", onPageRole);
		f7.instance.off("pageMasterStack", onPageMasterStack);
		f7.instance.off("pageMasterUnstack", onPageMasterUnstack);
		f7.instance.off("pageNavbarLargeCollapsed", onPageNavbarLargeCollapsed);
		f7.instance.off("pageNavbarLargeExpanded", onPageNavbarLargeExpanded);
		f7.instance.off("cardOpened", onCardOpened);
		f7.instance.off("cardClose", onCardClose);
	}

	onMount(() => {
		f7.ready(() => {
			if (el) {
				const dom7 = f7.instance.$;
				const fixedEls = dom7(el).children(".page-content").children("[data-f7-slot=\"fixed\"]");

				if (fixedEls.length) {
					for (let i = fixedEls.length - 1; i >= 0; i -= 1) {
						dom7(el).prepend(fixedEls[i]);
					}
				}
			}

			mountPage();
		});
	});

	afterUpdate(() => {
		if (el && f7.instance) {
			const dom7 = f7.instance.$;
			const fixedEls = dom7(el).children(".page-content").children("[data-f7-slot=\"fixed\"]");

			if (fixedEls.length) {
				for (let i = fixedEls.length - 1; i >= 0; i -= 1) {
					dom7(el).prepend(fixedEls[i]);
				}
			}
		}
	});

	onDestroy(() => {
		if (!f7.instance) return;
		destroyPage();
	});

	let { $$slots = {}, $$scope } = $$props;

	function div_binding($$value) {
		binding_callbacks[$$value ? "unshift" : "push"](() => {
			$$invalidate(18, el = $$value);
		});
	}

	$$self.$set = $$new_props => {
		$$invalidate(68, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
		if ("id" in $$new_props) $$invalidate(0, id = $$new_props.id);
		if ("style" in $$new_props) $$invalidate(1, style = $$new_props.style);
		if ("name" in $$new_props) $$invalidate(2, name = $$new_props.name);
		if ("stacked" in $$new_props) $$invalidate(26, stacked = $$new_props.stacked);
		if ("withSubnavbar" in $$new_props) $$invalidate(27, withSubnavbar = $$new_props.withSubnavbar);
		if ("subnavbar" in $$new_props) $$invalidate(28, subnavbar = $$new_props.subnavbar);
		if ("withNavbarLarge" in $$new_props) $$invalidate(29, withNavbarLarge = $$new_props.withNavbarLarge);
		if ("navbarLarge" in $$new_props) $$invalidate(30, navbarLarge = $$new_props.navbarLarge);
		if ("noNavbar" in $$new_props) $$invalidate(31, noNavbar = $$new_props.noNavbar);
		if ("noToolbar" in $$new_props) $$invalidate(32, noToolbar = $$new_props.noToolbar);
		if ("tabs" in $$new_props) $$invalidate(33, tabs = $$new_props.tabs);
		if ("pageContent" in $$new_props) $$invalidate(3, pageContent = $$new_props.pageContent);
		if ("noSwipeback" in $$new_props) $$invalidate(34, noSwipeback = $$new_props.noSwipeback);
		if ("ptr" in $$new_props) $$invalidate(4, ptr = $$new_props.ptr);
		if ("ptrDistance" in $$new_props) $$invalidate(5, ptrDistance = $$new_props.ptrDistance);
		if ("ptrPreloader" in $$new_props) $$invalidate(6, ptrPreloader = $$new_props.ptrPreloader);
		if ("ptrBottom" in $$new_props) $$invalidate(7, ptrBottom = $$new_props.ptrBottom);
		if ("ptrMousewheel" in $$new_props) $$invalidate(8, ptrMousewheel = $$new_props.ptrMousewheel);
		if ("infinite" in $$new_props) $$invalidate(9, infinite = $$new_props.infinite);
		if ("infiniteTop" in $$new_props) $$invalidate(10, infiniteTop = $$new_props.infiniteTop);
		if ("infiniteDistance" in $$new_props) $$invalidate(11, infiniteDistance = $$new_props.infiniteDistance);
		if ("infinitePreloader" in $$new_props) $$invalidate(12, infinitePreloader = $$new_props.infinitePreloader);
		if ("hideBarsOnScroll" in $$new_props) $$invalidate(13, hideBarsOnScroll = $$new_props.hideBarsOnScroll);
		if ("hideNavbarOnScroll" in $$new_props) $$invalidate(14, hideNavbarOnScroll = $$new_props.hideNavbarOnScroll);
		if ("hideToolbarOnScroll" in $$new_props) $$invalidate(15, hideToolbarOnScroll = $$new_props.hideToolbarOnScroll);
		if ("messagesContent" in $$new_props) $$invalidate(16, messagesContent = $$new_props.messagesContent);
		if ("loginScreen" in $$new_props) $$invalidate(17, loginScreen = $$new_props.loginScreen);
		if ("class" in $$new_props) $$invalidate(35, className = $$new_props.class);
		if ("$$scope" in $$new_props) $$invalidate(71, $$scope = $$new_props.$$scope);
	};

	$$self.$capture_state = () => {
		return {
			id,
			style,
			name,
			stacked,
			withSubnavbar,
			subnavbar,
			withNavbarLarge,
			navbarLarge,
			noNavbar,
			noToolbar,
			tabs,
			pageContent,
			noSwipeback,
			ptr,
			ptrDistance,
			ptrPreloader,
			ptrBottom,
			ptrMousewheel,
			infinite,
			infiniteTop,
			infiniteDistance,
			infinitePreloader,
			hideBarsOnScroll,
			hideNavbarOnScroll,
			hideToolbarOnScroll,
			messagesContent,
			loginScreen,
			className,
			el,
			hasSubnavbar,
			hasNavbarLarge,
			hasNavbarLargeCollapsed,
			hasCardExpandableOpened,
			routerPositionClass,
			routerForceUnstack,
			routerPageRole,
			routerPageRoleDetailRoot,
			routerPageMasterStack,
			forceSubnavbar,
			forceNavbarLarge,
			classes
		};
	};

	$$self.$inject_state = $$new_props => {
		$$invalidate(68, $$props = assign(assign({}, $$props), $$new_props));
		if ("id" in $$props) $$invalidate(0, id = $$new_props.id);
		if ("style" in $$props) $$invalidate(1, style = $$new_props.style);
		if ("name" in $$props) $$invalidate(2, name = $$new_props.name);
		if ("stacked" in $$props) $$invalidate(26, stacked = $$new_props.stacked);
		if ("withSubnavbar" in $$props) $$invalidate(27, withSubnavbar = $$new_props.withSubnavbar);
		if ("subnavbar" in $$props) $$invalidate(28, subnavbar = $$new_props.subnavbar);
		if ("withNavbarLarge" in $$props) $$invalidate(29, withNavbarLarge = $$new_props.withNavbarLarge);
		if ("navbarLarge" in $$props) $$invalidate(30, navbarLarge = $$new_props.navbarLarge);
		if ("noNavbar" in $$props) $$invalidate(31, noNavbar = $$new_props.noNavbar);
		if ("noToolbar" in $$props) $$invalidate(32, noToolbar = $$new_props.noToolbar);
		if ("tabs" in $$props) $$invalidate(33, tabs = $$new_props.tabs);
		if ("pageContent" in $$props) $$invalidate(3, pageContent = $$new_props.pageContent);
		if ("noSwipeback" in $$props) $$invalidate(34, noSwipeback = $$new_props.noSwipeback);
		if ("ptr" in $$props) $$invalidate(4, ptr = $$new_props.ptr);
		if ("ptrDistance" in $$props) $$invalidate(5, ptrDistance = $$new_props.ptrDistance);
		if ("ptrPreloader" in $$props) $$invalidate(6, ptrPreloader = $$new_props.ptrPreloader);
		if ("ptrBottom" in $$props) $$invalidate(7, ptrBottom = $$new_props.ptrBottom);
		if ("ptrMousewheel" in $$props) $$invalidate(8, ptrMousewheel = $$new_props.ptrMousewheel);
		if ("infinite" in $$props) $$invalidate(9, infinite = $$new_props.infinite);
		if ("infiniteTop" in $$props) $$invalidate(10, infiniteTop = $$new_props.infiniteTop);
		if ("infiniteDistance" in $$props) $$invalidate(11, infiniteDistance = $$new_props.infiniteDistance);
		if ("infinitePreloader" in $$props) $$invalidate(12, infinitePreloader = $$new_props.infinitePreloader);
		if ("hideBarsOnScroll" in $$props) $$invalidate(13, hideBarsOnScroll = $$new_props.hideBarsOnScroll);
		if ("hideNavbarOnScroll" in $$props) $$invalidate(14, hideNavbarOnScroll = $$new_props.hideNavbarOnScroll);
		if ("hideToolbarOnScroll" in $$props) $$invalidate(15, hideToolbarOnScroll = $$new_props.hideToolbarOnScroll);
		if ("messagesContent" in $$props) $$invalidate(16, messagesContent = $$new_props.messagesContent);
		if ("loginScreen" in $$props) $$invalidate(17, loginScreen = $$new_props.loginScreen);
		if ("className" in $$props) $$invalidate(35, className = $$new_props.className);
		if ("el" in $$props) $$invalidate(18, el = $$new_props.el);
		if ("hasSubnavbar" in $$props) $$invalidate(36, hasSubnavbar = $$new_props.hasSubnavbar);
		if ("hasNavbarLarge" in $$props) $$invalidate(37, hasNavbarLarge = $$new_props.hasNavbarLarge);
		if ("hasNavbarLargeCollapsed" in $$props) $$invalidate(38, hasNavbarLargeCollapsed = $$new_props.hasNavbarLargeCollapsed);
		if ("hasCardExpandableOpened" in $$props) $$invalidate(39, hasCardExpandableOpened = $$new_props.hasCardExpandableOpened);
		if ("routerPositionClass" in $$props) $$invalidate(40, routerPositionClass = $$new_props.routerPositionClass);
		if ("routerForceUnstack" in $$props) $$invalidate(41, routerForceUnstack = $$new_props.routerForceUnstack);
		if ("routerPageRole" in $$props) $$invalidate(42, routerPageRole = $$new_props.routerPageRole);
		if ("routerPageRoleDetailRoot" in $$props) $$invalidate(43, routerPageRoleDetailRoot = $$new_props.routerPageRoleDetailRoot);
		if ("routerPageMasterStack" in $$props) $$invalidate(44, routerPageMasterStack = $$new_props.routerPageMasterStack);
		if ("forceSubnavbar" in $$props) $$invalidate(45, forceSubnavbar = $$new_props.forceSubnavbar);
		if ("forceNavbarLarge" in $$props) $$invalidate(46, forceNavbarLarge = $$new_props.forceNavbarLarge);
		if ("classes" in $$props) $$invalidate(19, classes = $$new_props.classes);
	};

	let forceSubnavbar;
	let forceNavbarLarge;
	let classes;

	$$self.$$.update = () => {
		if ($$self.$$.dirty[0] & /*subnavbar, withSubnavbar*/ 402653184 | $$self.$$.dirty[1] & /*hasSubnavbar*/ 32) {
			 $$invalidate(45, forceSubnavbar = typeof subnavbar === "undefined" && typeof withSubnavbar === "undefined"
			? hasSubnavbar
			: false);
		}

		if ($$self.$$.dirty[0] & /*navbarLarge, withNavbarLarge*/ 1610612736 | $$self.$$.dirty[1] & /*hasNavbarLarge*/ 64) {
			 $$invalidate(46, forceNavbarLarge = typeof navbarLarge === "undefined" && typeof withNavbarLarge === "undefined"
			? hasNavbarLarge
			: false);
		}

		 $$invalidate(19, classes = Utils.classNames(
			className,
			"page",
			routerPositionClass,
			{
				stacked: stacked && !routerForceUnstack,
				tabs,
				"page-with-subnavbar": subnavbar || withSubnavbar || forceSubnavbar,
				"page-with-navbar-large": navbarLarge || withNavbarLarge || forceNavbarLarge,
				"no-navbar": noNavbar,
				"no-toolbar": noToolbar,
				"no-swipeback": noSwipeback,
				"page-master": routerPageRole === "master",
				"page-master-detail": routerPageRole === "detail",
				"page-master-detail-root": routerPageRoleDetailRoot === true,
				"page-master-stacked": routerPageMasterStack === true,
				"page-with-navbar-large-collapsed": hasNavbarLargeCollapsed === true,
				"page-with-card-opened": hasCardExpandableOpened === true,
				"login-screen-page": loginScreen
			},
			Mixins.colorClasses($$props)
		));
	};

	$$props = exclude_internal_props($$props);

	return [
		id,
		style,
		name,
		pageContent,
		ptr,
		ptrDistance,
		ptrPreloader,
		ptrBottom,
		ptrMousewheel,
		infinite,
		infiniteTop,
		infiniteDistance,
		infinitePreloader,
		hideBarsOnScroll,
		hideNavbarOnScroll,
		hideToolbarOnScroll,
		messagesContent,
		loginScreen,
		el,
		classes,
		onPtrPullStart,
		onPtrPullMove,
		onPtrPullEnd,
		onPtrRefresh,
		onPtrDone,
		onInfinite,
		stacked,
		withSubnavbar,
		subnavbar,
		withNavbarLarge,
		navbarLarge,
		noNavbar,
		noToolbar,
		tabs,
		noSwipeback,
		className,
		hasSubnavbar,
		hasNavbarLarge,
		hasNavbarLargeCollapsed,
		hasCardExpandableOpened,
		routerPositionClass,
		routerForceUnstack,
		routerPageRole,
		routerPageRoleDetailRoot,
		routerPageMasterStack,
		forceSubnavbar,
		forceNavbarLarge,
		dispatch,
		onPageMounted,
		onPageInit,
		onPageReinit,
		onPageBeforeIn,
		onPageBeforeOut,
		onPageAfterOut,
		onPageAfterIn,
		onPageBeforeRemove,
		onPageStack,
		onPageUnstack,
		onPagePosition,
		onPageRole,
		onPageMasterStack,
		onPageMasterUnstack,
		onPageNavbarLargeCollapsed,
		onPageNavbarLargeExpanded,
		onCardOpened,
		onCardClose,
		mountPage,
		destroyPage,
		$$props,
		$$slots,
		div_binding,
		$$scope
	];
}

class Page extends SvelteComponentDev {
	constructor(options) {
		super(options);

		init(
			this,
			options,
			instance$7,
			create_fragment$7,
			safe_not_equal,
			{
				id: 0,
				style: 1,
				name: 2,
				stacked: 26,
				withSubnavbar: 27,
				subnavbar: 28,
				withNavbarLarge: 29,
				navbarLarge: 30,
				noNavbar: 31,
				noToolbar: 32,
				tabs: 33,
				pageContent: 3,
				noSwipeback: 34,
				ptr: 4,
				ptrDistance: 5,
				ptrPreloader: 6,
				ptrBottom: 7,
				ptrMousewheel: 8,
				infinite: 9,
				infiniteTop: 10,
				infiniteDistance: 11,
				infinitePreloader: 12,
				hideBarsOnScroll: 13,
				hideNavbarOnScroll: 14,
				hideToolbarOnScroll: 15,
				messagesContent: 16,
				loginScreen: 17,
				class: 35
			},
			[-1, -1, -1]
		);

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Page",
			options,
			id: create_fragment$7.name
		});
	}

	get id() {
		throw new Error("<Page>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set id(value) {
		throw new Error("<Page>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get style() {
		throw new Error("<Page>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set style(value) {
		throw new Error("<Page>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get name() {
		throw new Error("<Page>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set name(value) {
		throw new Error("<Page>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get stacked() {
		throw new Error("<Page>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set stacked(value) {
		throw new Error("<Page>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get withSubnavbar() {
		throw new Error("<Page>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set withSubnavbar(value) {
		throw new Error("<Page>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get subnavbar() {
		throw new Error("<Page>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set subnavbar(value) {
		throw new Error("<Page>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get withNavbarLarge() {
		throw new Error("<Page>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set withNavbarLarge(value) {
		throw new Error("<Page>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get navbarLarge() {
		throw new Error("<Page>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set navbarLarge(value) {
		throw new Error("<Page>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get noNavbar() {
		throw new Error("<Page>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set noNavbar(value) {
		throw new Error("<Page>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get noToolbar() {
		throw new Error("<Page>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set noToolbar(value) {
		throw new Error("<Page>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get tabs() {
		throw new Error("<Page>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set tabs(value) {
		throw new Error("<Page>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get pageContent() {
		throw new Error("<Page>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set pageContent(value) {
		throw new Error("<Page>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get noSwipeback() {
		throw new Error("<Page>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set noSwipeback(value) {
		throw new Error("<Page>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get ptr() {
		throw new Error("<Page>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set ptr(value) {
		throw new Error("<Page>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get ptrDistance() {
		throw new Error("<Page>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set ptrDistance(value) {
		throw new Error("<Page>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get ptrPreloader() {
		throw new Error("<Page>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set ptrPreloader(value) {
		throw new Error("<Page>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get ptrBottom() {
		throw new Error("<Page>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set ptrBottom(value) {
		throw new Error("<Page>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get ptrMousewheel() {
		throw new Error("<Page>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set ptrMousewheel(value) {
		throw new Error("<Page>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get infinite() {
		throw new Error("<Page>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set infinite(value) {
		throw new Error("<Page>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get infiniteTop() {
		throw new Error("<Page>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set infiniteTop(value) {
		throw new Error("<Page>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get infiniteDistance() {
		throw new Error("<Page>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set infiniteDistance(value) {
		throw new Error("<Page>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get infinitePreloader() {
		throw new Error("<Page>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set infinitePreloader(value) {
		throw new Error("<Page>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get hideBarsOnScroll() {
		throw new Error("<Page>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set hideBarsOnScroll(value) {
		throw new Error("<Page>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get hideNavbarOnScroll() {
		throw new Error("<Page>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set hideNavbarOnScroll(value) {
		throw new Error("<Page>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get hideToolbarOnScroll() {
		throw new Error("<Page>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set hideToolbarOnScroll(value) {
		throw new Error("<Page>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get messagesContent() {
		throw new Error("<Page>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set messagesContent(value) {
		throw new Error("<Page>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get loginScreen() {
		throw new Error("<Page>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set loginScreen(value) {
		throw new Error("<Page>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get class() {
		throw new Error("<Page>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set class(value) {
		throw new Error("<Page>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* node_modules/framework7-svelte/components/panel.svelte generated by Svelte v3.18.2 */
const file$8 = "node_modules/framework7-svelte/components/panel.svelte";

// (188:2) {#if resizable}
function create_if_block$5(ctx) {
	let div;

	const block = {
		c: function create() {
			div = element("div");
			attr_dev(div, "class", "panel-resize-handler");
			add_location(div, file$8, 188, 4, 5365);
		},
		m: function mount(target, anchor) {
			insert_dev(target, div, anchor);
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(div);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block$5.name,
		type: "if",
		source: "(188:2) {#if resizable}",
		ctx
	});

	return block;
}

function create_fragment$8(ctx) {
	let div;
	let t;
	let current;
	const default_slot_template = /*$$slots*/ ctx[47].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[46], null);
	let if_block = /*resizable*/ ctx[2] && create_if_block$5(ctx);

	const block = {
		c: function create() {
			div = element("div");
			if (default_slot) default_slot.c();
			t = space();
			if (if_block) if_block.c();
			attr_dev(div, "id", /*id*/ ctx[0]);
			attr_dev(div, "style", /*style*/ ctx[1]);
			attr_dev(div, "class", /*classes*/ ctx[4]);
			add_location(div, file$8, 185, 0, 5273);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, div, anchor);

			if (default_slot) {
				default_slot.m(div, null);
			}

			append_dev(div, t);
			if (if_block) if_block.m(div, null);
			/*div_binding*/ ctx[48](div);
			current = true;
		},
		p: function update(ctx, dirty) {
			if (default_slot && default_slot.p && dirty[1] & /*$$scope*/ 32768) {
				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[46], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[46], dirty, null));
			}

			if (/*resizable*/ ctx[2]) {
				if (!if_block) {
					if_block = create_if_block$5(ctx);
					if_block.c();
					if_block.m(div, null);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}

			if (!current || dirty[0] & /*id*/ 1) {
				attr_dev(div, "id", /*id*/ ctx[0]);
			}

			if (!current || dirty[0] & /*style*/ 2) {
				attr_dev(div, "style", /*style*/ ctx[1]);
			}

			if (!current || dirty[0] & /*classes*/ 16) {
				attr_dev(div, "class", /*classes*/ ctx[4]);
			}
		},
		i: function intro(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(default_slot, local);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(div);
			if (default_slot) default_slot.d(detaching);
			if (if_block) if_block.d();
			/*div_binding*/ ctx[48](null);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$8.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance_1($$self, $$props, $$invalidate) {
	const dispatch = createEventDispatcher();
	let { id = undefined } = $$props;
	let { style = undefined } = $$props;
	let { class: className = undefined } = $$props;
	let { side = undefined } = $$props;
	let { effect = undefined } = $$props;
	let { cover = false } = $$props;
	let { reveal = false } = $$props;
	let { left = false } = $$props;
	let { right = false } = $$props;
	let { opened = false } = $$props;
	let { resizable = false } = $$props;
	let { backdrop = true } = $$props;
	let { backdropEl = undefined } = $$props;
	let { visibleBreakpoint = undefined } = $$props;
	let { collapsedBreakpoint = undefined } = $$props;
	let { swipe = false } = $$props;
	let { swipeOnlyClose = false } = $$props;
	let { swipeActiveArea = 0 } = $$props;
	let { swipeThreshold = 0 } = $$props;
	let el;
	let f7Panel;

	function instance() {
		return f7Panel;
	}

	let resizableOld = resizable;
	let initialWatchedResizable = false;

	function watchResizable(r) {
		if (!initialWatchedResizable) {
			initialWatchedResizable = true;
			return;
		}

		if (f7Panel && r && !resizableOld) {
			f7Panel.enableResizable();
		} else if (f7Panel && !r && resizableOld) {
			f7Panel.disableResizable();
		}

		resizableOld = r;
	}

	let openedOld = opened;
	let initialWatchedOpened = false;

	function watchOpened(o) {
		if (!initialWatchedOpened) {
			initialWatchedOpened = true;
			return;
		}

		if (f7Panel && o && !openedOld) {
			f7Panel.open();
		} else if (f7Panel && !o && openedOld) {
			f7Panel.close();
		}

		openedOld = o;
	}

	function onOpen(...args) {
		dispatch("panelOpen", [...args]);
		if (typeof $$props.onPanelOpen === "function") $$props.onPanelOpen(...args);
	}

	function onOpened(...args) {
		dispatch("panelOpened", [...args]);
		if (typeof $$props.onPanelOpened === "function") $$props.onPanelOpened(...args);
	}

	function onClose(...args) {
		dispatch("panelClose", [...args]);
		if (typeof $$props.onPanelClose === "function") $$props.onPanelClose(...args);
	}

	function onClosed(...args) {
		dispatch("panelClosed", [...args]);
		if (typeof $$props.onPanelClosed === "function") $$props.onPanelClosed(...args);
	}

	function onBackdropClick(...args) {
		dispatch("panelBackdropClick", [...args]);
		if (typeof $$props.onPanelBackdropClick === "function") $$props.onPanelBackdropClick(...args);
	}

	function onSwipe(...args) {
		dispatch("panelSwipe", [...args]);
		if (typeof $$props.onPanelSwipe === "function") $$props.onPanelSwipe(...args);
	}

	function onSwipeOpen(...args) {
		dispatch("panelSwipeOpen", [...args]);
		if (typeof $$props.onPanelSwipeOpen === "function") $$props.onPanelSwipeOpen(...args);
	}

	function onBreakpoint(...args) {
		dispatch("panelBreakpoint", [...args]);
		if (typeof $$props.onPanelBreakpoint === "function") $$props.onPanelBreakpoint(...args);
	}

	function onCollapsedBreakpoint(...args) {
		dispatch("panelCollapsedBreakpoint", [...args]);
		if (typeof $$props.onPanelCollapsedBreakpoint === "function") $$props.onPanelCollapsedBreakpoint(...args);
	}

	function onResize(...args) {
		dispatch("panelResize", [...args]);
		if (typeof $$props.onPanelResize === "function") $$props.onPanelResize(...args);
	}

	function open(animate) {
		if (!f7Panel) return;
		f7Panel.open(animate);
	}

	function close(animate) {
		if (!f7Panel) return;
		f7Panel.close(animate);
	}

	function toggle(animate) {
		if (!f7Panel) return;
		f7Panel.toggle(animate);
	} // eslint-disable-line

	onMount(() => {
		f7.ready(() => {
			const dom7 = f7.instance.$;

			if (dom7(".panel-backdrop").length === 0) {
				dom7("<div class=\"panel-backdrop\"></div>").insertBefore(el);
			}

			const params = Utils.noUndefinedProps({
				el,
				resizable,
				backdrop,
				backdropEl,
				visibleBreakpoint,
				collapsedBreakpoint,
				swipe,
				swipeOnlyClose,
				swipeActiveArea,
				swipeThreshold,
				on: {
					open: onOpen,
					opened: onOpened,
					close: onClose,
					closed: onClosed,
					backdropClick: onBackdropClick,
					swipe: onSwipe,
					swipeOpen: onSwipeOpen,
					collapsedBreakpoint: onCollapsedBreakpoint,
					breakpoint: onBreakpoint,
					resize: onResize
				}
			});

			f7Panel = f7.instance.panel.create(params);

			if (opened) {
				f7Panel.open(false);
			}
		});
	});

	onDestroy(() => {
		if (f7Panel && f7Panel.destroy) {
			f7Panel.destroy();
		}

		f7Panel = null;
	});

	let { $$slots = {}, $$scope } = $$props;

	function div_binding($$value) {
		binding_callbacks[$$value ? "unshift" : "push"](() => {
			$$invalidate(3, el = $$value);
		});
	}

	$$self.$set = $$new_props => {
		$$invalidate(45, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
		if ("id" in $$new_props) $$invalidate(0, id = $$new_props.id);
		if ("style" in $$new_props) $$invalidate(1, style = $$new_props.style);
		if ("class" in $$new_props) $$invalidate(5, className = $$new_props.class);
		if ("side" in $$new_props) $$invalidate(6, side = $$new_props.side);
		if ("effect" in $$new_props) $$invalidate(7, effect = $$new_props.effect);
		if ("cover" in $$new_props) $$invalidate(8, cover = $$new_props.cover);
		if ("reveal" in $$new_props) $$invalidate(9, reveal = $$new_props.reveal);
		if ("left" in $$new_props) $$invalidate(10, left = $$new_props.left);
		if ("right" in $$new_props) $$invalidate(11, right = $$new_props.right);
		if ("opened" in $$new_props) $$invalidate(12, opened = $$new_props.opened);
		if ("resizable" in $$new_props) $$invalidate(2, resizable = $$new_props.resizable);
		if ("backdrop" in $$new_props) $$invalidate(13, backdrop = $$new_props.backdrop);
		if ("backdropEl" in $$new_props) $$invalidate(14, backdropEl = $$new_props.backdropEl);
		if ("visibleBreakpoint" in $$new_props) $$invalidate(15, visibleBreakpoint = $$new_props.visibleBreakpoint);
		if ("collapsedBreakpoint" in $$new_props) $$invalidate(16, collapsedBreakpoint = $$new_props.collapsedBreakpoint);
		if ("swipe" in $$new_props) $$invalidate(17, swipe = $$new_props.swipe);
		if ("swipeOnlyClose" in $$new_props) $$invalidate(18, swipeOnlyClose = $$new_props.swipeOnlyClose);
		if ("swipeActiveArea" in $$new_props) $$invalidate(19, swipeActiveArea = $$new_props.swipeActiveArea);
		if ("swipeThreshold" in $$new_props) $$invalidate(20, swipeThreshold = $$new_props.swipeThreshold);
		if ("$$scope" in $$new_props) $$invalidate(46, $$scope = $$new_props.$$scope);
	};

	$$self.$capture_state = () => {
		return {
			id,
			style,
			className,
			side,
			effect,
			cover,
			reveal,
			left,
			right,
			opened,
			resizable,
			backdrop,
			backdropEl,
			visibleBreakpoint,
			collapsedBreakpoint,
			swipe,
			swipeOnlyClose,
			swipeActiveArea,
			swipeThreshold,
			el,
			f7Panel,
			resizableOld,
			initialWatchedResizable,
			openedOld,
			initialWatchedOpened,
			sideComputed,
			effectComputed,
			classes
		};
	};

	$$self.$inject_state = $$new_props => {
		$$invalidate(45, $$props = assign(assign({}, $$props), $$new_props));
		if ("id" in $$props) $$invalidate(0, id = $$new_props.id);
		if ("style" in $$props) $$invalidate(1, style = $$new_props.style);
		if ("className" in $$props) $$invalidate(5, className = $$new_props.className);
		if ("side" in $$props) $$invalidate(6, side = $$new_props.side);
		if ("effect" in $$props) $$invalidate(7, effect = $$new_props.effect);
		if ("cover" in $$props) $$invalidate(8, cover = $$new_props.cover);
		if ("reveal" in $$props) $$invalidate(9, reveal = $$new_props.reveal);
		if ("left" in $$props) $$invalidate(10, left = $$new_props.left);
		if ("right" in $$props) $$invalidate(11, right = $$new_props.right);
		if ("opened" in $$props) $$invalidate(12, opened = $$new_props.opened);
		if ("resizable" in $$props) $$invalidate(2, resizable = $$new_props.resizable);
		if ("backdrop" in $$props) $$invalidate(13, backdrop = $$new_props.backdrop);
		if ("backdropEl" in $$props) $$invalidate(14, backdropEl = $$new_props.backdropEl);
		if ("visibleBreakpoint" in $$props) $$invalidate(15, visibleBreakpoint = $$new_props.visibleBreakpoint);
		if ("collapsedBreakpoint" in $$props) $$invalidate(16, collapsedBreakpoint = $$new_props.collapsedBreakpoint);
		if ("swipe" in $$props) $$invalidate(17, swipe = $$new_props.swipe);
		if ("swipeOnlyClose" in $$props) $$invalidate(18, swipeOnlyClose = $$new_props.swipeOnlyClose);
		if ("swipeActiveArea" in $$props) $$invalidate(19, swipeActiveArea = $$new_props.swipeActiveArea);
		if ("swipeThreshold" in $$props) $$invalidate(20, swipeThreshold = $$new_props.swipeThreshold);
		if ("el" in $$props) $$invalidate(3, el = $$new_props.el);
		if ("f7Panel" in $$props) f7Panel = $$new_props.f7Panel;
		if ("resizableOld" in $$props) resizableOld = $$new_props.resizableOld;
		if ("initialWatchedResizable" in $$props) initialWatchedResizable = $$new_props.initialWatchedResizable;
		if ("openedOld" in $$props) openedOld = $$new_props.openedOld;
		if ("initialWatchedOpened" in $$props) initialWatchedOpened = $$new_props.initialWatchedOpened;
		if ("sideComputed" in $$props) $$invalidate(30, sideComputed = $$new_props.sideComputed);
		if ("effectComputed" in $$props) $$invalidate(31, effectComputed = $$new_props.effectComputed);
		if ("classes" in $$props) $$invalidate(4, classes = $$new_props.classes);
	};

	let sideComputed;
	let effectComputed;
	let classes;

	$$self.$$.update = () => {
		if ($$self.$$.dirty[0] & /*side, left, right*/ 3136) {
			// eslint-disable-next-line
			 $$invalidate(30, sideComputed = side || (left ? "left" : right ? "right" : "left"));
		}

		if ($$self.$$.dirty[0] & /*effect, reveal, cover*/ 896) {
			// eslint-disable-next-line
			 $$invalidate(31, effectComputed = effect || (reveal ? "reveal" : cover ? "cover" : "cover"));
		}

		 $$invalidate(4, classes = Utils.classNames(
			className,
			"panel",
			{
				"panel-resizable": resizable,
				[`panel-${sideComputed}`]: sideComputed,
				[`panel-${effectComputed}`]: effectComputed
			},
			Mixins.colorClasses($$props)
		));

		if ($$self.$$.dirty[0] & /*resizable*/ 4) {
			 watchResizable(resizable);
		}

		if ($$self.$$.dirty[0] & /*opened*/ 4096) {
			 watchOpened(opened);
		}
	};

	$$props = exclude_internal_props($$props);

	return [
		id,
		style,
		resizable,
		el,
		classes,
		className,
		side,
		effect,
		cover,
		reveal,
		left,
		right,
		opened,
		backdrop,
		backdropEl,
		visibleBreakpoint,
		collapsedBreakpoint,
		swipe,
		swipeOnlyClose,
		swipeActiveArea,
		swipeThreshold,
		instance,
		open,
		close,
		toggle,
		f7Panel,
		resizableOld,
		initialWatchedResizable,
		openedOld,
		initialWatchedOpened,
		sideComputed,
		effectComputed,
		dispatch,
		watchResizable,
		watchOpened,
		onOpen,
		onOpened,
		onClose,
		onClosed,
		onBackdropClick,
		onSwipe,
		onSwipeOpen,
		onBreakpoint,
		onCollapsedBreakpoint,
		onResize,
		$$props,
		$$scope,
		$$slots,
		div_binding
	];
}

class Panel extends SvelteComponentDev {
	constructor(options) {
		super(options);

		init(
			this,
			options,
			instance_1,
			create_fragment$8,
			safe_not_equal,
			{
				id: 0,
				style: 1,
				class: 5,
				side: 6,
				effect: 7,
				cover: 8,
				reveal: 9,
				left: 10,
				right: 11,
				opened: 12,
				resizable: 2,
				backdrop: 13,
				backdropEl: 14,
				visibleBreakpoint: 15,
				collapsedBreakpoint: 16,
				swipe: 17,
				swipeOnlyClose: 18,
				swipeActiveArea: 19,
				swipeThreshold: 20,
				instance: 21,
				open: 22,
				close: 23,
				toggle: 24
			},
			[-1, -1]
		);

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Panel",
			options,
			id: create_fragment$8.name
		});
	}

	get id() {
		throw new Error("<Panel>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set id(value) {
		throw new Error("<Panel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get style() {
		throw new Error("<Panel>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set style(value) {
		throw new Error("<Panel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get class() {
		throw new Error("<Panel>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set class(value) {
		throw new Error("<Panel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get side() {
		throw new Error("<Panel>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set side(value) {
		throw new Error("<Panel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get effect() {
		throw new Error("<Panel>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set effect(value) {
		throw new Error("<Panel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get cover() {
		throw new Error("<Panel>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set cover(value) {
		throw new Error("<Panel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get reveal() {
		throw new Error("<Panel>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set reveal(value) {
		throw new Error("<Panel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get left() {
		throw new Error("<Panel>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set left(value) {
		throw new Error("<Panel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get right() {
		throw new Error("<Panel>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set right(value) {
		throw new Error("<Panel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get opened() {
		throw new Error("<Panel>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set opened(value) {
		throw new Error("<Panel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get resizable() {
		throw new Error("<Panel>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set resizable(value) {
		throw new Error("<Panel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get backdrop() {
		throw new Error("<Panel>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set backdrop(value) {
		throw new Error("<Panel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get backdropEl() {
		throw new Error("<Panel>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set backdropEl(value) {
		throw new Error("<Panel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get visibleBreakpoint() {
		throw new Error("<Panel>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set visibleBreakpoint(value) {
		throw new Error("<Panel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get collapsedBreakpoint() {
		throw new Error("<Panel>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set collapsedBreakpoint(value) {
		throw new Error("<Panel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get swipe() {
		throw new Error("<Panel>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set swipe(value) {
		throw new Error("<Panel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get swipeOnlyClose() {
		throw new Error("<Panel>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set swipeOnlyClose(value) {
		throw new Error("<Panel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get swipeActiveArea() {
		throw new Error("<Panel>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set swipeActiveArea(value) {
		throw new Error("<Panel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get swipeThreshold() {
		throw new Error("<Panel>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set swipeThreshold(value) {
		throw new Error("<Panel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get instance() {
		return this.$$.ctx[21];
	}

	set instance(value) {
		throw new Error("<Panel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get open() {
		return this.$$.ctx[22];
	}

	set open(value) {
		throw new Error("<Panel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get close() {
		return this.$$.ctx[23];
	}

	set close(value) {
		throw new Error("<Panel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get toggle() {
		return this.$$.ctx[24];
	}

	set toggle(value) {
		throw new Error("<Panel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* node_modules/framework7-svelte/components/treeview-item.svelte generated by Svelte v3.18.2 */
const file$9 = "node_modules/framework7-svelte/components/treeview-item.svelte";
const get_children_slot_changes = dirty => ({});
const get_children_slot_context = ctx => ({});
const get_children_start_slot_changes = dirty => ({});
const get_children_start_slot_context = ctx => ({});
const get_root_end_slot_changes_1 = dirty => ({});
const get_root_end_slot_context_1 = ctx => ({});
const get_root_slot_changes_1 = dirty => ({});
const get_root_slot_context_1 = ctx => ({});
const get_content_end_slot_changes_1 = dirty => ({});
const get_content_end_slot_context_1 = ctx => ({});
const get_content_slot_changes_1 = dirty => ({});
const get_content_slot_context_1 = ctx => ({});
const get_label_slot_changes_1 = dirty => ({});
const get_label_slot_context_1 = ctx => ({});
const get_label_start_slot_changes_1 = dirty => ({});
const get_label_start_slot_context_1 = ctx => ({});
const get_media_slot_changes_1 = dirty => ({});
const get_media_slot_context_1 = ctx => ({});
const get_content_start_slot_changes_1 = dirty => ({});
const get_content_start_slot_context_1 = ctx => ({});
const get_root_start_slot_changes_1 = dirty => ({});
const get_root_start_slot_context_1 = ctx => ({});
const get_root_end_slot_changes = dirty => ({});
const get_root_end_slot_context = ctx => ({});
const get_root_slot_changes = dirty => ({});
const get_root_slot_context = ctx => ({});
const get_content_end_slot_changes = dirty => ({});
const get_content_end_slot_context = ctx => ({});
const get_content_slot_changes = dirty => ({});
const get_content_slot_context = ctx => ({});
const get_label_slot_changes = dirty => ({});
const get_label_slot_context = ctx => ({});
const get_label_start_slot_changes = dirty => ({});
const get_label_start_slot_context = ctx => ({});
const get_media_slot_changes = dirty => ({});
const get_media_slot_context = ctx => ({});
const get_content_start_slot_changes = dirty => ({});
const get_content_start_slot_context = ctx => ({});
const get_root_start_slot_changes = dirty => ({});
const get_root_start_slot_context = ctx => ({});

// (144:2) {:else}
function create_else_block$4(ctx) {
	let a;
	let t0;
	let t1;
	let div1;
	let t2;
	let t3;
	let t4;
	let div0;
	let t5;
	let t6_value = Utils.text(/*label*/ ctx[2]) + "";
	let t6;
	let t7;
	let t8;
	let t9;
	let t10;
	let t11;
	let current;
	let dispose;
	const root_start_slot_template = /*$$slots*/ ctx[26]["root-start"];
	const root_start_slot = create_slot(root_start_slot_template, ctx, /*$$scope*/ ctx[25], get_root_start_slot_context_1);
	let if_block0 = /*needToggle*/ ctx[8] && create_if_block_5(ctx);
	const content_start_slot_template = /*$$slots*/ ctx[26]["content-start"];
	const content_start_slot = create_slot(content_start_slot_template, ctx, /*$$scope*/ ctx[25], get_content_start_slot_context_1);
	let if_block1 = /*hasIcon*/ ctx[9] && create_if_block_4$1(ctx);
	const media_slot_template = /*$$slots*/ ctx[26].media;
	const media_slot = create_slot(media_slot_template, ctx, /*$$scope*/ ctx[25], get_media_slot_context_1);
	const label_start_slot_template = /*$$slots*/ ctx[26]["label-start"];
	const label_start_slot = create_slot(label_start_slot_template, ctx, /*$$scope*/ ctx[25], get_label_start_slot_context_1);
	const label_slot_template = /*$$slots*/ ctx[26].label;
	const label_slot = create_slot(label_slot_template, ctx, /*$$scope*/ ctx[25], get_label_slot_context_1);
	const content_slot_template = /*$$slots*/ ctx[26].content;
	const content_slot = create_slot(content_slot_template, ctx, /*$$scope*/ ctx[25], get_content_slot_context_1);
	const content_end_slot_template = /*$$slots*/ ctx[26]["content-end"];
	const content_end_slot = create_slot(content_end_slot_template, ctx, /*$$scope*/ ctx[25], get_content_end_slot_context_1);
	const root_slot_template = /*$$slots*/ ctx[26].root;
	const root_slot = create_slot(root_slot_template, ctx, /*$$scope*/ ctx[25], get_root_slot_context_1);
	const root_end_slot_template = /*$$slots*/ ctx[26]["root-end"];
	const root_end_slot = create_slot(root_end_slot_template, ctx, /*$$scope*/ ctx[25], get_root_end_slot_context_1);
	let a_levels = [{ class: /*itemRootClasses*/ ctx[5] }, /*itemRootAttrs*/ ctx[6]];
	let a_data = {};

	for (let i = 0; i < a_levels.length; i += 1) {
		a_data = assign(a_data, a_levels[i]);
	}

	const block = {
		c: function create() {
			a = element("a");
			if (root_start_slot) root_start_slot.c();
			t0 = space();
			if (if_block0) if_block0.c();
			t1 = space();
			div1 = element("div");
			if (content_start_slot) content_start_slot.c();
			t2 = space();
			if (if_block1) if_block1.c();
			t3 = space();
			if (media_slot) media_slot.c();
			t4 = space();
			div0 = element("div");
			if (label_start_slot) label_start_slot.c();
			t5 = space();
			t6 = text(t6_value);
			t7 = space();
			if (label_slot) label_slot.c();
			t8 = space();
			if (content_slot) content_slot.c();
			t9 = space();
			if (content_end_slot) content_end_slot.c();
			t10 = space();
			if (root_slot) root_slot.c();
			t11 = space();
			if (root_end_slot) root_end_slot.c();
			attr_dev(div0, "class", "treeview-item-label");
			add_location(div0, file$9, 168, 8, 4836);
			attr_dev(div1, "class", "treeview-item-content");
			add_location(div1, file$9, 153, 6, 4371);
			set_attributes(a, a_data);
			add_location(a, file$9, 144, 4, 4164);
		},
		m: function mount(target, anchor) {
			insert_dev(target, a, anchor);

			if (root_start_slot) {
				root_start_slot.m(a, null);
			}

			append_dev(a, t0);
			if (if_block0) if_block0.m(a, null);
			append_dev(a, t1);
			append_dev(a, div1);

			if (content_start_slot) {
				content_start_slot.m(div1, null);
			}

			append_dev(div1, t2);
			if (if_block1) if_block1.m(div1, null);
			append_dev(div1, t3);

			if (media_slot) {
				media_slot.m(div1, null);
			}

			append_dev(div1, t4);
			append_dev(div1, div0);

			if (label_start_slot) {
				label_start_slot.m(div0, null);
			}

			append_dev(div0, t5);
			append_dev(div0, t6);
			append_dev(div0, t7);

			if (label_slot) {
				label_slot.m(div0, null);
			}

			append_dev(div1, t8);

			if (content_slot) {
				content_slot.m(div1, null);
			}

			append_dev(div1, t9);

			if (content_end_slot) {
				content_end_slot.m(div1, null);
			}

			append_dev(a, t10);

			if (root_slot) {
				root_slot.m(a, null);
			}

			append_dev(a, t11);

			if (root_end_slot) {
				root_end_slot.m(a, null);
			}

			current = true;
			dispose = listen_dev(a, "click", /*onClick*/ ctx[11], false, false, false);
		},
		p: function update(ctx, dirty) {
			if (root_start_slot && root_start_slot.p && dirty & /*$$scope*/ 33554432) {
				root_start_slot.p(get_slot_context(root_start_slot_template, ctx, /*$$scope*/ ctx[25], get_root_start_slot_context_1), get_slot_changes(root_start_slot_template, /*$$scope*/ ctx[25], dirty, get_root_start_slot_changes_1));
			}

			if (/*needToggle*/ ctx[8]) {
				if (!if_block0) {
					if_block0 = create_if_block_5(ctx);
					if_block0.c();
					if_block0.m(a, t1);
				}
			} else if (if_block0) {
				if_block0.d(1);
				if_block0 = null;
			}

			if (content_start_slot && content_start_slot.p && dirty & /*$$scope*/ 33554432) {
				content_start_slot.p(get_slot_context(content_start_slot_template, ctx, /*$$scope*/ ctx[25], get_content_start_slot_context_1), get_slot_changes(content_start_slot_template, /*$$scope*/ ctx[25], dirty, get_content_start_slot_changes_1));
			}

			if (/*hasIcon*/ ctx[9]) {
				if (if_block1) {
					if_block1.p(ctx, dirty);
					transition_in(if_block1, 1);
				} else {
					if_block1 = create_if_block_4$1(ctx);
					if_block1.c();
					transition_in(if_block1, 1);
					if_block1.m(div1, t3);
				}
			} else if (if_block1) {
				group_outros();

				transition_out(if_block1, 1, 1, () => {
					if_block1 = null;
				});

				check_outros();
			}

			if (media_slot && media_slot.p && dirty & /*$$scope*/ 33554432) {
				media_slot.p(get_slot_context(media_slot_template, ctx, /*$$scope*/ ctx[25], get_media_slot_context_1), get_slot_changes(media_slot_template, /*$$scope*/ ctx[25], dirty, get_media_slot_changes_1));
			}

			if (label_start_slot && label_start_slot.p && dirty & /*$$scope*/ 33554432) {
				label_start_slot.p(get_slot_context(label_start_slot_template, ctx, /*$$scope*/ ctx[25], get_label_start_slot_context_1), get_slot_changes(label_start_slot_template, /*$$scope*/ ctx[25], dirty, get_label_start_slot_changes_1));
			}

			if ((!current || dirty & /*label*/ 4) && t6_value !== (t6_value = Utils.text(/*label*/ ctx[2]) + "")) set_data_dev(t6, t6_value);

			if (label_slot && label_slot.p && dirty & /*$$scope*/ 33554432) {
				label_slot.p(get_slot_context(label_slot_template, ctx, /*$$scope*/ ctx[25], get_label_slot_context_1), get_slot_changes(label_slot_template, /*$$scope*/ ctx[25], dirty, get_label_slot_changes_1));
			}

			if (content_slot && content_slot.p && dirty & /*$$scope*/ 33554432) {
				content_slot.p(get_slot_context(content_slot_template, ctx, /*$$scope*/ ctx[25], get_content_slot_context_1), get_slot_changes(content_slot_template, /*$$scope*/ ctx[25], dirty, get_content_slot_changes_1));
			}

			if (content_end_slot && content_end_slot.p && dirty & /*$$scope*/ 33554432) {
				content_end_slot.p(get_slot_context(content_end_slot_template, ctx, /*$$scope*/ ctx[25], get_content_end_slot_context_1), get_slot_changes(content_end_slot_template, /*$$scope*/ ctx[25], dirty, get_content_end_slot_changes_1));
			}

			if (root_slot && root_slot.p && dirty & /*$$scope*/ 33554432) {
				root_slot.p(get_slot_context(root_slot_template, ctx, /*$$scope*/ ctx[25], get_root_slot_context_1), get_slot_changes(root_slot_template, /*$$scope*/ ctx[25], dirty, get_root_slot_changes_1));
			}

			if (root_end_slot && root_end_slot.p && dirty & /*$$scope*/ 33554432) {
				root_end_slot.p(get_slot_context(root_end_slot_template, ctx, /*$$scope*/ ctx[25], get_root_end_slot_context_1), get_slot_changes(root_end_slot_template, /*$$scope*/ ctx[25], dirty, get_root_end_slot_changes_1));
			}

			set_attributes(a, get_spread_update(a_levels, [
				dirty & /*itemRootClasses*/ 32 && { class: /*itemRootClasses*/ ctx[5] },
				dirty & /*itemRootAttrs*/ 64 && /*itemRootAttrs*/ ctx[6]
			]));
		},
		i: function intro(local) {
			if (current) return;
			transition_in(root_start_slot, local);
			transition_in(content_start_slot, local);
			transition_in(if_block1);
			transition_in(media_slot, local);
			transition_in(label_start_slot, local);
			transition_in(label_slot, local);
			transition_in(content_slot, local);
			transition_in(content_end_slot, local);
			transition_in(root_slot, local);
			transition_in(root_end_slot, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(root_start_slot, local);
			transition_out(content_start_slot, local);
			transition_out(if_block1);
			transition_out(media_slot, local);
			transition_out(label_start_slot, local);
			transition_out(label_slot, local);
			transition_out(content_slot, local);
			transition_out(content_end_slot, local);
			transition_out(root_slot, local);
			transition_out(root_end_slot, local);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(a);
			if (root_start_slot) root_start_slot.d(detaching);
			if (if_block0) if_block0.d();
			if (content_start_slot) content_start_slot.d(detaching);
			if (if_block1) if_block1.d();
			if (media_slot) media_slot.d(detaching);
			if (label_start_slot) label_start_slot.d(detaching);
			if (label_slot) label_slot.d(detaching);
			if (content_slot) content_slot.d(detaching);
			if (content_end_slot) content_end_slot.d(detaching);
			if (root_slot) root_slot.d(detaching);
			if (root_end_slot) root_end_slot.d(detaching);
			dispose();
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_else_block$4.name,
		type: "else",
		source: "(144:2) {:else}",
		ctx
	});

	return block;
}

// (108:2) {#if treeviewRootTag === 'div'}
function create_if_block_1$3(ctx) {
	let div2;
	let t0;
	let t1;
	let div1;
	let t2;
	let t3;
	let t4;
	let div0;
	let t5;
	let t6_value = Utils.text(/*label*/ ctx[2]) + "";
	let t6;
	let t7;
	let t8;
	let t9;
	let t10;
	let t11;
	let current;
	let dispose;
	const root_start_slot_template = /*$$slots*/ ctx[26]["root-start"];
	const root_start_slot = create_slot(root_start_slot_template, ctx, /*$$scope*/ ctx[25], get_root_start_slot_context);
	let if_block0 = /*needToggle*/ ctx[8] && create_if_block_3$2(ctx);
	const content_start_slot_template = /*$$slots*/ ctx[26]["content-start"];
	const content_start_slot = create_slot(content_start_slot_template, ctx, /*$$scope*/ ctx[25], get_content_start_slot_context);
	let if_block1 = /*hasIcon*/ ctx[9] && create_if_block_2$3(ctx);
	const media_slot_template = /*$$slots*/ ctx[26].media;
	const media_slot = create_slot(media_slot_template, ctx, /*$$scope*/ ctx[25], get_media_slot_context);
	const label_start_slot_template = /*$$slots*/ ctx[26]["label-start"];
	const label_start_slot = create_slot(label_start_slot_template, ctx, /*$$scope*/ ctx[25], get_label_start_slot_context);
	const label_slot_template = /*$$slots*/ ctx[26].label;
	const label_slot = create_slot(label_slot_template, ctx, /*$$scope*/ ctx[25], get_label_slot_context);
	const content_slot_template = /*$$slots*/ ctx[26].content;
	const content_slot = create_slot(content_slot_template, ctx, /*$$scope*/ ctx[25], get_content_slot_context);
	const content_end_slot_template = /*$$slots*/ ctx[26]["content-end"];
	const content_end_slot = create_slot(content_end_slot_template, ctx, /*$$scope*/ ctx[25], get_content_end_slot_context);
	const root_slot_template = /*$$slots*/ ctx[26].root;
	const root_slot = create_slot(root_slot_template, ctx, /*$$scope*/ ctx[25], get_root_slot_context);
	const root_end_slot_template = /*$$slots*/ ctx[26]["root-end"];
	const root_end_slot = create_slot(root_end_slot_template, ctx, /*$$scope*/ ctx[25], get_root_end_slot_context);
	let div2_levels = [{ class: /*itemRootClasses*/ ctx[5] }, /*itemRootAttrs*/ ctx[6]];
	let div2_data = {};

	for (let i = 0; i < div2_levels.length; i += 1) {
		div2_data = assign(div2_data, div2_levels[i]);
	}

	const block = {
		c: function create() {
			div2 = element("div");
			if (root_start_slot) root_start_slot.c();
			t0 = space();
			if (if_block0) if_block0.c();
			t1 = space();
			div1 = element("div");
			if (content_start_slot) content_start_slot.c();
			t2 = space();
			if (if_block1) if_block1.c();
			t3 = space();
			if (media_slot) media_slot.c();
			t4 = space();
			div0 = element("div");
			if (label_start_slot) label_start_slot.c();
			t5 = space();
			t6 = text(t6_value);
			t7 = space();
			if (label_slot) label_slot.c();
			t8 = space();
			if (content_slot) content_slot.c();
			t9 = space();
			if (content_end_slot) content_end_slot.c();
			t10 = space();
			if (root_slot) root_slot.c();
			t11 = space();
			if (root_end_slot) root_end_slot.c();
			attr_dev(div0, "class", "treeview-item-label");
			add_location(div0, file$9, 132, 8, 3851);
			attr_dev(div1, "class", "treeview-item-content");
			add_location(div1, file$9, 117, 6, 3386);
			set_attributes(div2, div2_data);
			add_location(div2, file$9, 108, 4, 3177);
		},
		m: function mount(target, anchor) {
			insert_dev(target, div2, anchor);

			if (root_start_slot) {
				root_start_slot.m(div2, null);
			}

			append_dev(div2, t0);
			if (if_block0) if_block0.m(div2, null);
			append_dev(div2, t1);
			append_dev(div2, div1);

			if (content_start_slot) {
				content_start_slot.m(div1, null);
			}

			append_dev(div1, t2);
			if (if_block1) if_block1.m(div1, null);
			append_dev(div1, t3);

			if (media_slot) {
				media_slot.m(div1, null);
			}

			append_dev(div1, t4);
			append_dev(div1, div0);

			if (label_start_slot) {
				label_start_slot.m(div0, null);
			}

			append_dev(div0, t5);
			append_dev(div0, t6);
			append_dev(div0, t7);

			if (label_slot) {
				label_slot.m(div0, null);
			}

			append_dev(div1, t8);

			if (content_slot) {
				content_slot.m(div1, null);
			}

			append_dev(div1, t9);

			if (content_end_slot) {
				content_end_slot.m(div1, null);
			}

			append_dev(div2, t10);

			if (root_slot) {
				root_slot.m(div2, null);
			}

			append_dev(div2, t11);

			if (root_end_slot) {
				root_end_slot.m(div2, null);
			}

			current = true;
			dispose = listen_dev(div2, "click", /*onClick*/ ctx[11], false, false, false);
		},
		p: function update(ctx, dirty) {
			if (root_start_slot && root_start_slot.p && dirty & /*$$scope*/ 33554432) {
				root_start_slot.p(get_slot_context(root_start_slot_template, ctx, /*$$scope*/ ctx[25], get_root_start_slot_context), get_slot_changes(root_start_slot_template, /*$$scope*/ ctx[25], dirty, get_root_start_slot_changes));
			}

			if (/*needToggle*/ ctx[8]) {
				if (!if_block0) {
					if_block0 = create_if_block_3$2(ctx);
					if_block0.c();
					if_block0.m(div2, t1);
				}
			} else if (if_block0) {
				if_block0.d(1);
				if_block0 = null;
			}

			if (content_start_slot && content_start_slot.p && dirty & /*$$scope*/ 33554432) {
				content_start_slot.p(get_slot_context(content_start_slot_template, ctx, /*$$scope*/ ctx[25], get_content_start_slot_context), get_slot_changes(content_start_slot_template, /*$$scope*/ ctx[25], dirty, get_content_start_slot_changes));
			}

			if (/*hasIcon*/ ctx[9]) {
				if (if_block1) {
					if_block1.p(ctx, dirty);
					transition_in(if_block1, 1);
				} else {
					if_block1 = create_if_block_2$3(ctx);
					if_block1.c();
					transition_in(if_block1, 1);
					if_block1.m(div1, t3);
				}
			} else if (if_block1) {
				group_outros();

				transition_out(if_block1, 1, 1, () => {
					if_block1 = null;
				});

				check_outros();
			}

			if (media_slot && media_slot.p && dirty & /*$$scope*/ 33554432) {
				media_slot.p(get_slot_context(media_slot_template, ctx, /*$$scope*/ ctx[25], get_media_slot_context), get_slot_changes(media_slot_template, /*$$scope*/ ctx[25], dirty, get_media_slot_changes));
			}

			if (label_start_slot && label_start_slot.p && dirty & /*$$scope*/ 33554432) {
				label_start_slot.p(get_slot_context(label_start_slot_template, ctx, /*$$scope*/ ctx[25], get_label_start_slot_context), get_slot_changes(label_start_slot_template, /*$$scope*/ ctx[25], dirty, get_label_start_slot_changes));
			}

			if ((!current || dirty & /*label*/ 4) && t6_value !== (t6_value = Utils.text(/*label*/ ctx[2]) + "")) set_data_dev(t6, t6_value);

			if (label_slot && label_slot.p && dirty & /*$$scope*/ 33554432) {
				label_slot.p(get_slot_context(label_slot_template, ctx, /*$$scope*/ ctx[25], get_label_slot_context), get_slot_changes(label_slot_template, /*$$scope*/ ctx[25], dirty, get_label_slot_changes));
			}

			if (content_slot && content_slot.p && dirty & /*$$scope*/ 33554432) {
				content_slot.p(get_slot_context(content_slot_template, ctx, /*$$scope*/ ctx[25], get_content_slot_context), get_slot_changes(content_slot_template, /*$$scope*/ ctx[25], dirty, get_content_slot_changes));
			}

			if (content_end_slot && content_end_slot.p && dirty & /*$$scope*/ 33554432) {
				content_end_slot.p(get_slot_context(content_end_slot_template, ctx, /*$$scope*/ ctx[25], get_content_end_slot_context), get_slot_changes(content_end_slot_template, /*$$scope*/ ctx[25], dirty, get_content_end_slot_changes));
			}

			if (root_slot && root_slot.p && dirty & /*$$scope*/ 33554432) {
				root_slot.p(get_slot_context(root_slot_template, ctx, /*$$scope*/ ctx[25], get_root_slot_context), get_slot_changes(root_slot_template, /*$$scope*/ ctx[25], dirty, get_root_slot_changes));
			}

			if (root_end_slot && root_end_slot.p && dirty & /*$$scope*/ 33554432) {
				root_end_slot.p(get_slot_context(root_end_slot_template, ctx, /*$$scope*/ ctx[25], get_root_end_slot_context), get_slot_changes(root_end_slot_template, /*$$scope*/ ctx[25], dirty, get_root_end_slot_changes));
			}

			set_attributes(div2, get_spread_update(div2_levels, [
				dirty & /*itemRootClasses*/ 32 && { class: /*itemRootClasses*/ ctx[5] },
				dirty & /*itemRootAttrs*/ 64 && /*itemRootAttrs*/ ctx[6]
			]));
		},
		i: function intro(local) {
			if (current) return;
			transition_in(root_start_slot, local);
			transition_in(content_start_slot, local);
			transition_in(if_block1);
			transition_in(media_slot, local);
			transition_in(label_start_slot, local);
			transition_in(label_slot, local);
			transition_in(content_slot, local);
			transition_in(content_end_slot, local);
			transition_in(root_slot, local);
			transition_in(root_end_slot, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(root_start_slot, local);
			transition_out(content_start_slot, local);
			transition_out(if_block1);
			transition_out(media_slot, local);
			transition_out(label_start_slot, local);
			transition_out(label_slot, local);
			transition_out(content_slot, local);
			transition_out(content_end_slot, local);
			transition_out(root_slot, local);
			transition_out(root_end_slot, local);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(div2);
			if (root_start_slot) root_start_slot.d(detaching);
			if (if_block0) if_block0.d();
			if (content_start_slot) content_start_slot.d(detaching);
			if (if_block1) if_block1.d();
			if (media_slot) media_slot.d(detaching);
			if (label_start_slot) label_start_slot.d(detaching);
			if (label_slot) label_slot.d(detaching);
			if (content_slot) content_slot.d(detaching);
			if (content_end_slot) content_end_slot.d(detaching);
			if (root_slot) root_slot.d(detaching);
			if (root_end_slot) root_end_slot.d(detaching);
			dispose();
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block_1$3.name,
		type: "if",
		source: "(108:2) {#if treeviewRootTag === 'div'}",
		ctx
	});

	return block;
}

// (151:6) {#if needToggle}
function create_if_block_5(ctx) {
	let div;

	const block = {
		c: function create() {
			div = element("div");
			attr_dev(div, "class", "treeview-toggle");
			add_location(div, file$9, 151, 8, 4317);
		},
		m: function mount(target, anchor) {
			insert_dev(target, div, anchor);
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(div);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block_5.name,
		type: "if",
		source: "(151:6) {#if needToggle}",
		ctx
	});

	return block;
}

// (156:8) {#if hasIcon}
function create_if_block_4$1(ctx) {
	let current;

	const icon = new Icon({
			props: {
				material: /*$$props*/ ctx[12].iconMaterial,
				f7: /*$$props*/ ctx[12].iconF7,
				icon: /*$$props*/ ctx[12].icon,
				md: /*$$props*/ ctx[12].iconMd,
				ios: /*$$props*/ ctx[12].iconIos,
				aurora: /*$$props*/ ctx[12].iconAurora,
				color: /*$$props*/ ctx[12].iconColor,
				size: /*$$props*/ ctx[12].iconSize
			},
			$$inline: true
		});

	const block = {
		c: function create() {
			create_component(icon.$$.fragment);
		},
		m: function mount(target, anchor) {
			mount_component(icon, target, anchor);
			current = true;
		},
		p: function update(ctx, dirty) {
			const icon_changes = {};
			if (dirty & /*$$props*/ 4096) icon_changes.material = /*$$props*/ ctx[12].iconMaterial;
			if (dirty & /*$$props*/ 4096) icon_changes.f7 = /*$$props*/ ctx[12].iconF7;
			if (dirty & /*$$props*/ 4096) icon_changes.icon = /*$$props*/ ctx[12].icon;
			if (dirty & /*$$props*/ 4096) icon_changes.md = /*$$props*/ ctx[12].iconMd;
			if (dirty & /*$$props*/ 4096) icon_changes.ios = /*$$props*/ ctx[12].iconIos;
			if (dirty & /*$$props*/ 4096) icon_changes.aurora = /*$$props*/ ctx[12].iconAurora;
			if (dirty & /*$$props*/ 4096) icon_changes.color = /*$$props*/ ctx[12].iconColor;
			if (dirty & /*$$props*/ 4096) icon_changes.size = /*$$props*/ ctx[12].iconSize;
			icon.$set(icon_changes);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(icon.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(icon.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			destroy_component(icon, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block_4$1.name,
		type: "if",
		source: "(156:8) {#if hasIcon}",
		ctx
	});

	return block;
}

// (115:6) {#if needToggle}
function create_if_block_3$2(ctx) {
	let div;

	const block = {
		c: function create() {
			div = element("div");
			attr_dev(div, "class", "treeview-toggle");
			add_location(div, file$9, 115, 8, 3332);
		},
		m: function mount(target, anchor) {
			insert_dev(target, div, anchor);
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(div);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block_3$2.name,
		type: "if",
		source: "(115:6) {#if needToggle}",
		ctx
	});

	return block;
}

// (120:8) {#if hasIcon}
function create_if_block_2$3(ctx) {
	let current;

	const icon = new Icon({
			props: {
				material: /*$$props*/ ctx[12].iconMaterial,
				f7: /*$$props*/ ctx[12].iconF7,
				icon: /*$$props*/ ctx[12].icon,
				md: /*$$props*/ ctx[12].iconMd,
				ios: /*$$props*/ ctx[12].iconIos,
				aurora: /*$$props*/ ctx[12].iconAurora,
				color: /*$$props*/ ctx[12].iconColor,
				size: /*$$props*/ ctx[12].iconSize
			},
			$$inline: true
		});

	const block = {
		c: function create() {
			create_component(icon.$$.fragment);
		},
		m: function mount(target, anchor) {
			mount_component(icon, target, anchor);
			current = true;
		},
		p: function update(ctx, dirty) {
			const icon_changes = {};
			if (dirty & /*$$props*/ 4096) icon_changes.material = /*$$props*/ ctx[12].iconMaterial;
			if (dirty & /*$$props*/ 4096) icon_changes.f7 = /*$$props*/ ctx[12].iconF7;
			if (dirty & /*$$props*/ 4096) icon_changes.icon = /*$$props*/ ctx[12].icon;
			if (dirty & /*$$props*/ 4096) icon_changes.md = /*$$props*/ ctx[12].iconMd;
			if (dirty & /*$$props*/ 4096) icon_changes.ios = /*$$props*/ ctx[12].iconIos;
			if (dirty & /*$$props*/ 4096) icon_changes.aurora = /*$$props*/ ctx[12].iconAurora;
			if (dirty & /*$$props*/ 4096) icon_changes.color = /*$$props*/ ctx[12].iconColor;
			if (dirty & /*$$props*/ 4096) icon_changes.size = /*$$props*/ ctx[12].iconSize;
			icon.$set(icon_changes);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(icon.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(icon.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			destroy_component(icon, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block_2$3.name,
		type: "if",
		source: "(120:8) {#if hasIcon}",
		ctx
	});

	return block;
}

// (181:2) {#if hasChildren}
function create_if_block$6(ctx) {
	let div;
	let t0;
	let t1;
	let current;
	const children_start_slot_template = /*$$slots*/ ctx[26]["children-start"];
	const children_start_slot = create_slot(children_start_slot_template, ctx, /*$$scope*/ ctx[25], get_children_start_slot_context);
	const default_slot_template = /*$$slots*/ ctx[26].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[25], null);
	const children_slot_template = /*$$slots*/ ctx[26].children;
	const children_slot = create_slot(children_slot_template, ctx, /*$$scope*/ ctx[25], get_children_slot_context);

	const block = {
		c: function create() {
			div = element("div");
			if (children_start_slot) children_start_slot.c();
			t0 = space();
			if (default_slot) default_slot.c();
			t1 = space();
			if (children_slot) children_slot.c();
			attr_dev(div, "class", "treeview-item-children");
			add_location(div, file$9, 181, 4, 5165);
		},
		m: function mount(target, anchor) {
			insert_dev(target, div, anchor);

			if (children_start_slot) {
				children_start_slot.m(div, null);
			}

			append_dev(div, t0);

			if (default_slot) {
				default_slot.m(div, null);
			}

			append_dev(div, t1);

			if (children_slot) {
				children_slot.m(div, null);
			}

			current = true;
		},
		p: function update(ctx, dirty) {
			if (children_start_slot && children_start_slot.p && dirty & /*$$scope*/ 33554432) {
				children_start_slot.p(get_slot_context(children_start_slot_template, ctx, /*$$scope*/ ctx[25], get_children_start_slot_context), get_slot_changes(children_start_slot_template, /*$$scope*/ ctx[25], dirty, get_children_start_slot_changes));
			}

			if (default_slot && default_slot.p && dirty & /*$$scope*/ 33554432) {
				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[25], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[25], dirty, null));
			}

			if (children_slot && children_slot.p && dirty & /*$$scope*/ 33554432) {
				children_slot.p(get_slot_context(children_slot_template, ctx, /*$$scope*/ ctx[25], get_children_slot_context), get_slot_changes(children_slot_template, /*$$scope*/ ctx[25], dirty, get_children_slot_changes));
			}
		},
		i: function intro(local) {
			if (current) return;
			transition_in(children_start_slot, local);
			transition_in(default_slot, local);
			transition_in(children_slot, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(children_start_slot, local);
			transition_out(default_slot, local);
			transition_out(children_slot, local);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(div);
			if (children_start_slot) children_start_slot.d(detaching);
			if (default_slot) default_slot.d(detaching);
			if (children_slot) children_slot.d(detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block$6.name,
		type: "if",
		source: "(181:2) {#if hasChildren}",
		ctx
	});

	return block;
}

function create_fragment$9(ctx) {
	let div;
	let current_block_type_index;
	let if_block0;
	let t;
	let current;
	const if_block_creators = [create_if_block_1$3, create_else_block$4];
	const if_blocks = [];

	function select_block_type(ctx, dirty) {
		if (/*treeviewRootTag*/ ctx[10] === "div") return 0;
		return 1;
	}

	current_block_type_index = select_block_type(ctx);
	if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
	let if_block1 = /*hasChildren*/ ctx[7] && create_if_block$6(ctx);

	const block = {
		c: function create() {
			div = element("div");
			if_block0.c();
			t = space();
			if (if_block1) if_block1.c();
			attr_dev(div, "id", /*id*/ ctx[0]);
			attr_dev(div, "style", /*style*/ ctx[1]);
			attr_dev(div, "class", /*classes*/ ctx[4]);
			add_location(div, file$9, 106, 0, 3080);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, div, anchor);
			if_blocks[current_block_type_index].m(div, null);
			append_dev(div, t);
			if (if_block1) if_block1.m(div, null);
			/*div_binding*/ ctx[27](div);
			current = true;
		},
		p: function update(ctx, [dirty]) {
			let previous_block_index = current_block_type_index;
			current_block_type_index = select_block_type(ctx);

			if (current_block_type_index === previous_block_index) {
				if_blocks[current_block_type_index].p(ctx, dirty);
			} else {
				group_outros();

				transition_out(if_blocks[previous_block_index], 1, 1, () => {
					if_blocks[previous_block_index] = null;
				});

				check_outros();
				if_block0 = if_blocks[current_block_type_index];

				if (!if_block0) {
					if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
					if_block0.c();
				}

				transition_in(if_block0, 1);
				if_block0.m(div, t);
			}

			if (/*hasChildren*/ ctx[7]) {
				if (if_block1) {
					if_block1.p(ctx, dirty);
					transition_in(if_block1, 1);
				} else {
					if_block1 = create_if_block$6(ctx);
					if_block1.c();
					transition_in(if_block1, 1);
					if_block1.m(div, null);
				}
			} else if (if_block1) {
				group_outros();

				transition_out(if_block1, 1, 1, () => {
					if_block1 = null;
				});

				check_outros();
			}

			if (!current || dirty & /*id*/ 1) {
				attr_dev(div, "id", /*id*/ ctx[0]);
			}

			if (!current || dirty & /*style*/ 2) {
				attr_dev(div, "style", /*style*/ ctx[1]);
			}

			if (!current || dirty & /*classes*/ 16) {
				attr_dev(div, "class", /*classes*/ ctx[4]);
			}
		},
		i: function intro(local) {
			if (current) return;
			transition_in(if_block0);
			transition_in(if_block1);
			current = true;
		},
		o: function outro(local) {
			transition_out(if_block0);
			transition_out(if_block1);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(div);
			if_blocks[current_block_type_index].d();
			if (if_block1) if_block1.d();
			/*div_binding*/ ctx[27](null);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$9.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$8($$self, $$props, $$invalidate) {
	const dispatch = createEventDispatcher();
	let { id = undefined } = $$props;
	let { style = undefined } = $$props;
	let { class: className = undefined } = $$props;
	let { toggle = undefined } = $$props;
	let { itemToggle = false } = $$props;
	let { selectable = false } = $$props;
	let { selected = false } = $$props;
	let { opened = false } = $$props;
	let { label = undefined } = $$props;
	let { loadChildren = false } = $$props;
	let { link = undefined } = $$props;
	let el;

	function onClick(e) {
		dispatch("click", [e]);
		if (typeof $$props.onClick === "function") $$props.onClick(e);
	}

	function onOpen(itemEl) {
		if (itemEl !== el) return;
		dispatch("treeviewOpen", [el]);
		if (typeof $$props.onTreeviewOpen === "function") $$props.onTreeviewOpen(el);
	}

	function onClose(itemEl) {
		if (itemEl !== el) return;
		dispatch("treeviewClose", [el]);
		if (typeof $$props.onTreeviewClose === "function") $$props.onTreeviewClose(el);
	}

	function onLoadChildren(itemEl, done) {
		if (itemEl !== el) return;
		dispatch("treeviewLoadChildren", [el, done]);
		if (typeof $$props.onTreeviewLoadChildren === "function") $$props.onTreeviewLoadChildren(el, done);
	}

	onMount(() => {
		if (!el) return;

		f7.ready(() => {
			f7.instance.on("treeviewOpen", onOpen);
			f7.instance.on("treeviewClose", onClose);
			f7.instance.on("treeviewLoadChildren", onLoadChildren);
		});
	});

	onDestroy(() => {
		if (!el || !f7.instance) return;
		f7.instance.off("treeviewOpen", onOpen);
		f7.instance.off("treeviewClose", onClose);
		f7.instance.off("treeviewLoadChildren", onLoadChildren);
	});

	let { $$slots = {}, $$scope } = $$props;

	function div_binding($$value) {
		binding_callbacks[$$value ? "unshift" : "push"](() => {
			$$invalidate(3, el = $$value);
		});
	}

	$$self.$set = $$new_props => {
		$$invalidate(12, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
		if ("id" in $$new_props) $$invalidate(0, id = $$new_props.id);
		if ("style" in $$new_props) $$invalidate(1, style = $$new_props.style);
		if ("class" in $$new_props) $$invalidate(13, className = $$new_props.class);
		if ("toggle" in $$new_props) $$invalidate(14, toggle = $$new_props.toggle);
		if ("itemToggle" in $$new_props) $$invalidate(15, itemToggle = $$new_props.itemToggle);
		if ("selectable" in $$new_props) $$invalidate(16, selectable = $$new_props.selectable);
		if ("selected" in $$new_props) $$invalidate(17, selected = $$new_props.selected);
		if ("opened" in $$new_props) $$invalidate(18, opened = $$new_props.opened);
		if ("label" in $$new_props) $$invalidate(2, label = $$new_props.label);
		if ("loadChildren" in $$new_props) $$invalidate(19, loadChildren = $$new_props.loadChildren);
		if ("link" in $$new_props) $$invalidate(20, link = $$new_props.link);
		if ("$$scope" in $$new_props) $$invalidate(25, $$scope = $$new_props.$$scope);
	};

	$$self.$capture_state = () => {
		return {
			id,
			style,
			className,
			toggle,
			itemToggle,
			selectable,
			selected,
			opened,
			label,
			loadChildren,
			link,
			el,
			classes,
			itemRootClasses,
			itemRootAttrs,
			hasChildren,
			needToggle,
			hasIcon,
			treeviewRootTag
		};
	};

	$$self.$inject_state = $$new_props => {
		$$invalidate(12, $$props = assign(assign({}, $$props), $$new_props));
		if ("id" in $$props) $$invalidate(0, id = $$new_props.id);
		if ("style" in $$props) $$invalidate(1, style = $$new_props.style);
		if ("className" in $$props) $$invalidate(13, className = $$new_props.className);
		if ("toggle" in $$props) $$invalidate(14, toggle = $$new_props.toggle);
		if ("itemToggle" in $$props) $$invalidate(15, itemToggle = $$new_props.itemToggle);
		if ("selectable" in $$props) $$invalidate(16, selectable = $$new_props.selectable);
		if ("selected" in $$props) $$invalidate(17, selected = $$new_props.selected);
		if ("opened" in $$props) $$invalidate(18, opened = $$new_props.opened);
		if ("label" in $$props) $$invalidate(2, label = $$new_props.label);
		if ("loadChildren" in $$props) $$invalidate(19, loadChildren = $$new_props.loadChildren);
		if ("link" in $$props) $$invalidate(20, link = $$new_props.link);
		if ("el" in $$props) $$invalidate(3, el = $$new_props.el);
		if ("classes" in $$props) $$invalidate(4, classes = $$new_props.classes);
		if ("itemRootClasses" in $$props) $$invalidate(5, itemRootClasses = $$new_props.itemRootClasses);
		if ("itemRootAttrs" in $$props) $$invalidate(6, itemRootAttrs = $$new_props.itemRootAttrs);
		if ("hasChildren" in $$props) $$invalidate(7, hasChildren = $$new_props.hasChildren);
		if ("needToggle" in $$props) $$invalidate(8, needToggle = $$new_props.needToggle);
		if ("hasIcon" in $$props) $$invalidate(9, hasIcon = $$new_props.hasIcon);
		if ("treeviewRootTag" in $$props) $$invalidate(10, treeviewRootTag = $$new_props.treeviewRootTag);
	};

	let classes;
	let itemRootClasses;
	let itemRootAttrs;
	let hasChildren;
	let needToggle;
	let hasIcon;
	let treeviewRootTag;

	$$self.$$.update = () => {
		 $$invalidate(4, classes = Utils.classNames(
			className,
			"treeview-item",
			{
				"treeview-item-opened": opened,
				"treeview-load-children": loadChildren
			},
			Mixins.colorClasses($$props)
		));

		 $$invalidate(5, itemRootClasses = Utils.classNames(
			"treeview-item-root",
			{
				"treeview-item-selectable": selectable,
				"treeview-item-selected": selected,
				"treeview-item-toggle": itemToggle
			},
			Mixins.linkRouterClasses($$props),
			Mixins.linkActionsClasses($$props)
		));

		 $$invalidate(6, itemRootAttrs = Utils.extend(
			{
				href: link === true ? "#" : link || undefined
			},
			Mixins.linkRouterAttrs($$props),
			Mixins.linkActionsAttrs($$props)
		));

		if ($$self.$$.dirty & /*toggle, hasChildren*/ 16512) {
			/* eslint-enable no-undef */
			 $$invalidate(8, needToggle = typeof toggle === "undefined" ? hasChildren : toggle);
		}

		 $$invalidate(9, hasIcon = $$props.icon || $$props.iconMaterial || $$props.iconF7 || $$props.iconMd || $$props.iconIos || $$props.iconAurora);

		if ($$self.$$.dirty & /*link*/ 1048576) {
			 $$invalidate(10, treeviewRootTag = link || link === "" ? "a" : "div");
		}
	};

	 $$invalidate(7, hasChildren = hasSlots(arguments, "default") || hasSlots(arguments, "children") || hasSlots(arguments, "children-start"));
	$$props = exclude_internal_props($$props);

	return [
		id,
		style,
		label,
		el,
		classes,
		itemRootClasses,
		itemRootAttrs,
		hasChildren,
		needToggle,
		hasIcon,
		treeviewRootTag,
		onClick,
		$$props,
		className,
		toggle,
		itemToggle,
		selectable,
		selected,
		opened,
		loadChildren,
		link,
		dispatch,
		onOpen,
		onClose,
		onLoadChildren,
		$$scope,
		$$slots,
		div_binding
	];
}

class Treeview_item extends SvelteComponentDev {
	constructor(options) {
		super(options);

		init(this, options, instance$8, create_fragment$9, safe_not_equal, {
			id: 0,
			style: 1,
			class: 13,
			toggle: 14,
			itemToggle: 15,
			selectable: 16,
			selected: 17,
			opened: 18,
			label: 2,
			loadChildren: 19,
			link: 20
		});

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Treeview_item",
			options,
			id: create_fragment$9.name
		});
	}

	get id() {
		throw new Error("<Treeview_item>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set id(value) {
		throw new Error("<Treeview_item>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get style() {
		throw new Error("<Treeview_item>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set style(value) {
		throw new Error("<Treeview_item>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get class() {
		throw new Error("<Treeview_item>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set class(value) {
		throw new Error("<Treeview_item>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get toggle() {
		throw new Error("<Treeview_item>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set toggle(value) {
		throw new Error("<Treeview_item>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get itemToggle() {
		throw new Error("<Treeview_item>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set itemToggle(value) {
		throw new Error("<Treeview_item>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get selectable() {
		throw new Error("<Treeview_item>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set selectable(value) {
		throw new Error("<Treeview_item>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get selected() {
		throw new Error("<Treeview_item>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set selected(value) {
		throw new Error("<Treeview_item>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get opened() {
		throw new Error("<Treeview_item>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set opened(value) {
		throw new Error("<Treeview_item>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get label() {
		throw new Error("<Treeview_item>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set label(value) {
		throw new Error("<Treeview_item>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get loadChildren() {
		throw new Error("<Treeview_item>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set loadChildren(value) {
		throw new Error("<Treeview_item>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get link() {
		throw new Error("<Treeview_item>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set link(value) {
		throw new Error("<Treeview_item>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* node_modules/framework7-svelte/components/treeview.svelte generated by Svelte v3.18.2 */
const file$a = "node_modules/framework7-svelte/components/treeview.svelte";

function create_fragment$a(ctx) {
	let div;
	let current;
	const default_slot_template = /*$$slots*/ ctx[6].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[5], null);

	const block = {
		c: function create() {
			div = element("div");
			if (default_slot) default_slot.c();
			attr_dev(div, "id", /*id*/ ctx[0]);
			attr_dev(div, "style", /*style*/ ctx[1]);
			attr_dev(div, "class", /*classes*/ ctx[2]);
			add_location(div, file$a, 18, 0, 328);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, div, anchor);

			if (default_slot) {
				default_slot.m(div, null);
			}

			current = true;
		},
		p: function update(ctx, [dirty]) {
			if (default_slot && default_slot.p && dirty & /*$$scope*/ 32) {
				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[5], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[5], dirty, null));
			}

			if (!current || dirty & /*id*/ 1) {
				attr_dev(div, "id", /*id*/ ctx[0]);
			}

			if (!current || dirty & /*style*/ 2) {
				attr_dev(div, "style", /*style*/ ctx[1]);
			}

			if (!current || dirty & /*classes*/ 4) {
				attr_dev(div, "class", /*classes*/ ctx[2]);
			}
		},
		i: function intro(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(default_slot, local);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(div);
			if (default_slot) default_slot.d(detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$a.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$9($$self, $$props, $$invalidate) {
	let { id = undefined } = $$props;
	let { style = undefined } = $$props;
	let { class: className = undefined } = $$props;
	let { $$slots = {}, $$scope } = $$props;

	$$self.$set = $$new_props => {
		$$invalidate(4, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
		if ("id" in $$new_props) $$invalidate(0, id = $$new_props.id);
		if ("style" in $$new_props) $$invalidate(1, style = $$new_props.style);
		if ("class" in $$new_props) $$invalidate(3, className = $$new_props.class);
		if ("$$scope" in $$new_props) $$invalidate(5, $$scope = $$new_props.$$scope);
	};

	$$self.$capture_state = () => {
		return { id, style, className, classes };
	};

	$$self.$inject_state = $$new_props => {
		$$invalidate(4, $$props = assign(assign({}, $$props), $$new_props));
		if ("id" in $$props) $$invalidate(0, id = $$new_props.id);
		if ("style" in $$props) $$invalidate(1, style = $$new_props.style);
		if ("className" in $$props) $$invalidate(3, className = $$new_props.className);
		if ("classes" in $$props) $$invalidate(2, classes = $$new_props.classes);
	};

	let classes;

	$$self.$$.update = () => {
		 $$invalidate(2, classes = Utils.classNames(className, "treeview", Mixins.colorClasses($$props)));
	};

	$$props = exclude_internal_props($$props);
	return [id, style, classes, className, $$props, $$scope, $$slots];
}

class Treeview extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$9, create_fragment$a, safe_not_equal, { id: 0, style: 1, class: 3 });

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Treeview",
			options,
			id: create_fragment$a.name
		});
	}

	get id() {
		throw new Error("<Treeview>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set id(value) {
		throw new Error("<Treeview>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get style() {
		throw new Error("<Treeview>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set style(value) {
		throw new Error("<Treeview>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get class() {
		throw new Error("<Treeview>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set class(value) {
		throw new Error("<Treeview>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* node_modules/framework7-svelte/components/view.svelte generated by Svelte v3.18.2 */
const file$b = "node_modules/framework7-svelte/components/view.svelte";

function get_each_context$1(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[26] = list[i];
	return child_ctx;
}

// (135:2) {#each pages as page (page.id)}
function create_each_block$1(key_1, ctx) {
	let first;
	let switch_instance_anchor;
	let current;
	const switch_instance_spread_levels = [/*page*/ ctx[26].props];
	var switch_value = /*page*/ ctx[26].component;

	function switch_props(ctx) {
		let switch_instance_props = {};

		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
		}

		return {
			props: switch_instance_props,
			$$inline: true
		};
	}

	if (switch_value) {
		var switch_instance = new switch_value(switch_props());
	}

	const block = {
		key: key_1,
		first: null,
		c: function create() {
			first = empty();
			if (switch_instance) create_component(switch_instance.$$.fragment);
			switch_instance_anchor = empty();
			this.first = first;
		},
		m: function mount(target, anchor) {
			insert_dev(target, first, anchor);

			if (switch_instance) {
				mount_component(switch_instance, target, anchor);
			}

			insert_dev(target, switch_instance_anchor, anchor);
			current = true;
		},
		p: function update(ctx, dirty) {
			const switch_instance_changes = (dirty & /*pages*/ 8)
			? get_spread_update(switch_instance_spread_levels, [get_spread_object(/*page*/ ctx[26].props)])
			: {};

			if (switch_value !== (switch_value = /*page*/ ctx[26].component)) {
				if (switch_instance) {
					group_outros();
					const old_component = switch_instance;

					transition_out(old_component.$$.fragment, 1, 0, () => {
						destroy_component(old_component, 1);
					});

					check_outros();
				}

				if (switch_value) {
					switch_instance = new switch_value(switch_props());
					create_component(switch_instance.$$.fragment);
					transition_in(switch_instance.$$.fragment, 1);
					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
				} else {
					switch_instance = null;
				}
			} else if (switch_value) {
				switch_instance.$set(switch_instance_changes);
			}
		},
		i: function intro(local) {
			if (current) return;
			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(first);
			if (detaching) detach_dev(switch_instance_anchor);
			if (switch_instance) destroy_component(switch_instance, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_each_block$1.name,
		type: "each",
		source: "(135:2) {#each pages as page (page.id)}",
		ctx
	});

	return block;
}

function create_fragment$b(ctx) {
	let div;
	let t;
	let each_blocks = [];
	let each_1_lookup = new Map();
	let current;
	const default_slot_template = /*$$slots*/ ctx[24].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[23], null);
	let each_value = /*pages*/ ctx[3];
	const get_key = ctx => /*page*/ ctx[26].id;
	validate_each_keys(ctx, each_value, get_each_context$1, get_key);

	for (let i = 0; i < each_value.length; i += 1) {
		let child_ctx = get_each_context$1(ctx, each_value, i);
		let key = get_key(child_ctx);
		each_1_lookup.set(key, each_blocks[i] = create_each_block$1(key, child_ctx));
	}

	const block = {
		c: function create() {
			div = element("div");
			if (default_slot) default_slot.c();
			t = space();

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			attr_dev(div, "class", /*classes*/ ctx[4]);
			attr_dev(div, "style", /*style*/ ctx[1]);
			attr_dev(div, "id", /*id*/ ctx[0]);
			add_location(div, file$b, 132, 0, 3911);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, div, anchor);

			if (default_slot) {
				default_slot.m(div, null);
			}

			append_dev(div, t);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(div, null);
			}

			/*div_binding*/ ctx[25](div);
			current = true;
		},
		p: function update(ctx, [dirty]) {
			if (default_slot && default_slot.p && dirty & /*$$scope*/ 8388608) {
				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[23], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[23], dirty, null));
			}

			const each_value = /*pages*/ ctx[3];
			group_outros();
			validate_each_keys(ctx, each_value, get_each_context$1, get_key);
			each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div, outro_and_destroy_block, create_each_block$1, null, get_each_context$1);
			check_outros();

			if (!current || dirty & /*classes*/ 16) {
				attr_dev(div, "class", /*classes*/ ctx[4]);
			}

			if (!current || dirty & /*style*/ 2) {
				attr_dev(div, "style", /*style*/ ctx[1]);
			}

			if (!current || dirty & /*id*/ 1) {
				attr_dev(div, "id", /*id*/ ctx[0]);
			}
		},
		i: function intro(local) {
			if (current) return;
			transition_in(default_slot, local);

			for (let i = 0; i < each_value.length; i += 1) {
				transition_in(each_blocks[i]);
			}

			current = true;
		},
		o: function outro(local) {
			transition_out(default_slot, local);

			for (let i = 0; i < each_blocks.length; i += 1) {
				transition_out(each_blocks[i]);
			}

			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(div);
			if (default_slot) default_slot.d(detaching);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].d();
			}

			/*div_binding*/ ctx[25](null);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$b.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance_1$1($$self, $$props, $$invalidate) {
	let { init = true } = $$props;
	let { id = undefined } = $$props;
	let { style = undefined } = $$props;
	let { class: className = undefined } = $$props;
	const dispatch = createEventDispatcher();
	const { main, tab, tabActive } = $$props;
	let el;
	let pages = [];
	let routerData;
	let f7View;

	function instance() {
		return f7View;
	}

	function onSwipeBackMove(data) {
		dispatch("swipeBackMove", [data]);
		if (typeof $$props.onSwipeBackMove === "function") $$props.onSwipeBackMove(data);
	}

	function onSwipeBackBeforeChange(data) {
		dispatch("swipeBackBeforeChange", [data]);
		if (typeof $$props.onSwipeBackBeforeChange === "function") $$props.onSwipeBackBeforeChange(data);
	}

	function onSwipeBackAfterChange(data) {
		dispatch("swipeBackAfterChange", [data]);
		if (typeof $$props.onSwipeBackAfterChange === "function") $$props.onSwipeBackAfterChange(data);
	}

	function onSwipeBackBeforeReset(data) {
		dispatch("swipeBackBeforeReset", [data]);
		if (typeof $$props.onSwipeBackBeforeReset === "function") $$props.onSwipeBackBeforeReset(data);
	}

	function onSwipeBackAfterReset(data) {
		dispatch("swipeBackAfterReset", [data]);
		if (typeof $$props.onSwipeBackAfterReset === "function") $$props.onSwipeBackAfterReset(data);
	}

	function onTabShow(tabEl) {
		if (el !== tabEl) return;
		dispatch("tabShow");
		if (typeof $$props.onTabShow === "function") $$props.onTabShow();
	}

	function onTabHide(tabEl) {
		if (el !== tabEl) return;
		dispatch("tabHide");
		if (typeof $$props.onTabHide === "function") $$props.onTabHide();
	}

	function onViewInit(view) {
		f7View = view;
		routerData.instance = view;
		dispatch("viewInit", [view]);
		if (typeof $$props.onViewInit === "function") $$props.onViewInit(view);
	}

	onMount(() => {
		if (!init) return;

		f7.ready(() => {
			f7.instance.on("tabShow", onTabShow);
			f7.instance.on("tabHide", onTabHide);

			routerData = {
				el,
				instance: null,
				pages,
				setPages(p) {
					tick().then(() => {
						$$invalidate(3, pages = p);
					});
				}
			};

			f7.routers.views.push(routerData);

			routerData.instance = f7.instance.views.create(el, {
				...Utils.noUndefinedProps($$props),
				on: { init: onViewInit }
			});

			if (!f7View) f7View = routerData.instance;
			f7View.on("swipebackMove", onSwipeBackMove);
			f7View.on("swipebackBeforeChange", onSwipeBackBeforeChange);
			f7View.on("swipebackAfterChange", onSwipeBackAfterChange);
			f7View.on("swipebackBeforeReset", onSwipeBackBeforeReset);
			f7View.on("swipebackAfterReset", onSwipeBackAfterReset);
		});
	});

	afterUpdate(() => {
		if (!routerData) return;
		f7.events.emit("viewRouterDidUpdate", routerData);
	});

	onDestroy(() => {
		if (!init) return;

		if (f7.instance) {
			f7.instance.off("tabShow", onTabShow);
			f7.instance.off("tabHide", onTabHide);
		}

		if (f7View) {
			f7View.off("swipebackMove", onSwipeBackMove);
			f7View.off("swipebackBeforeChange", onSwipeBackBeforeChange);
			f7View.off("swipebackAfterChange", onSwipeBackAfterChange);
			f7View.off("swipebackBeforeReset", onSwipeBackBeforeReset);
			f7View.off("swipebackAfterReset", onSwipeBackAfterReset);

			if (f7View.destroy) {
				f7View.destroy();
			}
		}

		f7.routers.views.splice(f7.routers.views.indexOf(routerData), 1);
		f7View = null;
		routerData = null;
	});

	let { $$slots = {}, $$scope } = $$props;

	function div_binding($$value) {
		binding_callbacks[$$value ? "unshift" : "push"](() => {
			$$invalidate(2, el = $$value);
		});
	}

	$$self.$set = $$new_props => {
		$$invalidate(22, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
		if ("init" in $$new_props) $$invalidate(5, init = $$new_props.init);
		if ("id" in $$new_props) $$invalidate(0, id = $$new_props.id);
		if ("style" in $$new_props) $$invalidate(1, style = $$new_props.style);
		if ("class" in $$new_props) $$invalidate(6, className = $$new_props.class);
		if ("$$scope" in $$new_props) $$invalidate(23, $$scope = $$new_props.$$scope);
	};

	$$self.$capture_state = () => {
		return {
			init,
			id,
			style,
			className,
			el,
			pages,
			routerData,
			f7View,
			classes
		};
	};

	$$self.$inject_state = $$new_props => {
		$$invalidate(22, $$props = assign(assign({}, $$props), $$new_props));
		if ("init" in $$props) $$invalidate(5, init = $$new_props.init);
		if ("id" in $$props) $$invalidate(0, id = $$new_props.id);
		if ("style" in $$props) $$invalidate(1, style = $$new_props.style);
		if ("className" in $$props) $$invalidate(6, className = $$new_props.className);
		if ("el" in $$props) $$invalidate(2, el = $$new_props.el);
		if ("pages" in $$props) $$invalidate(3, pages = $$new_props.pages);
		if ("routerData" in $$props) routerData = $$new_props.routerData;
		if ("f7View" in $$props) f7View = $$new_props.f7View;
		if ("classes" in $$props) $$invalidate(4, classes = $$new_props.classes);
	};

	let classes;

	$$self.$$.update = () => {
		 $$invalidate(4, classes = Utils.classNames(
			className,
			"view",
			{
				"view-main": main,
				"tab-active": tabActive,
				tab
			},
			Mixins.colorClasses($$props)
		));
	};

	$$props = exclude_internal_props($$props);

	return [
		id,
		style,
		el,
		pages,
		classes,
		init,
		className,
		instance,
		routerData,
		f7View,
		dispatch,
		main,
		tab,
		tabActive,
		onSwipeBackMove,
		onSwipeBackBeforeChange,
		onSwipeBackAfterChange,
		onSwipeBackBeforeReset,
		onSwipeBackAfterReset,
		onTabShow,
		onTabHide,
		onViewInit,
		$$props,
		$$scope,
		$$slots,
		div_binding
	];
}

class View extends SvelteComponentDev {
	constructor(options) {
		super(options);

		init(this, options, instance_1$1, create_fragment$b, safe_not_equal, {
			init: 5,
			id: 0,
			style: 1,
			class: 6,
			instance: 7
		});

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "View",
			options,
			id: create_fragment$b.name
		});
	}

	get init() {
		throw new Error("<View>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set init(value) {
		throw new Error("<View>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get id() {
		throw new Error("<View>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set id(value) {
		throw new Error("<View>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get style() {
		throw new Error("<View>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set style(value) {
		throw new Error("<View>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get class() {
		throw new Error("<View>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set class(value) {
		throw new Error("<View>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get instance() {
		return this.$$.ctx[7];
	}

	set instance(value) {
		throw new Error("<View>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/**
 * Framework7 Svelte 5.4.1
 * Build full featured iOS & Android apps using Framework7 & Svelte
 * https://framework7.io/svelte/
 *
 * Copyright 2014-2020 Vladimir Kharlampidi
 *
 * Released under the MIT License
 *
 * Released on: February 8, 2020
 */

/* src/renderer/components/Session.svelte generated by Svelte v3.18.2 */

const file$c = "src/renderer/components/Session.svelte";

// (31:6) 
function create_media_slot_2(ctx) {
	let img;
	let img_src_value;

	const block = {
		c: function create() {
			img = element("img");
			if (img.src !== (img_src_value = "./img/s_host.png")) attr_dev(img, "src", img_src_value);
			attr_dev(img, "slot", "media");
			attr_dev(img, "alt", "Session Icon");
			add_location(img, file$c, 30, 6, 590);
		},
		m: function mount(target, anchor) {
			insert_dev(target, img, anchor);
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(img);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_media_slot_2.name,
		type: "slot",
		source: "(31:6) ",
		ctx
	});

	return block;
}

// (32:6) <b slot="label" class="text-color-blue">
function create_label_slot(ctx) {
	let b;

	const block = {
		c: function create() {
			b = element("b");
			b.textContent = "Session Name";
			attr_dev(b, "slot", "label");
			attr_dev(b, "class", "text-color-blue");
			add_location(b, file$c, 31, 6, 657);
		},
		m: function mount(target, anchor) {
			insert_dev(target, b, anchor);
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(b);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_label_slot.name,
		type: "slot",
		source: "(32:6) <b slot=\\\"label\\\" class=\\\"text-color-blue\\\">",
		ctx
	});

	return block;
}

// (34:8) 
function create_media_slot_1(ctx) {
	let img;
	let img_src_value;

	const block = {
		c: function create() {
			img = element("img");
			if (img.src !== (img_src_value = "./img/database.png")) attr_dev(img, "src", img_src_value);
			attr_dev(img, "slot", "media");
			attr_dev(img, "alt", "Database Icon");
			add_location(img, file$c, 33, 8, 787);
		},
		m: function mount(target, anchor) {
			insert_dev(target, img, anchor);
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(img);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_media_slot_1.name,
		type: "slot",
		source: "(34:8) ",
		ctx
	});

	return block;
}

// (36:10) 
function create_media_slot(ctx) {
	let img;
	let img_src_value;

	const block = {
		c: function create() {
			img = element("img");
			if (img.src !== (img_src_value = "./img/designer/table.png")) attr_dev(img, "src", img_src_value);
			attr_dev(img, "slot", "media");
			attr_dev(img, "alt", "Table Icon");
			add_location(img, file$c, 35, 10, 918);
		},
		m: function mount(target, anchor) {
			insert_dev(target, img, anchor);
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(img);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_media_slot.name,
		type: "slot",
		source: "(36:10) ",
		ctx
	});

	return block;
}

// (35:8) <TreeviewItem label="Table Name" toggle={false}>
function create_default_slot_4(ctx) {
	const block = { c: noop, m: noop, p: noop, d: noop };

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_default_slot_4.name,
		type: "slot",
		source: "(35:8) <TreeviewItem label=\\\"Table Name\\\" toggle={false}>",
		ctx
	});

	return block;
}

// (33:6) <TreeviewItem selectable itemToggle label="Database Name">
function create_default_slot_3(ctx) {
	let t;
	let current;

	const treeviewitem = new Treeview_item({
			props: {
				label: "Table Name",
				toggle: false,
				$$slots: {
					default: [create_default_slot_4],
					media: [create_media_slot]
				},
				$$scope: { ctx }
			},
			$$inline: true
		});

	const block = {
		c: function create() {
			t = space();
			create_component(treeviewitem.$$.fragment);
		},
		m: function mount(target, anchor) {
			insert_dev(target, t, anchor);
			mount_component(treeviewitem, target, anchor);
			current = true;
		},
		p: function update(ctx, dirty) {
			const treeviewitem_changes = {};

			if (dirty & /*$$scope*/ 4) {
				treeviewitem_changes.$$scope = { dirty, ctx };
			}

			treeviewitem.$set(treeviewitem_changes);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(treeviewitem.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(treeviewitem.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(t);
			destroy_component(treeviewitem, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_default_slot_3.name,
		type: "slot",
		source: "(33:6) <TreeviewItem selectable itemToggle label=\\\"Database Name\\\">",
		ctx
	});

	return block;
}

// (30:4) <TreeviewItem selectable itemToggle>
function create_default_slot_2(ctx) {
	let t0;
	let t1;
	let current;

	const treeviewitem = new Treeview_item({
			props: {
				selectable: true,
				itemToggle: true,
				label: "Database Name",
				$$slots: {
					default: [create_default_slot_3],
					media: [create_media_slot_1]
				},
				$$scope: { ctx }
			},
			$$inline: true
		});

	const block = {
		c: function create() {
			t0 = space();
			t1 = space();
			create_component(treeviewitem.$$.fragment);
		},
		m: function mount(target, anchor) {
			insert_dev(target, t0, anchor);
			insert_dev(target, t1, anchor);
			mount_component(treeviewitem, target, anchor);
			current = true;
		},
		p: function update(ctx, dirty) {
			const treeviewitem_changes = {};

			if (dirty & /*$$scope*/ 4) {
				treeviewitem_changes.$$scope = { dirty, ctx };
			}

			treeviewitem.$set(treeviewitem_changes);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(treeviewitem.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(treeviewitem.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(t0);
			if (detaching) detach_dev(t1);
			destroy_component(treeviewitem, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_default_slot_2.name,
		type: "slot",
		source: "(30:4) <TreeviewItem selectable itemToggle>",
		ctx
	});

	return block;
}

// (29:2) <Treeview>
function create_default_slot_1(ctx) {
	let current;

	const treeviewitem = new Treeview_item({
			props: {
				selectable: true,
				itemToggle: true,
				$$slots: {
					default: [create_default_slot_2],
					label: [create_label_slot],
					media: [create_media_slot_2]
				},
				$$scope: { ctx }
			},
			$$inline: true
		});

	const block = {
		c: function create() {
			create_component(treeviewitem.$$.fragment);
		},
		m: function mount(target, anchor) {
			mount_component(treeviewitem, target, anchor);
			current = true;
		},
		p: function update(ctx, dirty) {
			const treeviewitem_changes = {};

			if (dirty & /*$$scope*/ 4) {
				treeviewitem_changes.$$scope = { dirty, ctx };
			}

			treeviewitem.$set(treeviewitem_changes);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(treeviewitem.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(treeviewitem.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			destroy_component(treeviewitem, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_default_slot_1.name,
		type: "slot",
		source: "(29:2) <Treeview>",
		ctx
	});

	return block;
}

// (27:0) <Page>
function create_default_slot$1(ctx) {
	let current;

	const treeview = new Treeview({
			props: {
				$$slots: { default: [create_default_slot_1] },
				$$scope: { ctx }
			},
			$$inline: true
		});

	const block = {
		c: function create() {
			create_component(treeview.$$.fragment);
		},
		m: function mount(target, anchor) {
			mount_component(treeview, target, anchor);
			current = true;
		},
		p: function update(ctx, dirty) {
			const treeview_changes = {};

			if (dirty & /*$$scope*/ 4) {
				treeview_changes.$$scope = { dirty, ctx };
			}

			treeview.$set(treeview_changes);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(treeview.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(treeview.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			destroy_component(treeview, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_default_slot$1.name,
		type: "slot",
		source: "(27:0) <Page>",
		ctx
	});

	return block;
}

function create_fragment$c(ctx) {
	let current;

	const page = new Page({
			props: {
				$$slots: { default: [create_default_slot$1] },
				$$scope: { ctx }
			},
			$$inline: true
		});

	const block = {
		c: function create() {
			create_component(page.$$.fragment);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			mount_component(page, target, anchor);
			current = true;
		},
		p: function update(ctx, [dirty]) {
			const page_changes = {};

			if (dirty & /*$$scope*/ 4) {
				page_changes.$$scope = { dirty, ctx };
			}

			page.$set(page_changes);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(page.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(page.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			destroy_component(page, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$c.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$a($$self, $$props, $$invalidate) {
	let { db } = $$props;
	let session_list = [];

	onMount(() => {
		f7ready(() => {
			session_list = db.find({}, (err, docs) => {
				session_list = docs;
			});
		});
	});

	const writable_props = ["db"];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Session> was created with unknown prop '${key}'`);
	});

	$$self.$set = $$props => {
		if ("db" in $$props) $$invalidate(0, db = $$props.db);
	};

	$$self.$capture_state = () => {
		return { db, session_list };
	};

	$$self.$inject_state = $$props => {
		if ("db" in $$props) $$invalidate(0, db = $$props.db);
		if ("session_list" in $$props) session_list = $$props.session_list;
	};

	return [db];
}

class Session extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$a, create_fragment$c, safe_not_equal, { db: 0 });

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Session",
			options,
			id: create_fragment$c.name
		});

		const { ctx } = this.$$;
		const props = options.props || {};

		if (/*db*/ ctx[0] === undefined && !("db" in props)) {
			console.warn("<Session> was created without expected prop 'db'");
		}
	}

	get db() {
		throw new Error("<Session>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set db(value) {
		throw new Error("<Session>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/**
 * NeDB With Encryption & Decryption 
 * Last Update 12 Feb 2020
 * 
 * @author : Herlangga Sefani Wijaya <https://github.com/gaibz>
 */
const path = require('path'); // path for database 
const Datastore = require("nedb"); // of course you need NeDB
const crypto = require('crypto'); // now is in node default module
const {app} = require("electron").remote;

let algorithm = 'aes-256-cbc'; // you can choose many algorithm from supported openssl
let secret = 'superSecretKey';
let key = crypto.createHash('sha256').update(String(secret)).digest('base64').substr(0, 32);

const SessionDB = new Datastore({
  filename: path.join(app.getPath("userData"), "sessiondb.db"),
  autoload: true,
  afterSerialization(plaintext) {
    const iv = crypto.randomBytes(16);
    const aes = crypto.createCipheriv(algorithm, key, iv);
    let ciphertext = aes.update(plaintext);
    ciphertext = Buffer.concat([iv, ciphertext, aes.final()]);
    return ciphertext.toString('base64')
  },
  beforeDeserialization(ciphertext) {
    const ciphertextBytes = Buffer.from(ciphertext, 'base64');
    const iv = ciphertextBytes.slice(0, 16);
    const data = ciphertextBytes.slice(16);
    const aes = crypto.createDecipheriv(algorithm, key, iv);
    let plaintextBytes = Buffer.from(aes.update(data));
    plaintextBytes = Buffer.concat([plaintextBytes, aes.final()]);
    return plaintextBytes.toString()
  },
});

var Database = {
  SessionDB
};

/* src/renderer/home.svelte generated by Svelte v3.18.2 */
const file$d = "src/renderer/home.svelte";

// (1:0) <Page>
function create_default_slot$2(ctx) {
	let h1;

	const block = {
		c: function create() {
			h1 = element("h1");
			h1.textContent = "Hello World";
			add_location(h1, file$d, 1, 2, 9);
		},
		m: function mount(target, anchor) {
			insert_dev(target, h1, anchor);
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(h1);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_default_slot$2.name,
		type: "slot",
		source: "(1:0) <Page>",
		ctx
	});

	return block;
}

function create_fragment$d(ctx) {
	let current;

	const page = new Page({
			props: {
				$$slots: { default: [create_default_slot$2] },
				$$scope: { ctx }
			},
			$$inline: true
		});

	const block = {
		c: function create() {
			create_component(page.$$.fragment);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			mount_component(page, target, anchor);
			current = true;
		},
		p: function update(ctx, [dirty]) {
			const page_changes = {};

			if (dirty & /*$$scope*/ 1) {
				page_changes.$$scope = { dirty, ctx };
			}

			page.$set(page_changes);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(page.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(page.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			destroy_component(page, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$d.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$b($$self) {
	onMount(() => {
		f7ready(() => {
			
		}); // Framework7 initialized
		// f7.dialog.alert('Hello world');
	});

	$$self.$capture_state = () => {
		return {};
	};

	$$self.$inject_state = $$props => {
		
	};

	return [];
}

class Home extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$b, create_fragment$d, safe_not_equal, {});

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Home",
			options,
			id: create_fragment$d.name
		});
	}
}

/* src/renderer/App.svelte generated by Svelte v3.18.2 */
const file$e = "src/renderer/App.svelte";

// (6:6) <Button small class="display-flex" fill>
function create_default_slot_5(ctx) {
	let t;

	const block = {
		c: function create() {
			t = text("New Session");
		},
		m: function mount(target, anchor) {
			insert_dev(target, t, anchor);
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(t);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_default_slot_5.name,
		type: "slot",
		source: "(6:6) <Button small class=\\\"display-flex\\\" fill>",
		ctx
	});

	return block;
}

// (10:6) <Button small class="display-flex" fill color="teal">
function create_default_slot_4$1(ctx) {
	let t;

	const block = {
		c: function create() {
			t = text("Donate");
		},
		m: function mount(target, anchor) {
			insert_dev(target, t, anchor);
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(t);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_default_slot_4$1.name,
		type: "slot",
		source: "(10:6) <Button small class=\\\"display-flex\\\" fill color=\\\"teal\\\">",
		ctx
	});

	return block;
}

// (4:2) <Appbar themeDark>
function create_default_slot_3$1(ctx) {
	let div0;
	let t;
	let div1;
	let current;

	const button0 = new Button({
			props: {
				small: true,
				class: "display-flex",
				fill: true,
				$$slots: { default: [create_default_slot_5] },
				$$scope: { ctx }
			},
			$$inline: true
		});

	const button1 = new Button({
			props: {
				small: true,
				class: "display-flex",
				fill: true,
				color: "teal",
				$$slots: { default: [create_default_slot_4$1] },
				$$scope: { ctx }
			},
			$$inline: true
		});

	const block = {
		c: function create() {
			div0 = element("div");
			create_component(button0.$$.fragment);
			t = space();
			div1 = element("div");
			create_component(button1.$$.fragment);
			attr_dev(div0, "class", "left");
			add_location(div0, file$e, 4, 4, 140);
			attr_dev(div1, "class", "right");
			add_location(div1, file$e, 8, 4, 330);
		},
		m: function mount(target, anchor) {
			insert_dev(target, div0, anchor);
			mount_component(button0, div0, null);
			insert_dev(target, t, anchor);
			insert_dev(target, div1, anchor);
			mount_component(button1, div1, null);
			current = true;
		},
		p: function update(ctx, dirty) {
			const button0_changes = {};

			if (dirty & /*$$scope*/ 2) {
				button0_changes.$$scope = { dirty, ctx };
			}

			button0.$set(button0_changes);
			const button1_changes = {};

			if (dirty & /*$$scope*/ 2) {
				button1_changes.$$scope = { dirty, ctx };
			}

			button1.$set(button1_changes);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(button0.$$.fragment, local);
			transition_in(button1.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(button0.$$.fragment, local);
			transition_out(button1.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(div0);
			destroy_component(button0);
			if (detaching) detach_dev(t);
			if (detaching) detach_dev(div1);
			destroy_component(button1);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_default_slot_3$1.name,
		type: "slot",
		source: "(4:2) <Appbar themeDark>",
		ctx
	});

	return block;
}

// (14:4) <View>
function create_default_slot_2$1(ctx) {
	let current;

	const session = new Session({
			props: { db: Database.SessionDB },
			$$inline: true
		});

	const block = {
		c: function create() {
			create_component(session.$$.fragment);
		},
		m: function mount(target, anchor) {
			mount_component(session, target, anchor);
			current = true;
		},
		p: noop,
		i: function intro(local) {
			if (current) return;
			transition_in(session.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(session.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			destroy_component(session, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_default_slot_2$1.name,
		type: "slot",
		source: "(14:4) <View>",
		ctx
	});

	return block;
}

// (13:2) <Panel left cover visibleBreakpoint="800" resizable>
function create_default_slot_1$1(ctx) {
	let current;

	const view = new View({
			props: {
				$$slots: { default: [create_default_slot_2$1] },
				$$scope: { ctx }
			},
			$$inline: true
		});

	const block = {
		c: function create() {
			create_component(view.$$.fragment);
		},
		m: function mount(target, anchor) {
			mount_component(view, target, anchor);
			current = true;
		},
		p: function update(ctx, dirty) {
			const view_changes = {};

			if (dirty & /*$$scope*/ 2) {
				view_changes.$$scope = { dirty, ctx };
			}

			view.$set(view_changes);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(view.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(view.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			destroy_component(view, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_default_slot_1$1.name,
		type: "slot",
		source: "(13:2) <Panel left cover visibleBreakpoint=\\\"800\\\" resizable>",
		ctx
	});

	return block;
}

// (3:0) <App params={f7params}>
function create_default_slot$3(ctx) {
	let t0;
	let t1;
	let current;

	const appbar = new Appbar({
			props: {
				themeDark: true,
				$$slots: { default: [create_default_slot_3$1] },
				$$scope: { ctx }
			},
			$$inline: true
		});

	const panel = new Panel({
			props: {
				left: true,
				cover: true,
				visibleBreakpoint: "800",
				resizable: true,
				$$slots: { default: [create_default_slot_1$1] },
				$$scope: { ctx }
			},
			$$inline: true
		});

	const view = new View({
			props: { main: true, url: "/" },
			$$inline: true
		});

	const block = {
		c: function create() {
			create_component(appbar.$$.fragment);
			t0 = space();
			create_component(panel.$$.fragment);
			t1 = space();
			create_component(view.$$.fragment);
		},
		m: function mount(target, anchor) {
			mount_component(appbar, target, anchor);
			insert_dev(target, t0, anchor);
			mount_component(panel, target, anchor);
			insert_dev(target, t1, anchor);
			mount_component(view, target, anchor);
			current = true;
		},
		p: function update(ctx, dirty) {
			const appbar_changes = {};

			if (dirty & /*$$scope*/ 2) {
				appbar_changes.$$scope = { dirty, ctx };
			}

			appbar.$set(appbar_changes);
			const panel_changes = {};

			if (dirty & /*$$scope*/ 2) {
				panel_changes.$$scope = { dirty, ctx };
			}

			panel.$set(panel_changes);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(appbar.$$.fragment, local);
			transition_in(panel.$$.fragment, local);
			transition_in(view.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(appbar.$$.fragment, local);
			transition_out(panel.$$.fragment, local);
			transition_out(view.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			destroy_component(appbar, detaching);
			if (detaching) detach_dev(t0);
			destroy_component(panel, detaching);
			if (detaching) detach_dev(t1);
			destroy_component(view, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_default_slot$3.name,
		type: "slot",
		source: "(3:0) <App params={f7params}>",
		ctx
	});

	return block;
}

function create_fragment$e(ctx) {
	let current;

	const app = new App({
			props: {
				params: /*f7params*/ ctx[0],
				$$slots: { default: [create_default_slot$3] },
				$$scope: { ctx }
			},
			$$inline: true
		});

	const block = {
		c: function create() {
			create_component(app.$$.fragment);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			mount_component(app, target, anchor);
			current = true;
		},
		p: function update(ctx, [dirty]) {
			const app_changes = {};

			if (dirty & /*$$scope*/ 2) {
				app_changes.$$scope = { dirty, ctx };
			}

			app.$set(app_changes);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(app.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(app.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			destroy_component(app, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$e.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$c($$self) {
	const f7params = {
		// Array with app routes
		routes: [{ path: "/", component: Home }],
		// App Name
		name: "Jengkol DB",
		// App id
		id: "gaibz.jengkoldb",
		// ...
		theme: "aurora",
		autoDarkTheme: false
	};

	onMount(() => {
		f7ready(() => {
			
		}); // Call F7 APIs here
	});

	$$self.$capture_state = () => {
		return {};
	};

	$$self.$inject_state = $$props => {
		
	};

	return [f7params];
}

class App_1 extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$c, create_fragment$e, safe_not_equal, {});

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "App_1",
			options,
			id: create_fragment$e.name
		});
	}
}

// Custom Title Bar 
// Only good on windows system 
const customTitlebar = require('custom-electron-titlebar');
if(process.platform !== "darwin"){
  new customTitlebar.Titlebar({
    backgroundColor: customTitlebar.Color.fromHex('#444')
  });
}
const Framework7 = require('framework7/js/framework7-lite.bundle.js'); 

// Init F7-Svelte Plugin
Framework7.use(Plugin);

// Mount Svelte App
const app$1 = new App_1({
  target: document.getElementById('app')
});
//# sourceMappingURL=bundle.js.map
