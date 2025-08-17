const vsSource = `
// Vertex shader
attribute vec3 aVertexPosition;
attribute vec2 aTextureCoord;
attribute vec3 aNormal;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat3 uNormalMatrix;   
uniform float uTimeTotal;   

varying highp vec2 vTextureCoord;
varying highp vec3 vNormal;
varying highp float vTimeTotal;

void main() {
    gl_Position     = uProjectionMatrix * uModelViewMatrix * vec4(aVertexPosition, 1.0);
    vTextureCoord   = aTextureCoord;
    vNormal         = mat3(uNormalMatrix) * aNormal;  // if you set uNormalMatrix, else just vNormal = aNormal;
    vTimeTotal      = uTimeTotal;
}
`;

const fsSource = `
precision mediump float;

uniform sampler2D uSampler;

varying highp vec2 vTextureCoord;
varying highp vec3 vNormal;
varying highp float vTimeTotal;   // 

//void main() { gl_FragColor = texture2D(uSampler, vTextureCoord); }
void main() {
    vec3    normal   = normalize(vNormal);
    vec3    lightDir = normalize(vec3(0.5, 0.7, sin(vTimeTotal * 2.0)));
    float   diffuse  = max(dot(normal, lightDir), 0.0);
    vec4    texColor = texture2D(uSampler, vTextureCoord);
    gl_FragColor = vec4(texColor.rgb * (0.15 + 0.85 * diffuse), texColor.a);
}
`;

// Flatten VOXEL data into arrays for WebGL
function buildVoxelBuffers(gl) {
    const VOXEL_FACE_VERTICES =
        [ [[0, 1, 0], [1, 1, 0], [0, 1, 1], [1, 1, 1]]  // Top
        , [[1, 0, 0], [1, 1, 0], [1, 0, 1], [1, 1, 1]]  // Front
        , [[0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]]  // Right
        , [[0, 0, 0], [1, 0, 0], [0, 0, 1], [1, 0, 1]]  // Bottom
        , [[0, 0, 0], [0, 1, 0], [0, 0, 1], [0, 1, 1]]  // Back
        , [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0]]  // Left
        ];
    const VOXEL_FACE_UV =
        [ [[0.0, 0.0], [1.0, 0], [0, 1], [1, 1]]
        , [[0.0, 0.0], [1.0, 0], [0, 1], [1, 1]]
        , [[0.0, 0.0], [1.0, 0], [0, 1], [1, 1]]
        , [[0.0, 0.0], [1.0, 0], [0, 1], [1, 1]]
        , [[0.0, 0.0], [1.0, 0], [0, 1], [1, 1]]
        , [[0.0, 0.0], [1.0, 0], [0, 1], [1, 1]]
        ];
    const VOXEL_FACE_NORMALS =
        [ [[0.0,  1.0, 0], [0,  1.0, 0], [0,  1, 0], [0,  1, 0]]
        , [[1.0,  0, 0], [1,  0, 0], [1,  0, 0], [1,  0, 0]]
        , [[0,  0, 1.0], [0,  0, 1.0], [0,  0, 1], [0,  0, 1]]
        , [[0, -1.0, 0], [0, -1.0, 0], [0, -1, 0], [0, -1, 0]]
        , [[-1.0, 0, 0], [-1.0, 0, 0], [-1, 0, 0], [-1, 0, 0]]
        , [[0,  0,-1.0], [0,  0,-1.0], [0,  0,-1], [0,  0,-1]]
        ];
    const VOXEL_FACE_INDICES_16 =
        [ [4*3+0, 4*3+1, 4*3+2, 4*3+1, 4*3+3, 4*3+2] // Bottom
        , [4*4+0, 4*4+2, 4*4+1, 4*4+1, 4*4+2, 4*4+3] // Back
        , [4*5+0, 4*5+2, 4*5+1, 4*5+1, 4*5+2, 4*5+3] // Left
        , [4*0+0, 4*0+2, 4*0+1, 4*0+1, 4*0+2, 4*0+3] // Top
        , [4*1+0, 4*1+1, 4*1+2, 4*1+1, 4*1+3, 4*1+2] // Front
        , [4*2+0, 4*2+1, 4*2+2, 4*2+1, 4*2+3, 4*2+2] // Right
        ];

    const vertices = [];
    const indices  = [];

    // build interleaved vertex data
    for (let face = 0; face < 6; ++face) {
        for (let v = 0; v < 4; v++) {
            const pos = VOXEL_FACE_VERTICES[face][v];
            const uv  = VOXEL_FACE_UV[face][v];
            const nor = VOXEL_FACE_NORMALS[face][v];
            vertices.push(pos[0] - .5, pos[1] - .5, pos[2] - .5, uv[0] * 1.0, uv[1] * 1.0, nor[0] * 1.0, nor[1] * 1.0, nor[2] * 1.0);
        }
    }

    for (let face = 0; face < 6; ++face) {
        indices.push(...VOXEL_FACE_INDICES_16[face]);
    }

    const stride = (3 + 2 + 3) * 4; // 8 floats per vertex

    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    return { vertexBuffer, indexBuffer, stride };
}

// 'textureLocation' is your texture uniform location in the shader
function handleTexture(gl, imageToSet, textureLocation) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageToSet);
    gl.uniform1i(textureLocation, 0);
}

const { mat3, mat4, } = glMatrix;

const projectionMatrix = mat4.create();

let previousSize = {width:1, height:1};

function checkCanvasSize(canvas_node) {
    const {clientWidth, clientHeight} = canvas_node;
    if (clientWidth === previousSize.width && clientHeight === previousSize.height)
        return;

    mat4.perspective(projectionMatrix, Math.PI / 4, clientWidth / clientHeight, 0.1, 100.0);

    previousSize.width = clientWidth;
    previousSize.height = clientHeight;
}
function initShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
        return null;
    }
    return shaderProgram;
}
function loadShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if(gl.getShaderParameter(shader, gl.COMPILE_STATUS))
        return shader; 
    console.error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
}
// Usage example
//const canvas = document.querySelector("#glcanvas");
//const gl = canvas.getContext("webgl");
//checkCanvasSize(canvas);
//const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
//const programInfo = {
//    program: shaderProgram,
//    attribLocations: {
//        vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
//        textureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
//        normal: gl.getAttribLocation(shaderProgram, 'aNormal'),
//    },
//    uniformLocations: {
//        projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
//        modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
//        normalMatrix: gl.getUniformLocation(shaderProgram, 'uNormalMatrix'),
//        uSampler: gl.getUniformLocation(shaderProgram, 'uSampler'),
//    },
//};
// Main render loop
let totalTime   = 0;
let then        = 0;

function handleWithWebGL(gl, canvas_node) {
    const textureFilename = 'yce_small_sq_';

    const vertexShader      = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vsSource);
    gl.compileShader(vertexShader);

    const fragmentShader    = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fsSource);
    gl.compileShader(fragmentShader);

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    gl.useProgram(shaderProgram);

    const { vertexBuffer, indexBuffer, stride } = buildVoxelBuffers(gl);

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    {
        const positionAttributeLocation = gl.getAttribLocation(shaderProgram, "aVertexPosition");
        gl.enableVertexAttribArray(positionAttributeLocation);
        gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, stride, 0);
        const textureCoordAttributeLocation = gl.getAttribLocation(shaderProgram, "aTextureCoord");
        gl.enableVertexAttribArray(textureCoordAttributeLocation);
        gl.vertexAttribPointer(textureCoordAttributeLocation, 2, gl.FLOAT, false, stride, 12);
        const nLoc = gl.getAttribLocation(shaderProgram, "aNormal"); // if your shader uses normals
        gl.enableVertexAttribArray(nLoc);
        gl.vertexAttribPointer(nLoc, 3, gl.FLOAT, false, stride, 20);
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

    const   uSampler    = gl.getUniformLocation(shaderProgram, 'uSampler');
    let     jsImages    = [null, null, null, null, null, null];
    for (let iFace = 0; iFace < 6; ++iFace) {
        jsImages[iFace] = new Image();
        //jsImages[iFace].crossOrigin = 'anonymous'; // Uncomment if you need cross-origin support
        jsImages[iFace].src = textureFilename + iFace.toString() + '.png';
	}

    // After loading each jsImages[i], create textures:
    let textures = [];
    for (let iFace = 0; iFace < 6; iFace++) {
        let tex = gl.createTexture();
        tex.image = jsImages[iFace];
        jsImages[iFace].onload = () => {
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tex.image);
        };
        textures.push(tex);
    }

    const uModelViewMatrix  = gl.getUniformLocation(shaderProgram, 'uModelViewMatrix');
    const uProjectionMatrix = gl.getUniformLocation(shaderProgram, 'uProjectionMatrix');
    const uNormalMatrix = gl.getUniformLocation(shaderProgram, 'uNormalMatrix');
	const uTimeTotal = gl.getUniformLocation(shaderProgram, 'uTimeTotal');

    const modelMatrix = mat4.create();
    const viewMatrix = mat4.create();
    const modelViewMatrix = mat4.create();
    const normalMatrix = mat3.create();

    checkCanvasSize(canvas_node);

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS); // Reverse depth test

    function render(now) {
        checkCanvasSize(canvas_node);

        now *= 0.001;  // convert to seconds
        const deltaTime = now - then;
        then = now;

        totalTime += deltaTime; // Accumulate total time
        const rotationSpeed = 0.5;
        const angle = totalTime * rotationSpeed; // Calculate rotation angle based on total time

        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        mat4.identity(modelMatrix);
        // build model transforms here if needed
        mat4.identity(viewMatrix);
        mat4.translate(viewMatrix, viewMatrix, [0.0, 0.0, -3.0]);
        mat4.rotate(viewMatrix, viewMatrix, angle, [-1.0, 1.0, -1.0]);
        mat4.multiply(modelViewMatrix, viewMatrix, modelMatrix);
        mat3.normalFromMat4(normalMatrix, modelViewMatrix);

        gl.uniformMatrix4fv(uModelViewMatrix, false, modelViewMatrix);
        gl.uniformMatrix4fv(uProjectionMatrix, false, projectionMatrix);
        gl.uniformMatrix3fv(uNormalMatrix, false, normalMatrix);
		gl.uniform1f(uTimeTotal, totalTime); // Pass total time to shader if needed

        for (let face = 0; face < 6; ++face) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, textures[face]);
            gl.uniform1i(uSampler, 0);
            gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, face * 6 * 2);
        }
        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
    return 1;
}
function initLogo() {
    const canvas_element_id = 'webgl-canvas';
    const canvas_node   = document.getElementById(canvas_element_id);
    const gl            = canvas_node.getContext('webgl');
    document.getElementById(canvas_element_id).hidden = !(document.getElementById("no-webgl-canvas").hidden = !!gl);
    return gl ? handleWithWebGL(gl, canvas_node) : 0;
}