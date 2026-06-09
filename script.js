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

window.addEventListener("click", () => {
  explosion = 1;
  sceneTimer = scenes[currentScene].duration;
  hasTransitioned = false;
});

function resize(){
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

let stars = [];
for(let i = 0; i < 500; i++){
  stars.push({
    x: Math.random() * 800 - 400,
    y: Math.random() * 800 - 400,
    z: Math.random() * 800,
    size: Math.random() * 2
  });
}

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

let rotX = 0, rotY = 0, targetX = 0, targetY = 0;

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
  
  rotX += (targetX - rotX) * 0.05;
  rotY += (targetY - rotY) * 0.05;
  
  // Clear with motion blur
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw stars
  for(let s of stars){
    let r = rotate(s.x, s.y, s.z);
    let scale = 600 / (600 + r.z);
    let x = canvas.width/2 + r.x * scale;
    let y = canvas.height/2 + r.y * scale;
    
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(x, y, s.size * scale, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Draw hearts
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
  
  // Scene display text
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText(`Scene: ${scenes[currentScene].name}`, 20, 30);
}

draw();
