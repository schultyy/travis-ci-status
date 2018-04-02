'use strict';
import * as vscode from 'vscode';
import { StatusBarItem, window, workspace } from 'vscode';
import * as Path from 'path';
import * as ghslug from 'github-slug';
import { fetchStatus, BuildResponse } from './apiClient';

const configureToken = (travisStatusBar: TravisStatusBar, context: vscode.ExtensionContext) => {
    window.showInputBox({
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

export function activate(context: vscode.ExtensionContext) {
    let travisStatusBar = new TravisStatusBar();
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

        this.fetchGitHubSlug()
        .then((slug: String) => {
            this.slug = slug;
            this.fetchStatusContinuously();
        })
        .catch((error: Error) => {
            console.error(error.message);
        });
    }

    dispose() {
        this.statusBarItem.dispose();
    }

    private fetchGitHubSlug() : Promise<String> {
        if(workspace.workspaceFolders) {
            let sourceControl = vscode.scm.createSourceControl("git", "git", workspace.workspaceFolders[0].uri);
            if(sourceControl.rootUri) {
                const gitPath = Path.join(sourceControl.rootUri.fsPath.toString(), ".git", "config");
                return new Promise((resolve, reject) => {
                    ghslug(gitPath, (error: Error, slug: String) => {
                        if(error) {
                            reject(error);
                        } else {
                            resolve(slug);
                        }
                    });
                });
            } else {
                return Promise.reject("No git repository");
            }
        } else {
            return Promise.reject("No workspace");
        }
    }

    private fetchStatusContinuously() {
        this.fetchStatus()
        .then(() => {
            setInterval(() => {
                console.log('Fetching');
                this.fetchStatus();
            }, 10000);
        });
    }

    private fetchStatus() : Promise<any> {
        if(this.slug && this.token) {
            this.statusBarItem.text = "Refreshing";

            return fetchStatus(this.token, this.slug)
            .then((buildResponse: BuildResponse) => {
                if (buildResponse.builds.length > 0) {
                    this.statusBarItem.text = `Build Status(${this.slug}): ${buildResponse.builds[0].state}`;
                } else {
                    this.statusBarItem.text = `Build Status(${this.slug}): unknown`;
                }
                this.statusBarItem.show();
            });
        } else {
            return Promise.reject("No Slug and/or Token is set");
        }
    }
}