// Инициализация переменных
const grid = document.getElementById('grid');
const coordinatesDisplay = document.getElementById('coordinates');
const startXInput = document.getElementById('startX');
const startYInput = document.getElementById('startY');
const clearButton = document.getElementById('clearGrid');
const createButton = document.getElementById('createGrid');
const saveButton = document.getElementById('saveImage');
const colorPaletteContainer = document.getElementById('colorPaletteContainer');
const uploadImageInput = document.getElementById('uploadImage');
const saveAsMapButton = document.getElementById('saveAsMap');
const zoomInButton = document.getElementById('zoomIn');
const zoomOutButton = document.getElementById('zoomOut');
const fillToolButton = document.getElementById('fillTool');
const undoButton = document.getElementById('undoButton'); // Кнопка отмены
const useAltFunctionCheckbox = document.getElementById('useAltFunction');

let uploadedImageDimensions = { width: 0, height: 0 }; // Хранит размеры загруженного изображения
let currentScale = 1; // Текущий масштаб
let isFillToolActive = false; // Флаг активации инструмента заливки
const historyStack = []; // Стек для хранения предыдущих состояний

// Задаем палитру цветов
const colorPalette = [
    "#e46e6e", "#ffd635", "#7eed56", "#00ccc0",
    "#51e9f4", "#94b3ff", "#e4abff", "#ff99aa",
    "#ffb470", "#ffffff", "#be0039", "#ff9600",
    "#00cc78", "#009eaa", "#3690ea", "#6a5cff",
    "#b44ac0", "#ff3881", "#9c6926", "#898d90",
    "#6d001a", "#bf4300", "#00a368", "#00756f", 
    "#2450a4", "#493ac1", "#811e9f", "#a00357", 
    "#6d482f", "#000000"
];

// Создание палитры цветов
function createColorPalette() {
    colorPalette.forEach(color => {
        const colorBox = document.createElement('div');
        colorBox.classList.add('color-box');
        colorBox.style.backgroundColor = color;

        // Обработчик выбора цвета
        colorBox.addEventListener('click', () => {
            document.getElementById('colorPicker').value = color; // Установка выбранного цвета в input
        });

        colorPaletteContainer.appendChild(colorBox);
    });
}

// Функция для заливки похожих пикселей
function fillArea(pixel, newColor) {
    const pixels = document.querySelectorAll('.pixel');
    const width = uploadedImageDimensions.width || parseInt(document.getElementById('gridWidth').value, 10) || 16;
    const height = uploadedImageDimensions.height || parseInt(document.getElementById('gridHeight').value, 10) || 16;

    const pixelIndex = Array.prototype.indexOf.call(pixels, pixel);
    const startX = pixelIndex % width;
    const startY = Math.floor(pixelIndex / width);

    const originalColor = pixel.style.backgroundColor;

    if (originalColor === newColor) {
        return; // Если цвет одинаковый, выходим
    }

    function getPixel(x, y) {
        if (x >= 0 && x < width && y >= 0 && y < height) {
            return pixels[y * width + x];
        }
        return null;
    }

    const stack = [{ x: startX, y: startY }];
    const visited = new Set(); // Используем Set для отслеживания посещённых пикселей

    while (stack.length > 0) {
        const { x, y } = stack.pop();
        const currentPixel = getPixel(x, y);

        if (currentPixel && currentPixel.style.backgroundColor === originalColor && !visited.has(`${x},${y}`)) {
            currentPixel.style.backgroundColor = newColor;
            visited.add(`${x},${y}`); // Добавляем текущий пиксель в посещённые

            stack.push({ x: x + 1, y });
            stack.push({ x: x - 1, y });
            stack.push({ x, y: y + 1 });
            stack.push({ x, y: y - 1 });
        }
    }
}

// Обработчик нажатия на кнопку "Заливка"
fillToolButton.addEventListener('click', () => {
    isFillToolActive = !isFillToolActive;
    fillToolButton.classList.toggle('active', isFillToolActive);
});

// Сохранение текущего состояния сетки
function saveCurrentState() {
    const pixels = Array.from(document.querySelectorAll('.pixel'));
    const currentState = pixels.map(pixel => pixel.style.backgroundColor);
    historyStack.push(currentState);
}

// Обновляем обработчики для пикселей с учётом заливки
function updatePixelEventListeners() {
    const pixels = document.querySelectorAll('.pixel');
    pixels.forEach(pixel => {
        pixel.addEventListener('click', () => {
            const selectedColor = document.getElementById('colorPicker').value;

            if (isFillToolActive) {
                saveCurrentState(); // Сохраняем текущее состояние перед заливкой
                fillArea(pixel, selectedColor);
            } else {
                saveCurrentState(); // Сохраняем текущее состояние перед закрашиванием
                pixel.style.backgroundColor = selectedColor;
            }
        });
    });
}

// Создание сетки пикселей
function createGrid() {
	
    const gridWidth = parseInt(document.getElementById('gridWidth').value, 10) || 16;
    const gridHeight = parseInt(document.getElementById('gridHeight').value, 10) || 16;

	currentScale = 1;

    const maxDimension = Math.max(gridWidth, gridHeight);
    if (maxDimension > 50) {
        currentScale -= Math.floor(maxDimension / 50) * 0.2; // Уменьшаем масштаб
    }

    // Убедимся, что масштаб не меньше 0.1
    currentScale = Math.max(currentScale, 0.2);
	
	updateScale(); 
    uploadedImageDimensions = { width: 0, height: 0 };

    grid.innerHTML = ''; // Очищаем сетку перед созданием

    for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
            const pixel = document.createElement('div');
            pixel.classList.add('pixel');

            pixel.addEventListener('mouseenter', () => {
                const startX = parseInt(startXInput.value, 10) || 1;
                const startY = parseInt(startYInput.value, 10) || 1;
                coordinatesDisplay.textContent = `(${startX + x}, ${startY + y})`;
            });

            grid.appendChild(pixel);
        }
    }
    updatePixelEventListeners(); // Обновляем обработчики событий пикселей
    updateScale(); // Применяем масштаб после создания сетки
}

// Масштабирование
function updateScale() {
    const pixelSize = 20 * currentScale; // Размер пикселя
    const gridWidth = uploadedImageDimensions.width || (parseInt(document.getElementById('gridWidth').value, 10) || 16);
    const gridHeight = uploadedImageDimensions.height || (parseInt(document.getElementById('gridHeight').value, 10) || 16);

    grid.style.gridTemplateColumns = `repeat(${gridWidth}, ${pixelSize}px)`;
    grid.style.gridTemplateRows = `repeat(${gridHeight}, ${pixelSize}px)`;

    const pixels = document.querySelectorAll('.pixel');
    pixels.forEach(pixel => {
        pixel.style.width = `${pixelSize}px`;
        pixel.style.height = `${pixelSize}px`;
    });
}

// Обработчики событий для кнопок масштабирования
zoomInButton.addEventListener('click', () => {
    currentScale += 0.1;
    updateScale();
});

zoomOutButton.addEventListener('click', () => {
    currentScale = Math.max(currentScale - 0.1, 0.1);
    updateScale();
});

// Создание сетки пикселей из изображения
function createPixelGridFromImage(imageData, startX, startY, width, height) {
    grid.innerHTML = ''; // Очистим старую сетку
	
    grid.style.gridTemplateColumns = `repeat(${width}, 20px)`;
    grid.style.gridTemplateRows = `repeat(${height}, 20px)`;
	
	currentScale = 1;

    const maxDimension = Math.max(width, height);
    if (maxDimension > 50) {
        currentScale -= Math.floor(maxDimension / 50) * 0.2; // Уменьшаем масштаб
    }

    // Убедимся, что масштаб не меньше 0.1
    currentScale = Math.max(currentScale, 0.2);
	
	updateScale(); 
		
    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const pixel = document.createElement('div');
            pixel.classList.add('pixel');

            const index = (row * width + col) * 4;
            const r = imageData.data[index];
            const g = imageData.data[index + 1];
            const b = imageData.data[index + 2];

            pixel.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;

            const pixelX = startX + col;
            const pixelY = startY + row;

            pixel.addEventListener('mouseenter', () => {
                coordinatesDisplay.textContent = `X: ${pixelX}, Y: ${pixelY}`;
            });

            grid.appendChild(pixel);
        }
    }
    updatePixelEventListeners(); // Обновляем обработчики событий пикселей
}

function createPixelGridFromImageAlt(imageData, startX, startY, width, height) {
    grid.innerHTML = ''; // Очистим старую сетку
	
    grid.style.gridTemplateColumns = `repeat(${width}, 20px)`;
    grid.style.gridTemplateRows = `repeat(${height}, 20px)`;
	
	currentScale = 1;

    const maxDimension = Math.max(width, height);
    if (maxDimension > 50) {
        currentScale -= Math.floor(maxDimension / 50) * 0.2; // Уменьшаем масштаб
    }

    // Убедимся, что масштаб не меньше 0.1
    currentScale = Math.max(currentScale, 0.2);
	
	updateScale();
    function hexToRgb(hex) {
        hex = hex.replace(/^#/, '');
        if (hex.length === 3) {
            hex = hex.split('').map(x => x + x).join('');
        }
        const bigint = parseInt(hex, 16);
        return [
            (bigint >> 16) & 255,
            (bigint >> 8) & 255,
            bigint & 255
        ];
    }

    function findNearestColor(r, g, b) {
        let nearestColor = colorPalette[0];
        let minDistance = Infinity;

        colorPalette.forEach(color => {
            const [pr, pg, pb] = hexToRgb(color);
            const distance = Math.sqrt(Math.pow(r - pr, 2) + Math.pow(g - pg, 2) + Math.pow(b - pb, 2));
            if (distance < minDistance) {
                minDistance = distance;
                nearestColor = color;
            }
        });

        return nearestColor;
    }

    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const pixel = document.createElement('div');
            pixel.classList.add('pixel');

            const index = (row * width + col) * 4;
            const r = imageData.data[index];
            const g = imageData.data[index + 1];
            const b = imageData.data[index + 2];

            const nearestColor = findNearestColor(r, g, b);
            pixel.style.backgroundColor = nearestColor;

            const pixelX = startX + col;
            const pixelY = startY + row;

            pixel.addEventListener('mouseenter', () => {
                coordinatesDisplay.textContent = `X: ${pixelX}, Y: ${pixelY}`;
            });

            grid.appendChild(pixel);
        }
    }
    updatePixelEventListeners(); // Обновляем обработчики событий пикселей
}





// Функция для загрузки изображения и получения его пиксельных данных
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const canvas = document.getElementById('imageCanvas');
    const ctx = canvas.getContext('2d');

    const img = new Image();
    img.onload = function() {
        const width = img.width;
        const height = img.height;

        uploadedImageDimensions.width = width;
        uploadedImageDimensions.height = height;

        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, 0, 0, width, height);

        const imageData = ctx.getImageData(0, 0, width, height);

        const startX = parseInt(startXInput.value, 10) || 0;
        const startY = parseInt(startYInput.value, 10) || 0;

        // Проверяем состояние чекбокса и вызываем нужную функцию
        if (useAltFunctionCheckbox.checked) {
            createPixelGridFromImageAlt(imageData, startX, startY, width, height);
        } else {
            createPixelGridFromImage(imageData, startX, startY, width, height);
        }
    };
    img.src = URL.createObjectURL(file);
}

// Функция для отмены последнего действия
function undoLastAction() {
    if (historyStack.length > 0) {
        const lastState = historyStack.pop(); // Извлекаем последнее состояние
        const pixels = document.querySelectorAll('.pixel');
        
        pixels.forEach((pixel, index) => {
            pixel.style.backgroundColor = lastState[index]; // Восстанавливаем цвет пикселей
        });
    }
}

// Обработчики событий
createButton.addEventListener('click', createGrid);
clearButton.addEventListener('click', () => {
    const pixels = document.querySelectorAll('.pixel');
    pixels.forEach(pixel => pixel.style.backgroundColor = '#ffffff');
});

saveButton.addEventListener('click', () => {
    const pixels = document.querySelectorAll('.pixel');
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    const width = uploadedImageDimensions.width || (parseInt(document.getElementById('gridWidth').value, 10) || 16);
    const height = uploadedImageDimensions.height || (parseInt(document.getElementById('gridHeight').value, 10) || 16);

    canvas.width = width; 
    canvas.height = height; 

    pixels.forEach((pixel, index) => {
        const x = index % width;
        const y = Math.floor(index / width);
        ctx.fillStyle = pixel.style.backgroundColor || '#ffffff';
        ctx.fillRect(x, y, 1, 1);
    });

    const link = document.createElement('a');
    link.download = 'pixel-art.png';
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

saveAsMapButton.addEventListener('click', () => {
    const pixels = document.querySelectorAll('.pixel');
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    const width = uploadedImageDimensions.width || (parseInt(document.getElementById('gridWidth').value, 10) || 16);
    const height = uploadedImageDimensions.height || (parseInt(document.getElementById('gridHeight').value, 10) || 16);
    
    const pixelSize = 30; // Размер пикселя
    canvas.width = width * pixelSize + 30; // Увеличиваем ширину для координат
    canvas.height = height * pixelSize + 30; // Увеличиваем высоту для координат

    pixels.forEach((pixel, index) => {
        const x = (index % width) * pixelSize + 30;
        const y = Math.floor(index / width) * pixelSize + 30;
        ctx.fillStyle = pixel.style.backgroundColor || '#ffffff';
        ctx.fillRect(x, y, pixelSize, pixelSize);
    });
    
    ctx.strokeStyle = '#272727';
    ctx.lineWidth = 1; 
    for (let x = 0; x <= width; x++) {
        ctx.moveTo(x * pixelSize + 30, 30);
        ctx.lineTo(x * pixelSize + 30, height * pixelSize + 30);
    }
    for (let y = 0; y <= height; y++) {
        ctx.moveTo(30, y * pixelSize + 30);
        ctx.lineTo(width * pixelSize + 30, y * pixelSize + 30);
    }
    ctx.stroke();

    for (let x = -1; x < width; x++) {
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(x * pixelSize + 30, 30 - pixelSize, pixelSize, pixelSize);
    }

    ctx.strokeStyle = '#272727';
    for (let x = 0; x < width; x++) {
        ctx.moveTo(x * pixelSize + 30, 30 - pixelSize);
        ctx.lineTo(x * pixelSize + 30, 30);
    }
    ctx.stroke();

    for (let y = 0; y < height; y++) {
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(0, y * pixelSize + 30, pixelSize, pixelSize);
    }

    for (let y = 0; y < height; y++) {
        ctx.moveTo(0, y * pixelSize + 30);
        ctx.lineTo(pixelSize, y * pixelSize + 30);
    }
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Bahnschrift';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let x = 0; x < width; x++) {
        const coordX = startXInput.value ? parseInt(startXInput.value) + x : x + 1;
        ctx.fillText(coordX, x * pixelSize + 30 + pixelSize / 2, 30 - 15);
    }

    for (let y = 0; y < height; y++) {
        const coordY = startYInput.value ? parseInt(startYInput.value) + y : y + 1;
        ctx.fillText(coordY, 15, y * pixelSize + 30 + pixelSize / 2);
    }

    const link = document.createElement('a');
    link.download = 'pixel-map.png';
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

// Создание палитры и сетки при загрузке страницы
createColorPalette();
createGrid();
uploadImageInput.addEventListener('change', handleImageUpload);
undoButton.addEventListener('click', undoLastAction); // Обработчик для кнопки отмены
