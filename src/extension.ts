// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';

function log(message: string) {
    const timestamp = new Date().toISOString();
    fs.appendFileSync('d:\\dev\\2dlog.log', `[${timestamp}] ${message}\n`);
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    log('Entering activate');
    
    const output = vscode.window.createOutputChannel("1MyExtension");
            output.appendLine("Extension activated2");
    // Register a command that logs and shows the Output panel
    const disposablef = vscode.commands.registerCommand("myext.showLog", () => {
        log('Command myext.showLog executed');
        output.appendLine(`[${new Date().toISOString()}] Command executed`);
        output.show(true); // <-- brings the Output panel to the front
    });

    context.subscriptions.push(disposablef);
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "2d-math-input-extension" is now active!');

	// Register the custom editor provider
	context.subscriptions.push(vscode.window.registerCustomEditorProvider('mathEditor', new MathEditorProvider(context)));

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('2d-math-input-extension.insertFraction', () => {
		log('Command 2d-math-input-extension.insertFraction executed');
		// Create a new untitled math file to open the custom editor
		vscode.workspace.openTextDocument({ language: 'math', content: '' }).then(doc => {
			log('Opened new math document');
			vscode.window.showTextDocument(doc, { preview: false });
		});
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {
    log('Entering deactivate');
}

class MathEditorProvider implements vscode.CustomTextEditorProvider {
	constructor(private readonly context: vscode.ExtensionContext) {}

	public resolveCustomTextEditor(
		document: vscode.TextDocument,
		webviewPanel: vscode.WebviewPanel,
		_token: vscode.CancellationToken
	): void | Thenable<void> {
		log('Entering resolveCustomTextEditor');
		// Setup initial content
		webviewPanel.webview.options = {
			enableScripts: true,
			localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'src')]
		};

		webviewPanel.webview.html = this.getHtmlForWebview();

		// Send initial content
		webviewPanel.webview.postMessage({ command: 'update', content: document.getText() });

		// Handle messages from the webview
		webviewPanel.webview.onDidReceiveMessage(
			message => {
				log('Received message from webview: ' + message.command);
				switch (message.command) {
					case 'update':
						log('Handling case: update');
						// Update the document
						const currentText = document.getText();
						if (message.content !== currentText) {
							log('Content differs, updating document');
							const fullRange = new vscode.Range(
								document.positionAt(0),
								document.positionAt(currentText.length)
							);
							const edit = new vscode.WorkspaceEdit();
							edit.replace(document.uri, fullRange, message.content);
							vscode.workspace.applyEdit(edit);
						} else {
							log('Content is the same, no update needed');
						}
						break;
					case 'insertFraction':
						log('Handling case: insertFraction');
						const editor = vscode.window.activeTextEditor;
						if (editor) {
							log('Active editor found, inserting fraction');
							const fraction = `${message.numerator}/${message.denominator}`;
							editor.edit(editBuilder => {
								editBuilder.insert(editor.selection.active, fraction);
							});
						} else {
							log('No active editor, cannot insert fraction');
						}
						break;
					case 'log':
						log(message.message);
						break;
				}
			}
		);
	}

	private getHtmlForWebview(): string {
		log('Entering getHtmlForWebview');
		const templateUri = vscode.Uri.joinPath(this.context.extensionUri, 'src', 'webview-template.html');
		try {
			return fs.readFileSync(templateUri.fsPath, 'utf8');
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			log(`Failed to load webview template: ${message}`);
			return '<!DOCTYPE html><html><body><h3>Failed to load webview content.</h3></body></html>';
		}
	}
}

class FractionInputProvider implements vscode.WebviewViewProvider {
	public static readonly viewType = 'fractionInputView';

	private _view?: vscode.WebviewView;

	constructor(private readonly _context: vscode.ExtensionContext) {}

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {
		log('Entering resolveWebviewView');
		this._view = webviewView;

		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [this._context.extensionUri]
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

		webviewView.webview.onDidReceiveMessage(
			message => {
				log('Received message from webview view: ' + message.command);
				switch (message.command) {
					case 'insertFraction':
						log('Handling case: insertFraction');
						const editor = vscode.window.activeTextEditor;
						if (editor) {
							log('Active editor found, inserting fraction');
							const fraction = `${message.numerator}/${message.denominator}`;
							editor.edit(editBuilder => {
								editBuilder.insert(editor.selection.active, fraction);
							});
						} else {
							log('No active editor, cannot insert fraction');
						}
						// Clear the inputs after insertion
						webviewView.webview.postMessage({ command: 'clear' });
						return;
				}
			},
			undefined,
			this._context.subscriptions
		);
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		log('Entering _getHtmlForWebview');
		return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fraction Input</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 10px; }
        .fraction { display: flex; flex-direction: column; align-items: center; margin: 10px 0; }
        .numerator, .denominator { border: 1px solid #ccc; padding: 5px; width: 80px; text-align: center; }
        .line { width: 90px; height: 2px; background-color: black; margin: 5px 0; }
        button { margin-top: 10px; padding: 5px 10px; }
    </style>
</head>
<body>
    <h3>Insert Fraction</h3>
    <div class="fraction">
        <input type="text" class="numerator" id="numerator" placeholder="num" onkeydown="handleKey(event)">
        <div class="line"></div>
        <input type="text" class="denominator" id="denominator" placeholder="den" onkeydown="handleKey(event)">
    </div>
    <button onclick="insertFraction()">Insert</button>
    <script>
        const vscode = acquireVsCodeApi();

        function handleKey(event) {
            if (event.key === 'Tab') {
                event.preventDefault();
                if (event.target.id.startsWith('numerator')) {
                    event.target.parentElement.querySelector('[id^="denominator"]').focus();
                } else if (event.target.id.startsWith('denominator')) {
                    event.target.parentElement.querySelector('[id^="numerator"]').focus();
                }
            } else if (event.key === 'Enter') {
                insertFraction();
            }
        }

        function insertFraction() {
            const numerator = document.getElementById('numerator').value;
            const denominator = document.getElementById('denominator').value;
            vscode.postMessage({
                command: 'insertFraction',
                numerator: numerator,
                denominator: denominator
            });
        }

        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'clear':
                    document.getElementById('numerator').value = '';
                    document.getElementById('denominator').value = '';
                    document.getElementById('numerator').focus();
                    break;
            }
        });
    </script>
</body>
</html>`;
	}
}