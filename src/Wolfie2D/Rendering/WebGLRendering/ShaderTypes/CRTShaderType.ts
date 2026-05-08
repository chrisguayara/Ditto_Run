import CanvasNode from "../../../Nodes/CanvasNode";
import ResourceManager from "../../../ResourceManager/ResourceManager";
import ShaderType from "../ShaderType";

export default class CRTShaderType extends ShaderType {
    protected bufferObjectKey: string;

    public vignetteStrength: number = 1.0;
    public saturationBoost: number = 1.0;
    public scanlineStrength: number = 1.0;

    constructor(programKey: string) {
        super(programKey);
        this.resourceManager = ResourceManager.getInstance();
    }

    initBufferObject(): void {
        this.bufferObjectKey = "crt";
        this.resourceManager.createBuffer(this.bufferObjectKey);
    }

    render(gl: WebGLRenderingContext, options: Record<string, any>): void {
        const program = this.resourceManager.getShaderProgram(this.programKey);
        const buffer  = this.resourceManager.getBuffer(this.bufferObjectKey);

        gl.useProgram(program);

        const vertexData = new Float32Array([
            -1.0,  1.0,  0.0, 1.0,
            -1.0, -1.0,  0.0, 0.0,
             1.0,  1.0,  1.0, 1.0,
             1.0, -1.0,  1.0, 0.0,
        ]);
        const FSIZE = vertexData.BYTES_PER_ELEMENT;

        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);

        const a_Position = gl.getAttribLocation(program, "a_Position");
        gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 4 * FSIZE, 0);
        gl.enableVertexAttribArray(a_Position);

        const a_TexCoord = gl.getAttribLocation(program, "a_TexCoord");
        gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, 4 * FSIZE, 2 * FSIZE);
        gl.enableVertexAttribArray(a_TexCoord);

        // Use the dedicated texture unit passed from WebGLRenderer
        const unit = options.frameTextureUnit as number;
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, options.frameTexture as WebGLTexture);
        gl.uniform1i(gl.getUniformLocation(program, "u_Sampler"), unit);

        gl.uniform1f(gl.getUniformLocation(program, "u_vignetteStrength"), options.vignetteStrength ?? this.vignetteStrength);
        gl.uniform1f(gl.getUniformLocation(program, "u_saturationBoost"),  options.saturationBoost  ?? this.saturationBoost);
        gl.uniform1f(gl.getUniformLocation(program, "u_scanlineStrength"), options.scanlineStrength  ?? this.scanlineStrength);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    getOptions(_node: CanvasNode): Record<string, any> { return {}; }
}