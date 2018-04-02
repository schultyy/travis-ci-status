'use strict';
import * as vscode from 'vscode';
import { StatusBarItem, window, workspace } from 'vscode';
import * as Path from 'path';
import * as ghslug from 'github-slug';

export function activate(context: vscode.ExtensionContext) {


    let disposable = vscode.commands.registerCommand('extension.travis-status', () => {
        window.showInputBox({
            placeHolder: "Configure your Travis CI token",
            prompt: "Configure your Travis CI token"
        })
        .then(token => {
            if(token) {
                window.showInformationMessage("Thank you. Checking status now");
                let travisStatusBar = new TravisStatusBar(token);
                context.subscriptions.push(travisStatusBar);
            }
        });
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {
}

class TravisStatusBar {
    private statusBarItem : StatusBarItem;
    private token: String;

    constructor(token: String) {
        this.statusBarItem = window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        this.token = token;
    }

    public updateBuildStatus() {
        if(!this.statusBarItem) {
            return;
        }

        this.statusBarItem.text = "Build Status: Unknown";
        this.statusBarItem.show();

        if(workspace.workspaceFolders) {
            let sourceControl = vscode.scm.createSourceControl("git", "git", workspace.workspaceFolders[0].uri);
            if(sourceControl.rootUri) {
                const gitPath = Path.join(sourceControl.rootUri.fsPath.toString(), ".git", "config");
                ghslug(gitPath, function(error: Error, slug: String) {
                    if(error) {
                        console.error(error);
                    } else {
                        console.log(slug);
                    }
                });
            }
        }
    }

    dispose() {
        this.statusBarItem.dispose();
    }
}