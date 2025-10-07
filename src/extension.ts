// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    
    const output = vscode.window.createOutputChannel("1MyExtension");
            output.appendLine("Extension activated2");
    // Register a command that logs and shows the Output panel
    const disposablef = vscode.commands.registerCommand("myext.showLog", () => {
        output.appendLine(`[${new Date().toISOString()}] Command executed`);
        output.show(true); // <-- brings the Output panel to the front
    });

    context.subscriptions.push(disposablef);
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "2d-math-input-extension" is now active!');

	// Register the custom editor provider
	context.subscriptions.push(vscode.window.registerCustomEditorProvider('mathEditor', new MathEditorProvider()));

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('2d-math-input-extension.insertFraction', () => {
		// Create a new untitled math file to open the custom editor
		vscode.workspace.openTextDocument({ language: 'math', content: '' }).then(doc => {
			vscode.window.showTextDocument(doc, { preview: false });
		});
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}

class MathEditorProvider implements vscode.CustomTextEditorProvider {
	public resolveCustomTextEditor(
		document: vscode.TextDocument,
		webviewPanel: vscode.WebviewPanel,
		_token: vscode.CancellationToken
	): void | Thenable<void> {
		// Setup initial content
		webviewPanel.webview.options = {
			enableScripts: true,
			localResourceRoots: []
		};

		webviewPanel.webview.html = this.getHtmlForWebview();

		// Send initial content
		webviewPanel.webview.postMessage({ command: 'update', content: document.getText() });

		// Handle messages from the webview
		webviewPanel.webview.onDidReceiveMessage(
			message => {
				switch (message.command) {
					case 'update':
						// Update the document
						const currentText = document.getText();
						if (message.content !== currentText) {
							const fullRange = new vscode.Range(
								document.positionAt(0),
								document.positionAt(currentText.length)
							);
							const edit = new vscode.WorkspaceEdit();
							edit.replace(document.uri, fullRange, message.content);
							vscode.workspace.applyEdit(edit);
						}
						break;
					case 'insertFraction':
						const editor = vscode.window.activeTextEditor;
						if (editor) {
							const fraction = `${message.numerator}/${message.denominator}`;
							editor.edit(editBuilder => {
								editBuilder.insert(editor.selection.active, fraction);
							});
						}
						break;
				}
			}
		);
	}

	private getHtmlForWebview(): string {
		return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Math Editor</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
    <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .editor { display: flex; flex-direction: column; height: 100vh; }
        .input-area { flex: 1; padding: 10px; border: 1px solid #ccc; font-family: monospace; line-height: 2; }
        .render-area { flex: 1; padding: 10px; border: 1px solid #ccc; margin-top: 10px; overflow: auto; }
        .fraction { display: inline-flex; flex-direction: column; align-items: center; vertical-align: middle; margin: 0 5px; }
        .fraction .numerator, .fraction .denominator { 
            border: 1px solid var(--vscode-editor-foreground); 
            outline: none; 
            text-align: center; 
            min-width: 40px;  /* Increased from 20px */
            min-height: 30px; /* Added minimum height */
            padding: 5px;     /* Increased from 2px */
            cursor: text; 
            background: var(--vscode-input-background); 
            color: var(--vscode-input-foreground); 
            font-size: 16px;  /* Increased font size for better visibility */
        }
        /* Hide border when there's content */
        .fraction .numerator:not(:empty), 
        .fraction .denominator:not(:empty) { 
            border-color: transparent; 
        }
        .fraction .line { width: 100%; height: 1px; background-color: var(--vscode-editor-foreground); margin: 2px 0; }
        .fraction:focus-within { outline: 2px solid blue; }
        .continuation {
            border: 1px solid var(--vscode-editor-foreground);
            outline: none;
            text-align: center;
            min-width: 20px;
            min-height: 30px;
            padding: 5px;
            cursor: text;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            white-space: pre;
        }
        .limit {
            display: inline-flex;
            align-items: baseline;
            vertical-align: middle;
            margin: 0 5px;
        }
        .lim-symbol {
            font-style: normal;
            margin-right: 2px;
        }
        .subscript {
            border: 1px solid var(--vscode-editor-foreground);
            outline: none;
            text-align: center;
            min-width: 40px;
            min-height: 30px;
            padding: 5px;
            cursor: text;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            font-size: 16px;
            vertical-align: sub;
            font-size: smaller;
        }
        .subscript:not(:empty) {
            border-color: transparent;
        }
        .expression {
            border: 1px solid var(--vscode-editor-foreground);
            outline: none;
            text-align: center;
            min-width: 40px;
            min-height: 30px;
            padding: 5px;
            cursor: text;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            font-size: 16px;
            margin-left: 5px;
        }
        .expression:not(:empty) {
            border-color: transparent;
        }
        .limit:focus-within {
            outline: 2px solid blue;
        }
    </style>
</head>
<body>
    <div class="editor">
        <h2>Math Editor</h2>
        <div class="input-area" id="input" contenteditable="true" placeholder="Type math expressions here..."></div>
        <div class="render-area" id="render"></div>
    </div>
    <script>
        const vscode = acquireVsCodeApi();
        const input = document.getElementById('input');
        const render = document.getElementById('render');

        // Load initial content
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'update':
                    if (message.content !== getTextContent(input)) {
                        setTextContent(input, message.content);
                        renderMath();
                    }
                    break;
            }
        });

        let updateTimeout;
        input.addEventListener('input', (event) => {
            renderMath();
            clearTimeout(updateTimeout);
            updateTimeout = setTimeout(() => {
                vscode.postMessage({ command: 'update', content: getTextContent(input) });
            }, 500);
        });

        input.addEventListener('keydown', (e) => {
            console.log('keydown123', e);
            if (e.key === '/') {
                const text = input.textContent;
                if (text.endsWith('lim')) {
                    e.preventDefault();
                    insertLimit();
                } else {
                    e.preventDefault();
                    insertFraction();
                }
            }
        });

        // Add global keydown listener for Tab handling
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab' && document.activeElement && 
                (document.activeElement.classList.contains('numerator') || 
                 document.activeElement.classList.contains('denominator'))) {
                e.preventDefault();
                handleTabKey(e);
            }
        });

        function handleTabKey(event) {
            const activeElement = document.activeElement;

            if (activeElement.classList.contains('numerator')) {
                const fraction = activeElement.parentElement;
                const denominator = fraction.querySelector('.denominator');
                denominator.focus();
                const denRange = document.createRange();
                denRange.selectNodeContents(denominator);
                denRange.collapse(false); // Move cursor to end
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(denRange);
            } else if (activeElement.classList.contains('denominator')) {
                // Move out of fraction to the right
                const fraction = activeElement.parentElement;
                const continuation = document.createElement('span');
                continuation.contentEditable = 'true';
                continuation.className = 'continuation';
                continuation.textContent = '\u00A0'; // Non-breaking space
                fraction.parentNode.insertBefore(continuation, fraction.nextSibling);

                // Focus the continuation element
                const contRange = document.createRange();
                contRange.selectNodeContents(continuation);
                contRange.collapse(false); // Move cursor to end
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(contRange);
                continuation.focus();
            } else if (activeElement.classList.contains('subscript')) {
                const limit = activeElement.parentElement;
                const expression = limit.querySelector('.expression');
                expression.focus();
                const exprRange = document.createRange();
                exprRange.selectNodeContents(expression);
                exprRange.collapse(false);
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(exprRange);
            } else if (activeElement.classList.contains('expression')) {
                // Move out of limit to the right
                const limit = activeElement.parentElement;
                const continuation = document.createElement('span');
                continuation.contentEditable = 'true';
                continuation.className = 'continuation';
                continuation.textContent = '\u00A0'; // Non-breaking space
                limit.parentNode.insertBefore(continuation, limit.nextSibling);

                // Focus the continuation element
                const contRange = document.createRange();
                contRange.selectNodeContents(continuation);
                contRange.collapse(false); // Move cursor to end
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(contRange);
                continuation.focus();
            }
        }

        function handleKey(event) {
            // Handle other keys, but not Tab (Tab is handled globally now)
            if (event.key === 'c') {
                event.preventDefault();
                if (event.target.id.startsWith('numerator')) {
                    event.target.parentElement.querySelector('[id^="denominator"]').focus();
                } else if (event.target.id.startsWith('denominator')) {
                    // Add continuation box after the fraction
                    const fraction = event.target.parentElement;
                    const continuation = document.createElement('span');
                    continuation.contentEditable = 'true';
                    continuation.className = 'continuation';
                    continuation.textContent = '  ';
                    continuation.addEventListener('input', (event) => {
                        const span = event.target;
                        const text = span.textContent;
                        span.replaceWith(document.createTextNode(text));
                    });
                    fraction.parentNode.insertBefore(continuation, fraction.nextSibling);
                    continuation.focus();
                    const range = document.createRange();
                    range.selectNodeContents(continuation);
                    range.collapse(true);
                    const selection = window.getSelection();
                    selection.removeAllRanges();
                    selection.addRange(range);
                }
            }
        }

        function insertFraction() {
            const selection = window.getSelection();
            const range = selection.getRangeAt(0);
            const fraction = document.createElement('span');
            fraction.className = 'fraction';
            fraction.id = 'fraction-' + Date.now() + '-' + Math.random();
            fraction.innerHTML = '<span class="numerator" contenteditable="true" tabindex="0"></span><span class="line"></span><span class="denominator" contenteditable="true" tabindex="0"></span>';
            range.deleteContents();
            range.insertNode(fraction);
            // Add continuation box after the fraction
            const continuation = document.createElement('span');
            continuation.contentEditable = 'true';
            continuation.className = 'continuation';
            continuation.textContent = '  ';
            continuation.addEventListener('input', (event) => {
                const span = event.target;
                const text = span.textContent;
                span.replaceWith(document.createTextNode(text));
            });
            fraction.parentNode.insertBefore(continuation, fraction.nextSibling);
            // Focus numerator
            const numerator = fraction.querySelector('.numerator');
            numerator.id = 'numerator-' + fraction.id;
            console.log('numerator', numerator);
            const denominator = fraction.querySelector('.denominator');
            denominator.id = 'denominator-' + fraction.id;

            // Add event listeners for non-Tab keys
            numerator.addEventListener('keyup', () => {console.log('keyup');});
            denominator.addEventListener('keyup', () => {console.log('keyup');});
            numerator.focus();
            const numRange = document.createRange();
            numRange.selectNodeContents(numerator);
            numRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(numRange);
        }

        function insertLimit() {
            const selection = window.getSelection();
            const range = selection.getRangeAt(0);
            const limit = document.createElement('span');
            limit.className = 'limit';
            limit.innerHTML = '<span class="lim-symbol">lim</span><sub class="subscript" contenteditable="true" tabindex="0">x \\to -\\infty</sub><span class="expression" contenteditable="true" tabindex="0">\\frac{x}{2x-3}</span>';
            range.deleteContents();
            range.insertNode(limit);
            // Add continuation box after the limit
            const continuation = document.createElement('span');
            continuation.contentEditable = 'true';
            continuation.className = 'continuation';
            continuation.textContent = '  ';
            continuation.addEventListener('input', (event) => {
                const span = event.target;
                const text = span.textContent;
                span.replaceWith(document.createTextNode(text));
            });
            limit.parentNode.insertBefore(continuation, limit.nextSibling);
            // Focus subscript
            const subscript = limit.querySelector('.subscript');
            subscript.focus();
            const subRange = document.createRange();
            subRange.selectNodeContents(subscript);
            subRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(subRange);
        }

        function renderMath() {
            const text = getTextContent(input);
            try {
                render.innerHTML = katex.renderToString(text, { displayMode: true });
            } catch (e) {
                render.innerHTML = '<p>Error rendering math</p>';
            }
        }

        function getTextContent(element) {
            // Serialize fractions and limits back to LaTeX
            const cloned = element.cloneNode(true);
            const fractions = cloned.querySelectorAll('.fraction');
            fractions.forEach(f => {
                const numEl = f.querySelector('.numerator');
                const denEl = f.querySelector('.denominator');
                const num = numEl ? numEl.textContent.trim() : '';
                const den = denEl ? denEl.textContent.trim() : '';
                f.replaceWith(\`\\\\frac{\${num}}{\${den}}\`);
            });
            const limits = cloned.querySelectorAll('.limit');
            limits.forEach(l => {
                const subEl = l.querySelector('.subscript');
                const exprEl = l.querySelector('.expression');
                const sub = subEl ? subEl.textContent.trim() : '';
                const expr = exprEl ? exprEl.textContent.trim() : '';
                l.replaceWith(\`\\\\lim_{\${sub}} \${expr}\`);
            });
            return cloned.textContent;
        }

        function setTextContent(element, text) {
            // Parse LaTeX fractions and limits and create elements
            element.innerHTML = text
                .replace(/\\\\lim_\{([^}]+)\} (.+)/g, '<span class="limit"><span class="lim-symbol">lim</span><sub class="subscript" contenteditable="true">$1</sub><span class="expression" contenteditable="true">$2</span></span>')
                .replace(/\\\\frac\{([^}]+)\}\{([^}]+)\}/g, '<span class="fraction"><span class="numerator" contenteditable="true">$1</span><span class="line"></span><span class="denominator" contenteditable="true">$2</span></span>');
        }
    </script>
</body>
</html>`;
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
		this._view = webviewView;

		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [this._context.extensionUri]
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

		webviewView.webview.onDidReceiveMessage(
			message => {
				switch (message.command) {
					case 'insertFraction':
						const editor = vscode.window.activeTextEditor;
						if (editor) {
							const fraction = `${message.numerator}/${message.denominator}`;
							editor.edit(editBuilder => {
								editBuilder.insert(editor.selection.active, fraction);
							});
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