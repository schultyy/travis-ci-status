'use strict';
import * as vscode from 'vscode';
import TravisStatusBar from './TravisStatusBar';

const configureToken = (travisStatusBar: TravisStatusBar, context: vscode.ExtensionContext) => {
    vscode.window.showInputBox({
        placeHolder: "Configure your Travis CI token",
        prompt: "Configure your Travis CI token"
    })
    .then(token => {
        if(token) {
            context.globalState.update('travis-ci-api-key', token);
            travisStatusBar.updateBuildStatus(token);
        }
    });
};

let travisStatusBar = new TravisStatusBar();

export function activate(context: vscode.ExtensionContext) {

    let disposableStatus = vscode.commands.registerCommand('extension.travis-status', () => {
        const apiToken = context.globalState.get('travis-ci-api-key');
        if (apiToken) {
            travisStatusBar.updateBuildStatus(apiToken.toString());
        } else {
            configureToken(travisStatusBar, context);
        }
    });

    let disposableConfigureToken = vscode.commands.registerCommand('extension.configure-travis-ci-token',() => {
         configureToken(travisStatusBar, context);
    });

    context.subscriptions.push(travisStatusBar);
    context.subscriptions.push(disposableStatus);
    context.subscriptions.push(disposableConfigureToken);
}

export function deactivate() {
}
