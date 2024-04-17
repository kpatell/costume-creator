import React, { useState, useEffect, useRef } from "react";
import "./styles.css";

interface StyleColor {
  index: number;
  color: string;
}

const App: React.FC = () => {
  const [savedStyles, setSavedStyles] = useState<{
    [key: string]: StyleColor[];
  }>({});
  const [selectedStyle, setSelectedStyle] = useState<string>("Select a style");
  const [svgString, setSvgString] = useState<string>("");
  const [colorBank, setColorBank] = useState<string[]>([]);
  const [colorPicker, setColorPicker] = useState<string>("#000000");
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [startCoords, setStartCoords] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  const svgContainerRef = useRef<HTMLDivElement | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const svgString = e.target?.result?.toString() || "";
        setSvgString(svgString);
      };
      reader.readAsText(file);
    }
  };

  const renderSVG = () => {
    const svgContainer = svgContainerRef.current;
    if (svgContainer) {
      svgContainer.innerHTML = svgString;

      const svg = svgContainer.querySelector("svg");
      if (svg) {
        svg.style.width = "100%";
        svg.style.height = "100%";

        const svgElements = svgContainer.querySelectorAll("path");
        svgElements.forEach((elem, index) => {
          elem.addEventListener("click", () => {
            elem.style.fill = colorPicker;
          });
        });
      }
    }
  };

  const saveStyle = () => {
    const styleName = prompt("Enter a style name:");
    if (styleName && !savedStyles[styleName]) {
      const svgElements = document.querySelectorAll("#svg-container path");
      const styleColors = Array.from(svgElements).map((elem, index) => ({
        index: index,
        color: elem.getAttribute("fill") || "",
      }));
      setSavedStyles({ ...savedStyles, [styleName]: styleColors });
      setSelectedStyle(styleName);
      alert("Style saved!");
    } else {
      alert("Invalid or duplicate style name.");
    }
  };

  const applyStyle = () => {
    if (selectedStyle !== "Select a style" && savedStyles[selectedStyle]) {
      const styleColors = savedStyles[selectedStyle];
      const svgElements = document.querySelectorAll("#svg-container path");
      styleColors.forEach((style) => {
        if (svgElements[style.index]) {
          svgElements[style.index].setAttribute("fill", style.color);
        }
      });
      renderSVG();
    } else {
      alert("Please select a valid style.");
    }
  };

  const exportPNG = () => {
    const svgElement = svgContainerRef.current?.querySelector("svg");
    if (svgElement) {
      const svgData = new XMLSerializer().serializeToString(svgElement);

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = function () {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);

        const imageData = canvas
          .toDataURL("image/png")
          .replace("image/png", "image/octet-stream");

        const link = document.createElement("a");
        link.download = "exported-image.png";
        link.href = imageData;
        link.click();
      };

      img.crossOrigin = "anonymous";

      const svgBlob = new Blob([svgData], {
        type: "image/svg+xml;charset=utf-8",
      });
      const DOMURL = window.URL || window.webkitURL || window;
      const url = DOMURL.createObjectURL(svgBlob);
      img.src = url;
    }
  };

  const handleZoom = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const zoomSpeed = 0.05;
    let newZoomLevel = zoomLevel + event.deltaY * -zoomSpeed;
    newZoomLevel = Math.max(0.1, newZoomLevel); // Limiting zoom level
    setZoomLevel(newZoomLevel);

    const svg = svgContainerRef.current?.querySelector("svg");
    if (svg) {
      svg.style.width = `${100 * newZoomLevel}%`;
      svg.style.height = `${100 * newZoomLevel}%`;
    }
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    setIsPanning(true);
    setStartCoords({ x: event.clientX, y: event.clientY });
    svgContainerRef.current?.classList.add("grabbing");
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isPanning) {
      const deltaX = (event.clientX - startCoords.x) * 0.5;
      const deltaY = (event.clientY - startCoords.y) * 0.5;
      svgContainerRef.current?.scrollBy(-deltaX, -deltaY);
      setStartCoords({ x: event.clientX, y: event.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    svgContainerRef.current?.classList.remove("grabbing");
  };

  const nativeHandleZoom = (event: MouseEvent) => {
    handleZoom(event as unknown as React.WheelEvent<HTMLDivElement>);
  };

  const nativeHandleMouseDown = (event: MouseEvent) => {
    handleMouseDown(event as unknown as React.MouseEvent<HTMLDivElement>);
  };

  const nativeHandleMouseMove = (event: MouseEvent) => {
    handleMouseMove(event as unknown as React.MouseEvent<HTMLDivElement>);
  };

  useEffect(() => {
    renderSVG();
  }, [svgString]);

  useEffect(() => {
    if (svgContainerRef.current) {
      svgContainerRef.current.addEventListener("wheel", nativeHandleZoom);
      svgContainerRef.current.addEventListener(
        "mousedown",
        nativeHandleMouseDown
      );
      svgContainerRef.current.addEventListener(
        "mousemove",
        nativeHandleMouseMove
      );
      svgContainerRef.current.addEventListener("mouseup", handleMouseUp);

      return () => {
        svgContainerRef.current?.removeEventListener("wheel", nativeHandleZoom);
        svgContainerRef.current?.removeEventListener(
          "mousedown",
          nativeHandleMouseDown
        );
        svgContainerRef.current?.removeEventListener(
          "mousemove",
          nativeHandleMouseMove
        );
        svgContainerRef.current?.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isPanning, zoomLevel]);

  return (
    <div id="container">
      <div id="header">
        <h1 id="site-title">Ramblin' Raas Costume Editor</h1>
        <img
          src={process.env.PUBLIC_URL + "/site-logo.svg"}
          alt="Logo"
          id="site-logo"
        />
      </div>
      <h2 id="authors">By Shaan Patel and Aadit Trivedi</h2>
      <input type="file" id="file-input" onChange={handleFileSelect} />
      <div>
        <input type="text" id="style-name" placeholder="Style Name" />
        <button onClick={saveStyle}>Save Style</button>
        <select
          id="style-selector"
          value={selectedStyle}
          onChange={(e) => setSelectedStyle(e.target.value)}
        >
          <option>Select a style</option>
          {Object.keys(savedStyles).map((styleName) => (
            <option key={styleName} value={styleName}>
              {styleName}
            </option>
          ))}
        </select>
        <button onClick={applyStyle} style={{ marginLeft: "10px" }}>
          Apply Style
        </button>
        <button onClick={exportPNG} style={{ float: "right" }}>
          Export to PNG
        </button>
      </div>
      <div
        id="svg-container"
        ref={svgContainerRef}
        style={{ overflow: "hidden", cursor: isPanning ? "grabbing" : "grab" }}
      ></div>
      <footer>
        <div id="color-picker-container">
          <input
            type="color"
            id="color-picker"
            value={colorPicker}
            onChange={(e) => setColorPicker(e.target.value)}
          />
          <input type="text" id="color-hex" placeholder="Hex code" />
          <button onClick={() => setColorBank([...colorBank, colorPicker])}>
            Add Color
          </button>
        </div>
        <h2 id="color-bank-header">Color Bank</h2>
        <div id="color-bank">
          {colorBank.map((color, index) => (
            <div
              key={index}
              className="color-option"
              style={{ backgroundColor: color }}
            ></div>
          ))}
        </div>
      </footer>
    </div>
  );
};

export default App;
