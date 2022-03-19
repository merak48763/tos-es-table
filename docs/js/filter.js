function parse_range(raw_str) {
    const single_number_pattern = /(?<![0-9\-])\d+(?![0-9\-])/gm;
    const range_pattern = /\d+-\d+/gm;

    let result = new Set();

    let single_numbers = raw_str.match(single_number_pattern);
    let ranges = raw_str.match(range_pattern);

    if(single_numbers) for(let n of single_numbers) {
        result.add(parseInt(n));
    }
    if(ranges) for(let r of ranges) {
        let range = r.split('-');
        let lbound = parseInt(range[0]);
        let ubound = parseInt(range[1]);
        for(let i=lbound; i<=ubound; ++i) {
            result.add(i);
        }
    }

    return Array.from(result).sort((a, b) => a - b);
}

function clear_table() {
    while(es_table.rows.length > 1) {
        es_table.deleteRow(-1);
    }
}

function create_row(id) {
    if(id in es_data.es) {
        let new_row = es_table.insertRow(-1);
        new_row.classList.add('mdc-data-table__row');
        for(let i=0; i<3; ++i) {
            new_row.insertCell();
            new_row.cells[i].classList.add('mdc-data-table__cell');
        }

        new_row.cells[0].innerText = id.toString();
        es_details = [es_data.es[id].title, es_data.es[id].desc];
        new_row.cells[1].innerHTML = "<details><summary>{0}</summary>{1}</details>".replace(/{(\d+)}/gm, (m, n) => es_details[n]);
        new_row.cells[2].innerHTML = es_data.es[id].custom_desc;
    }
}

function searchES() {
    clear_table();

    let queried_es_set = parse_range(filter_input.value);
    if(queried_es_set.length > 0) for(let id of queried_es_set) {
        create_row(id);
    }
    else for(let id in es_data.es) {
        create_row(id);
    }
}

let es_data = {
    'last_update': {
        'version': '48.763',
        'date': '2020/11/06'
    },
    'es': {
        '0': {
            'title': '沒有技能',
            'desc': '沒有技能',
            'custom_desc': ''
        }
    }
};

$(async function() {
    await new Promise((resolve, reject) => {
        $.ajax({
            'type': 'GET',
            'url': '/tool_data/data/es.json',
            'success': e => {
                es_data = e;
                resolve();
            },
            'error': e => {
                console.error(e);
                reject();
            }
        });
    });

    document.getElementById('last_update_version').innerText = es_data.last_update.version;
});
