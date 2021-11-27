const fs = require('fs');
const yml = require('js-yaml');
const translate = require('translate-google');
const inquirer = require('inquirer');

const saveText = 'Salvar';
const changeText = 'Alterar';

async function insertNewText(action, textToTranslate, suggestion, item) {
    switch (action) {
        case saveText:
            return item.replace(textToTranslate, suggestion);
        case changeText:
            const {result} = await inquirer.prompt([
                {
                    name: 'result',
                    type: 'editor',
                    message: 'Alterando texto:',
                    default: suggestion
                }
            ]);
            return item.replace(textToTranslate, result);
        default:
            return textToTranslate;
    }
}

async function startTranslation(path) {
    try {
        const key = 'l_english';
        const fileContents = fs.readFileSync(path, 'utf-8')
        let data = yml.load(fileContents);
        const lines = data[key].split('" ').map(line => {
            if (line[line.length] !== '"') {
                return line + '"'
            }

            return line;
        });

        for (let i = 0; i < lines.length; i++) {
            const item = lines[i];
            const init = item.indexOf('"');
            const finish = item.lastIndexOf('"');
            const textToTranslate = item.slice(init + 1, finish);
            const suggestion = await translate(textToTranslate, {from: 'en', to: 'pt'});
            const {action} = await inquirer.prompt([{
                name: 'action',
                type: 'list',
                message: `\rOriginal: ${textToTranslate}\rSuggestion: ${suggestion}\rComo você deseja prosseguir?`,
                choices: [saveText, insertNewText, 'Ignorar']
            }]);

            lines[i] = await insertNewText(action, textToTranslate, suggestion, item);
        }

        fs.writeFileSync('test.yml', `${key}:\n  ${lines.join('\n  ')}`)
    } catch (e) {
        console.log(e);
    }
}

function main() {
    inquirer.prompt([
        {
            name: 'path',
            message: 'Digite o path do arquivo que você deseja traduzir:'
        }
    ]).then(({path}) => startTranslation(path))
}

main();
