let quiz_data = await fetch('/tool_data/data/quiz.json').then(res => {
    if(res.status == 200) {
        return res.json();
    }
    return {
        'last_update': {
            'version': '-',
            'dv': '-',
            'time': 0
        },
        'quiz': {}
    };
});

function generate_attribute_info(arg) {
    let tokens = arg.split(' ');
    let texts = ['變更', [], []];
    let modTarget = 1;
    for(let token of tokens) {
        switch(token.toLowerCase()) {
            case 'loop':
                texts[0] = '循環';
                texts[1] = [];
                modTarget = 1;
                break;
            case 'increase':
            case 'inc':
                texts[0] = '遞增';
                texts[1] = [];
                modTarget = 1;
                break;
            case 'decrease':
            case 'dec':
                texts[0] = '遞減';
                texts[1] = [];
                modTarget = 1;
                break;
            case 'init':
                modTarget = 2;
                texts[2] = [];
                break;
            default:
                texts[modTarget].push(token);
        }
    }
    return `<details><summary>屬性${texts[0]}</summary>${texts[1].join(' → ')}${texts[2].length==0 ? '' : ('<br />進場設定為'+texts[2][0])}</details>`;
}

function generate_quiz_table(arg) {
    let table_rows_html = '';
    let tokens = arg.split(' ');
    if(tokens.length < 2) {
        return `<details><summary>@quiz</summary>無資料</details>`
    }
    tokens.forEach((element, index) => {
        tokens[index] = element.split(',');
    });

    tokens[1].forEach(element => {
        let qa = quiz_data.quiz[element];
        let question = qa.question;
        let monster_icon = generateMonsterIcon(tokens[0][qa.answer]);
        let answer = monster_icon.html;
        if(tokens[0][qa.answer] >= 50000) answer = `<code>#${tokens[0][qa.answer]}</code>`;
        table_rows_html += `<tr><td>${question}</td><td>${answer}</td></tr>`;
        tooltips.push(monster_icon.tooltipId);
    });
    return `<details><summary>@quiz</summary><ul><li>由下列題目隨機抽選一題</li></ul><table class="quiz"><thead><tr><th>問題</th><th>答案</th></tr></thead><tbody>${table_rows_html}</tbody></table></details>`;
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
    'random_number': arg => `<details><summary>指定數量</summary>${arg=='' ? '無資料' : ('隨機範圍 '+arg.replace(' ', ' ~ '))}</details>`,
    'attribute_change': generate_attribute_info,
    'quiz': generate_quiz_table
}