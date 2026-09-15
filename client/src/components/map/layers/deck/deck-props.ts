// deck.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// @ts-nocheck vendored from @deck.gl/arcgis 9.3.7 src (2D only)

import * as ArcGISReactiveUtils from "@arcgis/core/core/reactiveUtils";

const properties = {
  layers: {},
  layerFilter: {},
  parameters: {},
  effects: {},
  pickingRadius: {},
  onBeforeRender: {},
  onAfterRender: {},
  onClick: {},
  onHover: {},
  onDragStart: {},
  onDrag: {},
  onDragEnd: {},
  onError: {},
  debug: {},
  drawPickingColors: {},
  getCursor: {},
  getTooltip: {},
};

export default function createDeckProps(Accessor) {
  const DeckProps = Accessor.createSubclass({
    properties,

    constructor() {
      this._callbacks = {};

      // Diverges from vendored source: Accessor.watch is deprecated, replaced with one reactiveUtils.watch per property key.
      for (const propName of Object.keys(properties)) {
        ArcGISReactiveUtils.watch(
          () => this[propName],
          (newValue) => this.emit("change", { [propName]: newValue }),
        );
      }
    },

    on(eventName, cb) {
      this._callbacks[eventName] = this._callbacks[eventName] || [];
      this._callbacks[eventName].push(cb);
    },

    emit(eventName, details) {
      const callbacks = this._callbacks[eventName];
      if (callbacks) {
        for (const cb of callbacks) {
          cb(details);
        }
      }
    },

    toJSON() {
      const result = {};
      for (const key of this.keys()) {
        if (this[key] !== undefined) {
          result[key] = this[key];
        }
      }
      return result;
    },
  });

  return DeckProps;
}
