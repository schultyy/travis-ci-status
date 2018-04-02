import * as request from 'request';

export interface BuildResponse {
    builds: Array<{ state: String }>;
}

export class ApiClient {
    private _host: string;

    public static buildComClient() : ApiClient {
        return new ApiClient("api.travis-ci.com");
    }

    public static buildOrgClient() : ApiClient {
        return new ApiClient("api.travis-ci.org");
    }

    constructor(host: string) {
        this._host = host;
    }

    public get host() {
        return this._host;
    }

    fetchStatus(apiToken: String, slug: String) : Promise<BuildResponse> {
        const urlSafeSlug = slug.replace("/", "%2F");

        const options = {
            url: `https://${this._host}/repo/${urlSafeSlug}/builds?limit=1&finished_at=desc`,
            headers: {
              'Authorization': `token ${apiToken}`,
              'Travis-API-Version': '3',
              'User-Agent': 'API Explorer'
            }
        };

        return new Promise((resolve, reject) => {
            request.get(options,(error, response) => {
                if(response.statusCode === 200) {
                    const buildResponse = JSON.parse(response.body);
                    resolve(buildResponse);
                } else {
                    reject(response);
                }
            });
        });
    }
}