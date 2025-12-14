## 📌 Features

✔️ Free-form drawing with mouse or touch
✔️ mathematical analysis of the sets drawn
✔ Clear canvas
✔ Optional download/export drawing
✔ Works completely offline once loaded

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/AliNasrollahpour/drawingCanvas.git
cd drawingCanvas
```

### 2. Open in browser

Simply open `index.html` in your browser:

```bash
open index.html
```

or drag and drop it into any modern browser.

---

## 🧠 How It Works

This project uses the HTML5 `<canvas>` element to capture user pointer input and render strokes.

Basic logic flow:

* Listen for `mousedown / mousemove / mouseup` or touch events
* Draw path segments on the canvas context
* Control brush attributes (color & thickness)
* Clear canvas on demand

You can build on top of this foundation to add features like undo, export as PNG, and more.

---

## ❓ Troubleshooting

If drawing doesn’t start:

* Make sure the canvas has correct width/height
* Check for console errors in developer tools

---

## 💡 Tips & Ideas

✨ Add **undo/redo** support using stroke history
✨ Add **eraser** mode (white color)
✨ Add **save to PNG** button
✨ Add **color picker** & brush preview UI component

---

## ❤️ Contributing

Contributions are welcome!

1. Fork the repo
2. Create a new branch (`feature/your-feature`)
3. Make your changes
4. Open a Pull Request

---

## 📄 License

This project is open-source — feel free to adapt and redistribute.

---
