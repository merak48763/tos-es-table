let quiz_data = null;
async function load_quiz_data() {
    if(quiz_data === null) {
        quiz_data = await fetch('/tool_data/data/quiz.json').then(res => {
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
    }
}

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
        let answer_string = qa.answer_options[qa.answer];
        let monster_icon = generateMonsterIcon(tokens[0][qa.answer]);
        let answer_monster = monster_icon.html;
        //if(qa.answer >= tokens[0].length) answer_monster = `<em>ERROR</em>`;
        table_rows_html += `<tr><td>${qa.question}</td><td>${answer_string}</td><td>${answer_monster}</td></tr>`;
    });
    return `<details><summary>@quiz</summary><ul><li>由下列題目隨機抽選一題</li></ul><table class="quiz"><thead><tr><th>問題</th><th>答案</th><th>對應敵人</th></tr></thead><tbody>${table_rows_html}</tbody></table></details>`;
}

const annotation_replacers = {
    'crescendo': arg => `<details><summary>越戰越強</summary><table><tr><td>剩餘血量</td><td>100%</td><td>20%</td><td>0%</td></tr><tr><td>倍率</td><td>1</td><td>2</td><td>2</td></tr></table><ul><li>各點之間為線性成長</li></ul></details>`,
    'crescendo_ex': arg => `<details><summary>越戰越強</summary><table><tr><td>剩餘血量</td><td>100%</td><td>20%</td><td>0%</td></tr><tr><td>倍率</td><td>1</td><td>3</td><td>3</td></tr></table><ul><li>各點之間為線性成長</li></ul></details>`,
    'trojan': arg => `<details><summary>越戰越強</summary><table><tr><td>剩餘血量</td><td>100%</td><td>50%</td><td>35%</td><td>20%</td><td>0%</td></tr><tr><td>倍率</td><td>1</td><td>2</td><td>5</td><td>10</td><td>10</td></tr></table><ul><li>各點之間為線性成長</li><li>血量30%以下時發動連擊</li></ul></details>`,
    'trojan_ex': arg => `<details><summary>越戰越強</summary><table><tr><td>剩餘血量</td><td>100%</td><td>50%</td><td>35%</td><td>20%</td><td>0%</td></tr><tr><td>倍率</td><td>1</td><td>3</td><td>10</td><td>20</td><td>20</td></tr></table><ul><li>各點之間為線性成長</li><li>血量30%以下時發動連擊</li></ul></details>`,
    'trojan_fort_ex': arg => `<details><summary>越戰越強</summary><table><tr><td>剩餘血量</td><td>100%</td><td>50%</td><td>35%</td><td>20%</td><td>0%</td></tr><tr><td>倍率</td><td>1</td><td>3</td><td>10</td><td>20</td><td>20</td></tr></table><ul><li>各點之間為線性成長</li><li>攻擊、防禦倍率相同</li><li>血量30%以下時發動連擊</li></ul></details>`,
    'trojan_multi_attack': arg => `<details><summary>血低追擊</summary><table><tr><td>剩餘血量</td><td>100%</td><td>80%</td><td>60%</td><td>40%</td><td>20%</td></tr><tr><td>攻擊次數</td><td>+0</td><td>+1</td><td>+2</td><td>+3</td><td>+4</td></tr></table></details>`,
    'trojan_attack': arg => `<details><summary>越攻越強</summary><table><tr><td>攻擊次數</td><td>1</td><td>2</td><td>3</td><td>4</td><td>5</td><td>6</td></tr><tr><td>倍率</td><td>1</td><td>2</td><td>4</td><td>8</td><td>16</td><td>32</td></tr></table><ul><li>第6次攻擊起會連擊，並停止倍率成長</li></ul></details>`,
    'trojan_hp_attack': arg => `<details open=""><summary>越扣越強</summary>${arg=='' ? '無資料' : (arg.replaceAll(' ', '% → ')+'%')}</details>`,
    'explode_increase_attack': arg => `<ul><li>引爆增攻：每1顆增加0.5倍，最高20顆增加10倍</li></ul>`,
    'explode_reduce_damage': arg => `<ul><li>引爆減傷：每1顆減傷${arg || '5'}%，最高${Math.ceil(100/parseInt(arg || '5'))}顆減傷100%</li></ul>`,
    'mild_attack': arg => `<ul><li>輕量攻擊：敵人攻擊力的65%</ul></li>`,
    'ambush': arg => `<ul><li>突擊：${arg=='' ? '無資料' : '敵人攻擊力的'+arg+'%'}</li></ul>`,
    'fixed_board': arg => `<details><summary>固定版面</summary>${get_fixed_board(arg)}</details>`,
    'fixed_shape': arg => `<details><summary>固定版面</summary>${get_fixed_shape(arg)}</details>`,
    'fixed_position': arg => `<details><summary>固定位置</summary>${get_fixed_position(arg)}</details>`,
    'crumbling_walls': arg => `<details open=""><summary>減傷抗性</summary>${arg=='' ? '無資料' : (arg.replaceAll(' ', '% → ')+'%')}</details>`,
    'assigned_combo': arg => `<ul><li>指定連擊：${arg=='' ? '無資料' : (arg.replaceAll(' ', ' Combo → ')+' Combo')}</li></ul>`,
    'random_combo': arg => `<ul><li>指定連擊：${arg=='' ? '無資料' : ('隨機範圍 '+arg.replace(' ', ' Combo ~ ')+' Combo')}</li></ul>`,
    'assigned_number': arg => `<ul><li>指定數量：${arg=='' ? '無資料' : (arg.replaceAll(' ', ' → '))}</li></ul>`,
    'random_number': arg => `<ul><li>指定數量：${arg=='' ? '無資料' : ('隨機範圍 '+arg.replace(' ', ' ~ '))}</li></ul>`,
    'attribute_change': generate_attribute_info,
    'quiz': generate_quiz_table
}