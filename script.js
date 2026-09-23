/* ===== PRELOADER ===== */
window.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
        document.getElementById("preloader").classList.add("preloader-hidden");
    }, 2500);
});

/* ===== CUSTOM CURSOR ===== */
const cursorDot = document.querySelector(".cursor-dot");
const cursorOutline = document.querySelector(".cursor-outline");

window.addEventListener("mousemove", function(e) {
    const posX = e.clientX;
    const posY = e.clientY;

    cursorDot.style.left = `${posX}px`;
    cursorDot.style.top = `${posY}px`;
    
    cursorOutline.animate({
        left: `${posX}px`,
        top: `${posY}px`
    }, { duration: 500, fill: "forwards" });
});

const interactives = document.querySelectorAll("a, button, input, textarea, .portfolio-card");
interactives.forEach(el => {
    el.addEventListener("mouseenter", () => {
        cursorOutline.style.transform = "translate(-50%, -50%) scale(1.5)";
        cursorOutline.style.backgroundColor = "rgba(139, 92, 246, 0.1)"; 
    });
    el.addEventListener("mouseleave", () => {
        cursorOutline.style.transform = "translate(-50%, -50%) scale(1)";
        cursorOutline.style.backgroundColor = "transparent";
    });
});

/* ===== DRAG TO SCROLL FOR PORTFOLIO (Optional Enhance) ===== */
const slider = document.querySelector('.portfolio-grid');
let isDown = false;
let startX;
let scrollLeft;

slider.addEventListener('mousedown', (e) => {
  isDown = true;
  slider.style.cursor = 'grabbing';
  startX = e.pageX - slider.offsetLeft;
  scrollLeft = slider.scrollLeft;
});
slider.addEventListener('mouseleave', () => {
  isDown = false;
  slider.style.cursor = 'auto';
});
slider.addEventListener('mouseup', () => {
  isDown = false;
  slider.style.cursor = 'auto';
});
slider.addEventListener('mousemove', (e) => {
  if(!isDown) return;
  e.preventDefault();
  const x = e.pageX - slider.offsetLeft;
  const walk = (x - startX) * 2; // Scroll-fast
  slider.scrollLeft = scrollLeft - walk;
});


/* ===== PARTICLES.JS ===== */
particlesJS("particles-js", {
    "particles": {
        "number": { "value": 60, "density": { "enable": true, "value_area": 800 } },
        "color": { "value": ["#0ea5e9", "#8b5cf6", "#ffffff"] },
        "shape": { "type": "circle" },
        "opacity": { "value": 0.5, "random": true },
        "size": { "value": 3, "random": true },
        "line_linked": {
            "enable": true,
            "distance": 150,
            "color": "#8b5cf6",
            "opacity": 0.2,
            "width": 1
        },
        "move": {
            "enable": true,
            "speed": 2,
            "direction": "none",
            "random": true,
            "out_mode": "out",
            "bounce": false
        }
    },
    "interactivity": {
        "detect_on": "canvas",
        "events": {
            "onhover": { "enable": true, "mode": "grab" }, 
            "onclick": { "enable": true, "mode": "push" }, 
            "resize": true
        },
        "modes": {
            "grab": { "distance": 200, "line_linked": { "opacity": 0.8 } },
            "push": { "particles_nb": 4 }
        }
    },
    "retina_detect": true
});

/* ===== TYPED.JS ===== */
var typed = new Typed('.typed-text', {
    strings: ["Backend Developer.", "Software Engineer.", "Problem Solver."],
    typeSpeed: 50,
    backSpeed: 30,
    backDelay: 1500,
    loop: true
});

/* ===== AOS ANIMATION INITIALIZATION ===== */
AOS.init({
    once: false,
    offset: 100,
    duration: 800,
    easing: 'ease-in-out',
});

/* ===== STICKY NAVBAR & SCROLL SPY ===== */
const navbar = document.querySelector(".navbar");
const sections = document.querySelectorAll("section");
const navLinksList = document.querySelectorAll(".nav-links a");

window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
        navbar.classList.add("scrolled");
    } else {
        navbar.classList.remove("scrolled");
    }

    let current = "";
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (pageYOffset >= (sectionTop - sectionHeight / 3)) {
            current = section.getAttribute("id");
        }
    });

    navLinksList.forEach(link => {
        link.classList.remove("active");
        if (link.getAttribute("href").includes(current)) {
            link.classList.add("active");
        }
    });
});

/* ===== MOBILE MENU ===== */
const hamburger = document.querySelector(".hamburger");
const navMenu = document.querySelector(".nav-links");

hamburger.addEventListener("click", () => {
    navMenu.classList.toggle("nav-active");
    if(navMenu.classList.contains("nav-active")){
        hamburger.innerHTML = '<i class="fas fa-times"></i>';
    } else {
        hamburger.innerHTML = '<i class="fas fa-bars"></i>';
    }
});

navLinksList.forEach(link => {
    link.addEventListener("click", () => {
        navMenu.classList.remove("nav-active");
        hamburger.innerHTML = '<i class="fas fa-bars"></i>';
    });
});

/* ===== EMAILJS ===== */
(function() {
    if(typeof emailjs !== 'undefined'){
        emailjs.init("ZkFNdjGVpoN7CneCz");
        
        const form = document.getElementById('contact-form');
        if(form){
            form.addEventListener('submit', function(event) {
                event.preventDefault();
                
                const btn = this.querySelector('button');
                const originalText = btn.innerHTML;
                btn.innerHTML = 'Sending... <i class="fas fa-spinner fa-spin"></i>';
                
                const name = document.getElementById("name").value;
                const email = document.getElementById("email").value;
                const project = document.getElementById("project").value;
                const message = document.getElementById("message").value;

               emailjs.send("naufal_emailjs_service_t", "template_4q2cni7", {
                    name: name,
                    project: project,
                    message: message,
                    time: new Date().toLocaleString("id-ID"),
                    email: email,
                    recipients: email
                }).then(function() {
                    document.getElementById("success-modal").classList.add("active");
                    document.getElementById('contact-form').reset();
                    btn.innerHTML = originalText;
                }, function(error) {
                    console.log("Error:", error);
                    alert("Oops! Something went wrong. Please try again.");
                    btn.innerHTML = originalText;
                });
            });
        }
    }
})();

function closeModal() {
    document.getElementById("success-modal").classList.remove("active");
}
