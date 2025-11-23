# ML Zoo Frontend

A React-based frontend application for the ML Zoo number recognition system. This application provides an interactive canvas where users can draw numbers and get AI predictions.

## Features

- **Interactive Drawing Canvas**: Draw numbers with mouse or touch input
- **Real-time Predictions**: Get instant AI predictions for drawn numbers
- **Confidence Scores**: View prediction confidence and probability distribution
- **Responsive Design**: Works on desktop and mobile devices
- **Clean UI**: Modern, user-friendly interface

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn package manager

### Installation

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) to view the application in your browser.

### Building for Production

To create a production build:

```bash
npm run build
```

This will create a `build` folder with optimized production files.

## Usage

1. **Drawing**: Click and drag on the canvas to draw a number (0-9)
2. **Clear**: Use the "Clear Canvas" button to start over
3. **Predict**: Click "Predict Number" to get AI prediction
4. **Results**: View the predicted number and confidence scores

## API Integration

The frontend communicates with the backend API at `http://localhost:8000`. Make sure the backend server is running before using the prediction feature.

## Technologies Used

- React 18
- Axios for HTTP requests
- HTML5 Canvas for drawing
- CSS3 for styling

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Development

### Project Structure

```
src/
  components/
    DrawingCanvas.js     # Main canvas component
    DrawingCanvas.css    # Canvas styles
  App.js                 # Main app component
  index.js              # Entry point
  index.css             # Global styles
```

### Customization

- Modify canvas size by changing `canvasSize` in `DrawingCanvas.js`
- Adjust drawing styles (line width, color) in the canvas setup
- Update API endpoint in the `predictNumber` function

## Troubleshooting

### Common Issues

1. **Prediction fails**: Ensure the backend is running on localhost:8000
2. **Canvas not responsive**: Check CSS media queries
3. **Touch drawing doesn't work**: Ensure touch events are properly handled

### CORS Issues

If you encounter CORS issues, make sure the backend allows requests from localhost:3000.