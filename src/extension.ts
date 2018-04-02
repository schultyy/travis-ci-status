'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { StatusBarItem, window, workspace } from 'vscode';
import * as Path from 'path';
import * as ghslug from 'github-slug';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "travis-ci-status" is now active!');

    let travisStatusBar = new TravisStatusBar();

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('extension.sayHello', () => {
        // The code you place here will be executed every time your command is executed
        travisStatusBar.updateBuildStatus();
    });

    context.subscriptions.push(travisStatusBar);
    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}

class TravisStatusBar {
    private statusBarItem : StatusBarItem;

    constructor() {
        this.statusBarItem = window.createStatusBarItem(vscode.StatusBarAlignment.Left);
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