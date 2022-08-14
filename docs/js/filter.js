function parse_range(range_str) {
    const single_number_pattern = /^\d+$/gm;
    const range_pattern = /^\d+-\d+$/gm

    let result = []

    let single_numbers = range_str.match(single_number_pattern);
    let ranges = range_str.match(range_pattern);

    if(single_numbers) for(let n of single_numbers) {
        result.push(parseInt(n));
    }
    if(ranges) for(let r of ranges) {
        let range = r.split('-');
        let lbound = parseInt(range[0]);
        let ubound = parseInt(range[1]);
        for(let i=lbound; i<=ubound; ++i) {
            result.push(i);
        }
    }

    return result;
}

function match_keyword(str) {
    if(str == '') return [];

    let result = new Set();
    const range_pattern = /^\d+(?:-\d+)?$/gm

    for(let id in es_data.es) {
        if(str.match(range_pattern)) {
            return parse_range(str);
        }
        else if(es_data.es[id].title.replaceAll(' ', '').indexOf(str) > -1) {
            result.add(parseInt(id));
        }
        else if(es_data.es[id].desc.replaceAll('&nbsp;', '').replaceAll('<br />', '').indexOf(str) > -1) {
            result.add(parseInt(id));
        }
        else if('keywords' in es_data.es[id]) {
            for(let keyword of es_data.es[id].keywords) {
                if(keyword.indexOf(str) > -1) {
                    result.add(parseInt(id));
                    break;
                }
            }
        }
    }

    return Array.from(result);
}

function search_data(raw_str) {
    let sop_terms = createSOPList(raw_str);
    transformSOPList(sop_terms, match_keyword);
    return reduceSOPList(sop_terms).sort((a, b) => a - b);
}

function clear_table() {
    while(es_table.rows.length > 0) {
        es_table.deleteRow(-1);
    }
}

function create_es_icon(icon_id) {
    if(icon_id < 10000) {
        return `<img class="es_icon" src="/tool_data/image/skill_icon/${icon_id}.png" />`;
    }
    else {
        let frame_src = `/tool_data/image/skill_icon/f${Math.floor(icon_id/10000)}.png`;
        icon_id %= 10000;
        return `<span class="si_frame" style="--frame-src:url(${frame_src});"><img class="es_icon" src="/tool_data/image/skill_icon/${icon_id}.png" /></span>`;
    }
}

function create_es_icons_html(icon_list) {
    let result = '';
    for(let icon_id of icon_list) {
        result += create_es_icon(icon_id);
    }
    return result;
}

function switch_icon(target) {
    let id = target.dataset.skillId;
    if('alticons' in es_data.es[id]) {
        let len = es_data.es[id].alticons.length;
        let next_index = (parseInt(target.dataset.iconIndex)+1) % (len+1);
        if(next_index == 0) {
            target.innerHTML = create_es_icons_html(es_data.es[id].icons ?? []);
        }
        else {
            target.innerHTML = create_es_icons_html(es_data.es[id].alticons[next_index-1]);
        }
        target.dataset.iconIndex = next_index;
    }
}

function reset_icon(details_element) {
    if(!details_element.open) {
        let target = details_element.querySelector('details>span.si_wrapper');
        let id = target.dataset.skillId;
        target.innerHTML = create_es_icons_html(es_data.es[id].icons ?? []);
        target.dataset.iconIndex = 0;
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

        let icons_html = create_es_icons_html(es_data.es[id].icons ?? []);
        let wrapped_icons = `<span class="si_wrapper">${icons_html}</span>`;
        let wrapped_icons_clickable = `<span class="si_wrapper" data-skill-id="${id}" data-icon-index="0" onclick="switch_icon(this)">${icons_html}</span><br />`;
        if(icons_html == '') wrapped_icons_clickable = '';
        new_row.cells[0].innerText = id.toString();
        new_row.cells[1].innerHTML = es_data.es[id].desc=='##EMPTY##' ? '' : `<details onclick="reset_icon(this)"><summary>${wrapped_icons}${es_data.es[id].title}</summary>${wrapped_icons_clickable}${es_data.es[id].desc}</details>`;
        new_row.cells[2].innerHTML = es_data.es[id].custom_desc;
    }
}

function searchES() {
    clear_table();

    let queried_es_list = search_data(filter_input.value);
    if(queried_es_list.length > 0) for(let id of queried_es_list) {
        create_row(id);
    }
    /*
    else for(let id in es_data.es) {
        create_row(id);
    }
    */
    else create_row(0);

    const a_delim = /(?<=^\S+)\s/;  // (?<=^\S+) somehow works
    document.querySelectorAll('span.annotation').forEach(ele => {
        let a_arg = ele.innerText.split(a_delim);
        if(a_arg[0] in annotation_replacers) {
            ele.outerHTML = annotation_replacers[a_arg[0]](a_arg[1] ?? '');
        }
    });

    document.querySelectorAll('div.mdc-tooltip').forEach(element => {
        let tooltip = mdc.tooltip.MDCTooltip.attachTo(element);
        tooltip.attachScrollHandler((event, handler) => {
            document.querySelector('#table_container').addEventListener(event, handler);
        });
    });

    document.getElementById('table_container').scrollTo({
        'top': 0,
        'behavior': 'smooth'
    });
}

let es_data = {
    'last_update': {
        'version': '-',
        'dv': '-',
        'time': 0
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
    /*
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
    }); */

    es_data = await fetch('/tool_data/data/es.json').then(res => res.json());
    await load_quiz_data();
    await loadMonsterData();

    const update_date = new Date(es_data.last_update.time * 1000);
    document.getElementById('last_update_version').innerText = `${es_data.last_update.version}`;
    document.getElementById('last_update_dv').innerText = `${es_data.last_update.dv}`;
    document.getElementById('last_update_time').innerText = `${update_date.toLocaleDateString()}`;

    const param = new URLSearchParams(location.search);
    let initTarget = parseInt(param.get('search'));
    if(initTarget != NaN && initTarget >= 0) {
        history.replaceState(null, '', location.pathname);
        filter_input.value = initTarget.toString();
        searchES();
    }
});
