import * as request from 'request';

export interface BuildResponse {
    builds: Array<{ state: String }>;
}

export class ApiClient {
    private host: string;

    public static buildComClient() : ApiClient {
        return new ApiClient("api.travis-ci.com");
    }

    constructor(host: string) {
        this.host = host;
    }

    fetchStatus(apiToken: String, slug: String) : Promise<BuildResponse> {
        const urlSafeSlug = slug.replace("/", "%2F");

        const options = {
            url: `https://${this.host}/repo/${urlSafeSlug}/builds?limit=1&finished_at=desc`,
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