import * as mysql from "mysql";

let connectionPool: mysql.Pool;
export const initialize = () => {
  connectionPool = mysql.createPool({
    host: process.env.SQL_HOST,
    port: Number(process.env.SQL_PORT),
    user: process.env.SQL_USER,
    password: process.env.SQL_PASS,
    database: process.env.SQL_DATABASE,
    connectionLimit: 10
  })
}