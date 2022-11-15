// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

function isEmptyOrSpaces(str:string){
    return str === null || str.match(/^ *$/) !== null;
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "oneblue" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('oneblue.redisSlowLog2Csv', () => {
		// The code you place here will be executed every time your command is executed
		const editor = vscode.window.activeTextEditor;

		if (editor) {
			const document = editor.document;
			const selection = editor.selection;
			const word = document.getText(selection);

			let warningMessage = '';
			const slowLogPatten = /((^\s*)|(\s+))\d+[)]/g;

			const levels: number[] = [];

			const items = [];
			let currentObj: { [name: string]: string } = {};
			let headerIndex = 0;
			const headers = ['Identifier', 'Unix Timestamp', 'Execution Time (microseconds)', 'Command', 'ClientIPAndPort', 'Client Name']
			let lastLevelIndex = 0;

			for (const line of word.split('\n')) {
				let position = 0;
				let levelIndex = 0;

				for (const match of line.matchAll(slowLogPatten)) {
					//validation
					if (position === 0) {
						if (match.index === 0) {
						} else {
							warningMessage += `The line '${line}' does not meet the patten '${slowLogPatten}'\n`;
							break;
						}
					}
					position += match[0].length;

					if (levels.length !== 0) {
						for (levelIndex = levels.length - 1; levelIndex >= 0; levelIndex--) {
							if (levels[levelIndex] > position) {
								levels.pop();
							} else if (levels[levelIndex] === position) {
								break;
							} else {
								levels.push(position);
								levelIndex++;
								break;
							}
						}
					} else {
						levels.push(position);
					}

					if (levelIndex === 0) {
						currentObj = {};
						items.push(currentObj);
					}
				}

				let value = line.substring(position).trim();
				if (value.startsWith('(integer) ')) {
					value = value.substring('(integer) '.length);
				}
				//console.info(`${value} - level:${levelIndex} - stack:${items.length}`);

				if (levelIndex === 1) {
					if (lastLevelIndex > levelIndex) {
						headerIndex++;
					}
					currentObj[headers[headerIndex]] = value;
					headerIndex++;
				} else {
					if (currentObj[headers[headerIndex]]) {
						currentObj[headers[headerIndex]] += ` ${value}`;
					} else {
						currentObj[headers[headerIndex]] = value;
					}
				}

				lastLevelIndex = levelIndex;

				if (headerIndex >= headers.length) {
					headerIndex = 0;
				}

				if (warningMessage) {
					break;
				}
			}
			if (warningMessage) {
				vscode.window.showInformationMessage(warningMessage);
				console.error(warningMessage);
			}else{
				// for(const item of items){
				// 	item['Time'] = (new Date(parseInt(item[headers[1]]) * 1000)).toUTCString();
				// }
				items.forEach(item => {
					item.Time = (new Date(parseInt(item[headers[1]]) * 1000)).toISOString();
				})

				const newHeaders = Object.keys(items[0]).toString();

				const body = items.map(it => {
					return Object.values(it).toString()
				}).join('\n');

				editor.edit(editBuilder => {
					editBuilder.replace(selection, `${newHeaders}\n${body}`);
				})
			}


			// console.info(headers.toString());
			// console.info(items.map(it => {
			// 	return Object.values(it).toString()
			// }).join('\n'));
		}
		// Display a message box to the user

	});

	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('oneblue.removeEmptyLine', () => {
		// The code you place here will be executed every time your command is executed
		const editor = vscode.window.activeTextEditor;

		if (editor) {
			const document = editor.document;
			const selection = editor.selection;
			const word = document.getText(selection);

			let warningMessage = '';

			let output = ''
			
			for (const line of word.split('\n')) {
				if(!isEmptyOrSpaces(line)){
					output += line;
					output += '\n';
				}
			}

			if (warningMessage) {
				vscode.window.showInformationMessage(warningMessage);
				console.error(warningMessage);
			}else{
				editor.edit(editBuilder => {
					editBuilder.replace(selection, output);
				})
			}
		}
		// Display a message box to the user

	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() { }
