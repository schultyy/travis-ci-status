'use strict';
import * as vscode from 'vscode';
import TravisStatusBar from './TravisStatusBar';
import TravisEnvironment from './travisEnvironment';

const STATE_COM_API_KEY = 'travis-ci-com-api-key';
const STATE_ORG_API_KEY = 'travis-ci-org-api-key';

const configureToken = (travisStatusBar: TravisStatusBar, env: TravisEnvironment, context: vscode.ExtensionContext) => {
    let environmentStr = '';

    switch(env) {
        case TravisEnvironment.com:
            environmentStr = 'travis-ci.com';
            break;
        case TravisEnvironment.org:
            environmentStr = 'travis-ci.org';
            break;
    }

    return vscode.window.showInputBox({
        placeHolder: `Configure your ${environmentStr} token`,
        prompt: `Configure your ${environmentStr} token`
    });
};

let travisStatusBar = new TravisStatusBar();

export function activate(context: vscode.ExtensionContext) {

    let disposableComStatus = vscode.commands.registerCommand('extension.travis-com-status', () => {
        const apiToken = context.globalState.get(STATE_COM_API_KEY);
        if (apiToken) {
            travisStatusBar.updateBuildStatus(apiToken.toString(), TravisEnvironment.com);
        } else {
            vscode.window.showInformationMessage('Please configure your API tokens for travis-ci.com and travis-ci.org');
        }
    });

    let disposableOrgStatus = vscode.commands.registerCommand('extension.travis-org-status', () => {
        const apiToken = context.globalState.get(STATE_ORG_API_KEY);
        if (apiToken) {
            travisStatusBar.updateBuildStatus(apiToken.toString(), TravisEnvironment.org);
        } else {
            vscode.window.showInformationMessage('Please configure your API tokens for travis-ci.com and travis-ci.org');
        }
    });

    let disposableConfigureComToken = vscode.commands.registerCommand('extension.configure-travis-ci-com-token',() => {
         configureToken(travisStatusBar, TravisEnvironment.com, context)
         .then(token => {
            if(token) {
                context.globalState.update(STATE_COM_API_KEY, token);
                travisStatusBar.updateBuildStatus(token, TravisEnvironment.com);
            }
        });
    });

    let disposableConfigureOrgToken = vscode.commands.registerCommand('extension.configure-travis-ci-org-token',() => {
        configureToken(travisStatusBar, TravisEnvironment.org, context)
        .then(token => {
            if(token) {
                context.globalState.update(STATE_ORG_API_KEY, token);
                travisStatusBar.updateBuildStatus(token, TravisEnvironment.org);
            }
        });
   });

    context.subscriptions.push(travisStatusBar);
    context.subscriptions.push(disposableComStatus);
    context.subscriptions.push(disposableOrgStatus);
    context.subscriptions.push(disposableConfigureComToken);
    context.subscriptions.push(disposableConfigureOrgToken);
}

export function deactivate() {
}
