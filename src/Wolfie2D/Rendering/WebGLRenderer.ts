import Map from "../DataTypes/Map";
import Vec2 from "../DataTypes/Vec2";
import CanvasNode from "../Nodes/CanvasNode";
import Graphic from "../Nodes/Graphic";
import Point from "../Nodes/Graphics/Point";
import Rect from "../Nodes/Graphics/Rect";
import AnimatedSprite from "../Nodes/Sprites/AnimatedSprite";
import Sprite from "../Nodes/Sprites/Sprite";
import Tilemap from "../Nodes/Tilemap";
import UIElement from "../Nodes/UIElement";
import Label from "../Nodes/UIElements/Label";
import ShaderRegistry from "../Registry/Registries/ShaderRegistry";
import RegistryManager from "../Registry/RegistryManager";
import ResourceManager from "../ResourceManager/ResourceManager";
import ParallaxLayer from "../Scene/Layers/ParallaxLayer";
import UILayer from "../Scene/Layers/UILayer";
import Color from "../Utils/Color";
import RenderingManager from "./RenderingManager";

export default class WebGLRenderer extends RenderingManager {

	protected origin: Vec2;
	protected zoom: number;
	protected worldSize: Vec2;

	protected gl: WebGLRenderingContext;
	protected textCtx: CanvasRenderingContext2D;

	// --- CRT post-process FBO ---
	/** Off-screen framebuffer the scene is rendered into each frame */
	private fbo: WebGLFramebuffer;
	/** Color texture attached to the FBO; read by the CRT shader */
	private fboTexture: WebGLTexture;
	// ----------------------------

	initializeCanvas(canvas: HTMLCanvasElement, width: number, height: number): WebGLRenderingContext {
		canvas.width = width;
        canvas.height = height;

		this.worldSize = Vec2.ZERO;
		this.worldSize.x = width;
		this.worldSize.y = height;

		// Get the WebGL context
        this.gl = canvas.getContext("webgl");

		this.gl.viewport(0, 0, canvas.width, canvas.height);

		this.gl.disable(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        this.gl.enable(this.gl.CULL_FACE);

		// Tell the resource manager we're using WebGL
		ResourceManager.getInstance().useWebGL(true, this.gl);

		// Show the text canvas and get its context
		let textCanvas = <HTMLCanvasElement>document.getElementById("text-canvas");
		textCanvas.hidden = false;
		this.textCtx = textCanvas.getContext("2d");

		// Size the text canvas to be the same as the game canvas
		textCanvas.height = height;
		textCanvas.width = width;

		// Build the off-screen framebuffer for the CRT post-process pass.
		// Must happen after ResourceManager.useWebGL() so the gl context is ready.
		this.setupCRTFramebuffer(width, height);

        return this.gl;
	}

	/**
	 * Creates the FBO and its color texture used by the CRT post-process pass.
	 * No depth buffer is needed because depth testing is disabled for this renderer.
	 */
	private fboTextureUnit: number;

private setupCRTFramebuffer(width: number, height: number): void {
    const gl = this.gl;

    // Use the highest available unit to avoid colliding with ResourceManager's sequential assignments
    this.fboTextureUnit = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS) - 1;

    this.fboTexture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + this.fboTextureUnit);
    gl.bindTexture(gl.TEXTURE_2D, this.fboTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    this.fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.fboTexture, 0);
	const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);

	if (status !== gl.FRAMEBUFFER_COMPLETE) {
		console.error("Framebuffer incomplete:", status);
	} else {
		console.log("Framebuffer complete");
	}

    if(gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE){
        console.error("WebGLRenderer: CRT framebuffer incomplete");
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.activeTexture(gl.TEXTURE0); // restore default active unit
}



	render(visibleSet: CanvasNode[], tilemaps: Tilemap[], uiLayers: Map<UILayer>): void {
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fbo);
		this.gl.viewport(0, 0, 1200, 800);
		this.gl.clearColor(0, 0, 0, 1);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT);

		for(let node of visibleSet){
			this.renderNode(node);
		}
		uiLayers.forEach(key => {
			if(!uiLayers.get(key).isHidden())
				uiLayers.get(key).getItems().forEach(node => this.renderNode(<CanvasNode>node));
		});

    	// Read one pixel from the center of the FBO
		const pixels = new Uint8Array(200 * 200 * 4);
		this.gl.readPixels(0, 0, 200, 200, this.gl.RGBA, this.gl.UNSIGNED_BYTE, pixels);
		let found = false;
		for(let i = 0; i < pixels.length; i += 4){
			if(pixels[i] > 0 || pixels[i+1] > 0 || pixels[i+2] > 0){
				console.log("Non-black pixel at index", i/4, "RGBA:", pixels[i], pixels[i+1], pixels[i+2], pixels[i+3]);
				found = true;
				break;
			}
		}
		if(!found) console.log("FBO is entirely black — sprites not drawing into it");
		}
	/**
	* Draws a fullscreen quad through the CRT shader, sampling from the FBO texture.
	* Call this after the scene has been rendered into the FBO.
	*/
	protected renderCRTPass(): void {
		const shader = RegistryManager.shaders.get(ShaderRegistry.CRT_SHADER);
		shader.render(this.gl, {
			frameTexture:     this.fboTexture,
			frameTextureUnit: this.fboTextureUnit,  // pass the unit along
			vignetteStrength: 1.0,
			saturationBoost:  1.0,
			scanlineStrength: 1.0,
		});
		}

		clear(color: Color): void {
			// Clears the default framebuffer (visible canvas).
			// The FBO is cleared inside render() just before the scene is drawn into it.
			this.gl.clearColor(color.r, color.g, color.b, color.a);
			this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

			this.textCtx.clearRect(0, 0, this.worldSize.x, this.worldSize.y);
		}

	protected renderNode(node: CanvasNode): void {
		this.origin = this.scene.getViewTranslation(node);
		this.zoom   = this.scene.getViewScale();
		
		if(node.hasCustomShader){
			this.renderCustom(node);
		} else if(node instanceof Graphic){
			this.renderGraphic(node);
		} else if(node instanceof Sprite){
			if(node instanceof AnimatedSprite){
				this.renderAnimatedSprite(node);
			} else {
				this.renderSprite(node);
			}
		} else if(node instanceof UIElement){
			this.renderUIElement(node);
		}
	}

	protected renderSprite(sprite: Sprite): void {
		let shader = RegistryManager.shaders.get(ShaderRegistry.SPRITE_SHADER);
		let options = this.addOptions(shader.getOptions(sprite), sprite);
		shader.render(this.gl, options);
	}

	protected renderAnimatedSprite(sprite: AnimatedSprite): void {
		let shader = RegistryManager.shaders.get(ShaderRegistry.SPRITE_SHADER);
		let options = this.addOptions(shader.getOptions(sprite), sprite);
		shader.render(this.gl, options);
	}

	protected renderGraphic(graphic: Graphic): void {
		if(graphic instanceof Point){
			let shader = RegistryManager.shaders.get(ShaderRegistry.POINT_SHADER);
			let options = this.addOptions(shader.getOptions(graphic), graphic);
			shader.render(this.gl, options);
		} else if(graphic instanceof Rect) {
			let shader = RegistryManager.shaders.get(ShaderRegistry.RECT_SHADER);
			let options = this.addOptions(shader.getOptions(graphic), graphic);
			shader.render(this.gl, options);
		} 
	}

	protected renderTilemap(tilemap: Tilemap): void {
		throw new Error("Method not implemented.");
	}

	protected renderUIElement(uiElement: UIElement): void {
		if(uiElement instanceof Label){
			let shader = RegistryManager.shaders.get(ShaderRegistry.LABEL_SHADER);
			let options = this.addOptions(shader.getOptions(uiElement), uiElement);
			shader.render(this.gl, options);

			this.textCtx.setTransform(1, 0, 0, 1, (uiElement.position.x - this.origin.x)*this.zoom, (uiElement.position.y - this.origin.y)*this.zoom);
			this.textCtx.rotate(-uiElement.rotation);
			let globalAlpha = this.textCtx.globalAlpha;
			this.textCtx.globalAlpha = uiElement.alpha;

			this.textCtx.font = uiElement.getFontString();
			let offset = uiElement.calculateTextOffset(this.textCtx);
			this.textCtx.fillStyle = uiElement.calculateTextColor();
			this.textCtx.globalAlpha = uiElement.textColor.a;
			this.textCtx.fillText(uiElement.text, offset.x - uiElement.size.x/2, offset.y - uiElement.size.y/2);

			this.textCtx.globalAlpha = globalAlpha;
        	this.textCtx.setTransform(1, 0, 0, 1, 0, 0);
		}
	}

	protected renderCustom(node: CanvasNode): void {
		let shader = RegistryManager.shaders.get(node.customShaderKey);
		let options = this.addOptions(shader.getOptions(node), node);
		shader.render(this.gl, options);
	}

	protected addOptions(options: Record<string, any>, node: CanvasNode): Record<string, any> {
		options.worldSize = this.worldSize;

		let layer = node.getLayer();
		let parallax = new Vec2(1, 1);
		if(layer instanceof ParallaxLayer){
			parallax = (<ParallaxLayer>layer).parallax;
		}

		options.origin = this.origin.clone().mult(parallax);

		return options;
	}
}