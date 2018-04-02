import {
  StatusBarItem,
  window,
  workspace,
  StatusBarAlignment,
  scm
} from 'vscode';
import * as ghslug from 'github-slug';
import * as Path from 'path';
import { fetchStatus, BuildResponse } from './apiClient';

export default class TravisStatusBar {
    private timer: NodeJS.Timer | null;
    private statusBarItem : StatusBarItem;
    private token: String | null;
    private slug: String | null;

    constructor() {
        this.statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left);
        this.token = null;
        this.slug = null;
        this.timer = null;
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
        if(this.timer) {
            clearInterval(this.timer);
        }
    }

    private fetchGitHubSlug() : Promise<String> {
        if(workspace.workspaceFolders) {
            let sourceControl = scm.createSourceControl("git", "git", workspace.workspaceFolders[0].uri);
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
            this.timer = setInterval(() => {
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