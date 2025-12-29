const INPUTS_SIZE = 100;

function prerenderVmixWeb() {
    let inputsHTML = '';
    let mixerHTML = ``;
    ['M', 'A', 'B'].forEach(
        (bus) =>
            (mixerHTML += `
      <div id="mixer-${bus}" class="w-[95px] border border-neutral pb-1 m-1 bg-base-100 hidden">
        <div class="mixer-header p-0 bg-success text-center">
          <span class="badge my-1">${getBusName(bus, true)}</span>
        </div>
        <div class="relative pr-[12px]">
          <canvas class="volume-canvas absolute right-0 top-0 w-[10px] h-full" width="100" height="100"></canvas>
          <div class="inline-block text-center ml-1">
            <div class="volume-value mt-1">&nbsp;</div>

            <div class="flex items-center gap-1 mt-2">
              <input id="volume-${bus}" type="text" placeholder="Vol" class="input input-xs w-[40px] px-1" value="100">
              <button class="btn btn-sm btn-neutral w-[24px] h-[24px] min-h-0 rounded-xs p-1" onclick="setBusVolume('${bus}')">
                <svg class="fill-current w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"/></svg>
              </button>
            </div>

            <div class="flex items-center gap-1 mt-1">&nbsp;</div>
          </div>
        </div>

        <div class="flex items-center gap-2 w-fit mx-auto px-1 mt-2 h-[20px]">
          <button class="mute-btn btn btn-sm w-[22px] h-[22px] min-h-0 rounded-xs p-0" onclick="toggleBusAudio('${bus}')">
            <svg class="fill-current w-4 h-4 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><path d="M533.6 32.5C598.5 85.2 640 165.8 640 256s-41.5 170.7-106.4 223.5c-10.3 8.4-25.4 6.8-33.8-3.5s-6.8-25.4 3.5-33.8C557.5 398.2 592 331.2 592 256s-34.5-142.2-88.7-186.3c-10.3-8.4-11.8-23.5-3.5-33.8s23.5-11.8 33.8-3.5zM473.1 107c43.2 35.2 70.9 88.9 70.9 149s-27.7 113.8-70.9 149c-10.3 8.4-25.4 6.8-33.8-3.5s-6.8-25.4 3.5-33.8C475.3 341.3 496 301.1 496 256s-20.7-85.3-53.2-111.8c-10.3-8.4-11.8-23.5-3.5-33.8s23.5-11.8 33.8-3.5zm-60.5 74.5C434.1 199.1 448 225.9 448 256s-13.9 56.9-35.4 74.5c-10.3 8.4-25.4 6.8-33.8-3.5s-6.8-25.4 3.5-33.8C393.1 284.4 400 271 400 256s-6.9-28.4-17.7-37.3c-10.3-8.4-11.8-23.5-3.5-33.8s23.5-11.8 33.8-3.5zM301.1 34.8C312.6 40 320 51.4 320 64l0 384c0 12.6-7.4 24-18.9 29.2s-25 3.1-34.4-5.3L131.8 352 64 352c-35.3 0-64-28.7-64-64l0-64c0-35.3 28.7-64 64-64l67.8 0L266.7 40.1c9.4-8.4 22.9-10.4 34.4-5.3z"/></svg>
          </button>
          ${bus === 'M' ? '' : `<button class="bus-M btn btn-sm w-[22px] h-[20px] min-h-0 rounded-xs" onclick="toggleSendToMaster('${bus}')">M</button>`}
        </div>
      </div>`),
    );

    for (let i = 1; i <= INPUTS_SIZE; i++) {
        inputsHTML += `
          <div id="input-${i}" class="mx-1 my-1 border border-neutral relative pr-[12px] hidden">
            <canvas class="volume-canvas absolute right-0 top-0 w-[10px] h-full" width="100" height="100"></canvas>
            <button class="preview-btn btn w-64 whitespace-nowrap overflow-hidden flex h-fit min-h-0 justify-start p-0 gap-0 rounded-none" onclick="previewInput(${i})">
              <span class="badge badge-neutral mx-1 my-1 w-[24px]">${i}</span>
              <span class="input-title whitespace-nowrap overflow-hidden inline-flex flex-1"></span>
            </button>
            <div class="m-1">
              <button class="overlay1-btn btn btn-neutral w-[22px] h-[20px] min-h-0 p-0 rounded-xs" onclick="overlayInput(${i}, 1)">1</button>
              <button class="overlay2-btn btn btn-neutral w-[22px] h-[20px] min-h-0 p-0 rounded-xs" onclick="overlayInput(${i}, 2)">2</button>
              <button class="overlay3-btn btn btn-neutral w-[22px] h-[20px] min-h-0 p-0 rounded-xs" onclick="overlayInput(${i}, 3)">3</button>
              <button class="overlay4-btn btn btn-neutral w-[22px] h-[20px] min-h-0 p-0 rounded-xs" onclick="overlayInput(${i}, 4)">4</button>
              <button class="audio-btn btn btn-neutral w-fit h-[20px] min-h-0 px-2 rounded-xs" onclick="muteInput(${i})">AUDIO</button>
              <button class="loop-btn btn btn-neutral w-fit h-[20px] min-h-0 px-2 rounded-xs" onclick="loopInput(${i})">LOOP</button>
            </div>
          </div>`;

        mixerHTML += `
          <div id="mixer-${i}" class="w-[120px] border border-neutral pb-1 m-1 bg-base-100 hidden">
            <div class="mixer-header whitespace-nowrap overflow-hidden p-0">
              <span class="badge badge-neutral w-[24px] ml-1 mr-0 my-1">${i}</span>
              <span class="mixer-title whitespace-nowrap overflow-hidden text-sm p-0"></span>
            </div>
            <div class="relative pr-[12px]">
              <canvas class="volume-canvas absolute right-0 top-0 w-[10px] h-full" width="100" height="100"></canvas>
              <div class="inline-block text-center ml-1">
                <div class="volume-value mt-1"></div>

                <div class="flex items-center gap-1 mt-2">
                  <input id="volume-${i}" type="text" placeholder="Vol" class="input input-xs w-[40px] px-1" value="100">
                  <button class="btn btn-sm btn-neutral w-[24px] h-[24px] min-h-0 rounded-xs p-1" onclick="fadeInputAudio(${i})">
                    <svg class="fill-current w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"/></svg>
                  </button>
                  <span>Vol</span>
                </div>

                <div class="flex items-center gap-1 mt-2">
                  <input id="gain-${i}" type="text" placeholder="dB" class="input input-xs w-[40px] px-1" value="0">
                  <button class="btn btn-sm btn-neutral w-[24px] h-[24px] min-h-0 rounded-xs p-1" onclick="setInputGain(${i})">
                    <svg class="fill-current w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"/></svg>
                  </button>
                  <span>dB</span>
                </div>
              </div>

            </div>
            <div class="flex items-center gap-2 w-fit mx-auto px-1 mt-2 h-[22px]">
              <button class="bus-M btn btn-sm w-[22px] h-[20px] min-h-0 rounded-xs" onclick="toggleAudioBus(${i}, 'M')">M</button>
              <button class="bus-A btn btn-sm w-[22px] h-[20px] min-h-0 rounded-xs" onclick="toggleAudioBus(${i}, 'A')">A</button>
              <button class="bus-B btn btn-sm w-[22px] h-[20px] min-h-0 rounded-xs" onclick="toggleAudioBus(${i}, 'B')">B</button>
            </div>
          </div>`;
    }

    document.getElementById('vmix-inputs').innerHTML = inputsHTML;
    document.getElementById('vmix-mixer').innerHTML = mixerHTML;
}

async function renderVmixWeb() {
    const masterInput = document.getElementById('master');

    const master = getMaster();
    if (master === null) {
        hideVmixWeb();
        masterInput.classList.add('input-error');
        return;
    }
    masterInput.classList.remove('input-error');

    const vmixInfo = getVmixInfo(master);
    if (vmixInfo === null || vmixInfo.error) {
        hideVmixWeb();
        return;
    }
    showVmixWeb();
    const info = vmixInfo.value;

    const active = info.inputs[info.active];
    const preview = info.inputs[info.preview];

    const screensElem = document.getElementById('vmix-screens');
    document.getElementById('active-title').innerHTML = active.title;
    document.getElementById('preview-title').innerHTML = preview.title;
    document.getElementById('active-progress').innerHTML = getInputProgress(active);
    document.getElementById('preview-progress').innerHTML = getInputProgress(preview);

    const ftbBtn = screensElem.querySelector('.ftb-btn');
    if (info.fadeToBlack) {
        ftbBtn.classList.remove('btn-neutral');
        ftbBtn.classList.add('btn-error');
    } else {
        ftbBtn.classList.add('btn-neutral');
        ftbBtn.classList.remove('btn-error');
    }

    const inputLength = info.inputs.length;
    for (let i = inputLength; i <= INPUTS_SIZE; i++) {
        const inputElem = document.getElementById('input-' + i);
        inputElem.classList.add('hidden');
        inputElem.classList.remove('inline-block');

        const mixerElem = document.getElementById('mixer-' + i);
        mixerElem.classList.add('hidden');
        mixerElem.classList.remove('inline-block');
    }

    ['M', 'A', 'B'].forEach((bus) => {
        const mixerElem = document.getElementById('mixer-' + bus);
        const busInfo = info.audio[getBusName(bus)];
        if (busInfo === undefined) {
            mixerElem.classList.add('hidden');
            mixerElem.classList.remove('inline-block');
            return;
        }
        const busHeader = mixerElem.querySelector('.mixer-header');
        setColor(busHeader, busInfo.muted === 'False', false, 'bg');
        mixerElem.classList.add('inline-block');
        mixerElem.classList.remove('hidden');
        const volumeElem = mixerElem.querySelector('.volume-value');
        volumeElem.innerHTML = Math.round(busInfo.volume) + '%';
        const volumeCanvas = mixerElem.querySelector('.volume-canvas');
        drawAudioLevels(volumeCanvas, busInfo);
        const muteBtn = mixerElem.querySelector('.mute-btn');
        setColor(muteBtn, busInfo.muted === 'False');
        if (bus !== 'M') {
            const sendToMasterBtn = mixerElem.querySelector('.bus-M');
            setColor(sendToMasterBtn, busInfo.sendToMaster === 'True');
        }
    });

    info.inputs.forEach((input, i) => {
        // Render input tile
        const inputElem = document.getElementById('input-' + i);
        inputElem.classList.add('inline-block');
        inputElem.classList.remove('hidden');
        inputElem.querySelector('.input-title').innerHTML = getResponsiveTitle(input.title);
        const previewBtn = inputElem.querySelector('.preview-btn');
        setColor(previewBtn, i === info.active, i === info.preview);

        const overlay1Btn = inputElem.querySelector('.overlay1-btn');
        setColor(overlay1Btn, info.overlays[1] === i);
        const overlay2Btn = inputElem.querySelector('.overlay2-btn');
        setColor(overlay2Btn, info.overlays[2] === i);
        const overlay3Btn = inputElem.querySelector('.overlay3-btn');
        setColor(overlay3Btn, info.overlays[3] === i);
        const overlay4Btn = inputElem.querySelector('.overlay4-btn');
        setColor(overlay4Btn, info.overlays[4] === i);

        const audioBtn = inputElem.querySelector('.audio-btn');
        setColor(audioBtn, input.muted === 'False');
        if (input.volume === undefined) {
            audioBtn.classList.add('invisible');
        } else {
            audioBtn.classList.remove('invisible');
        }
        const loopBtn = inputElem.querySelector('.loop-btn');
        setColor(loopBtn, input.loop === 'True');
        if (input.type === 'Image') {
            loopBtn.classList.add('invisible');
        } else {
            loopBtn.classList.remove('invisible');
        }
        drawAudioLevels(inputElem.querySelector('.volume-canvas'), input);

        // Render input audio mixer
        const mixerElem = document.getElementById('mixer-' + i);
        if (input.volume === undefined) {
            mixerElem.classList.add('hidden');
            mixerElem.classList.remove('inline-block');
            return;
        }
        mixerElem.classList.add('inline-block');
        mixerElem.classList.remove('hidden');

        mixerElem.querySelector('.mixer-title').innerHTML = input.title;
        const mixerHeader = mixerElem.querySelector('.mixer-header');
        setColor(mixerHeader, input.muted === 'False', false, 'bg');

        drawAudioLevels(mixerElem.querySelector('.volume-canvas'), input);

        const volumeValue = mixerElem.querySelector('.volume-value');
        volumeValue.innerHTML = getInputVolume(input);

        const busM = mixerElem.querySelector('.bus-M');
        setColor(busM, input.audiobusses.includes('M'));
        const busA = mixerElem.querySelector('.bus-A');
        setColor(busA, input.audiobusses.includes('A'));
        const busB = mixerElem.querySelector('.bus-B');
        setColor(busB, input.audiobusses.includes('B'));
    });
}

function getMaster() {
    const master = parseInt(document.getElementById('master').value);
    return isNaN(master) ? null : master;
}

function getMasterInfo() {
    const master = getMaster();
    const info = getVmixInfo(master)?.value;
    if (info === undefined || info === null) {
        showError('Internal Error', "Couldn't fetch vMix status for box " + master);
        return null;
    }
    return info;
}

function getSlaves() {
    const slaves = document.getElementById('slaves').value;
    return parseNumbers(slaves);
}

function hideVmixWeb() {
    const vmixContainer = document.getElementById('vmix-container');
    vmixContainer.classList.add('hidden');
}

function showVmixWeb() {
    const vmixContainer = document.getElementById('vmix-container');
    vmixContainer.classList.remove('hidden');
}

function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (num) => String(num).padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

function getInputProgress(input) {
    if (input.duration === '0') return '';
    console.assert(['Video', 'AudioFile', 'Photos'].includes(input.type));
    const duration = parseInt(input.duration);
    const position = parseInt(input.position);
    const remaining = duration - position;

    if (input.type === 'Photos') {
        return `${position} / ${duration} / ${remaining}`;
    }
    return `${formatTime(position)} / ${formatTime(duration)} / ${formatTime(remaining)}`;
}

function getInputVolume(input) {
    let gain = '';
    if (input.gainDb !== undefined && input.gainDb !== '0') {
        gain = ' | ' + Math.round(input.gainDb * 100) / 100 + 'dB';
    }
    return Math.round(input.volume) + '%' + gain;
}

function setColor(elem, active, preview = false, type = 'btn') {
    // bg-neutral bg-success bg-warning
    // btn-neutral btn-success btn-warning
    if (active) {
        elem.classList.remove(type + '-neutral');
        elem.classList.add(type + '-success');
        elem.classList.remove(type + '-warning');
    } else if (preview) {
        elem.classList.remove(type + '-neutral');
        elem.classList.remove(type + '-success');
        elem.classList.add(type + '-warning');
    } else {
        elem.classList.add(type + '-neutral');
        elem.classList.remove(type + '-success');
        elem.classList.remove(type + '-warning');
    }
}
