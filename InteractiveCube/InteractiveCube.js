"use strict";

var ctm;

var switch_direction = 1; // 1)

var canvas;
var gl;

var numVertices  = 36;

var numChecks = 8;

var program_gouraud;
var program_phong;

var ambientProduct;
var diffuseProduct;
var specularProduct;

var ambientProductLoc;
var diffuseProductLoc;
var specularProductLoc;

var c;

var modelViewMatrix, projectionMatrix; // 4
var modelViewMatrixLoc, projectionMatrixLoc; // 4

var scaleVector = [1.0,1.0,1.0]; // 3)
var translateVector = [0.0, 0.0, 0.0]; // 3)

var near = 0.3; // 4
var far = 5.0; // 4

var  fovy = 45.0;  // 5 
var  aspect = 1.0; // 5

var flag = true;

var pointsArray = [];
//var colorsArray = []; // 6
var normalsArray = []; // 6

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

/* var vertexColors = [
    vec4( 0.0, 0.0, 0.0, 1.0 ),  // black
    vec4( 1.0, 0.0, 0.0, 1.0 ),  // red
    vec4( 1.0, 1.0, 0.0, 1.0 ),  // yellow
    vec4( 0.0, 1.0, 0.0, 1.0 ),  // green
    vec4( 0.0, 0.0, 1.0, 1.0 ),  // blue
    vec4( 1.0, 0.0, 1.0, 1.0 ),  // magenta
    vec4( 0.0, 1.0, 1.0, 1.0 ),  // white
    vec4( 0.0, 1.0, 1.0, 1.0 )   // cyan
]; */ // 6

var lightPosition = vec4(1.0, 1.0, 1.0, 0.0 ); // 6
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 ); // 6
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 ); // 6
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 ); // 6
var materialAmbient = vec4( 1.0, 0.0, 1.0, 1.0 ); // 6
var materialDiffuse = vec4( 0.0, 1.0, 1.0, 1.0); // 6
var materialSpecular = vec4( 0.0, 1.0, 1.0, 1.0 ); // 6
var materialShininess = 100.0;

var lightPositionLoc;
var shininessLoc;

var isOrtho = false; // 5
var left = -1.0; // 4
var right = 1.0; // 4
var ytop = 1.0; // 4
var bottom = -1.0; // 4

var eye = vec3(0.0, 0.0, 3.0);  // 4
const at = vec3(0.0, 0.0, 0.0); // 4
const up = vec3(0.0, 1.0, 0.0); // 4

var phong = false;

var xAxis = 0;
var yAxis = 1;
var zAxis = 2;
var axis = xAxis;

var theta = [45.0, 45.0, 45.0];
var thetaLoc;

function quad(a, b, c, d) {
     var t1 = subtract(vertices[b], vertices[a]); // 6
     var t2 = subtract(vertices[c], vertices[b]); // 6
     var normal = cross(t1, t2); // 6
     var normal = vec3(normal); // 6
    
     pointsArray.push(vertices[a]);
     //colorsArray.push(vertexColors[a]); // 6
     normalsArray.push(normal); // 6

     pointsArray.push(vertices[b]);
     //colorsArray.push(vertexColors[a]); // 6
     normalsArray.push(normal); // 6

     pointsArray.push(vertices[c]);
     //colorsArray.push(vertexColors[a]); // 6
     normalsArray.push(normal); // 6

     pointsArray.push(vertices[a]);
     //colorsArray.push(vertexColors[a]); // 6
     normalsArray.push(normal); // 6

     pointsArray.push(vertices[c]);
     //colorsArray.push(vertexColors[a]); // 6
     normalsArray.push(normal); // 6

     pointsArray.push(vertices[d]);
     //colorsArray.push(vertexColors[a]); // 6
     normalsArray.push(normal); // 6
}

function colorCube()
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
    //program = initShaders( gl, "vertex-shader", "fragment-shader" );
    program_phong = initShaders(gl, "vertex-shader-phong", "fragment-shader-phong");
    program_gouraud = initShaders(gl, "vertex-shader-gouraud", "fragment-shader-gouraud");
    //gl.useProgram( program );

    colorCube();

    //var cBuffer = gl.createBuffer(); // 6
    var nBuffer = gl.createBuffer(); // 6
    //gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer ); // 6
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer ); // 6
    //gl.bufferData( gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW ); // 6
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW ); // 6

    //var vColor = gl.getAttribLocation( program, "vColor" ); // 6
    //var vNormal = gl.getAttribLocation( program, "vNormal" ); // 6
    var vNormal = gl.getAttribLocation( program_phong, "vNormal" );
    gl.vertexAttribPointer( vNormal, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal );
    
    var vNormal = gl.getAttribLocation( program_gouraud, "vNormal" );
    gl.vertexAttribPointer( vNormal, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal );
    //gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 ); // 6
    gl.vertexAttribPointer( vNormal, 3, gl.FLOAT, false, 0, 0 ); // 6
    //gl.enableVertexAttribArray( vColor ); // 6
    gl.enableVertexAttribArray( vNormal ); // 6

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW );

    //var vPosition = gl.getAttribLocation( program, "vPosition" );
    var vPosition = gl.getAttribLocation( program_phong, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
    
    var vPosition = gl.getAttribLocation( program_gouraud, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
    
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    //modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    //projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix");

    document.getElementById("ButtonX").onclick = function(){axis = xAxis;};
    document.getElementById("ButtonY").onclick = function(){axis = yAxis;};
    document.getElementById("ButtonZ").onclick = function(){axis = zAxis;};
    document.getElementById("ButtonT").onclick = function(){flag = !flag;};
    document.getElementById("ButtonS").onclick = function(){switch_direction = - switch_direction;}; // 1)
    document.getElementById("scalingSlider").oninput = function(){
        scaleVector = [event.target.value, event.target.value, event.target.value]; // 3)
    }  
    document.getElementById("translationXSlider").oninput = function(){
        translateVector[xAxis] = event.target.value;
    } // 3
    document.getElementById("translationYSlider").oninput = function(){
        translateVector[yAxis] = event.target.value;
    } // 3
    document.getElementById("translationZSlider").oninput = function(){
        translateVector[zAxis] = event.target.value;
    } // 3
     document.getElementById("changeButton").onclick = function(event) {
        if (isOrtho) {
            document.getElementById("currentProjection").innerHTML = "(current: perspective)";
            isOrtho = false;
        } else {
            document.getElementById("currentProjection").innerHTML = "(current: parallel)";
            isOrtho = true;
        }
    }; // 5
    
     document.getElementById("nearSlider").oninput = function(){ // 5
        near = event.target.value;
    }
    
    document.getElementById("farSlider").oninput = function(){ // 5 
        far = event.target.value;
    }
    
    document.getElementById("lightButton").onclick = function(){ phong = !phong };
    
    // INIZIO 6
    
    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);
    
    //gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"), flatten(ambientProduct));
    //gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"), flatten(diffuseProduct) );
    //gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), flatten(specularProduct) );
    //gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(lightPosition) );

    //gl.uniform1f(gl.getUniformLocation(program, "shininess"),materialShininess);
    
    // FINE 6
    
    
    render();
}


var render = function() {
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    if(flag) theta[axis] += 2.0 * switch_direction; // 2)
    
     if (isOrtho) {
        projectionMatrix = ortho(left, right, bottom, ytop, near, far); // 4
    } else {
        projectionMatrix = perspective(fovy, aspect, near, far); // 5
    }
    
    if (phong) {
        gl.useProgram( program_phong );
        
        modelViewMatrixLoc = gl.getUniformLocation( program_phong, "modelViewMatrix" );
        projectionMatrixLoc = gl.getUniformLocation( program_phong, "projectionMatrix" );
        
        ambientProductLoc = gl.getUniformLocation( program_phong, "ambientProduct" );
        diffuseProductLoc = gl.getUniformLocation( program_phong, "diffuseProduct" );
        specularProductLoc = gl.getUniformLocation( program_phong, "specularProduct" );
        
        lightPositionLoc = gl.getUniformLocation(program_phong, "lightPosition");
        
        shininessLoc = gl.getUniformLocation(program_phong, "shininess")
    } else {
        gl.useProgram( program_gouraud );
        
        modelViewMatrixLoc = gl.getUniformLocation( program_gouraud, "modelViewMatrix" );
        projectionMatrixLoc = gl.getUniformLocation( program_gouraud, "projectionMatrix" );
        
        ambientProductLoc = gl.getUniformLocation( program_gouraud, "ambientProduct" );
        diffuseProductLoc = gl.getUniformLocation( program_gouraud, "diffuseProduct" );
        specularProductLoc = gl.getUniformLocation( program_gouraud, "specularProduct" );
        
        lightPositionLoc = gl.getUniformLocation(program_gouraud, "lightPosition");
        
        shininessLoc = gl.getUniformLocation(program_gouraud, "shininess")
    }
    
    ctm = lookAt(eye, at , up);
    
    ctm = mult(ctm,translate(translateVector)); // 3)
    
    ctm = mult(ctm,scalem(scaleVector)); //   3)
    
    ctm = mult(ctm,rotateZ(-theta[zAxis])); // 2)
    ctm = mult(ctm,rotateY(-theta[yAxis])); //  2)
    ctm = mult(ctm,rotateX(-theta[xAxis])); //  2)
    
    //gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(ctm)); // 2)
    //gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten(projectionMatrix)); // 4)
    // gl.uniform3fv(thetaLoc, theta); // 2)
    
    gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten(ctm) );
    gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten(projectionMatrix) );
    gl.uniform4fv(ambientProductLoc, flatten(ambientProduct));
    gl.uniform4fv(diffuseProductLoc, flatten(diffuseProduct));
    gl.uniform4fv(specularProductLoc, flatten(specularProduct));
    gl.uniform4fv(lightPositionLoc, flatten(lightPosition) );
    gl.uniform1f(shininessLoc, materialShininess);
    
    gl.drawArrays( gl.TRIANGLES, 0, numVertices );
    requestAnimFrame(render);
}
