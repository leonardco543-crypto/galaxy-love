const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let currentScene = 0;
const scenes = [
  { name: "Explosion", duration: 180 },
  { name: "Next Part", duration: 300 }
];

let sceneTimer = 0;
let hasTransitioned = false;
let explosion = 0;

// 🎵 AUDIO VISUALIZATION
let audioContext;
let analyser;
let dataArray;
let isAudioInitialized = false;

function initAudio() {
  if(isAudioInitialized) return;
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;
  dataArray = new Uint8Array(analyser.frequencyBinCount);
  
  // Connect microphone or play audio
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
      const source = audioContext.createMediaStreamAudioSource(stream);
      source.connect(analyser);
      isAudioInitialized = true;
    })
    .catch(() => console.log("Audio permission denied"));
}

// 📱 GYROSCOPE
let gyroX = 0, gyroY = 0;
if(window.DeviceOrientationEvent) {
  window.addEventListener("deviceorientation", (event) => {
    gyroX = event.beta / 90;
    gyroY = event.gamma / 90;
  });
}

// ✨ NAME GENERATOR
function generateName() {
  const name = prompt("What's your name? (or leave blank)");
  return name || "You";
}
let yourName = generateName();

// 💫 CLICK-TO-EXPLODE PARTICLES
let explodingStars = [];

window.addEventListener("click", (e) => {
  explosion = 1;
  sceneTimer = scenes[currentScene].duration;
  hasTransitioned = false;
  
  // Create explosion particles at click location
  for(let i = 0; i < 30; i++) {
    explodingStars.push({
      x: e.clientX - canvas.width/2,
      y: e.clientY - canvas.height/2,
      vx: (Math.random() - 0.5) * 15,
      vy: (Math.random() - 0.5) * 15,
      life: 1,
      size: Math.random() * 3 + 2
    });
  }
  
  initAudio();
});

function resize(){
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

// 🌟 STARS
let stars = [];
for(let i = 0; i < 500; i++){
  stars.push({
    x: Math.random() * 800 - 400,
    y: Math.random() * 800 - 400,
    z: Math.random() * 800,
    size: Math.random() * 2
  });
}

// ❤️ HEARTS
let hearts = [];
setInterval(() => {
  hearts.push({
    x: Math.random() * 800 - 400,
    y: Math.random() * 800 - 400,
    z: Math.random() * 600,
    life: 1
  });
  if(hearts.length > 120) hearts.shift();
}, 120);

// 🌈 PERLIN NOISE (Simple Nebula)
function perlin(x, y, z) {
  let n = Math.sin(x * 12.9898 + y * 78.233 + z * 43758.5453) * 43758.5453;
  return n - Math.floor(n);
}

function nebula(x, y) {
  let nx = x / 100;
  let ny = y / 100;
  let value = perlin(nx, ny, currentScene) * 0.5 + perlin(nx * 2, ny * 2, currentScene) * 0.25;
  return value;
}

let rotX = 0, rotY = 0, targetX = 0, targetY = 0;
let zoomLevel = 1;

window.addEventListener("mousemove", (e) => {
  targetY = (e.clientX - window.innerWidth/2) * 0.002;
  targetX = (e.clientY - window.innerHeight/2) * 0.002;
});

function rotate(x, y, z){
  let cx = Math.cos(rotX), sx = Math.sin(rotX);
  let cy = Math.cos(rotY), sy = Math.sin(rotY);
  
  let dy = y * cx - z * sx;
  let dz = y * sx + z * cx;
  let dx = x;
  
  let rx = dx * cy - dz * sy;
  let rz = dx * sy + dz * cy;
  
  return {x: rx, y: dy, z: rz};
}

// 🕳️ BLACK HOLE ZOOM
function updateZoom() {
  if(currentScene === 1) {
    zoomLevel += (2 - zoomLevel) * 0.01;
  } else {
    zoomLevel += (1 - zoomLevel) * 0.05;
  }
}

function draw(){
  requestAnimationFrame(draw);
  
  // Update logic
  if(sceneTimer > 0) sceneTimer--;
  explosion *= 0.92;
  if(explosion < 0.01) explosion = 0;
  
  // Scene transition
  if(sceneTimer === 0 && explosion === 0 && !hasTransitioned){
    hasTransitioned = true;
    currentScene = (currentScene + 1) % scenes.length;
  }
  
  updateZoom();
  
  // Get audio data for beat visualization
  let beatIntensity = 0;
  if(isAudioInitialized && analyser) {
    analyser.getByteFrequencyData(dataArray);
    beatIntensity = dataArray.reduce((a, b) => a + b) / dataArray.length / 255;
  }
  
  // Gyro influence on rotation
  rotX += (targetX + gyroX * 0.5 - rotX) * 0.05;
  rotY += (targetY + gyroY * 0.5 - rotY) * 0.05;
  
  // Clear with motion blur
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // 🌌 NEBULA BACKGROUND
  for(let i = 0; i < 50; i++) {
    for(let j = 0; j < 50; j++) {
      let nx = (i - 25) * 40 + beatIntensity * 20;
      let ny = (j - 25) * 40 + beatIntensity * 20;
      let nebulaVal = nebula(nx, ny);
      
      if(currentScene === 0) {
        ctx.fillStyle = `rgba(${200 + nebulaVal * 55}, ${50}, ${100 + nebulaVal * 155}, ${nebulaVal * 0.15})`;
      } else {
        ctx.fillStyle = `rgba(${50}, ${100 + nebulaVal * 155}, ${200 + nebulaVal * 55}, ${nebulaVal * 0.15})`;
      }
      ctx.fillRect(i * 40, j * 40, 40, 40);
    }
  }
  
  // Draw stars with zoom
  for(let s of stars){
    let r = rotate(s.x, s.y, s.z);
    let scale = 600 / (600 + r.z * zoomLevel);
    let x = canvas.width/2 + r.x * scale * zoomLevel;
    let y = canvas.height/2 + r.y * scale * zoomLevel;
    
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(x, y, s.size * scale, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // 💥 EXPLODING STARS (Click particles)
  for(let i = explodingStars.length - 1; i >= 0; i--) {
    let p = explodingStars[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.1;
    p.life -= 0.02;
    
    if(p.life <= 0) {
      explodingStars.splice(i, 1);
      continue;
    }
    
    ctx.fillStyle = `rgba(255,200,100,${p.life * 0.8})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // ❤️ HEARTS
  for(let h of hearts){
    let r = rotate(h.x, h.y, h.z);
    let scale = 600 / (600 + r.z);
    let x = canvas.width/2 + r.x * scale;
    let y = canvas.height/2 + r.y * scale;
    
    ctx.fillStyle = `rgba(255,80,120,${h.life})`;
    ctx.font = `${14*scale}px Arial`;
    ctx.fillText("❤", x, y);
    h.life -= 0.01;
  }
  hearts = hearts.filter(h => h.life > 0);
  
  // Explosion flash
  if(explosion > 0){
    ctx.fillStyle = `rgba(255,255,255,${explosion * 0.15})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  
  // 🕳️ BLACK HOLE CENTER (Scene 1)
  if(currentScene === 1) {
    let blackHoleRadius = 50 * zoomLevel;
    let gradient = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, blackHoleRadius);
    gradient.addColorStop(0, "rgba(0,0,0,0.8)");
    gradient.addColorStop(1, "rgba(100,0,150,0.3)");
    ctx.fillStyle = gradient;
    ctx.fillRect(canvas.width/2 - blackHoleRadius, canvas.height/2 - blackHoleRadius, blackHoleRadius * 2, blackHoleRadius * 2);
    
    // Glow ring
    ctx.strokeStyle = `rgba(150,50,200,${0.5 + beatIntensity * 0.5})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(canvas.width/2, canvas.height/2, blackHoleRadius + 10, 0, Math.PI * 2);
    ctx.stroke();
  }
  
  // Scene display + Name
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText(`Scene: ${scenes[currentScene].name}`, 20, 30);
  
  // ✨ Your name in the stars
  ctx.fillStyle = `rgba(255,200,100,${0.5 + Math.sin(Date.now() / 500) * 0.3})`;
  ctx.font = "bold 40px Arial";
  ctx.textAlign = "center";
  ctx.fillText(`${yourName}`, canvas.width/2, canvas.height - 40);
  ctx.textAlign = "left";
  
  // Beat indicator
  if(isAudioInitialized) {
    ctx.fillStyle = `rgba(255,200,100,${beatIntensity})`;
    ctx.fillRect(canvas.width - 30, 20, 20 * beatIntensity, 20);
  }
}

draw();
