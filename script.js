document.getElementById('file-input').addEventListener('change', handleFileSelect);
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('save-style').addEventListener('click', saveStyle);
    document.getElementById('apply-style').addEventListener('click', applyStyle);

    let savedStyles = {};

    function saveStyle() {
        const styleName = document.getElementById('style-name').value;
        if (!styleName) {
            alert("Please enter a style name.");
            return;
        }
        if (savedStyles[styleName]) {
            alert("Style name already exists.");
            return;
        }

        const svgElements = document.querySelectorAll('#svg-container path');
        const styleColors = Array.from(svgElements).map((elem, index) => ({
            index: index,
            color: elem.style.fill
        }));

        savedStyles[styleName] = styleColors;
        updateStyleSelector(styleName);
        clearStyleInputs();
        alert("Style saved!");
    }

    function updateStyleSelector(newStyle) {
        const selector = document.getElementById('style-selector');
        const option = document.createElement('option');
        option.value = newStyle;
        option.textContent = newStyle;
        selector.appendChild(option);
    }

    function clearStyleInputs() {
        document.getElementById('style-name').value = '';
        document.getElementById('style-selector').value = 'Select a style';
    }

    function applyStyle() {
        const selectedStyle = document.getElementById('style-selector').value;
        if (selectedStyle === "Select a style" || !savedStyles[selectedStyle]) {
            alert("Please select a valid style.");
            return;
        }

        const styleColors = savedStyles[selectedStyle];
        const svgElements = document.querySelectorAll('#svg-container path');
        styleColors.forEach(style => {
            if (svgElements[style.index]) {
                svgElements[style.index].style.fill = style.color;
            }
        });
    }
});


function handleFileSelect(event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
        const svgString = e.target.result;
        renderSVG(svgString);
    };

    reader.readAsText(file);
}

function renderSVG(svgString) {
    const svgContainer = document.getElementById('svg-container');
    svgContainer.innerHTML = svgString;

    const svg = svgContainer.querySelector('svg');

    svg.style.width = '100%';
    svg.style.height = '100%';

    const colorPicker = document.getElementById('color-picker');
    const colorHex = document.getElementById('color-hex');
    const colorBank = document.getElementById('color-bank');
    const svgElements = svgContainer.querySelectorAll('path');

    for (let i = 0; i < svgElements.length; i++) {
        svgElements[i].addEventListener('click', function() {
            this.style.fill = colorPicker.value;
        });
    }

    colorPicker.addEventListener('change', function() {
        colorHex.value = this.value;
    });

    colorHex.addEventListener('change', function() {
        colorPicker.value = this.value;
    });

    document.getElementById('add-color').addEventListener('click', function() {
        const color = colorHex.value;
        if (color) {
            const colorOption = document.createElement('div');
            colorOption.classList.add('color-option');
            colorOption.style.backgroundColor = color;
            colorOption.addEventListener('click', function() {
                colorPicker.value = color;
            });
            colorBank.appendChild(colorOption);
        }
    });

    let zoomLevel = 1;
    svgContainer.addEventListener('wheel', function(event) {
        event.preventDefault();
        const zoomSpeed = 0.05;
        zoomLevel += event.deltaY * -zoomSpeed;
        zoomLevel = Math.max(0.1, zoomLevel);

        svg.style.width = `${100 * zoomLevel}%`;
        svg.style.height = `${100 * zoomLevel}%`;

        const scrollLeft = svgContainer.scrollLeft;
        const scrollTop = svgContainer.scrollTop;
        const centerX = scrollLeft + svgContainer.offsetWidth / 2;
        const centerY = scrollTop + svgContainer.offsetHeight / 2;
        const newScrollLeft = (centerX * zoomLevel - svgContainer.offsetWidth / 2) / zoomLevel;
        const newScrollTop = (centerY * zoomLevel - svgContainer.offsetHeight / 2) / zoomLevel;
        svgContainer.scrollLeft = newScrollLeft;
        svgContainer.scrollTop = newScrollTop;
    });

    let isPanning = false;
    let startCoords = {
        x: 0,
        y: 0
    };
    svgContainer.addEventListener('mousedown', function(event) {
        isPanning = true;
        startCoords = {
            x: event.clientX,
            y: event.clientY
        };
        svgContainer.style.cursor = 'grabbing';
    });

    svgContainer.addEventListener('mousemove', function(event) {
        if (isPanning) {
            const deltaX = event.clientX - startCoords.x;
            const deltaY = event.clientY - startCoords.y;
            svgContainer.scrollLeft -= deltaX;
            svgContainer.scrollTop -= deltaY;
            startCoords = {
                x: event.clientX,
                y: event.clientY
            };
        }
    });

    document.addEventListener('mouseup', function() {
        isPanning = false;
        svgContainer.style.cursor = 'grab';
    });
}