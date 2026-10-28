/* Água de Elarion: profundidade e espuma costeira pré-calculadas, ondas leves no shader.
   Uma malha e uma textura pequena por região; sem reflexão em segunda câmera. */
(() => {
  const Water = {};
  Water.make = (B, size, level, world) => {
    const terrainSize = world ? world.size : size;
    const N = 128, bytes = new Uint8Array(N * N * 4);
    for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) {
      const wx = ((x + .5) / N - .5) * terrainSize, wz = ((z + .5) / N - .5) * terrainSize;
      const height = world ? (world.terrainAt ? world.terrainAt(wx, wz) : world.height(wx, wz)) : level - 6;
      const depth = Math.max(0, Math.min(16, level - height));
      const i = (z * N + x) * 4;
      bytes[i] = Math.round(depth / 16 * 255); bytes[i + 1] = bytes[i]; bytes[i + 2] = bytes[i]; bytes[i + 3] = 255;
    }
    const depthMap = new THREE.DataTexture(bytes, N, N, THREE.RGBAFormat);
    depthMap.magFilter = depthMap.minFilter = THREE.LinearFilter; depthMap.needsUpdate = true;
    const uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
      t: { value: 0 }, night: { value: B.night ? 1 : 0 }, depthMap: { value: depthMap },
      terrainSize: { value: terrainSize }, c1: { value: new THREE.Color(B.water || '#327e9a') },
      c2: { value: new THREE.Color('#77d1cc') }, sky: { value: new THREE.Color((B.sky || ['#7797ba'])[0]) },
    }]);
    const material = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, fog: true, uniforms,
      vertexShader: `uniform float t; varying vec3 vWater; varying vec3 vView;
        #include <fog_pars_vertex>
        void main(){ vec3 p=position; vec4 origin=modelMatrix*vec4(p,1.0);
          p.z+=sin(origin.x*.32+t*1.2)*.035+sin(origin.z*.27-t*.9)*.025;
          vec4 wp=modelMatrix*vec4(p,1.0); vWater=wp.xyz; vView=cameraPosition-wp.xyz;
          vec4 mvPosition=viewMatrix*wp; gl_Position=projectionMatrix*mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: `uniform float t; uniform float night; uniform float terrainSize;
        uniform sampler2D depthMap; uniform vec3 c1; uniform vec3 c2; uniform vec3 sky;
        varying vec3 vWater; varying vec3 vView;
        #include <fog_pars_fragment>
        void main(){ vec2 p=vWater.xz; vec2 uv=clamp(p/terrainSize+.5,vec2(.001),vec2(.999));
          float depth=texture2D(depthMap,uv).r*16.0;
          float waves=sin(p.x*.66+t*1.45)*sin(p.y*.52-t*1.1);
          vec3 normal=normalize(vec3(-cos(p.x*.32+t*1.2)*.045,1.0,-cos(p.y*.27-t*.9)*.035));
          vec3 view=normalize(vView); float fresnel=pow(1.0-clamp(dot(normal,view),0.0,1.0),2.0);
          vec3 shallow=mix(c2,c1,.35); vec3 water=mix(shallow,c1,smoothstep(.1,7.0,depth));
          water*=.94+waves*.045; water=mix(water,sky*.72+vec3(.13,.18,.20),fresnel*.48);
          float shore=1.0-smoothstep(.08,1.3,depth);
          float foam=shore*smoothstep(.12,.84,sin(p.x*1.4+p.y*.85+t*2.1))*.65;
          float sparkle=pow(max(0.0,dot(reflect(normalize(vec3(-.4,-.8,.3)),normal),view)),28.0);
          water=mix(water,vec3(.86,.97,.96),foam); water+=vec3(1.0,.94,.75)*sparkle*.22*(1.0-night*.85);
          water=mix(water,water*vec3(.40,.52,.76),night*.72);
          gl_FragColor=vec4(water,mix(.66,.90,smoothstep(0.0,8.0,depth)));
          #include <fog_fragment>
        }`,
    });
    const segments = E.state && E.state.settings.quality === 'alto' ? 28 : 14;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size, segments, segments), material);
    mesh.rotation.x = -Math.PI / 2; mesh.position.y = level;
    mesh.name = 'water-surface'; mesh.renderOrder = 1; mesh.userData.depthTexture = depthMap;
    return mesh;
  };
  Water.setNight = (surface, amount) => { if (surface && surface.material.uniforms.night) surface.material.uniforms.night.value = Math.max(0, Math.min(1, amount)); };
  E.Water = Water;
})();
