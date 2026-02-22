// deck.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import { Deck } from "@deck.gl/core";
import { GL } from "@luma.gl/constants";
import type { Device, Texture, Framebuffer } from "@luma.gl/core";
import { Model, Geometry } from "@luma.gl/engine";
import { WebGLDevice } from "@luma.gl/webgl";

interface Renderer {
  redraw: () => void;
}

export type RenderResources = {
  deck: Deck;
  texture: Texture;
  model: Model;
  fbo: Framebuffer;
};

async function createDeckInstance(gl: WebGL2RenderingContext): Promise<{
  deckInstance: Deck;
  device: Device;
}> {
  return new Promise((resolve) => {
    const deckInstance = new Deck({
      // Input is handled by the ArcGIS API for JavaScript.
      controller: false,

      // We use the same WebGL context as the ArcGIS API for JavaScript.
      gl,

      // We need depth testing in general; we don't know what layers might be added to the deck.
      parameters: {
        depthCompare: "less-equal",
      },

      // To disable canvas resizing, since the FBO is owned by the ArcGIS API for JavaScript.
      width: null,
      height: null,

      onDeviceInitialized: (device: Device) => {
        resolve({ deckInstance, device });
      },
    });
  });
}

export async function initializeResources(
  this: Renderer,
  gl: WebGL2RenderingContext,
): Promise<RenderResources> {
  const { deckInstance, device } = await createDeckInstance(gl);

  const texture = device.createTexture({
    format: "rgba8unorm",
    width: 1,
    height: 1,
    sampler: {
      minFilter: "linear",
      magFilter: "linear",
      addressModeU: "clamp-to-edge",
      addressModeV: "clamp-to-edge",
    },
  });

  const model = new Model(device, {
    vs: /* glsl */ `\
      #version 300 es
      in vec2 pos;
      out vec2 v_texcoord;
      void main(void) {
          gl_Position = vec4(pos, 0.0, 1.0);
          v_texcoord = (pos + 1.0) / 2.0;
      }
    `,
    fs: /* glsl */ `\
      #version 300 es
      precision mediump float;
      uniform sampler2D deckglTexture;
      in vec2 v_texcoord;
      out vec4 fragColor;

      void main(void) {
          vec4 imageColor = texture(deckglTexture, v_texcoord);
          imageColor.rgb *= imageColor.a;
          fragColor = imageColor;
      }
    `,
    bindings: {
      deckglTexture: texture,
    },
    parameters: {
      blend: true,
      depthWriteEnabled: true,
      depthCompare: "less-equal",
      blendColorSrcFactor: "one",
      blendColorDstFactor: "one-minus-src-alpha",
      blendAlphaSrcFactor: "one",
      blendAlphaDstFactor: "one-minus-src-alpha",
      blendColorOperation: "add",
      blendAlphaOperation: "add",
    },
    geometry: new Geometry({
      topology: "triangle-strip",
      attributes: {
        pos: { size: 2, value: new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]) },
      },
    }),
    vertexCount: 4,
    disableWarnings: true,
  });

  const fbo = device.createFramebuffer({
    id: "deckfbo",
    width: 1,
    height: 1,
    colorAttachments: [texture],
  });

  deckInstance.setProps({
    // This deck renders into an auxiliary framebuffer.
    _framebuffer: fbo,

    _customRender: (redrawReason) => {
      if (redrawReason === "arcgis") {
        // Only redraw layers when triggered by ArcGIS
        deckInstance._drawLayers(redrawReason);
      } else {
        // Trigger a redraw of the ArcGIS layer view
        this.redraw();
      }
    },
  });

  return { deck: deckInstance, texture, fbo, model };
}

export function render(
  resources: RenderResources,
  viewport: {
    width: number;
    height: number;
    longitude: number;
    latitude: number;
    zoom: number;
    altitude?: number;
    pitch: number;
    bearing: number;
  },
) {
  const { deck } = resources;
  // @ts-expect-error accessing protected property
  const device: Device = deck.device;
  if (device instanceof WebGLDevice) {
    const viewState = viewport;

    // Get ArcGIS's currently bound framebuffer
    const _framebuffer = device.getParametersWebGL(GL.FRAMEBUFFER_BINDING);

    // Render deck.gl layers directly to ArcGIS's framebuffer
    deck.setProps({
      viewState,
      _framebuffer,
    });

    // Clear only the depth buffer to ensure deck.gl layers render on top of the base map
    // This prevents z-fighting and ensures deck.gl content is always visible
    const clearPass = device.beginRenderPass({
      framebuffer: _framebuffer,
      clearColor: false,
      clearDepth: 1,
      clearStencil: false,
    });
    clearPass.end();

    // Render deck.gl layers without clearing color (preserves base map)
    deck._drawLayers("arcgis", {
      clearCanvas: false,
    });
  }
}

export function finalizeResources(resources: RenderResources) {
  resources.deck.finalize();
  resources.model.destroy();
  resources.fbo.destroy();
  resources.texture.destroy();
}
