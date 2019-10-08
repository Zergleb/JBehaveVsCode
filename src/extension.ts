import * as vscode from 'vscode';

const jbehaveCommandFinder = /@When\(\s*"(.*)"\s*\)|@Given\(\s*"(.*)"\s*\)|@Then\(\s*"(.*)"\s*\)|@Alias\(\s*"(.*)"\s*\)/;

interface Command {
	command: string;
	uri: vscode.Uri;
	line: number;
}

export async function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "jbehaveutils" is now active!');

	let goTo = vscode.commands.registerTextEditorCommand('extension.jbehave.goToAction', async (textEditor, edit) => {
		var range = textEditor.document.getWordRangeAtPosition(textEditor.selection.anchor);
		if(range) {
			var search = textEditor.document.lineAt(range.start.line).text.trim();
			if(search.indexOf("When ") === 0) {
				search = search.substring(5);
			} else if(search.indexOf("Then ") === 0) {
				search = search.substring(5);
			} else if(search.indexOf("Given ") === 0) {
				search = search.substring(6);
			} else if(search.indexOf("And ") === 0) {
				search = search.substring(4);
			}
			console.log("search: " + search);
			console.log(context.workspaceState.get("commands"));
			var commands: {[s: string]: Command} = (context.workspaceState.get("commands") as any);
			var command;
			for(var check in commands) {
				var match = search.match(check);
				if(match && match[0] === search) {
					command = commands[check];
					break;
				}
			}
			if(command) {
				var editor = await vscode.window.showTextDocument(command.uri, {preview: false});
				editor.revealRange(editor.document.lineAt(command.line - 1).range);
			}
		}
	});

	console.log('Testing Does this show');
	var files = await vscode.workspace.findFiles('**/*Steps.java', '**/.history', 10000);

	const commands: { [s: string]: Command; } = {};
	
	files.forEach(async (file) => {
		var document = await vscode.workspace.openTextDocument(file);
		var lines = document.getText().split("\n");
		for(var i = 0; i < lines.length; i++) {
			var found = jbehaveCommandFinder.exec(lines[i]);
			if(found) {
				for(var x = 1; x < found.length; x++) {
					if(found[x]) {
						var command = {
							command: found[x].replace(/\$\w+|<\w+>/g, "[^\\s]+"),
							uri: file,
							line: i
						};
						commands[command.command] = command;
						console.log("Line number " + (command.line));
					}
				}
			}
		}
	});
	
	context.workspaceState.update("commands", commands);

	context.subscriptions.push(goTo);
}

// this method is called when your extension is deactivated
export function deactivate() {}
