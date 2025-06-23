# 🌿 Grass Shader using GLSL in React Three Fiber

Instanced grass rendering system using **React Three Fiber**, custom GLSL shaders, and procedural geometry. It supports over 400,000 grass blades animated by **Perlin Noise** as wind, with tip-to-base color gradients.


https://github.com/user-attachments/assets/5091f912-e9ef-40c3-b3b9-d93948778467

---

## ✅ Features

- Renders 400,000+ animated grass blades using `instancedMesh`
- Custom grass blade geometry with adjustable segment count
- Custom vertex and fragment shaders for animation and coloring
- Real-time tip and base color customization via Leva UI
- Smooth wind animation and subtle blade bending
- Full control of lighting and normals for realistic shading

---

## 🌱 Blade Geometry

Each grass blade is constructed procedurally inside a `useMemo()` hook.

- **Height**: `1` unit
- **Width**: approximately `0.12` unit (tapered as it rises)
- **Segments**: Usually `7`, but can be reduced to `3` for far-away instances
- **Taper**: Each segment's top vertices move closer together to simulate a natural blade shape
- **Final tip**: A triangle connects both top vertices to the center tip

The geometry is manually generated using triangles (2 per rectangular segment), and one final triangle for the blade tip. Normals are computed using `computeVertexNormals()` for accurate lighting.

<img width="1280" alt="Screenshot 2025-06-17 at 10 29 57 PM" src="https://github.com/user-attachments/assets/e8f2ef93-d4a2-4461-9ede-4179e54c35ca" />

```jsx
// Grass blade geometry
  const grassGeometry = useMemo(() => {
    const segments = 7;


    const taper = 0.005;
    const positions = [];

    for (let i = 0; i < segments - 1; i++) {
      const y0 = (i / segments) * height;
      const y1 = ((i + 1) / segments) * height;

      positions.push(
        -halfWidth + taper * i, y0, 0,  // bottom left
        halfWidth - taper * i, y0, 0, // bottom right
        -halfWidth + taper * (i + 1), y1, 0, // top left

        -halfWidth + taper * (i + 1), y1, 0, // top left
        halfWidth - taper * i, y0, 0, // bottom right
        halfWidth - taper * (i + 1), y1, 0 // top right
      );
    }

    // top traingle
    positions.push(
      -halfWidth + taper * (segments - 1), ((segments - 1) / segments) * height, 0,
      halfWidth - taper * (segments - 1), ((segments - 1) / segments) * height, 0,
      0, height, 0
    );

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(positions), 3));
    // create normals
    geo.computeVertexNormals();
    return geo;
  }, []);
```

---

## 🌾 Instancing

Grass blades are rendered using `instancedMesh` in React Three Fiber. This drastically reduces the draw calls and enables rendering hundreds of thousands of blades efficiently.

Each instance:
- Is randomly positioned within a 2D grid
- Receives a random Y-axis rotation
- Gets its transformation matrix baked into the instanced mesh using `setMatrixAt`

<img width="1280" alt="Screenshot 2025-06-17 at 10 49 58 PM" src="https://github.com/user-attachments/assets/c8002c07-2dc9-420a-b730-bd7c601bc676" />

```jsx
const dummy = new THREE.Object3D();
  let index = 0;

  for (let i = 0; i < COUNT; i++) {
    const x = (2 * Math.random() - 1) * GRASSLENGTH/2;
    const z = (2 * Math.random() - 1) * GRASSWIDTH/2;
    dummy.position.set(x, 0, z);

    dummy.rotation.y = Math.random() * Math.PI * 2;
    dummy.updateMatrix();

    instanceRef.current.setMatrixAt(index++, dummy.matrix);
  }

```
---

## 🎨 Shaders

## Vertex Shader

### Features:
- **Blade bending**: The shader bends each grass blade in its `local Z-direction` (typically forward in the mesh model), and applies a varying curvature starting at a certain height using a `bezier interpolation` for smoother, more natural bending.
  ```glsl
  // Bend direction in local space
  vec3 instanceZ = normalize(vec3(0.0, 0.0, instanceMatrix[0].z));

  float hash = rand(vec2(instanceMatrix[3].x, instanceMatrix[3].z));

  float bendStrength = mix(0.3, 0.6, hash);
  float bendStart = 0.2;
  float t = clamp((pos.y / 2.0 - bendStart) / (1.0 - bendStart), 0.0, 1.0);
  float topBendFactor = bezier(t, 0.1);
  ```
- **Gentle Wind**: Waving effect where each blade sways in the `xz` plane using sin() function.


https://github.com/user-attachments/assets/afabcda2-b187-489e-b0cf-03c7d105d9c7


  ```glsl
  float gentleSway = sin(uTime * uSpeed * 0.8 + hash * 10.0) * 0.1;
  vec3 gentleDir = normalize(vec3(1.0, 0.0, 1.0));
  vec3 gentleOffset = gentleDir * gentleSway * t;
  ```
- **StrongWind**: Strong waves generated using classic perlin noise `cnoise()`.



https://github.com/user-attachments/assets/f1dd00c9-42fb-4ba6-9000-8b28bc32f862



https://github.com/user-attachments/assets/558ce143-09f4-4aa7-b508-8e17b91aff09

  ```glsl
  vec3 worldPos = (instanceMatrix * vec4(pos, 1.0)).xyz;
  float wave = cnoise(worldPos.xz * 0.3 + vec2(uTime * uSpeed * 0.2, 0.0));
  float strongWind = wave * 0.65;
  vec3 strongDir = normalize(vec3(0.0, 0.0, 1.0));
  float y = pos.y;
  vec3 strongOffset = strongDir * strongWind * pow(y, 2.0);
  ```
- **BillBoarding**: Blades try to rotate towards the camera, creating a more lusher scene without any unnecessary instancing of the blades.

```glsl
// Billboard
vec3 camPos = inverse(viewMatrix)[3].xyz;
vec3 bladeWorldPos = instanceMatrix[3].xyz;
vec2 toCamera2D = normalize(camPos.xz - bladeWorldPos.xz);
float angleToCamera = atan(toCamera2D.y, toCamera2D.x);
mat3 billboardRot = rotationY(angleToCamera);
localPosition = billboardRot * localPosition;
```


https://github.com/user-attachments/assets/14950c88-a4f9-4158-841a-542432bff293


- **Normal calculation**: Normals are manually calculated using offset positions to preserve lighting realism even with deformed geometry.

Attributes:
- `position`: The position of each vertex (from the grass blade geometry).
- `normal`: The normal vector of the vertex for lighting.

Uniforms:
- `uTime`: elapsed time, used for wave simulation
- `uSpeed`: controls the wind animation speed
- `uFrequency`: controls wave repetition
- `uBladeHeight`: helps normalize `vElevation`
- `uHalfWidth`: half of blade's width, used to compute gradient across the blade.
- `modelMatrix`, `viewMatrix`, `projectionMatrix`,`instanceMatrix`: Standard matrices to place the grass in world and camera space.

Varyings (to be used by Fragment shader):
- `vElevation`: Y coordinate of `position`
- `vSideGradient`: Gradient (1.0 -> 0.0) across left to right end of the blade
- `vNormal`:Since we've changed the shape of the grass blades (bent them), we can't rely on the original normals. The shader recalculates them using a basic trick:
    - It samples points slightly offset from the current vertex in X and Y.
    - It calculates two vectors from these points.
    - Then it uses a cross product to compute the new normal vector.
<img width="1280" alt="Screenshot 2025-06-17 at 11 03 09 PM" src="https://github.com/user-attachments/assets/1950bae8-2164-48e8-a2de-8763eea01197" />

- `vFakeNormal`: Combining `vNormal` with its inverse through `vSideGradient` to simulate a curved surface.
<img width="1280" alt="Screenshot 2025-06-17 at 11 02 38 PM" src="https://github.com/user-attachments/assets/7b2bc9c3-f232-4f72-9bd3-72d8dd109cac" />

- `vPosition`: where on the grass blade this pixel lies in world space.

## Fragment Shader

### Features:
- **Vertical gradient coloring**: Mixes `uBaseColor` and `uTipColor` based on `vElevation` using `smoothstep` for a soft gradient.
  <img width="1280" alt="Screenshot 2025-06-17 at 11 05 32 PM" src="https://github.com/user-attachments/assets/a7b9c6d0-85b2-454d-b591-600f265d222a" />

  ```glsl
  float gradient = smoothstep(0.2, 1.0, vElevation);
  vec3 finalColor = mix(uBaseColor, uTipColor, gradient);
  ```
- **Lighting**: Uses the `vFakeNormal` to calculate basic Lambertian lighting against a directional light source.
<img width="1280" alt="Screenshot 2025-06-17 at 11 06 34 PM" src="https://github.com/user-attachments/assets/51fa103f-8f87-4afd-9625-e885ddbcf7ba" />



https://github.com/user-attachments/assets/282af595-aca9-4ced-b9e3-d21bd2d976ff


  ```glsl
  vec3 directionalLight(vec3 lightColor,float lightIntensity,vec3 normal,vec3 lightPosition,vec3 viewDirection, float specularPower){

  vec3 lightDirection = normalize(lightPosition);
  vec3 lightReflection = reflect(-lightDirection, normal);

  //Shading
  float shading = dot(normal, lightDirection);
  shading = max(0.0,shading);

  //Specular
  float specular = - dot(lightReflection,viewDirection);
  specular = max(0.0,specular);
  specular = pow(specular,specularPower) * shading;


  return lightColor * lightIntensity * (shading + specular);
  }
  ```

Key uniforms:
- `uBaseColor`: color near the root of the blade
- `uTipColor`: color at the top of the blade

---

