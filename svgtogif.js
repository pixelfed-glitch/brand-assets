const puppeteer = require("puppeteer");
const { PuppeteerScreenRecorder } = require("puppeteer-screen-recorder");
const child_process = require("child_process");
const fs = require("fs");

const usage = 'usage: node svgtogif.js <svgPath> <width> <height> <duration> <fps> <outFile>';
const videoExt = '.mov';

const wait = (ms) => new Promise((res) => setTimeout(res, ms));

main = async () => {
    let [nodePath, progPath, svgPath, width, height, duration, fps, outFile] = process.argv;
    if(outFile === undefined) {
        console.error('outFile is not defined');
        console.log(usage);
        process.exit(2);
    }
    const svg = fs.readFileSync(svgPath, 'utf-8');

    duration = parseFloat(duration);
    fps = parseInt(fps);
    console.log('duration: ' + duration + ' s, fps: ' + fps);
    const totalFrames = Math.floor(fps * duration);
    console.log('totalFrames: ' + totalFrames);

    await createFrames(Number(width), Number(height), svg, fps, duration, outFile);
    convertToGif(outFile);
}

createFrames = async (width, height, svg, fps, duration, outFile) => {
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: process.env.CHROMIUM_PATH || null,
    args: ["--no-sandbox", "--font-render-hinting=none"],
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({
      width,
      height,
      deviceScaleFactor: 3,
    });
    const recorderOptions = {
        format: "png",
        videoCodec: "png", 
        videoPixelFormat: "rgba",
        fps,
        ffmpeg_Path: process.env.FFMPEG_PATH || null,
    };
    const svgHtml = `
    <!DOCTYPE html>
    <html>
        <head>
            <title></title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style> html,body {margin: 0; padding: 0 overflow: hidden} </style>
        </head>
        <body>${svg}</body>
    </html>
    `;
    await page.setContent(svgHtml);

    // set transparent background in browsers
    const client = await page.target().createCDPSession();
    await client.send("Emulation.setDefaultBackgroundColorOverride", {
        color: { r: 0, g: 0, b: 0, a: 0 },
    });

    const recorder = new PuppeteerScreenRecorder(page, recorderOptions);

    await wait(3);
    await recorder.start(outFile + videoExt);
    await wait(duration * 1000);
    // await page.waitForTimeout(1);
    await recorder.stop();
  } catch (e) {
    console.log(e);
  } finally {
    await browser.close();
  }
};

convertToGif = (outFile) => {
    console.log('running ffmpeg')
    let output = child_process.execFileSync('ffmpeg',
        ['-hide_banner', '-loglevel', 'warning', '-y',
            '-i', outFile + videoExt,
            // '-c:v', 'libx264', '-vf', 'fps=' + fps, '-pix_fmt', 'yuv420p',
            "-q:v", "0",
            outFile],
        {'encoding': 'utf8'});
    console.log(output);
};

main();