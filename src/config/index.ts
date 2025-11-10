import Constants from 'expo-constants';

type Environment = {
  api: {
    baseUrl: string;
    timeout: number;
  };
  isDev: boolean;
};

const ENV = {
  dev: {
    api: {
      baseUrl: "http://192.168.0.106:8000",
      timeout: 30000,
    },
    isDev: true,
  },
  staging: {
    api: {
      baseUrl: 'https://staging-api.iarobots.com/api',
      timeout: 15000,
    },
    isDev: false,
  },
  production: {
    api: {
      baseUrl: 'https://api.iarobots.com/api',
      timeout: 20000,
    },
    isDev: false,
  },
} as const;

const getEnvVars = (env = Constants.expoConfig?.releaseChannel): Environment => {
  if (env === null || env === undefined || env === '') return ENV.dev;
  if (env.indexOf('dev') !== -1) return ENV.dev;
  if (env.indexOf('staging') !== -1) return ENV.staging;
  if (env.indexOf('prod') !== -1) return ENV.production;
  return ENV.dev;
  
};

export default getEnvVars;
