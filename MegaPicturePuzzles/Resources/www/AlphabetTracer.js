var CoverColour = "#333399";

var ImagesDirectory = "./Resources/Images/";
var CurrentImageIndex = 0;
var Squeaker = new Audio("./Sounds/108486__robinhood76.mp3");
var PlaySound = true;
var MouseDown = false;
var Menubar = null;
var LastX = 0;
var LastY = 0;

var Spinner = null;

// colour image to be revealed
var image =
{
  'url': null,
  'img': null
};

// temp and draw canvases
var canvas =
{
  'temp':null,
  'draw':null
};

var MainCanvas = null;

function ToggleSound()
{
  PlaySound = !PlaySound;
  var audioImg = document.getElementById('AudioController');
  audioImg.src = PlaySound ? "./Resources/Icons/1227973961782836377Farmeral_audio-icon.svg.med.png" : "./Resources/Icons/1227973961782836377Farmeral_audio-icon.svg.med.off.png";
}

function StartSqueaker(ev)
{
  MouseDown = true;
  LastX = ev.clientX;
  LastY = ev.clientY;
}

function StopSqueaker(ev)
{
  Squeaker.pause();
}

function MoveSqueaker(ev)
{
  if (Math.abs(ev.clientX - LastX) < 1 || Math.abs(ev.clientY - LastY) < 1)
  {
    Squeaker.pause();
  }
  else
  {
    if (MouseDown && PlaySound)
    {
      Squeaker.play();
    }
  }
  LastX = ev.clientX;
  LastY = ev.clientY;
}

function HideMenubar()
{
  Menubar.style.visibility = "hidden";
}

function ShowMenubar()
{
  Menubar.style.visibility = "visible";
}

function InitSound()
{
  Squeaker.loop = true;
  Squeaker.load();

  MainCanvas.addEventListener('mousedown', StartSqueaker, false);
  MainCanvas.addEventListener('mousemove', MoveSqueaker, false);
  MainCanvas.addEventListener('mouseup', StopSqueaker, false);

  MainCanvas.addEventListener('touchstart', StartSqueaker, false);
  MainCanvas.addEventListener('touchmove', MoveSqueaker, false);
  MainCanvas.addEventListener('touchend', StopSqueaker, false);
}

function InitMenubar()
{
  Menubar = document.getElementById("footer");

  MainCanvas.addEventListener('mousedown', HideMenubar, false);
  MainCanvas.addEventListener('mouseup', ShowMenubar, false);

  MainCanvas.addEventListener('touchstart', HideMenubar, false);
  MainCanvas.addEventListener('touchend', ShowMenubar, false);
}

function HideSpinner()
{
  Spinner.style.visibility = "hidden";
}

function ShowSpinner()
{
  Spinner.style.visibility = "visible";
}

function InitSpinner()
{
  Spinner = document.getElementById("spinner");
  CentreOnPage(Spinner);
  HideSpinner();
}

function CentreOnPage(el)
{
  el.style.left = (window.innerWidth - el.offsetWidth) / 2 + "px";
  el.style.top = (window.innerHeight - el.offsetHeight) / 2 + "px";
}

function ClearCanvas()
{
  // clear the draw canvas
  canvas.draw.width = canvas.draw.width;
  RecompositeCanvases()
}

/**
 * Handle loading of needed image resources
 */
function LoadImage()
{
  ShowSpinner();

  var loadCount = 0;
  var loadTotal = 1;
  var loadingIndicator;

  function imageLoaded(e)
  {
    loadCount++;

    if (loadCount >= loadTotal)
    {
      pause(250);
      HideSpinner();
      RecompositeCanvases();
    }
  }

  image.img = document.createElement('img'); // image is global
  image.img.addEventListener('load', imageLoaded, false);
  image.img.src = image.url;
}

function LoadImageByName(rootName)
{
  image.url = ImagesDirectory + rootName;
  LoadImage();
}

function LoadCanvas(index)
{
  LoadImageByName(ImageFiles[index]);
}

function NextCanvas()
{
  CurrentImageIndex++;
  if (CurrentImageIndex >= ImageFiles.length)
  {
    // cycle around to start
    CurrentImageIndex = 0;
  }
  LoadCanvas(CurrentImageIndex);
}

function PreviousCanvas()
{
  CurrentImageIndex--;
  if (CurrentImageIndex < 0)
  {
    // cycle around to end
    CurrentImageIndex = ImageFiles.length - 1;
  }
  LoadCanvas(CurrentImageIndex);
}

function ReloadCanvas()
{
  // reload current image
  LoadCanvas(CurrentImageIndex);
}

function RandomCanvas()
{
  // load a random image
  CurrentImageIndex = Math.floor(Math.random() * ImageFiles.length);
  LoadCanvas(CurrentImageIndex);
}

/**
 * Helper function to get the local coords of an event in an element,
 * since offsetX/offsetY are apparently not entirely supported, but
 * offsetLeft/offsetTop/pageX/pageY are!
 *
 * @param elem element in question
 * @param ev the event
 */
function GetLocalCoords(elem, ev)
{
  var ox = 0, oy = 0;
  var first;
  var pageX, pageY;

  // Walk back up the tree to calculate the total page offset of the
  // currentTarget element.  I can't tell you how happy this makes me.
  // Really.
  while (elem != null)
  {
    ox += elem.offsetLeft;
    oy += elem.offsetTop;
    elem = elem.offsetParent;
  }

  if (ev.hasOwnProperty('changedTouches'))
  {
    first = ev.changedTouches[0];
    pageX = first.pageX;
    pageY = first.pageY;
  }
  else
  {
    pageX = ev.pageX;
    pageY = ev.pageY;
  }

  return { 'x': pageX - ox, 'y': pageY - oy };
}

/**
 * Draw a scratch line
 *
 * @param can the canvas
 * @param x,y the coordinates
 * @param fresh start a new line if true
 */
function ScratchLine(can, x, y, fresh)
{
  var ctx = can.getContext('2d');

  // set eraser width based on screen size
  ctx.lineWidth = Math.min(window.innerWidth, window.innerHeight)/15;

  ctx.lineCap = ctx.lineJoin = 'round';
  ctx.strokeStyle = '#fff'; // can be any opaque color
  if (fresh)
  {
    ctx.beginPath();
    // this +0.01 hackishly causes Linux Chrome to draw a
    // "zero"-length line (a single point), otherwise it doesn't
    // draw when the mouse is clicked but not moved:
    ctx.moveTo(x + 0.01, y);
  }
  ctx.lineTo(x, y);
  ctx.stroke();
}

/**
 * On mouse down, draw a line starting fresh
 */
function MouseDown_Handler(e)
{
  var local = GetLocalCoords(MainCanvas, e);
  MouseDown = true;

  ScratchLine(canvas.draw, local.x, local.y, true);
  RecompositeCanvases();

  if (e.cancelable)
  {
    e.preventDefault();
  }
  return false;
};

/**
 * On mouse move, if mouse down, draw a line
 *
 * We do this on the window to smoothly handle mousing outside
 * the canvas
 */
function MouseMove_Handler(e)
{
  if (!MouseDown)
  {
    return true;
  }

  var local = GetLocalCoords(MainCanvas, e);

  ScratchLine(canvas.draw, local.x, local.y, false);
  RecompositeCanvases();

  if (e.cancelable)
  {
    e.preventDefault();
  }

  return false;
};

/**
 * On mouseup.  (Listens on window to catch out-of-canvas events.)
 */
function MouseUp_Handler(e)
{
  if (MouseDown)
  {
    MouseDown = false;

    if (e.cancelable)
    {
      e.preventDefault();
    }
    return false;
  }

  return true;
};

/**
 * Recomposites the canvases onto the screen
 *
 * Note that my preferred method (putting the background down, then the
 * masked foreground) doesn't seem to work in FF with "source-out"
 * compositing mode (it just leaves the destination canvas blank.)  I
 * like this method because mentally it makes sense to have the
 * foreground drawn on top of the background.
 *
 * Instead, to get the same effect, we draw the whole foreground image,
 * and then mask the background (with "source-atop", which FF seems
 * happy with) and stamp that on top.  The final result is the same, but
 * it's a little bit weird since we're stamping the background on the
 * foreground.
 *
 * OPTIMIZATION: This naively redraws the entire canvas, which involves
 * four full-size image blits.  An optimization would be to track the
 * dirty rectangle in scratchLine(), and only redraw that portion (i.e.
 * in each drawImage() call, pass the dirty rectangle as well--check out
 * the drawImage() documentation for details.)  This would scale to
 * arbitrary-sized images, whereas in its current form, it will dog out
 * if the images are large.
 */
function RecompositeCanvases()
{
  var tempctx = canvas.temp.getContext('2d');
  var mainctx = MainCanvas.getContext('2d');

  // Step 1: clear the temp
  canvas.temp.width = canvas.temp.width; // resizing clears

  // Step 2: stamp the draw on the temp (source-over)
  tempctx.drawImage(canvas.draw, 0, 0);

  /* !!!! this way doesn't work on FF:
    // Step 3: stamp the foreground on the temp (!! source-out mode !!)
    tempctx.globalCompositeOperation = 'source-out';
    tempctx.drawImage(image.front.img, 0, 0);

    // Step 4: stamp the background on the display canvas (source-over)
    //mainctx.drawImage(image.img, 0, 0);

    // Step 5: stamp the temp on the display canvas (source-over)
    mainctx.drawImage(canvas.temp, 0, 0);
  */

  // Step 3: stamp the background on the temp (!! source-atop mode !!)
  tempctx.globalCompositeOperation = 'source-atop';

  var imgHeight = MainCanvas.height;

  // maintain aspect ratio
  var imgWidth = imgHeight * image.img.width/image.img.height;

  // check we aren't too wide
  if (imgWidth > MainCanvas.width)
  {
    imgWidth = MainCanvas.width;
    imgHeight = imgWidth * image.img.height/image.img.width;
  }

  // center vertically
  var vMargin = (MainCanvas.height - imgHeight) / 2;

  // Five arguments:
  //  the element,
  //  destination (x,y) coordinates
  //  destination width and height (if you want to resize the source image).
  tempctx.drawImage(image.img,
    // center image horizontally
    (MainCanvas.width - imgWidth) / 2, vMargin,

    imgWidth, imgHeight);

  // Step 4: stamp the foreground on the display canvas (source-over)
  //mainctx.drawImage(image.front.img, 0, 0);
  mainctx.fillStyle = CoverColour;
  mainctx.fillRect(0, 0, MainCanvas.width, MainCanvas.height);

  // Step 5: stamp the temp on the display canvas (source-over)
  mainctx.drawImage(canvas.temp, 0, 0);
}

function InitCanvases()
{
  MainCanvas = document.getElementById('MainCanvas');

  // create the temp and draw canvases, and set their dimensions
  // to the same as the main canvas:
  canvas.temp = document.createElement('canvas');
  canvas.draw = document.createElement('canvas');

  MainCanvas.addEventListener('mousedown', MouseDown_Handler, false);
  MainCanvas.addEventListener('touchstart', MouseDown_Handler, false);

  window.addEventListener('mousemove', MouseMove_Handler, false);
  window.addEventListener('touchmove', MouseMove_Handler, false);

  window.addEventListener('mouseup', MouseUp_Handler, false);
  window.addEventListener('touchend', MouseUp_Handler, false);
}

function ResizeCanvas()
{
  var Footer = document.getElementById("footer");
  var FooterHeight = Footer.clientHeight;
  var HeightOffset = 0;

  MainCanvas.height = window.innerHeight - HeightOffset;

  var WidthOffset = 0;

  MainCanvas.width = window.innerWidth - WidthOffset;

  canvas.temp.width = canvas.draw.width = MainCanvas.width;
  canvas.temp.height = canvas.draw.height = MainCanvas.height;
}

/* When this function is called, PhoneGap has been initialized and is ready to roll */
function OnDeviceReady()
{
  // do your thing!
  // except for Android as the accelerometer calibrations are not consistent across devices :-(
  // to support 'shake to erase', we'd have to calibrate the accelerometer which might be
  // beyond a parents' or child's ability
  if (BrowserDetect.OS != "Android")
  {
    WatchForShake(1.25);
  }
}

function WatchForShake(threshold)
{
  var axl = new Accelerometer();

  axl.watchAcceleration
  (
   function (Accel)
   {
    if (true === Accel.is_updating)
    {
      return;
    }

   if (Math.abs(Accel.x) >= threshold &&
      Math.abs(Accel.y) >= threshold )
    {
      //debug.log("acc(" + Accel.x + "," + Accel.y + "," + Accel.z + ")");
      RandomCanvas();
    }
   }
   , function(){}
   , { frequency : 60 }
   );
}

function OnBodyLoad()
{
  CommonInit();
  InitCanvases();
  InitSound();
  InitMenubar();
  InitSpinner();

  document.addEventListener("deviceready", OnDeviceReady, false);

  PreventTouchMove();

  ResizeCanvas();
  RandomCanvas();
}
