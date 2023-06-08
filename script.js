import { TRAINING_DATA } from "./mnist.js";
const PREDICTION_ELEMENT = document.getElementById("prediction");
const CANVAS = document.getElementById("canvas");
const CTX = CANVAS.getContext("2d");
const PREDICT_BTN = document.getElementById("predictBtn");
const scaleFactor = 6;
let isDrawing = false;

initCanvas();

// Grab a reference to the MNIST input values (pixel data).
const INPUTS = TRAINING_DATA.inputs;

// Grab reference to the MNIST output values.
const OUTPUTS = TRAINING_DATA.outputs;

// Shuffle the two arrays in the same way so inputs still match outputs indexes.
tf.util.shuffleCombo(INPUTS, OUTPUTS);

// Input feature Array is 1 dimensional.
const INPUTS_TENSOR = tf.tensor2d(INPUTS);

// Output feature Array is 1 dimensional.
// onHot() converts the array to a 2 dimensional array with a 1 in the index
const OUTPUTS_TENSOR = tf.oneHot(tf.tensor1d(OUTPUTS, "int32"), 10);

// Now actually create and define model architecture.
const model = tf.sequential();

model.add(
  tf.layers.dense({ inputShape: [784], units: 32, activation: "relu" })
);
model.add(tf.layers.dense({ units: 16, activation: "relu" }));
model.add(tf.layers.dense({ units: 10, activation: "softmax" }));

model.summary();

train();

PREDICT_BTN.addEventListener("click", function () {
  evaluate();
});

/** ----------------------------------------------------
 * trains the model
 ---------------------------------------------------- */
async function train() {
  // Compile the model with the defined optimizer and specify our loss function to use.
  model.compile({
    optimizer: "adam", // automatically changes the learning rate over time
    loss: "categoricalCrossentropy", // multi-class classification loss function
    metrics: ["accuracy"], // measures of how many images are predicted correctly from the training data
  });

  let results = await model.fit(INPUTS_TENSOR, OUTPUTS_TENSOR, {
    shuffle: true, // Ensure data is shuffled again before using each epoch.
    validationSplit: 0.2,
    batchSize: 512, // Update weights after every 512 examples.
    epochs: 50, // Go over the data 50 times!
    callbacks: { onEpochEnd: logProgress },
  });

  OUTPUTS_TENSOR.dispose();
  INPUTS_TENSOR.dispose();

  // evaluate(); // Once trained we can evaluate the model.
}

/** ----------------------------------------------------
 * Log the progress of the training.
 ---------------------------------------------------- */
function logProgress(epoch, logs) {
  console.log("Data for epoch " + epoch, Math.sqrt(logs.loss));
}

/** ----------------------------------------------------
 * evaluates the model.
---------------------------------------------------- */
function evaluate() {
  const OFFSET = Math.floor(Math.random() * INPUTS.length); // Select random from all example inputs.

  let answer = tf.tidy(function () {
    let newInput = tf.tensor1d(getCanvasData()).expandDims();
    // let newInput = tf.tensor1d(INPUTS[OFFSET]).expandDims();
    // newInput.print();
    let output = model.predict(newInput);
    output.print();
    return output.squeeze().argMax();
    x;
  });

  answer.array().then(function (index) {
    PREDICTION_ELEMENT.innerText = index;

    PREDICTION_ELEMENT.setAttribute(
      "class",
      //index === OUTPUTS[OFFSET] ? "correct" : "wrong"
      "correct"
    );

    answer.dispose();
    // drawImage(INPUTS[OFFSET]);
  });
}

/** ----------------------------------------------------
 * draws the digit on the canvas
---------------------------------------------------- */
// function drawImage(digit) {
//   var imageData = CTX.getImageData(0, 0, 28, 28);

//   for (let i = 0; i < digit.length; i++) {
//     imageData.data[i * 4] = digit[i] * 255; // Red Channel.
//     imageData.data[i * 4 + 1] = digit[i] * 255; // Green Channel.
//     imageData.data[i * 4 + 2] = digit[i] * 255; // Blue Channel.
//     imageData.data[i * 4 + 3] = 255; // Alpha Channel.
//   }

//   // Render the updated array of data to the canvas itself.
//   CTX.putImageData(imageData, 0, 0);
// }

/** ----------------------------------------------------
 * initialize the canvas
---------------------------------------------------- */
function initCanvas() {
  CTX.fillStyle = "black";
  CTX.fillRect(0, 0, CANVAS.width, CANVAS.height);

  let lastX, lastY;

  CANVAS.addEventListener("mousedown", () => {
    isDrawing = true;
  });

  CANVAS.addEventListener("mouseup", () => {
    isDrawing = false;
    lastX = undefined;
    lastY = undefined;
  });

  CANVAS.addEventListener("mousemove", (event) => {
    if (isDrawing) {
      CTX.strokeStyle = "white";
      CTX.lineWidth = scaleFactor;
      const rect = CANVAS.getBoundingClientRect();
      const x = Math.floor((event.clientX - rect.left));
      const y = Math.floor((event.clientY - rect.top));
      CTX.beginPath();
      CTX.moveTo(lastX, lastY);
      CTX.lineTo(x, y);
      CTX.stroke();
      lastX = x;
      lastY = y;
    }
  });

  document.getElementById("clearCanvas").addEventListener("click", () => {
    // Fill the canvas with black again
    CTX.fillStyle = "black";
    CTX.fillRect(0, 0, CANVAS.width, CANVAS.height);
    lastX = undefined;
    lastY = undefined;
  });
}


/** ----------------------------------------------------
 * Read canvas data
---------------------------------------------------- */
function getCanvasData() {
  const originalWidth = CANVAS.width;
  const originalHeight = CANVAS.height;

  const scaledWidth = Math.floor(originalWidth / scaleFactor);
  const scaledHeight = Math.floor(originalHeight / scaleFactor);

  let scaledImage = [];

  for (let y = 0; y < scaledHeight; y++) {
    // let row = [];
    for (let x = 0; x < scaledWidth; x++) {
      // Fetch the pixel data from the original image
      let imageData = CTX.getImageData(x * scaleFactor, y * scaleFactor, 1, 1).data;
      let r = imageData[0];
      let g = imageData[1];
      let b = imageData[2];
      // row.push([r, g, b]);
      scaledImage.push((r+b+g)/3/255);
    }
  }

  return scaledImage;
}