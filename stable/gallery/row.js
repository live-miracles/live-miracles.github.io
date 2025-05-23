import {
    updateUrlParams,
    extractYouTubeId,
    getRowName,
    getRowType,
    getRowValue,
    getAvailableMics,
} from './tools.js';
import { createBox, addBox, getBoxes, updateBoxNumbers } from './box.js';

function getRowNumber(row) {
    return parseInt(row.querySelector('.row-number').textContent);
}

function createRow(name, type, value, number = '') {
    const div = document.createElement('div');
    div.className = 'row flex items-center gap-1 rounded-xs';

    div.innerHTML = `
        <span class="handle badge cursor-grab">
            <svg class="fill-current w-3 h-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M0 96C0 78.3 14.3 64 32 64l384 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 128C14.3 128 0 113.7 0 96zM0 256c0-17.7 14.3-32 32-32l384 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 288c-17.7 0-32-14.3-32-32zM448 416c0 17.7-14.3 32-32 32L32 448c-17.7 0-32-14.3-32-32s14.3-32 32-32l384 0c17.7 0 32 14.3 32 32z"/></svg>
        </span>
        <span class="row-number badge badge-neutral w-9 min-w-9">${number}</span>
        <input type="text" placeholder="Name" value="${name}" class="row-name input input-xs w-36 ml-0" />
        <select class="row-type select select-xs w-36">
          <option value="YT" ${type === 'YT' ? 'selected' : ''}>YT (YouTube)</option>
          <option value="YN" ${type === 'YN' ? 'selected' : ''}>YN (YouTube with enhanced privacy)</option>
          <option value="JW" ${type === 'JW' ? 'selected' : ''}>JW (JW Player)</option>
          <option value="VC" ${type === 'VC' ? 'selected' : ''}>VC (VdoCipher Player)</option>
          <option value="SS" ${type === 'SS' ? 'selected' : ''}>SS (Screen Share)</option>
          <option value="FB" ${type === 'FB' ? 'selected' : ''}>FB (Facebook)</option>
          <option value="CU" ${type === 'CU' ? 'selected' : ''}>CU (Custom)</option>
        </select>
        ${
            type === 'SS'
                ? `
            <select class="row-value mic-select row-type select select-xs mx-1 flex-1">
                <option value="" disabled>Select Microphone</option>
                ${window.mics.map(
                    (mic) => `
                    <option
                        value="${mic.deviceId}"
                        ${value === mic.deviceId ? 'selected' : ''}>
                        ${mic.label}
                    </option>`,
                )}
            </select>`
                : `<input type="text" placeholder="ID" value="${value}" class="row-value input input-xs flex-1" />`
        }
        <button class="reset-btn btn btn-xs btn-secondary">
          <svg class="fill-current w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M386.3 160L336 160c-17.7 0-32 14.3-32 32s14.3 32 32 32l128 0c17.7 0 32-14.3 32-32l0-128c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 51.2L414.4 97.6c-87.5-87.5-229.3-87.5-316.8 0s-87.5 229.3 0 316.8s229.3 87.5 316.8 0c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0c-62.5 62.5-163.8 62.5-226.3 0s-62.5-163.8 0-226.3s163.8-62.5 226.3 0L386.3 160z"/></svg>
        </button>

        <button class="close-btn btn btn-xs btn-error">
          <svg class="fill-current w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"/></svg>
        </button>`;

    const rowNameInput = div.querySelector('.row-name');
    const rowTypeInput = div.querySelector('.row-type');
    const rowValueInput = div.querySelector('.row-value');
    const closeBtn = div.querySelector('.close-btn');
    const resetBtn = div.querySelector('.reset-btn');

    rowTypeInput.onchange = (e) => {
        const newRow = createRow(rowNameInput.value, rowTypeInput.value, '', getRowNumber(div));
        div.parentElement.replaceChild(newRow, div);
    };

    if (type === 'SS' && window.mics.length === 0) {
        (async () => {
            window.mics = await getAvailableMics();
            const newRow = createRow(
                rowNameInput.value,
                rowTypeInput.value,
                value,
                getRowNumber(div),
            );
            div.parentElement.replaceChild(newRow, div);
            updateUrlParams();
        })();
    }

    rowValueInput.onpaste = (e) => {
        if (type === 'YT') {
            e.preventDefault();
            const paste = e.clipboardData.getData('text');
            e.target.value = extractYouTubeId(paste);
        }
    };

    closeBtn.onclick = (e) => {
        const row = e.currentTarget.parentElement;
        row.parentElement.removeChild(row);

        updateRowNumbers();
        updateUrlParams();
    };

    resetBtn.onclick = (e) => {
        const row = e.currentTarget.parentElement;
        const boxLength = getBoxes().length;
        const rowIndex = getRowNumber(row);

        const rows = getRows();
        for (let i = boxLength; i < rowIndex; i++) {
            const cur = rows[i];
            addBox(getRowName(cur), getRowType(cur), getRowValue(cur));
        }

        if (rowIndex <= boxLength) {
            resetBox(row);
        }
        updateBoxNumbers();
        updateUrlParams();

        document.getElementById('init-unmute').click();
    };

    return div;
}

function addRow(name = '', type = 'YT', value = '') {
    const dataRows = document.getElementById('data-rows');
    dataRows.appendChild(createRow(name, type, value));
    updateRowNumbers();
}

function resetBox(row) {
    const number = getRowNumber(row);
    const boxes = getBoxes();
    console.assert(number <= boxes.length);
    const box = boxes[number - 1];
    const newBox = createBox(getRowName(row), getRowType(row), getRowValue(row));
    box.parentElement.replaceChild(newBox, box);
}

function getRows() {
    return document.getElementById('data-rows').querySelectorAll('.row');
}

function updateRowNumbers() {
    document.querySelectorAll('.row').forEach((row, i) => {
        row.querySelector('.row-number').textContent = i + 1;
    });
}

export { addRow, updateRowNumbers };
