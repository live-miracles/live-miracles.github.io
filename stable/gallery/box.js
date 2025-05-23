import { getPlayer } from './players.js';
import { generateUUID } from './tools.js';

// ===== Box Top Buttons =====
function expandBox(e) {
    const box = e.currentTarget.parentElement.parentElement;
    box.classList.toggle('expanded');
}

function refreshBox(e) {
    const box = e.currentTarget.parentElement.parentElement;
    const player = box.querySelector('.player');

    box.removeChild(player);
    box.appendChild(
        getPlayer(
            box.getAttribute('data-type'),
            box.getAttribute('data-value'),
            box.getAttribute('data-id'),
        ),
    );
}

function muteOthers(e) {
    const box = e.currentTarget.parentElement.parentElement;
    getBoxes().forEach((b) => {
        if (b !== box) {
            muteBox(b);
        }
    });
    unmuteBox(box);
}

function createBox(name, type, value) {
    const id = generateUUID();
    const box = document.createElement('div');
    box.setAttribute('data-name', name);
    box.setAttribute('data-type', type);
    box.setAttribute('data-value', value);
    box.setAttribute('data-id', id);
    box.className =
        'box relative w-[279px] h-[150px] overflow-hidden rounded-lg bg-slate-700 m-1 border border-neutral';
    box.innerHTML = `
      <div class="top-btn-container absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 hidden w-full text-center">
          <button class="expand-btn btn btn-circle btn-xs">
            <svg class="fill-current w-3 h-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M32 32C14.3 32 0 46.3 0 64l0 96c0 17.7 14.3 32 32 32s32-14.3 32-32l0-64 64 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L32 32zM64 352c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 96c0 17.7 14.3 32 32 32l96 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-64 0 0-64zM320 32c-17.7 0-32 14.3-32 32s14.3 32 32 32l64 0 0 64c0 17.7 14.3 32 32 32s32-14.3 32-32l0-96c0-17.7-14.3-32-32-32l-96 0zM448 352c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 64-64 0c-17.7 0-32 14.3-32 32s14.3 32 32 32l96 0c17.7 0 32-14.3 32-32l0-96z"/></svg>
          </button>

          <button class="refresh-btn btn btn-circle btn-xs">
            <svg class="fill-current w-3 h-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M463.5 224l8.5 0c13.3 0 24-10.7 24-24l0-128c0-9.7-5.8-18.5-14.8-22.2s-19.3-1.7-26.2 5.2L413.4 96.6c-87.6-86.5-228.7-86.2-315.8 1c-87.5 87.5-87.5 229.3 0 316.8s229.3 87.5 316.8 0c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0c-62.5 62.5-163.8 62.5-226.3 0s-62.5-163.8 0-226.3c62.2-62.2 162.7-62.5 225.3-1L327 183c-6.9 6.9-8.9 17.2-5.2 26.2s12.5 14.8 22.2 14.8l119.5 0z"/></svg>
          </button>

          <span class="box-number badge badge-neutral"></span>

          <button class="mute-btn btn btn-circle btn-xs">
            <svg class="swap-on fill-current w-3 h-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><path d="M533.6 32.5C598.5 85.2 640 165.8 640 256s-41.5 170.7-106.4 223.5c-10.3 8.4-25.4 6.8-33.8-3.5s-6.8-25.4 3.5-33.8C557.5 398.2 592 331.2 592 256s-34.5-142.2-88.7-186.3c-10.3-8.4-11.8-23.5-3.5-33.8s23.5-11.8 33.8-3.5zM473.1 107c43.2 35.2 70.9 88.9 70.9 149s-27.7 113.8-70.9 149c-10.3 8.4-25.4 6.8-33.8-3.5s-6.8-25.4 3.5-33.8C475.3 341.3 496 301.1 496 256s-20.7-85.3-53.2-111.8c-10.3-8.4-11.8-23.5-3.5-33.8s23.5-11.8 33.8-3.5zm-60.5 74.5C434.1 199.1 448 225.9 448 256s-13.9 56.9-35.4 74.5c-10.3 8.4-25.4 6.8-33.8-3.5s-6.8-25.4 3.5-33.8C393.1 284.4 400 271 400 256s-6.9-28.4-17.7-37.3c-10.3-8.4-11.8-23.5-3.5-33.8s23.5-11.8 33.8-3.5zM301.1 34.8C312.6 40 320 51.4 320 64l0 384c0 12.6-7.4 24-18.9 29.2s-25 3.1-34.4-5.3L131.8 352 64 352c-35.3 0-64-28.7-64-64l0-64c0-35.3 28.7-64 64-64l67.8 0L266.7 40.1c9.4-8.4 22.9-10.4 34.4-5.3z"/></svg>
          </button>

          <button class="solo-btn btn btn-circle btn-xs">
            <svg class="swap-on fill-current w-3 h-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path d="M99.1 105.4C79 114 68.2 127.2 65.2 144.8c-2.4 14.1-.7 23.2 2 29.4c2.8 6.3 7.9 12.4 16.7 18.6c19.2 13.4 48.3 22.1 84.9 32.5c1 .3 1.9 .6 2.9 .8c32.7 9.3 72 20.6 100.9 40.7c15.7 10.9 29.9 25.5 38.6 45.1c8.8 19.8 10.8 42 6.6 66.3c-7.3 42.5-35.3 71.7-71.8 87.3c-35.4 15.2-79.1 17.9-123.7 10.9l-.2 0s0 0 0 0c-24-3.9-62.7-17.1-87.6-25.6c-4.8-1.7-9.2-3.1-12.8-4.3C5.1 440.8-3.9 422.7 1.6 405.9s23.7-25.8 40.5-20.3c4.9 1.6 10.2 3.4 15.9 5.4c25.4 8.6 56.4 19.2 74.4 22.1c36.8 5.7 67.5 2.5 88.5-6.5c20.1-8.6 30.8-21.8 33.9-39.4c2.4-14.1 .7-23.2-2-29.4c-2.8-6.3-7.9-12.4-16.7-18.6c-19.2-13.4-48.3-22.1-84.9-32.5c-1-.3-1.9-.6-2.9-.8c-32.7-9.3-72-20.6-100.9-40.7c-15.7-10.9-29.9-25.5-38.6-45.1c-8.8-19.8-10.8-42-6.6-66.3l31.5 5.5L2.1 133.9C9.4 91.4 37.4 62.2 73.9 46.6c35.4-15.2 79.1-17.9 123.7-10.9c13 2 52.4 9.6 66.6 13.4c17.1 4.5 27.2 22.1 22.7 39.2s-22.1 27.2-39.2 22.7c-11.2-3-48.1-10.2-60.1-12l4.9-31.5-4.9 31.5c-36.9-5.8-67.5-2.5-88.6 6.5z"/></svg>
          </button>
      </div>

      <div class="box-name badge badge-neutral absolute left-1/2 transform -translate-x-1/2 bottom-1 z-10"><span class="opacity-100 whitespace-nowrap">${name}</span></div>`;

    box.querySelector('.expand-btn').onclick = expandBox;
    box.querySelector('.refresh-btn').onclick = refreshBox;
    box.querySelector('.solo-btn').onclick = muteOthers;

    box.appendChild(getPlayer(type, value, id));
    return box;
}

function addBox(name = '', type = 'YT', value = '') {
    const gallery = document.getElementById('gallery');
    gallery.appendChild(createBox(name, type, value));
    updateBoxNumbers();
}

function getBoxes() {
    return document.getElementById('gallery').querySelectorAll('.box');
}

function muteBox(box) {
    if (box.classList.contains('unmuted')) {
        box.querySelector('.mute-btn').click();
    }
}

function unmuteBox(box) {
    if (!box.classList.contains('unmuted')) {
        box.querySelector('.mute-btn').click();
    }
}

function updateBoxNumbers() {
    getBoxes().forEach((box, i) => {
        box.querySelector('.box-number').textContent = i + 1;
    });
}

export { createBox, addBox, getBoxes, muteBox, unmuteBox, updateBoxNumbers };
