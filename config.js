module.exports = {

  // PRODUCTION_DB: "inversiones",
  // DEVELOPMENT_DB: "inversiones",
  // DB_HOST: "localhost",
  // DB_USER: "root",
  // DB_PASSWORD:  "i(7PoNKpbsmueSqh",
  
  PRODUCTION_DB: "inversiones",
  DEVELOPMENT_DB: "inversiones",
  DB_HOST: "localhost",
  DB_USER: "root",
  DB_PASSWORD:  "",
  ENVIRONMENT: process.env.NODE_ENV || "development",
  TOKEN_SECRET: process.env.TOKEN_SECRET || "tokenultrasecreto",
  BASIC_AUTH_USER: process.env.BASIC_AUTH_USER || "xandbox",
  BASIC_AUTH_PASSWORD: process.env.BASIC_AUTH_PASSWORD || "pA2yey4CJ2SqDLtkaTxKq3PWn4YDdEMX",
  APP_PORT: '3008',
  SECRET_ACCESS_KEY: process.env.SECRET_ACCESS_KEY || '6zMdf3dOZbVodQDUj7CuWcYvXPAuq0/QHifoBONU',
};

