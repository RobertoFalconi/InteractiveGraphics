"use strict";

var canvas;
var gl;
var program;

var texSize = 256;
var numChecks = 8;

var texture1, texture2;
var t1, t2;
var c;

var projectionMatrix;
var modelViewMatrix;

var translateBody = 0;
var rotateTail = 0;
var rotateTailValue = 5.0;
var rotateLeg = 0;
var rotateLegValue = 1.0;
var rotateLeg2 = 0;
var rotateLegValue2 = -1.0;
var rotateLowerLeg = 0;
var rotateLowerLeg2 = 0;
var rotateLowerLegValue = 2.0;
var rotateLowerLegValue2 = 2.0;
var rotateLegs = [0, 0, 0, 0];
var animate = false;

var instanceMatrix;

var modelViewMatrixLoc;

var image1 = new Uint8Array(4*texSize*texSize);

    for ( var i = 0; i < texSize; i++ ) {
        for ( var j = 0; j <texSize; j++ ) {
            var patchx = Math.floor(i/(texSize/numChecks));
            var patchy = Math.floor(j/(texSize/numChecks));
            if(patchx%2 ^ patchy%2) c = 255;
            else c = 0;
            //c = 255*(((i & 0x8) == 0) ^ ((j & 0x8)  == 0))
            image1[4*i*texSize+4*j] = c;
            image1[4*i*texSize+4*j+1] = c;
            image1[4*i*texSize+4*j+2] = c;
            image1[4*i*texSize+4*j+3] = 255;
        }
    }

var image2 = new Uint8Array(4*texSize*texSize);

    // Create a checkerboard pattern
    for ( var i = 0; i < texSize; i++ ) {
        for ( var j = 0; j <texSize; j++ ) {
            image2[4*i*texSize+4*j] = -i;
            image2[4*i*texSize+4*j+1] = -i;
            image2[4*i*texSize+4*j+2] = -i;
            image2[4*i*texSize+4*j+3] = 255;
        }
    }

var vertices = [

    vec4( -0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5,  0.5,  0.5, 1.0 ),
    vec4( 0.5,  0.5,  0.5, 1.0 ),
    vec4( 0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5, -0.5, -0.5, 1.0 ),
    vec4( -0.5,  0.5, -0.5, 1.0 ),
    vec4( 0.5,  0.5, -0.5, 1.0 ),
    vec4( 0.5, -0.5, -0.5, 1.0 )
];


var torsoId = 0;
var headId  = 1;
var leftUpperArmId = 2;
var leftLowerArmId = 3;
var rightUpperArmId = 4;
var rightLowerArmId = 5;
var leftUpperLegId = 6;
var leftLowerLegId = 7;
var rightUpperLegId = 8;
var rightLowerLegId = 9;
var tailId = 10;


var torsoHeight = 4.0;
var torsoWidth = 1.6;
var upperArmHeight = 1.5;
var lowerArmHeight = 1.0;
var upperArmWidth  = 0.5;
var lowerArmWidth  = 0.5;
var upperLegWidth  = 0.5;
var lowerLegWidth  = 0.5;
var lowerLegHeight = 1.0;
var upperLegHeight = 1.5;
var headHeight = 1.5;
var headWidth = 1.35;
var tailHeight = 2.0;
var tailWidth = 0.5;

var numNodes = 11;
var numAngles = 12;
var angle = 0;

var theta = [90, 0, 90, 0, 90, 0, 90, 0, 90, 0, -45];

var numVertices = 24;

var stack = [];

var figure = [];

for( var i=0; i<numNodes; i++) figure[i] = createNode(null, null, null, null);

var vBuffer;
var modelViewLoc;

var pointsArray = [];
var texCoordsArray = [];

var texCoord = [
    vec2(0, 0),
    vec2(0, 1),
    vec2(1, 1),
    vec2(1, 0)
];

//-------------------------------------------

function scale4(a, b, c) {
   var result = mat4();
   result[0][0] = a;
   result[1][1] = b;
   result[2][2] = c;
   return result;
}

//--------------------------------------------

function configureTexture() {
    texture1 = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, texture1 );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, image1);
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
                      gl.NEAREST_MIPMAP_LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    texture2 = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, texture2 );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, image2);
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
                      gl.NEAREST_MIPMAP_LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
}

function createNode(transform, render, sibling, child){
    var node = {
        transform: transform,
        render: render,
        sibling: sibling,
        child: child
    }
    return node;
}


function initNodes(Id) {

    var m = mat4();

    switch(Id) {

        case torsoId:
            m = rotate(theta[torsoId], 0, 1, 0 );
            m = mult(m, rotate(theta[torsoId], 1, 0, 0 ));
            m = mult(m, translate(1, -4+translateBody, 0, 0));
            m = mult(m, translate(1, 0, 2, 0));
            figure[torsoId] = createNode( m, torso, null, headId );
        break;

        case headId:
            m = translate(0.0, torsoHeight+0.5*headHeight, -0.5*headHeight);
            m = mult(m, translate(0.0, -0.5*headHeight, 0.0));
            m = mult(m, rotate(theta[headId], 0, 0, 1));
            figure[headId] = createNode( m, head, leftUpperArmId, null);
        break;


        case leftUpperArmId:
            m = translate(-0.5*(torsoWidth+upperArmWidth), 0.9*torsoHeight, 0.0);
            m = mult(m, rotate(theta[leftUpperArmId], 1, 0, 0));
            m = mult(m, rotate(rotateLegs[0], 1, 0, 0));
            figure[leftUpperArmId] = createNode( m, leftUpperArm, rightUpperArmId, leftLowerArmId );
        break;

        case rightUpperArmId:
            m = translate(0.5*(torsoWidth+upperArmWidth), 0.9*torsoHeight, 0.0);
            m = mult(m, rotate(theta[rightUpperArmId], 1, 0, 0));
            m = mult(m, rotate(rotateLegs[1], 1, 0, 0));
            figure[rightUpperArmId] = createNode( m, rightUpperArm, leftUpperLegId, rightLowerArmId );
        break;

        case leftUpperLegId:
            m = translate(-0.5*(torsoWidth+upperLegWidth), 0.1*upperLegHeight, 0.0);
            m = mult(m , rotate(theta[leftUpperLegId], 1, 0, 0));
            m = mult(m, rotate(rotateLegs[1], 1, 0, 0));
            figure[leftUpperLegId] = createNode( m, leftUpperLeg, rightUpperLegId, leftLowerLegId );
        break;

        case rightUpperLegId:
            m = translate(0.5*(torsoWidth+upperLegWidth), 0.1*upperLegHeight, 0.0);
            m = mult(m, rotate(theta[rightUpperLegId], 1, 0, 0));
            m = mult(m, rotate(rotateLegs[0], 1, 0, 0));
            figure[rightUpperLegId] = createNode( m, rightUpperLeg, tailId, rightLowerLegId );
        break;

        case leftLowerArmId:
            m = translate(0.0, upperArmHeight, 0.0);
            m = mult(m, rotate(theta[leftLowerArmId], 1, 0, 0));
            m = mult(m, rotate(rotateLegs[2], 1, 0, 0));
            figure[leftLowerArmId] = createNode( m, leftLowerArm, null, null );
        break;

        case rightLowerArmId:
            m = translate(0.0, upperArmHeight, 0.0);
            m = mult(m, rotate(theta[rightLowerArmId], 1, 0, 0));
            m = mult(m, rotate(rotateLegs[3], 1, 0, 0));
            figure[rightLowerArmId] = createNode( m, rightLowerArm, null, null );
        break;

        case leftLowerLegId:
            m = translate(0.0, upperLegHeight, 0.0);
            m = mult(m, rotate(theta[leftLowerLegId], 1, 0, 0));
            m = mult(m, rotate(rotateLegs[3], 1, 0, 0));
            figure[leftLowerLegId] = createNode( m, leftLowerLeg, null, null );
        break;

        case rightLowerLegId:
            m = translate(0.0, upperLegHeight, 0.0);
            m = mult(m, rotate(theta[rightLowerLegId], 1, 0, 0));
            m = mult(m, rotate(rotateLegs[2], 1, 0, 0));
            figure[rightLowerLegId] = createNode( m, rightLowerLeg, null, null );
        break;
            
        case tailId:
            m = rotate(theta[tailId], 1, 0, 0);
            m = mult(m, rotate(rotateTail, 0, 0, 1))
            m = mult(m, translate(0.0,-torsoHeight+0.5*tailHeight, 0.0));
            m = mult(m, translate(0, 0.5*tailHeight, 0));
            figure[tailId] = createNode( m, tail, null, null );
        break;
    }

}

function traverse(Id) {

   if (Id == null) return;
   stack.push(modelViewMatrix);
   modelViewMatrix = mult(modelViewMatrix, figure[Id].transform);
   figure[Id].render();
   if(figure[Id].child != null) traverse(figure[Id].child);
    modelViewMatrix = stack.pop();
   if(figure[Id].sibling != null) traverse(figure[Id].sibling);
}

function torso() {
    
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5*torsoHeight, 0.0) );
    instanceMatrix = mult(instanceMatrix, scale4( torsoWidth, torsoHeight, torsoWidth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function head() {
    gl.useProgram(program);
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * headHeight, 0.0 ));
	instanceMatrix = mult(instanceMatrix, scale4(headWidth, headHeight, headWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function leftUpperArm() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * upperArmHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(upperArmWidth, upperArmHeight, upperArmWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function leftLowerArm() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * lowerArmHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(lowerArmWidth, lowerArmHeight, lowerArmWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function rightUpperArm() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * upperArmHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(upperArmWidth, upperArmHeight, upperArmWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function rightLowerArm() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * lowerArmHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(lowerArmWidth, lowerArmHeight, lowerArmWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function  leftUpperLeg() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * upperLegHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(upperLegWidth, upperLegHeight, upperLegWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function leftLowerLeg() {

    instanceMatrix = mult(modelViewMatrix, translate( 0.0, 0.5 * lowerLegHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(lowerLegWidth, lowerLegHeight, lowerLegWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function rightUpperLeg() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * upperLegHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(upperLegWidth, upperLegHeight, upperLegWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function rightLowerLeg() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * lowerLegHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(lowerLegWidth, lowerLegHeight, lowerLegWidth) )
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function tail(){
    
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * tailHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(tailWidth, tailHeight, tailWidth) )
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function quad(a, b, c, d) {
     pointsArray.push(vertices[a]);
     texCoordsArray.push(texCoord[0]);
     pointsArray.push(vertices[b]);
     texCoordsArray.push(texCoord[1]);
     pointsArray.push(vertices[c]);
     texCoordsArray.push(texCoord[2]);
     pointsArray.push(vertices[d]);
     texCoordsArray.push(texCoord[3]);
}


function cube()
{
    quad( 1, 0, 3, 2 );
    quad( 2, 3, 7, 6 );
    quad( 3, 0, 4, 7 );
    quad( 6, 5, 1, 2 );
    quad( 4, 5, 6, 7 );
    quad( 5, 4, 0, 1 );
}


window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader");
    gl.useProgram( program )
    
    instanceMatrix = mat4();

    projectionMatrix = ortho(-6.0,6.0,-6.0, 6.0,-10.0,10.0);
    modelViewMatrix = mat4();


    gl.uniformMatrix4fv(gl.getUniformLocation( program, "modelViewMatrix"), false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv( gl.getUniformLocation( program, "projectionMatrix"), false, flatten(projectionMatrix) );

    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix")

    cube();

    vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
    
    var tBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW );
    
    var vTexCoord = gl.getAttribLocation( program, "vTexCoord" );
    gl.vertexAttribPointer( vTexCoord, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vTexCoord );
    
    configureTexture();

    gl.activeTexture( gl.TEXTURE0 );
    gl.bindTexture( gl.TEXTURE_2D, texture1 );
    gl.uniform1i(gl.getUniformLocation( program, "Tex0"), 0);

    gl.activeTexture( gl.TEXTURE1 );
    gl.bindTexture( gl.TEXTURE_2D, texture2 );
    gl.uniform1i(gl.getUniformLocation( program, "Tex1"), 1);
    
    document.getElementById("startAnimation").onclick = function(event) {
        animate = !animate;
        translateBody = 0;
        rotateTail = 0;
        theta[headId] = 0;
        rotateLegs[0] = 0;
        rotateLegs[1] = 0;
        rotateLegs[2] = 0;
        rotateLegs[3] = 0;
        rotateLegValue = 1.0;
        rotateLegValue2 = -1.0;
        rotateLowerLegValue = 2.0;
        rotateLowerLegValue2 = 2.0;
    };

    render();
}

function animation() {
    translateBody += 0.03;
    
    // Head animation
    if (theta[headId] < 90) theta[headId] += 2.0;
    
    // Legs animation
    rotateLegs[0] += rotateLegValue;
    if (rotateLegs[0] > 20){
        rotateLegValue = -rotateLegValue;
    }
    if (rotateLegs[0] < -20){
        rotateLegValue = -rotateLegValue;
    }
    
    rotateLegs[1] += rotateLegValue2;
    if (rotateLegs[1] > 20){
        rotateLegValue2 = -rotateLegValue2;
    }
    if (rotateLegs[1] < -20){
        rotateLegValue2 = -rotateLegValue2;
    }
    
    // Lower legs animation
    if (rotateLegs[0] >= 0 && rotateLegs[0] < 20){
        rotateLegs[2] += rotateLowerLegValue;
        if (rotateLegs[2] >= 40 || rotateLegs[2] <= 0){
            rotateLowerLegValue = -rotateLowerLegValue;
        }
    }
    
    if (rotateLegs[1] >= 0 && rotateLegs[1] < 20){
        rotateLegs[3] += rotateLowerLegValue2;
        if (rotateLegs[3] >= 40 || rotateLegs[3] <= 0){
            rotateLowerLegValue2 = -rotateLowerLegValue2;
        }
    }
    
    // Tail animation
    rotateTail += rotateTailValue;
    if (rotateTail > 45){
        rotateTailValue = -rotateTailValue;
    }
    if (rotateTail < -45){
        rotateTailValue = -rotateTailValue;
    }
}


var render = function() {

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    for(i=0; i<numNodes; i++) initNodes(i);
    if (animate) animation();
    traverse(torsoId);
    requestAnimFrame(render);
}
