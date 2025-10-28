// deck.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import { Deck } from "@deck.gl/core";
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
      // For the fullscreen blit we must not reject the quad due to the map's depth buffer.
      // Make the blit always pass and don't write depth.
      depthWriteEnabled: false,
      depthCompare: "always",
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
    depthStencilAttachment: "depth16unorm",
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
  const { model, deck } = resources;
  const device = model.device;

  if (device instanceof WebGLDevice) {
    const screenFbo = device.getDefaultCanvasContext().getCurrentFramebuffer();
    const { width, height, ...viewState } = viewport;

    /* global window */
    const dpr = window.devicePixelRatio;
    const pixelWidth = Math.round(width * dpr);
    const pixelHeight = Math.round(height * dpr);

    // Create a new texture with correct dimensions
    const newTexture = device.createTexture({
      format: "rgba8unorm",
      width: pixelWidth,
      height: pixelHeight,
      sampler: {
        minFilter: "linear",
        magFilter: "linear",
        addressModeU: "clamp-to-edge",
        addressModeV: "clamp-to-edge",
      },
    });

    // Create a new framebuffer with the correctly sized texture
    const resizedFbo = device.createFramebuffer({
      id: "deckfbo-resized",
      width: pixelWidth,
      height: pixelHeight,
      colorAttachments: [newTexture],
      depthStencilAttachment: "depth16unorm",
    });

    deck.setProps({ viewState, _framebuffer: resizedFbo });
    // redraw deck immediately into deckFbo
    deck.redraw("arcgis");

    // Update the model's texture binding to use the new texture
    model.setBindings({
      deckglTexture: newTexture,
    });

    const textureToScreenPass = device.beginRenderPass({
      framebuffer: screenFbo,
      parameters: {
        viewport: [0, 0, pixelWidth, pixelHeight],
      },
      clearColor: false,
      clearDepth: false,
      clearStencil: 1,
    });
    try {
      model.draw(textureToScreenPass);
    } finally {
      textureToScreenPass.end();
    }
  }
}

export function finalizeResources(resources: RenderResources) {
  resources.deck.finalize();
  resources.model.destroy();
  resources.fbo.destroy();
  resources.texture.destroy();
}
