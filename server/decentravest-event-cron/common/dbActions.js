

const Client = require('serverless-mysql')

const client = async () => {
  console.log("client", process.env.AURORA_HOST, process.env.DB_NAME, process.env.USERNAME, process.env.PASSWORD)
  let client = Client({
    config: {
        host: process.env.AURORA_HOST,
        database: process.env.DB_NAME,
        user: process.env.USERNAME,
        password: process.env.PASSWORD
    }
  })

  console.log("client connecting...")
  await client.connect()
  console.log("client connected")

  await init(client)
}
exports.client = client

const init = async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS positions
      (
          uuid char(36) not null, 
          owner varchar(44) not null, 
          PRIMARY KEY (uuid)
      );  
    `)
    await client.query(`
      CREATE TABLE IF NOT EXISTS standardActions
      (
          uuid char(36) not null, 
          position_id varchar(36) not null, 
          transferAmount varchar(100),
          market varchar(36) not null,
          asset varchar(36) not null,
          side varchar(36) not null,
          confirmedAt varchar(36) not null,
          PRIMARY KEY (uuid)
      );  
    `)
    await client.query(`
      CREATE TABLE IF NOT EXISTS traderPairedTraderEvents
      (
          id char(100) not null, 
          blockHash varchar(100) not null, 
          blockNumber varchar(100) not null,
          user varchar(36) not null,
          traderId MEDIUMINT UNSIGNED not null,
          investorCollateralProfitPercent MEDIUMINT UNSIGNED not null,
          investorDirectProfitPercent MEDIUMINT UNSIGNED not null,
          date MEDIUMINT UNSIGNED not null,
          PRIMARY KEY (id)
      );  
    `)
    await client.query(`
      CREATE TABLE IF NOT EXISTS traderPairedInvestorEvents
      (
          id char(100) not null, 
          blockHash varchar(100) not null, 
          blockNumber varchar(100) not null,
          user varchar(36) not null,
          investorId MEDIUMINT UNSIGNED not null,
          date MEDIUMINT UNSIGNED not null,
          PRIMARY KEY (id)
      );  
    `)
    await client.query(`
      CREATE TABLE IF NOT EXISTS traderPairedInvestEvents
      (
          id char(100) not null, 
          blockHash varchar(100) not null, 
          blockNumber varchar(100) not null,
          investmentId MEDIUMINT UNSIGNED not null,
          wallet varchar(36) not null,
          trader varchar(36) not null,
          investor varchar(36) not null,
          token varchar(36) not null,
          amount varchar(100) not null,
          investorProfitPercent MEDIUMINT UNSIGNED not null,
          investmentType SMALLINT UNSIGNED not null,
          allocationInvested varchar(100) not null,
          allocationTotal varchar(100) not null,
          date MEDIUMINT UNSIGNED not null,
          PRIMARY KEY (id)
      );  
    `)
}
exports.init = init

// module.exports.createByParams = async (params) => {
//   console.log("createByParams", params)

//   try {
//     // write the invest event to the database
//     const result = await dynamoDb.put(params).promise();
    
//     console.log("createByParams success", result);

//     // create a response
//     return {
//       error: null,
//       result: params.Item
//     };

//   } catch (error) {
//     return {
//       error: error,
//       result: null
//     };
//   }
// };

// module.exports.listByParams = async (params) => {
  
//   try {
//     // fetch all events from the database
//     const result = await dynamoDb.scan(params).promise();
//     // create a response
//     return {
//       error: null,
//       result: result.Items
//     };
//   } catch (error) {
//     return {
//       error: error,
//       result: null
//     }
//   }
// };

// module.exports.firstByParams = async (params) => {
  
//   try {
//     // fetch all events from the database
//     const result = await dynamoDb.scan(params).promise();
//     // create a response
//     return {
//       error: null,
//       result: result.Items[0]
//     };
//   } catch (error) {
//     return {
//       error: error,
//       result: null
//     }
//   }
// };

// module.exports.getByParams = async (params) => {
//   try {
//     // fetch event from the database
//     const result = await dynamoDb.get(params).promise();

//     return {
//       error: null,
//       result: result.Item
//     };
//   } catch (error) {
//     return {
//       error: error,
//       result: null
//     }
//   }
// };