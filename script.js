const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// 🎬 SCENE MANAGEMENT
let currentScene = 0;
const scenes = [
  { name: "Explosion", duration: 180 }, // 3 seconds
  { name: "Next Part", duration: 300 }
];

function resize(){
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

let stars = [];
let hearts = [];

const STAR_COUNT = 500;

// 🌠 CREATE STARS (MILKY WAY STYLE)
function initStars(){
  stars = [];
  for(let i=0;i<STAR_COUNT;i++){
    let angle = Math.random() * Math.PI * 2;
    let radius = Math.random() * 400 + 50;

    stars.push({
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      z: Math.random() * 800,
      size: Math.random() * 2
    });
  }
}
initStars();

// ❤️ HEART PARTICLES
function spawnHeart(){
  hearts.push({
    x: (Math.random() - 0.5) * 800,
    y: (Math.random() - 0.5) * 800,
    z: Math.random() * 600,
    life: 1
  });

  if(hearts.length > 120) hearts.shift();
}

setInterval(spawnHeart, 120);

// 🌀 CAMERA CONTROL
let rotX = 0;
let rotY = 0;

let targetX = 0;
let targetY = 0;

window.addEventListener("mousemove", (e)=>{
  targetY = (e.clientX - innerWidth/2) * 0.002;
  targetX = (e.clientY - innerHeight/2) * 0.002;
});

// 💥 CLICK EXPLOSION & TRANSITION
let explosion = 0;
let sceneTimer = 0;

window.addEventListener("click", ()=>{
  explosion = 1;
  sceneTimer = scenes[currentScene].duration;
  console.log("Click! Starting scene timer:", scenes[currentScene].duration);
});

// decay explosion
function updateExplosion(){
  explosion *= 0.92;
  if(explosion < 0.01) explosion = 0;
}

// Advance to next scene
function updateScene(){
  if(sceneTimer > 0){
    sceneTimer--;
  }
  
  // When timer reaches exactly 0, advance scene
  if(sceneTimer === 0 && explosion === 0){
    currentScene = (currentScene + 1) % scenes.length;
    console.log("✅ Scene advanced to:", scenes[currentScene].name, "Current scene index:", currentScene);
  }
}

// 🧠 ROTATION FUNCTION
function rotate(x,y,z){
  let cx = Math.cos(rotX);
  let sx = Math.sin(rotX);
  let cy = Math.cos(rotY);
  let sy = Math.sin(rotY);

  let dy = y * cx - z * sx;
  let dz = y * sx + z * cx;

  let dx = x;

  let rx = dx * cy - dz * sy;
  let rz = dx * sy + dz * cy;

  return {x:rx,y:dy,z:rz};
}

// 🌌 RENDER LOOP
function draw(){
  requestAnimationFrame(draw);

  updateExplosion();
  updateScene();

  rotX += (targetX - rotX) * 0.05;
  rotY += (targetY - rotY) * 0.05;

  // motion blur
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.fillRect(0,0,canvas.width,canvas.height);

  // Scene-specific background tint
  if(currentScene === 0){
    // Explosion scene - warm red tint
    ctx.fillStyle = "rgba(255,50,50,0.05)";
    ctx.fillRect(0,0,canvas.width,canvas.height);
  } else if(currentScene === 1){
    // Next Part scene - cool blue tint
    ctx.fillStyle = "rgba(50,100,255,0.05)";
    ctx.fillRect(0,0,canvas.width,canvas.height);
  }

  // 🌠 STAR FIELD
  for(let s of stars){
    let r = rotate(s.x,s.y,s.z);

    let scale = 600 / (600 + r.z);
    let x = canvas.width/2 + r.x * scale;
    let y = canvas.height/2 + r.y * scale;

    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(x,y,s.size*scale,0,Math.PI*2);
    ctx.fill();
  }

  // ❤️ HEARTS
  for(let h of hearts){
    let r = rotate(h.x,h.y,h.z);

    let scale = 600 / (600 + r.z);
    let x = canvas.width/2 + r.x * scale;
    let y = canvas.height/2 + r.y * scale;

    ctx.fillStyle = `rgba(255,80,120,${h.life})`;
    ctx.font = `${14*scale}px Arial`;
    ctx.fillText("❤", x, y);

    h.life -= 0.01;
  }

  hearts = hearts.filter(h => h.life > 0);

  // 💥 EXPLOSION FLASH
  if(explosion > 0){
    ctx.fillStyle = `rgba(255,255,255,${explosion * 0.15})`;
    ctx.fillRect(0,0,canvas.width,canvas.height);
  }
  
  // 🎬 DISPLAY CURRENT SCENE
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText(`Scene: ${scenes[currentScene].name} (${currentScene})`, 20, 30);
  ctx.fillText(`Timer: ${sceneTimer}`, 20, 60);
  ctx.fillText(`Explosion: ${explosion.toFixed(2)}`, 20, 90);
}
draw();
