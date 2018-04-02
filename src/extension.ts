'use strict';
import * as vscode from 'vscode';
import { StatusBarItem, window, workspace } from 'vscode';
import * as Path from 'path';
import * as ghslug from 'github-slug';
import * as request from 'request';

export function activate(context: vscode.ExtensionContext) {
    let travisStatusBar = new TravisStatusBar();
    let disposable = vscode.commands.registerCommand('extension.travis-status', () => {
        window.showInputBox({
            placeHolder: "Configure your Travis CI token",
            prompt: "Configure your Travis CI token"
        })
        .then(token => {
            if(token) {
                window.showInformationMessage("Thank you. Checking status now");
                travisStatusBar.updateBuildStatus(token);
            }
        });
    });

    context.subscriptions.push(travisStatusBar);
    context.subscriptions.push(disposable);
}

export function deactivate() {
}

class TravisStatusBar {
    private statusBarItem : StatusBarItem;
    private token: String | null;
    private slug: String | null;

    constructor() {
        this.statusBarItem = window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        this.token = null;
        this.slug = null;
    }

    public updateBuildStatus(token: String) {
        if(!this.statusBarItem) {
            return;
        }
        this.token = token;

        this.statusBarItem.text = "Build Status: Unknown";
        this.statusBarItem.show();

        if(workspace.workspaceFolders) {
            let sourceControl = vscode.scm.createSourceControl("git", "git", workspace.workspaceFolders[0].uri);
            if(sourceControl.rootUri) {
                const gitPath = Path.join(sourceControl.rootUri.fsPath.toString(), ".git", "config");
                ghslug(gitPath, (error: Error, slug: String) => {
                    if(error) {
                        console.error(error);
                    } else {
                        this.slug = slug;
                        console.log('fetching status');
                        this.fetchStatus();
                    }
                });
            }
        }
    }

    dispose() {
        this.statusBarItem.dispose();
    }

    private fetchStatus() {
        if(this.slug) {
            const urlSafeSlug = this.slug.replace("/", "%2F");

            const options = {
                url: `https://api.travis-ci.com/repo/${urlSafeSlug}/builds?limit=1`,
                headers: {
                  'Authorization': `token ${this.token}`,
                  'Travis-API-Version': '3',
                  'User-Agent': 'API Explorer'
                }
              };

            request.get(options,(error, response) => {
                if(response.statusCode === 200) {
                    const buildResponse = JSON.parse(response.body);
                    if (buildResponse.builds.length > 0) {
                        this.statusBarItem.text = `Build Status: ${buildResponse.builds[0].state}`;
                    } else {
                        this.statusBarItem.text = "Build Status: unknown";
                    }
                    this.statusBarItem.show();
                }
            });
        }
    }
}