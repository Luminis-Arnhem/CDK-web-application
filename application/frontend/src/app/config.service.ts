import { FrontendConfig } from './frontend-config.model';

export class ConfigService {

    static get(): FrontendConfig {
        return (window as any).AWSConfig;
    }

}