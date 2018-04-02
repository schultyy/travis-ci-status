'use strict';
import * as vscode from 'vscode';
import TravisStatusBar from './TravisStatusBar';

const STATE_COM_API_KEY = 'travis-ci-com-api-key';

const configureToken = (travisStatusBar: TravisStatusBar, context: vscode.ExtensionContext) => {
    vscode.window.showInputBox({
        placeHolder: "Configure your travis-ci.com token",
        prompt: "Configure your travis-ci.com token"
    })
    .then(token => {
        if(token) {
            context.globalState.update(STATE_COM_API_KEY, token);
            travisStatusBar.updateBuildStatus(token);
        }
    });
};

let travisStatusBar = new TravisStatusBar();

export function activate(context: vscode.ExtensionContext) {

    let disposableStatus = vscode.commands.registerCommand('extension.travis-status', () => {
        const apiToken = context.globalState.get(STATE_COM_API_KEY);
        if (apiToken) {
            travisStatusBar.updateBuildStatus(apiToken.toString());
        } else {
            configureToken(travisStatusBar, context);
        }
    });

    let disposableConfigureToken = vscode.commands.registerCommand('extension.configure-travis-ci-com-token',() => {
         configureToken(travisStatusBar, context);
    });

    context.subscriptions.push(travisStatusBar);
    context.subscriptions.push(disposableStatus);
    context.subscriptions.push(disposableConfigureToken);
}

export function deactivate() {
}
