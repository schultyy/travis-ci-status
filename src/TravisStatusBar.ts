import {
  StatusBarItem,
  window,
  workspace,
  StatusBarAlignment,
  scm
} from 'vscode';
import * as ghslug from 'github-slug';
import * as Path from 'path';
import { ApiClient, BuildResponse } from './apiClient';
import TravisEnvironment from './travisEnvironment';

export default class TravisStatusBar {
    private timer: NodeJS.Timer | null;
    private statusBarItem : StatusBarItem;
    private token: String | null;
    private slug: String | null;
    private travisEnvironment: TravisEnvironment | null;

    constructor() {
        this.statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left);
        this.token = null;
        this.slug = null;
        this.timer = null;
        this.travisEnvironment = null;
    }

    public updateBuildStatus(token: String, env: TravisEnvironment) {
        if(!this.statusBarItem) {
            return;
        }
        this.token = token;
        this.travisEnvironment = env;

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
        this.stopTimer();
    }

    private stopTimer() {
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
            let apiClient: ApiClient;

            switch(this.travisEnvironment) {
                case TravisEnvironment.com:
                    apiClient = ApiClient.buildComClient();
                    break;
                case TravisEnvironment.org:
                    apiClient = ApiClient.buildOrgClient();
                    break;
                default:
                    return Promise.reject(`Invalid Travis environment ${this.travisEnvironment}`);
            }

            return apiClient.fetchStatus(this.token, this.slug)
            .then((buildResponse: BuildResponse) => {
                if (buildResponse.builds.length > 0) {
                    this.statusBarItem.text = `Build Status(${this.slug}): ${buildResponse.builds[0].state}`;
                } else {
                    this.statusBarItem.text = `Build Status(${this.slug}): unknown`;
                }
                this.statusBarItem.show();
            })
            .catch((response) => {
                if(response.statusCode === 404) {
                    window.showErrorMessage(`No repository ${this.slug} configured on ${apiClient.host}`);
                    this.statusBarItem.hide();
                    this.stopTimer();
                }
            });
        } else {
            return Promise.reject("No Slug and/or Token is set");
        }
    }
}