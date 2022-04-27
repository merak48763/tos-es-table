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
    while(es_table.rows.length > 0) {
        es_table.deleteRow(-1);
    }
}

const annotation_replacers = {
    'crescendo': arg => `<details><summary>越戰越強</summary><table><tr><td>剩餘血量</td><td>100%</td><td>20%</td><td>0%</td></tr><tr><td>倍率</td><td>1</td><td>2</td><td>2</td></tr></table><ul><li>各點之間為線性成長</li></ul></details>`,
    'crescendo_ex': arg => `<details><summary>越戰越強</summary><table><tr><td>剩餘血量</td><td>100%</td><td>20%</td><td>0%</td></tr><tr><td>倍率</td><td>1</td><td>3</td><td>3</td></tr></table><ul><li>各點之間為線性成長</li></ul></details>`,
    'trojan': arg => `<details><summary>越戰越強</summary><table><tr><td>剩餘血量</td><td>100%</td><td>50%</td><td>35%</td><td>20%</td><td>0%</td></tr><tr><td>倍率</td><td>1</td><td>2</td><td>5</td><td>10</td><td>10</td></tr></table><ul><li>各點之間為線性成長</li><li>血量30%以下時發動連擊</li></ul></details>`,
    'trojan_ex': arg => `<details><summary>越戰越強</summary><table><tr><td>剩餘血量</td><td>100%</td><td>50%</td><td>35%</td><td>20%</td><td>0%</td></tr><tr><td>倍率</td><td>1</td><td>3</td><td>10</td><td>20</td><td>20</td></tr></table><ul><li>各點之間為線性成長</li><li>血量30%以下時發動連擊</li></ul></details>`,
    'trojan_fort_ex': arg => `<details><summary>越戰越強</summary><table><tr><td>剩餘血量</td><td>100%</td><td>50%</td><td>35%</td><td>20%</td><td>0%</td></tr><tr><td>倍率</td><td>1</td><td>3</td><td>10</td><td>20</td><td>20</td></tr></table><ul><li>各點之間為線性成長</li><li>攻擊、防禦倍率相同</li><li>血量30%以下時發動連擊</li></ul></details>`,
    'trojan_multi_attack': arg => `<details><summary>血低追擊</summary><table><tr><td>剩餘血量</td><td>100%</td><td>80%</td><td>60%</td><td>40%</td><td>20%</td></tr><tr><td>攻擊次數</td><td>+0</td><td>+1</td><td>+2</td><td>+3</td><td>+4</td></tr></table></details>`,
    'trojan_attack': arg => `<details><summary>越攻越強</summary><table><tr><td>攻擊次數</td><td>1</td><td>2</td><td>3</td><td>4</td><td>5</td><td>6</td></tr><tr><td>倍率</td><td>1</td><td>2</td><td>4</td><td>8</td><td>16</td><td>32</td></tr></table><ul><li>第6次攻擊起會連擊，並停止倍率成長</li></ul></details>`,
    'trojan_hp_attack': arg => `<details><summary>越扣越強</summary>${arg=='' ? '無資料' : (arg.replaceAll(' ', '% → ')+'%')}</details>`,
    'explode_increase_attack': arg => `<details><summary>引爆增攻</summary>每1顆增加0.5倍，最高20顆增加10倍</details>`,
    'explode_reduce_damage': arg => `<details><summary>引爆減傷</summary>每1顆減傷${arg || '5'}%，最高${Math.ceil(100/parseInt(arg || '5'))}顆減傷100%</details>`,
    'mild_attack': arg => `<details><summary>輕量攻擊</summary>敵人攻擊力的65%</details>`,
    'ambush': arg => `<details><summary>突擊</summary>${arg=='' ? '無資料' : '敵人攻擊力的'+arg+'%'}</details>`,
    'fixed_board': arg => `<details><summary>固定版面</summary>${get_fixed_board(arg)}</details>`,
    'fixed_shape': arg => `<details><summary>固定版面</summary>${get_fixed_shape(arg)}</details>`,
    'fixed_position': arg => `<details><summary>固定位置</summary>${get_fixed_position(arg)}</details>`,
    'crumbling_walls': arg => `<details><summary>減傷抗性</summary>${arg=='' ? '無資料' : (arg.replaceAll(' ', '% → ')+'%')}</details>`,
    'assigned_combo': arg => `<details><summary>指定連擊</summary>${arg=='' ? '無資料' : (arg.replaceAll(' ', ' Combo → ')+' Combo')}</details>`,
    'random_combo': arg => `<details><summary>指定連擊</summary>${arg=='' ? '無資料' : ('隨機範圍 '+arg.replace(' ', ' Combo ~ ')+' Combo')}</details>`,
    'assigned_number': arg => `<details><summary>指定數量</summary>${arg=='' ? '無資料' : (arg.replaceAll(' ', ' → '))}</details>`,
    'random_number': arg => `<details><summary>指定數量</summary>${arg=='' ? '無資料' : ('隨機範圍 '+arg.replace(' ', ' ~ '))}</details>`
}

function create_row(id) {
    if(id in es_data.es) {
        let new_row = es_table.insertRow(-1);
        new_row.classList.add('mdc-data-table__row');
        for(let i=0; i<3; ++i) {
            new_row.insertCell();
            new_row.cells[i].classList.add('mdc-data-table__cell');
        }

        let icons_html = '';
        for(let icon of es_data.es[id].icons ?? []) {
            icons_html += `<img class="es_icon" src="/tool_data/image/skill_icon/${icon.toString()}.png" />`
        }
        new_row.cells[0].innerText = id.toString();
        new_row.cells[1].innerHTML = es_data.es[id].desc=='##EMPTY##' ? '' : `<details><summary><span>${icons_html}</span>${es_data.es[id].title}</summary>${icons_html=='' ? '' : '<span>'+icons_html+'</span><br />'}${es_data.es[id].desc}</details>`;
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

    const a_delim = /(?<=^\S+)\s/;
    document.querySelectorAll('span.annotation').forEach(ele => {
        let a_arg = ele.innerText.split(a_delim);
        if(a_arg[0] in annotation_replacers) {
            ele.outerHTML = annotation_replacers[a_arg[0]](a_arg[1] ?? '');
        }
    });

    document.getElementById('table_container').scrollTo({
        'top': 0,
        'behavior': 'smooth'
    });
}

let es_data = {
    'last_update': {
        'version': '-',
        'date': '-'
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

    const update_date = new Date(es_data.last_update.date)  // ISO 8601
    document.getElementById('last_update_version').innerText = `${es_data.last_update.version} (${update_date.toLocaleDateString()})`;
});
