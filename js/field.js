const relFields = $('#relFields');
const flags = $('#flags');

const setings = $('#setings').children('input');
let rows = setings[0].value;
let cols = setings[1].value;
let leveles = setings[2].value;
let mines = setings[3].value;
var mineCkets = [];
var isFirstClick = true;

function setFieldes() {
    for (let l = 0; l < leveles; l++) {
        relFields.append('<table border="1" class="field"></table>');
        let field = $('.field')[l];
        for (let r = 0; r < rows; r++) {
            $(field).append('<tr></tr>');
            let row = $(field).children('tr')[r];
            for (let c = 0; c < cols; c++) {
                $(row).append('<td></td>');
                let cell = $(row).children('td')[c];
                $(cell).attr('id', 'l' + l + 'r' + r + 'c' + c);
                $(cell).addClass('cell');
                $(cell).attr('onclick', 'openCell(this)');

                $(cell).on('mouseenter', function () { paintNaighbors(this, 'on') });
                $(cell).on('mouseleave', function () { paintNaighbors(this, 'off') });

                // Добавляем обработчик правой кнопки мыши для флажка
                $(cell).on('contextmenu', function (e) {
                    e.preventDefault();
                    toggleFlag(this);
                });
            }
        }
    }
}
setFieldes();
$(document).on('input', function () {
    rows = setings[0].value;
    cols = setings[1].value;
    leveles = setings[2].value;
    mines = setings[3].value;

    isFirstClick = true;
    relFields.empty();
    setFieldes();
});

function openCell(cell) {
    // Если клетка уже открыта и содержит число
    if ($(cell).css('background-color') === 'rgb(34, 34, 34)' && $(cell).text().length > 0) {
        let cellId = $(cell).attr('id');
        let l = parseCellId(cellId).l;
        let r = parseCellId(cellId).r;
        let c = parseCellId(cellId).c;
        let number = parseInt($(cell).text());

        // 6 соседей
        let nghbrs = [
            { l: l - 1, r: r, c: c },
            { l: l + 1, r: r, c: c },
            { l: l, r: r - 1, c: c },
            { l: l, r: r + 1, c: c },
            { l: l, r: r, c: c - 1 },
            { l: l, r: r, c: c + 1 }
        ];

        // Считаем количество флажков вокруг
        let flagCount = 0;
        nghbrs.forEach(nghbr => {
            let nghbrId = `#l${nghbr.l}r${nghbr.r}c${nghbr.c}`;
            if ($(nghbrId).hasClass('flagged')) flagCount++;
        });

        if (flagCount >= number) {
            // Открываем все неоткрытые и неотмеченные клетки вокруг
            nghbrs.forEach(nghbr => {
                let nghbrId = `#l${nghbr.l}r${nghbr.r}c${nghbr.c}`;
                let $nghbr = $(nghbrId);
                if ($nghbr.length &&
                    !$nghbr.hasClass('flagged') &&
                    $nghbr.css('background-color') !== 'rgb(34, 34, 34)' &&
                    $nghbr.css('background-color') !== 'rgb(255, 0, 0)'
                ) {
                    openCell($nghbr[0]);
                }
            });
        }
        return; // Не продолжаем обычное открытие
    }

    let cellId = $(cell).attr('id');
    let l = parseCellId(cellId).l;
    let r = parseCellId(cellId).r;
    let c = parseCellId(cellId).c;

    // Генерация мин только после первого клика
    if (isFirstClick) {
        isFirstClick = false;
        generateMinesAfterFirstClick(l, r, c);

        $('#submitButton').html('restart');
    }

    let isMine = false;
    mineCkets.forEach(clet => {
        if (clet.l == l && clet.r == r && clet.c == c) {
            isMine = true;
        }
    });

    if (isMine) {
        $(cell).css('background-color', 'red');
        revealAllMines();
    } else {
        $(cell).css('background-color', '#222');
        countMinesAround(l, r, c);
    }
}

// Генерация мин с учётом исключённых клеток
function generateMinesAfterFirstClick(l, r, c) {
    mineCkets = [];
    // Собираем запрещённые клетки (сама и соседи)
    let forbidden = new Set();
    for (let dl = -1; dl <= 1; dl++) {
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                let key = `${l + dl},${r + dr},${c + dc}`;
                forbidden.add(key);
            }
        }
    }
    // Генерируем мины 
    while (mineCkets.length < mines) {
        let ml = Math.floor(Math.random() * leveles);
        let mr = Math.floor(Math.random() * rows);
        let mc = Math.floor(Math.random() * cols);
        let key = `${ml},${mr},${mc}`;
        if (!forbidden.has(key) && !mineCkets.some(m => m.l === ml && m.r === mr && m.c === mc)) {
            mineCkets.push({ l: ml, r: mr, c: mc });
        }
    }
}

function revealAllMines() {
    mineCkets.forEach(clet => {
        let mineId = `#l${clet.l}r${clet.r}c${clet.c}`;
        $(mineId).css('background-color', 'red');
    });
}

function countMinesAround(l, r, c) {
    var count = 0;
    let cletId = `#l${l}r${r}c${c}`;
    var nghbrs = [
        { l: l - 1, r: r, c: c }, // слой ниже
        { l: l + 1, r: r, c: c }, // слой выше
        { l: l, r: r - 1, c: c }, // строка выше
        { l: l, r: r + 1, c: c }, // строка ниже
        { l: l, r: r, c: c - 1 }, // столбец левее
        { l: l, r: r, c: c + 1 }  // столбец правее
    ];

    nghbrs.forEach(nghbr => {
        mineCkets.forEach(clet => {
            if (clet.l == nghbr.l && clet.r == nghbr.r && clet.c == nghbr.c) {
                count++;
            }
        });
    });

    if (count > 0) {
        $(cletId).text(count);
    } else {
        $(cletId).css('background-color', '#222');
        $(cletId).text('');
        nghbrs.forEach(nghbr => {
            let nghbrId = `#l${nghbr.l}r${nghbr.r}c${nghbr.c}`;
            if ($(nghbrId).length) {
                let currentColor = $(nghbrId).css('background-color');
                if (currentColor !== 'rgb(255, 0, 0)' && currentColor !== 'rgb(34, 34, 34)') {
                    openCell($(nghbrId)[0]);
                }
            }
        });
    }
}

function paintNaighbors(cell, state) {
    let cellId = $(cell).attr('id');
    let l = parseCellId(cellId).l;
    let r = parseCellId(cellId).r;
    let c = parseCellId(cellId).c;

    let Cell = $(`#l${l}r${r}c${c}`);

    var nghbrs = [
        { l: l - 1, r: r, c: c }, // слой ниже
        { l: l + 1, r: r, c: c }, // слой выше
        { l: l, r: r - 1, c: c }, // строка выше
        { l: l, r: r + 1, c: c }, // строка ниже
        { l: l, r: r, c: c - 1 }, // столбец левее
        { l: l, r: r, c: c + 1 }  // столбец правее
    ];

    nghbrs.forEach(nghbr => {
        let nghbrId = `#l${nghbr.l}r${nghbr.r}c${nghbr.c}`;
        if ($(nghbrId).length) {
            let currentColor = $(nghbrId).css('background-color');

            if (currentColor !== 'rgb(34, 34, 34)' && currentColor !== 'rgb(255, 0, 0)') {
                if (state == 'on') {
                    $(nghbrId).css('background-color', '#335');
                } else {
                    $(nghbrId).css('background-color', '#333');
                }
            }

            if (Cell.css('background-color') !== 'rgb(34, 34, 34)' && Cell.css('background-color') !== 'rgb(255, 0, 0)') {
                if (state == 'on') {
                    $(Cell).css('background-color', '#446');

                } else {
                    $(Cell).css('background-color', '#333');
                }
            }
        }
    });
}

var flagsCount = mines;
$(flags).html('🏳️: ' + flagsCount);
function toggleFlag(cell) {
    // Проверяем, открыта ли клетка (цвет #222 или rgb(34, 34, 34))
    let bg = $(cell).css('background-color');
    if (bg !== 'rgb(34, 34, 34)') {
        // Если уже стоит флажок — убираем, иначе ставим
        if ($(cell).hasClass('flagged')) {
            $(cell).removeClass('flagged');
            $(cell).html('');
            flagsCount++;
            $(flags).html('🏳️: ' + flagsCount);
        } else {
            $(cell).addClass('flagged');
            $(cell).html('🏳️');
            flagsCount--;
            $(flags).html('🏳️: ' + flagsCount);
        }
    }
}

function parseCellId(cellId) {
    // Ожидает id вида "l{l}r{r}c{c}"
    let match = cellId.match(/^l(\d+)r(\d+)c(\d+)$/);
    if (!match) return null;
    return {
        l: parseInt(match[1], 10),
        r: parseInt(match[2], 10),
        c: parseInt(match[3], 10)
    };
}