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

function custom_es_icon(icon_id) {
    if(icon_id < 10000) {
        return `<img class="es_icon" src="/tool_data/image/skill_icon/${icon_id}.png" />`;
    }
    else {
        let frame_src = `/tool_data/image/skill_icon/f${Math.floor(icon_id/10000)}.png`;
        icon_id %= 10000;
        return `<span class="si_frame" style="--frame-src:url(${frame_src});"><img class="es_icon" src="/tool_data/image/skill_icon/${icon_id}.png" /></span>`;
    }
}

const POST_PROCESS_CROP = new Set([
    122, 123, 124, 155, 188, 193, 230, 246, 281, 347,
    348, 792, 793, 794, 795, 796, 834, 1001, 1002, 1003,
    1005, 1006, 1008, 1009, 1010, 1011, 1012, 1013, 1014, 1015,
    1017, 1018, 1019, 1020, 1023, 1024, 1025, 1026, 1028, 1029,
    1030, 1031, 1032, 1034, 1035, 1036, 1037, 1038, 1039, 1040,
    1041, 1043, 1044, 1045, 1046, 1047, 1048, 1049, 1050, 1051,
    1052, 1053, 1054, 1055, 1057, 1058, 1059, 1060, 1061, 1062,
    1063, 1064, 1065, 1068, 1070, 1071, 1072, 1073, 1074, 1076,
    1077, 1088, 1089, 1090, 1091, 1092, 1093, 1094, 1095, 1096,
    1097, 1098, 1101, 1102, 1103, 1104, 1109, 1110, 1111, 1112,
    1113, 1114, 1115, 1116, 1117, 1118, 1119,
]);
function standard_es_icon_post_process(icon_id) {
    icon_id = parseInt(icon_id);
    if(POST_PROCESS_CROP.has(icon_id)) {
        return ["es_icon--crop"];
    }
    return [];
}

function standard_es_icon(icon_id) {
    const classNames = [
        "es_icon",
        ...standard_es_icon_post_process(icon_id),
    ];
    if(icon_id == 185) {
        // 9+combo icon fix
        return custom_es_icon(59);
    }
    return `<img class="${classNames.join(" ")}" src="/tool_data/image/standard_icon/ICON${icon_id.toString().padStart(3, "0")}.png" />`;
}

function create_custom_icons_html(icon_list) {
    let result = '';
    for(let icon_id of icon_list) {
        result += custom_es_icon(icon_id);
    }
    return result;
}

function create_standard_icons_html(icon_list) {
    return icon_list.map(standard_es_icon).join("");
}

function create_icons_html(es_id) {
    // standard icon as fallback
    return "icons" in es_data.es[es_id]
        ? create_custom_icons_html(es_data.es[es_id].icons)
        : create_standard_icons_html(es_data.standard_icons[es_id] ?? []);
/*
    // custom icon as fallback
    return id in es_data.standard_icons
        ? create_standard_icons_html(es_data.standard_icons[id])
        : create_custom_icons_html(es_data.es[id].icons ?? []);
*/
}

function switch_icon(target) {
    let id = target.dataset.skillId;
    if("alticons" in es_data.es[id] && "icons" in es_data.es[id]) {
        let len = es_data.es[id].alticons.length;
        let next_index = (parseInt(target.dataset.iconIndex)+1) % (len+1);
        if(next_index == 0) {
            target.innerHTML = create_custom_icons_html(es_data.es[id].icons ?? []);
        }
        else {
            target.innerHTML = create_custom_icons_html(es_data.es[id].alticons[next_index-1]);
        }
        target.dataset.iconIndex = next_index;
    }
}

function reset_icon(details_element) {
    if(!details_element.open) {
        let target = details_element.querySelector('details>span.si_wrapper');
        let id = target.dataset.skillId;
        target.innerHTML = create_icons_html(id);
        target.dataset.iconIndex = 0;
    }
}

function partial_fold(desc) {
    //const title0_pat = /#title0#(.*?)<br\s*\/>#desc0#/g;
    //const title1_pat = /#title1#(.*?)<br\s*\/>#desc1#/g;
    //return desc.replace(title0_pat, '<span class="title0">$1</span><br />').replace(title1_pat, '<span class="title1">$1</span><br />');

    const title0_pat = /#title0#(.*?)<br\s\/>#desc0#(.*?)(?=#title0#|$)/g;
    const title1_pat = /#title1#(.*?)<br\s\/>#desc1#(.*?)(?=#title[01]#|$)/g;
    const empty_line_pat = /<\/summary><br\s\/>/g;
    return desc.replace(title1_pat, '<details class="title1"><summary>$1</summary>$2</details>').replace(title0_pat, '<details class="title0"><summary>$1</summary>$2</details>').replace(empty_line_pat, '</summary>');
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

        const icons_html = create_icons_html(id);
        let desc_html = partial_fold(es_data.es[id].desc);
        if(es_data.es[id].desc=='##EMPTY##') {
            new_row.cells[1].innerHTML = '';
        }
        else if(icons_html == '') {
            new_row.cells[1].innerHTML = `<details><summary><span class="si_wrapper">${icons_html}</span>${es_data.es[id].title}</summary>${desc_html}</details>`
        }
        else {
            new_row.cells[1].innerHTML = `<details ontoggle="reset_icon(this)"><summary><span class="si_wrapper">${icons_html}</span>${es_data.es[id].title}</summary><span class="si_wrapper" data-skill-id="${id}" data-icon-index="0" onclick="switch_icon(this)">${icons_html}</span><br />${desc_html}</details>`
        }

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
        let a_arg = ele.innerHTML.split(a_delim);
        if(a_arg[0] in annotation_replacers) {
            ele.outerHTML = annotation_replacers[a_arg[0]](a_arg[1] ?? '');
        }
    });

    document.querySelectorAll('div.mdc-tooltip').forEach(element => {
        let tooltip = mdc.tooltip.MDCTooltip.attachTo(element);
        const table_container = document.querySelector('#table_container');
        tooltip.attachScrollHandler((event, handler) => {
            table_container.addEventListener(event, handler);
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
    },
    "standard_icons": {}
};

window.addEventListener("load", async function() {
    es_data = await fetch('/tool_data/data/es.json').then(res => res.json());
    await load_quiz_data();
    await loadMonsterData();
    if(es_data) document.querySelector("#loading_dialog").remove();

    const update_date = new Date(es_data.last_update.time * 1000);
    document.getElementById('last_update_version').innerHTML = `${es_data.last_update.version}`;
    document.getElementById('last_update_dv').innerHTML = `${es_data.last_update.dv}`;
    document.getElementById('last_update_time').innerHTML = `${update_date.toLocaleDateString()}`;

    const param = new URLSearchParams(location.search);
    let initTarget = parseInt(param.get('search'));
    if(initTarget != NaN && initTarget >= 0) {
        history.replaceState(null, '', location.pathname);
        filter_input.value = initTarget.toString();
        searchES();
    }
});
