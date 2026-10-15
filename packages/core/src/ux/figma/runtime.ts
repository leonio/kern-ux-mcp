/**
 * The JavaScript the script runs in Figma's plugin sandbox (use_figma): it
 * builds a plan (plan.ts) from the kit's components. Kept as source text,
 * since it runs there and not here; runtime.test.ts runs it against a fake
 * of the Plugin API. Plain ES2017, without template literals, so it fits in
 * this one.
 *
 * What it does, in Figma's words: imports each kit component by its key,
 * picks the variant, sets text, boolean and instance-swap properties by name
 * (the ID suffixes differ per copy of the kit), fills nested instances, and
 * builds the content of a slot as a local component swapped into it. Spacing
 * is bound to the library's metric/space variables when the Foundations are
 * linked, KERN's pixel values otherwise. A frame of the same name is replaced,
 * so the script can run again.
 */
export const FIGMA_RUNTIME = `
async function buildKernScreen(plan, keys) {
  var report = { screenId: null, slotsId: null, instances: 0, missing: [], warnings: [], errors: [] };
  var SPACE = { none: 0, "2x-small": 2, "x-small": 4, small: 8, "default": 16, large: 24, "x-large": 32 };
  var PAGE_MARGIN = { desktop: 32, mobile: 8 };
  var LEVEL_BACKGROUND = { 0: { r: 1, g: 1, b: 1 }, 1: { r: 0.953, g: 0.953, b: 0.953 }, 2: { r: 1, g: 1, b: 1 } };

  function propertyName(key) {
    return key.replace(/#[^#]*$/, "").replace(/^[^a-zA-Z]+/, "").trim().toLowerCase();
  }
  function optionKey(value) {
    return String(value).toLowerCase().replace(/[^a-z0-9äöüß%]/g, "");
  }
  function message(error) {
    return error && error.message ? error.message : String(error);
  }
  function warn(text) {
    if (report.warnings.indexOf(text) < 0) report.warnings.push(text);
  }

  // Kit components by name, each imported once.
  var imported = {};
  async function kit(name) {
    if (Object.prototype.hasOwnProperty.call(imported, name)) return imported[name];
    var node = null;
    var key = keys[name];
    if (!key) {
      if (report.missing.indexOf(name) < 0) report.missing.push(name);
    } else {
      try {
        node = await figma.importComponentSetByKeyAsync(key);
      } catch (notASet) {
        try {
          node = await figma.importComponentByKeyAsync(key);
        } catch (error) {
          report.errors.push(name + ": no component with the key " + key + " (" + message(error) + ")");
        }
      }
    }
    imported[name] = node;
    return node;
  }

  // Variables by name: local ones first, then the linked libraries' 02_Device and 04_Level.
  var localVariables = null;
  var libraryKeys = null;
  var variables = {};
  async function variable(name) {
    if (Object.prototype.hasOwnProperty.call(variables, name)) return variables[name];
    var found = null;
    try {
      if (!localVariables) localVariables = await figma.variables.getLocalVariablesAsync();
      found = localVariables.find(function (v) { return v.name === name; }) || null;
      if (!found) {
        if (!libraryKeys) {
          libraryKeys = {};
          var collections = await figma.teamLibrary.getAvailableLibraryVariableCollectionsAsync();
          for (var c = 0; c < collections.length; c++) {
            if (["02_Device", "04_Level"].indexOf(collections[c].name) < 0) continue;
            var listed = await figma.teamLibrary.getVariablesInLibraryCollectionAsync(collections[c].key);
            for (var l = 0; l < listed.length; l++) libraryKeys[listed[l].name] = listed[l].key;
          }
        }
        if (libraryKeys[name]) found = await figma.variables.importVariableByKeyAsync(libraryKeys[name]);
        else if (Object.keys(libraryKeys).length === 0) warn(UNLINKED);
        else warn("The KERN 2 Foundations have no variable " + name + ": KERN's value is used.");
      }
    } catch (error) {
      warn("Variables aren't available (" + message(error) + "): KERN's values are used, unbound.");
    }
    variables[name] = found;
    return found;
  }
  var UNLINKED = "The KERN 2 Foundations aren't linked to this file: spacing and backgrounds use KERN's values, unbound.";

  async function bindNumber(node, field, token) {
    var pageMargin = token === "page-margin";
    node[field] = pageMargin ? PAGE_MARGIN[plan.device] : SPACE[token];
    var v = await variable(pageMargin ? "metric/grid/page-margin" : "metric/space/" + token);
    if (v) node.setBoundVariable(field, v);
  }

  async function setMode(node, variableName, modeName) {
    var v = await variable(variableName);
    if (!v) return null;
    var collection = await figma.variables.getVariableCollectionByIdAsync(v.variableCollectionId);
    var mode = collection && collection.modes.find(function (m) { return optionKey(m.name) === optionKey(modeName); });
    if (mode) node.setExplicitVariableModeForCollection(collection, mode.modeId);
    return v;
  }

  // A KERN level: 04_Level's mode, with the contextual background bound to the fill.
  async function setLevel(node, level) {
    var paint = { type: "SOLID", color: LEVEL_BACKGROUND[level] };
    var v = await setMode(node, "color/layout/background/default-contextual", "Level-" + level);
    node.fills = [v ? figma.variables.setBoundVariableForPaint(paint, "color", v) : paint];
  }

  async function makeFrame(spec) {
    var node = figma.createFrame();
    node.name = spec.name;
    node.layoutMode = spec.direction === "horizontal" ? "HORIZONTAL" : "VERTICAL";
    node.primaryAxisSizingMode = "AUTO";
    node.counterAxisSizingMode = "AUTO";
    node.fills = [];
    node.clipsContent = false;
    if (spec.wrap && spec.direction === "horizontal") node.layoutWrap = "WRAP";
    if (spec.spaceBetween) node.primaryAxisAlignItems = "SPACE_BETWEEN";
    await bindNumber(node, "itemSpacing", spec.gap);
    if (node.layoutWrap === "WRAP") await bindNumber(node, "counterAxisSpacing", spec.gap);
    var padding = spec.padding || {};
    if (padding.x) {
      await bindNumber(node, "paddingLeft", padding.x);
      await bindNumber(node, "paddingRight", padding.x);
    }
    if (padding.y) {
      await bindNumber(node, "paddingTop", padding.y);
      await bindNumber(node, "paddingBottom", padding.y);
    }
    if (spec.level) await setLevel(node, spec.level);
    return node;
  }

  // Stretch across a vertical auto-layout parent; next to siblings, keep the own width.
  function stretch(node, parent) {
    if (parent.layoutMode === "VERTICAL") node.layoutSizingHorizontal = "FILL";
  }

  var loadedFonts = {};
  async function loadFonts(node) {
    var texts = node.findAllWithCriteria({ types: ["TEXT"] });
    for (var t = 0; t < texts.length; t++) {
      var text = texts[t];
      var fonts = text.fontName === figma.mixed ? text.getRangeAllFontNames(0, text.characters.length) : [text.fontName];
      for (var f = 0; f < fonts.length; f++) {
        var id = fonts[f].family + "|" + fonts[f].style;
        if (loadedFonts[id]) continue;
        loadedFonts[id] = true;
        try {
          await figma.loadFontAsync(fonts[f]);
        } catch (error) {
          warn("The font " + fonts[f].family + " " + fonts[f].style + " isn't available.");
        }
      }
    }
  }

  function findProperty(instance, name, type) {
    var properties = instance.componentProperties;
    return Object.keys(properties).find(function (key) {
      return properties[key].type === type && propertyName(key) === name.toLowerCase();
    });
  }

  async function variantOptions(instance, key) {
    var main = await instance.getMainComponentAsync();
    var set = main && main.parent && main.parent.type === "COMPONENT_SET" ? main.parent : null;
    var definition = set ? set.componentPropertyDefinitions[key] : null;
    return definition && definition.variantOptions ? definition.variantOptions : [];
  }

  async function swapTarget(name) {
    var target = await kit(name);
    if (!target) return null;
    return target.type === "COMPONENT_SET" ? target.defaultVariant : target;
  }

  // Variants (of nested instances), booleans and swaps first, then texts with their fonts loaded.
  async function setProperties(instance, spec, label, withVariants) {
    var values = {};
    var name;
    if (withVariants) {
      for (name in spec.variants || {}) {
        var variantKey = findProperty(instance, name, "VARIANT");
        if (!variantKey) { warn(label + ": no variant " + name); continue; }
        var wanted = spec.variants[name];
        var option = (await variantOptions(instance, variantKey)).find(function (o) { return optionKey(o) === optionKey(wanted); });
        if (option === undefined) { warn(label + ": " + name + " has no value " + wanted); continue; }
        values[variantKey] = option;
      }
    }
    for (name in spec.booleans || {}) {
      var booleanKey = findProperty(instance, name, "BOOLEAN");
      if (booleanKey) values[booleanKey] = spec.booleans[name];
      else warn(label + ": no boolean property " + name);
    }
    for (name in spec.swaps || {}) {
      var swapKey = findProperty(instance, name, "INSTANCE_SWAP");
      var target = await swapTarget(spec.swaps[name]);
      if (!swapKey) warn(label + ": no swap property " + name);
      else if (target) values[swapKey] = target.id;
    }
    if (Object.keys(values).length > 0) instance.setProperties(values);

    var texts = {};
    for (name in spec.texts || {}) {
      var textKey = findProperty(instance, name, "TEXT");
      if (textKey) texts[textKey] = spec.texts[name];
      else warn(label + ": no text property " + name);
    }
    if (Object.keys(texts).length > 0) {
      await loadFonts(instance);
      instance.setProperties(texts);
    }
  }

  function layerName(name) {
    return name.replace(/^[^a-zA-Z]+/, "").trim().toLowerCase();
  }

  async function setNested(root, nested, label) {
    for (var n = 0; n < (nested || []).length; n++) {
      var spec = nested[n];
      var where = label + " > " + spec.layer;
      var layers = root.findAll(function (node) {
        return node.type === "INSTANCE" && layerName(node.name) === spec.layer.toLowerCase();
      });
      if (layers.length === 0) { warn(where + ": not found"); continue; }
      if (spec.items) {
        if (spec.items.length > layers.length) warn(where + ": " + spec.items.length + " items, the kit shows " + layers.length);
        for (var i = 0; i < layers.length; i++) {
          var item = spec.items[i];
          layers[i].visible = Boolean(item);
          if (!item) continue;
          await setProperties(layers[i], item, where, true);
          await setNested(layers[i], item.nested, where);
        }
      } else if (spec.visible === false) {
        layers[0].visible = false;
      } else {
        await setProperties(layers[0], spec, where, true);
        await setNested(layers[0], spec.nested, where);
      }
    }
  }

  function pickVariant(set, wanted, label) {
    var base = set.defaultVariant;
    var target = Object.assign({}, base.variantProperties);
    var definitions = set.componentPropertyDefinitions;
    Object.keys(wanted || {}).forEach(function (name) {
      var axis = Object.keys(target).find(function (a) { return propertyName(a) === name.toLowerCase(); });
      if (!axis) { warn(label + ": no variant " + name); return; }
      var options = definitions[axis] && definitions[axis].variantOptions ? definitions[axis].variantOptions : [];
      var option = options.find(function (o) { return optionKey(o) === optionKey(wanted[name]); });
      if (option === undefined) { warn(label + ": " + name + " has no value " + wanted[name]); return; }
      target[axis] = option;
    });
    var match = set.children.find(function (variant) {
      return variant.type === "COMPONENT" && Object.keys(target).every(function (axis) {
        return variant.variantProperties && variant.variantProperties[axis] === target[axis];
      });
    });
    if (!match) warn(label + ": no variant " + JSON.stringify(target) + ", the default is used");
    return match || base;
  }

  var slotsFrame = null;
  async function fillSlots(instance, slots, label) {
    var values = {};
    var names = Object.keys(slots);
    for (var s = 0; s < names.length; s++) {
      var key = findProperty(instance, names[s], "INSTANCE_SWAP");
      if (!key) { warn(label + ": no slot " + names[s]); continue; }
      var placeholder = instance.findOne(function (node) {
        return node.type === "INSTANCE" && node.componentPropertyReferences && node.componentPropertyReferences.mainComponent === key;
      });
      var holder = await makeFrame({ name: label + " / " + names[s], direction: "vertical", gap: "default" });
      slotsFrame.appendChild(holder);
      holder.resize(Math.max(1, placeholder ? placeholder.width : instance.width), 1);
      holder.counterAxisSizingMode = "FIXED";
      holder.primaryAxisSizingMode = "AUTO";
      for (var c = 0; c < slots[names[s]].length; c++) await build(slots[names[s]][c], holder);
      values[key] = figma.createComponentFromNode(holder).id;
    }
    if (Object.keys(values).length > 0) instance.setProperties(values);
  }

  var placeholderFont = null;
  async function drawMissing(name, parent) {
    var box = figma.createFrame();
    box.name = "missing: " + name;
    box.layoutMode = "HORIZONTAL";
    box.primaryAxisSizingMode = "AUTO";
    box.counterAxisSizingMode = "AUTO";
    box.paddingLeft = box.paddingRight = box.paddingTop = box.paddingBottom = 8;
    box.fills = [];
    box.strokes = [{ type: "SOLID", color: { r: 0.8, g: 0.1, b: 0.1 } }];
    box.dashPattern = [4, 4];
    parent.appendChild(box);
    try {
      if (!placeholderFont) {
        placeholderFont = { family: "Inter", style: "Regular" };
        await figma.loadFontAsync(placeholderFont);
      }
      var label = figma.createText();
      label.fontName = placeholderFont;
      label.characters = name + ": no key in KEYS";
      box.appendChild(label);
    } catch (error) {
      warn("Placeholders have no label: " + message(error));
    }
  }

  async function build(node, parent) {
    var label = node.type === "frame" ? node.name : node.component;
    try {
      if (node.type === "frame") {
        var frame = await makeFrame(node);
        parent.appendChild(frame);
        stretch(frame, parent);
        for (var c = 0; c < node.children.length; c++) await build(node.children[c], frame);
        return;
      }
      var component = await kit(node.component);
      if (!component) { await drawMissing(node.component, parent); return; }
      var isSet = component.type === "COMPONENT_SET";
      var main = isSet ? pickVariant(component, node.variants, label) : component;
      var instance = main.createInstance();
      parent.appendChild(instance);
      report.instances++;
      if (node.fill) stretch(instance, parent);
      await setProperties(instance, node, label, !isSet);
      await setNested(instance, node.nested, label);
      if (node.slots) await fillSlots(instance, node.slots, label);
    } catch (error) {
      report.errors.push(label + ": " + message(error));
    }
  }

  var page = figma.currentPage;
  var slotsName = plan.name + " / slots";
  var part = plan.part || { index: 0, of: 1, path: [] };
  var screen;
  var target;

  if (part.index === 0) {
    // The screen, to the right of what's on the page; an earlier one of the same name goes.
    page.children.filter(function (n) { return n.name === plan.name || n.name === slotsName; })
      .forEach(function (n) { n.remove(); });
    var right = page.children.reduce(function (x, n) { return Math.max(x, n.x + n.width); }, -200);
    screen = await makeFrame({
      name: plan.name,
      direction: "vertical",
      gap: plan.page ? "none" : "large",
      padding: plan.page ? undefined : { x: "page-margin", y: "x-large" }
    });
    page.appendChild(screen);
    screen.x = right + 200;
    screen.y = 0;
    screen.resize(plan.width, 1);
    screen.counterAxisSizingMode = "FIXED";
    screen.primaryAxisSizingMode = "AUTO";
    screen.clipsContent = true;
    await setMode(screen, "metric/space/default", plan.device);
    await setLevel(screen, 0);
    slotsFrame = await makeFrame({ name: slotsName, direction: "vertical", gap: "x-large" });
    page.appendChild(slotsFrame);
    slotsFrame.y = 0;
    target = screen;
  } else {
    // A later part: it adds to the frame the earlier parts built, found by its position.
    screen = page.children.find(function (n) { return n.name === plan.name; });
    slotsFrame = page.children.find(function (n) { return n.name === slotsName; });
    if (!screen || !slotsFrame) {
      report.errors.push("Part " + (part.index + 1) + " of " + part.of + ": run the parts in order, the first one first.");
      return report;
    }
    target = screen;
    for (var p = 0; p < part.path.length; p++) target = target && target.children[part.path[p]];
    if (!target || target.name !== part.container) {
      report.errors.push("Part " + (part.index + 1) + " of " + part.of + ": no frame " + part.container + " where the earlier parts put it. Run all parts again, in order.");
      return report;
    }
  }

  for (var i = 0; i < plan.children.length; i++) await build(plan.children[i], target);

  slotsFrame.x = screen.x + screen.width + 200;
  report.screenId = screen.id;
  if (slotsFrame.children.length > 0) report.slotsId = slotsFrame.id;
  else if (part.index === part.of - 1) slotsFrame.remove();
  return report;
}
`;
