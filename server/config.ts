import {readFileSync} from "fs";

// Default configuration settings

const config = {
    server: {
        port: 8080,
        debug: false,
    },
    client: {path: "./client"},
    redis: {url: "redis://localhost:6379"},
};

// Read local configuration (if it exists) to override standard settings
// config.json is .gitignored so that local orerrides are not committed

const localConfig = "./config.json";
type Config = {[key: string]: string | number | boolean | Config};

try {
    const configJson = readFileSync(localConfig).toString();
    const configData = JSON.parse(configJson);
    applyConfig(config, configData);
}
catch {
    console.log(`Error reading ${localConfig}, using default config`);
}

function applyConfig(target: Config, source: Config) {
    for (const key in source) {
        if (key in target)
            if (source[key] instanceof Object && target[key] instanceof Object)
                applyConfig(target[key], source[key]);
            else if (typeof source[key] === typeof target[key])
                target[key] = source[key]!;
            else
                console.warn(`Type mismatch for config key: ${key}`);
        else
            console.warn(`Unknown config key: ${key}`);
    }
}

export default config;
