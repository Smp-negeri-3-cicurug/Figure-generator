// Configuration
const API_ENDPOINT = '/api/generate'; // Ganti dengan URL API kamu setelah deploy

// Particles Animation
const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');
let particlesArray = [];

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initParticles();
});

class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = Math.random() * 0.5 - 0.25;
        this.speedY = Math.random() * 0.5 - 0.25;
        this.opacity = Math.random() * 0.5 + 0.2;
    }
    
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        
        if (this.x > canvas.width) this.x = 0;
        if (this.x < 0) this.x = canvas.width;
        if (this.y > canvas.height) this.y = 0;
        if (this.y < 0) this.y = canvas.height;
    }
    
    draw() {
        ctx.fillStyle = `rgba(99, 102, 241, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function initParticles() {
    particlesArray = [];
    const numberOfParticles = (canvas.width * canvas.height) / 15000;
    for (let i = 0; i < numberOfParticles; i++) {
        particlesArray.push(new Particle());
    }
}

function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
        particlesArray[i].draw();
    }
    requestAnimationFrame(animateParticles);
}

initParticles();
animateParticles();

// State
let selectedFile = null;

// Elements
const uploadBox = document.getElementById('uploadBox');
const fileInput = document.getElementById('fileInput');
const uploadContent = document.getElementById('uploadContent');
const previewContainer = document.getElementById('previewContainer');
const previewImage = document.getElementById('previewImage');
const removeBtn = document.getElementById('removeBtn');
const generateBtn = document.getElementById('generateBtn');
const btnText = document.querySelector('.btn-text');
const btnLoader = document.querySelector('.btn-loader');
const resultSection = document.getElementById('resultSection');
const resultImage = document.getElementById('resultImage');
const downloadBtn = document.getElementById('downloadBtn');
const newBtn = document.getElementById('newBtn');
const loadingOverlay = document.getElementById('loadingOverlay');

// Event Listeners
uploadBox.addEventListener('click', () => {
    if (!previewContainer.style.display || previewContainer.style.display === 'none') {
        fileInput.click();
    }
});

fileInput.addEventListener('change', handleFileSelect);
removeBtn.addEventListener('click', removeImage);
generateBtn.addEventListener('click', generateFigure);
downloadBtn.addEventListener('click', downloadResult);
newBtn.addEventListener('click', resetApp);

// Drag and Drop
uploadBox.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadBox.classList.add('dragover');
});

uploadBox.addEventListener('dragleave', () => {
    uploadBox.classList.remove('dragover');
});

uploadBox.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadBox.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        if (file.type.startsWith('image/')) {
            handleFile(file);
        } else {
            showError('Please drop an image file');
        }
    }
});

// Functions
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        handleFile(file);
    }
}

function handleFile(file) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
        showError('Mohon pilih file gambar');
        return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
        showError('Ukuran file harus kurang dari 10MB');
        return;
    }

    selectedFile = file;

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
        previewImage.src = e.target.result;
        uploadContent.style.display = 'none';
        previewContainer.style.display = 'block';
        generateBtn.disabled = false;
        resultSection.style.display = 'none';
    };
    reader.readAsDataURL(file);
}

function removeImage(e) {
    e.stopPropagation();
    selectedFile = null;
    fileInput.value = '';
    previewImage.src = '';
    uploadContent.style.display = 'block';
    previewContainer.style.display = 'none';
    generateBtn.disabled = true;
}

async function generateFigure() {
    if (!selectedFile) return;

    try {
        // Show loading
        btnText.style.display = 'none';
        btnLoader.style.display = 'flex';
        generateBtn.disabled = true;
        loadingOverlay.style.display = 'flex';

        // Create FormData
        const formData = new FormData();
        formData.append('image', selectedFile);

        // Call API
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Gagal membuat figure');
        }

        const data = await response.json();

        // Show result
        resultImage.src = data.result;
        resultSection.style.display = 'block';
        
        // Scroll to result
        setTimeout(() => {
            resultSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);

    } catch (error) {
        console.error('Error:', error);
        showError(error.message || 'Gagal membuat figure. Silakan coba lagi.');
    } finally {
        // Hide loading
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
        generateBtn.disabled = false;
        loadingOverlay.style.display = 'none';
    }
}

function downloadResult() {
    // Gunakan API download endpoint
    const downloadUrl = `/api/download?url=${encodeURIComponent(resultImage.src)}`;
    
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `figure_art_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function resetApp() {
    selectedFile = null;
    fileInput.value = '';
    previewImage.src = '';
    resultImage.src = '';
    uploadContent.style.display = 'block';
    previewContainer.style.display = 'none';
    resultSection.style.display = 'none';
    generateBtn.disabled = true;
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showError(message) {
    alert(message);
}

// Prevent default drag behavior on document
document.addEventListener('dragover', (e) => e.preventDefault());
document.addEventListener('drop', (e) => e.preventDefault());
