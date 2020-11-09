const Client = require('serverless-mysql')

const getClient = () => {
    var client = Client({
        config: {
            host: process.env.MYSQL_HOST,
            database: process.env.DB_NAME,
            user: process.env.USERNAME,
            password: process.env.PASSWORD
        }
    })

    console.log("MySQL Client", process.env.MYSQL_HOST, process.env.DB_NAME)

    return client
}
exports.getClient = getClient

exports.dropTables = async () => {

    let client = getClient()

    let res = await client.query(`
    DROP TABLE IF EXISTS event_traderpaired_trader;  
    `)

    res = await client.query(`
    DROP TABLE IF EXISTS event_traderpaired_investor;  
    `)

    res = await client.query(`
    DROP TABLE IF EXISTS event_traderpaired_investment;  
    `)

    res = await client.query(`
    DROP TABLE IF EXISTS event_traderpaired_allocate;  
    `)

    res = await client.query(`
    DROP TABLE IF EXISTS event_traderpaired_invest;  
    `)

    res = await client.query(`
    DROP TABLE IF EXISTS event_traderpaired_stop;  
    `)

    res = await client.query(`
    DROP TABLE IF EXISTS event_traderpaired_requestexit;  
    `)

    res = await client.query(`
    DROP TABLE IF EXISTS event_traderpaired_rejectexit;  
    `)

    res = await client.query(`
    DROP TABLE IF EXISTS event_traderpaired_approveexit;  
    `)

    res = await client.query(`
    DROP TABLE IF EXISTS event_multisigfundwallet_disbursementcreated;  
    `)

    res = await client.query(`
    DROP TABLE IF EXISTS investments;  
    `)

    res = await client.query(`
    DROP TABLE IF EXISTS trades;  
    `)

    client.quit()
    return res
}

exports.createTables = async () => {

    let client = getClient()
    
    let res = await client.query(`
    CREATE TABLE IF NOT EXISTS event_traderpaired_trader
    (
        id char(36) not null,
        blockNumber INT UNSIGNED not null, 
        user char(50) not null,
        traderId INT UNSIGNED not null, 
        investorCollateralProfitPercent SMALLINT UNSIGNED not null, 
        investorDirectProfitPercent SMALLINT UNSIGNED not null,
        eventDate INT UNSIGNED not null,
        PRIMARY KEY (id)
    );  
    `)

    res = await client.query(`
    CREATE TABLE IF NOT EXISTS event_traderpaired_investor
    (
        id char(36) not null,
        blockNumber INT UNSIGNED not null, 
        user char(50) not null,
        investorId INT UNSIGNED not null, 
        eventDate INT UNSIGNED not null,
        PRIMARY KEY (id)
    );  
    `)

    res = await client.query(`
    CREATE TABLE IF NOT EXISTS event_traderpaired_investment
    (
        id char(36) not null,
        blockNumber INT UNSIGNED not null, 
        wallet char(50) not null,
        investor char(50) not null, 
        eventDate INT UNSIGNED not null,
        PRIMARY KEY (id)
    );  
    `)

    res = await client.query(`
    CREATE TABLE IF NOT EXISTS event_traderpaired_allocate
    (
        id char(36) not null,
        blockNumber INT UNSIGNED not null, 
        trader char(50) not null,
        token char(50) not null,
        total char(36) not null, 
        invested varchar(36) not null, 
        eventDate INT UNSIGNED not null,
        PRIMARY KEY (id)
    );  
    `)

    res = await client.query(`
    CREATE TABLE IF NOT EXISTS event_traderpaired_invest
    (
        id char(36) not null,
        blockNumber INT UNSIGNED not null, 
        investmentId char(20) not null, 
        wallet char(50) not null,
        trader char(50) not null,
        investor char(50) not null,
        token char(50) not null,
        amount char(36) not null,
        investorProfitPercent SMALLINT UNSIGNED not null, 
        investmentType SMALLINT UNSIGNED not null, 
        allocationInvested char(36) not null,
        allocationTotal char(36) not null,
        eventDate INT UNSIGNED not null,
        PRIMARY KEY (id)
    );  
    `)

    res = await client.query(`
    CREATE TABLE IF NOT EXISTS event_traderpaired_stop
    (
        id char(36) not null,
        blockNumber INT UNSIGNED not null, 
        investmentId char(20) not null, 
        wallet char(50) not null,
        trader char(50) not null,
        investor char(50) not null,
        stopFrom char(50) not null,
        eventDate INT UNSIGNED not null,
        PRIMARY KEY (id)
    );  
    `)

    res = await client.query(`
    CREATE TABLE IF NOT EXISTS event_traderpaired_requestexit
    (
        id char(36) not null,
        blockNumber INT UNSIGNED not null, 
        investmentId char(20) not null, 
        wallet char(50) not null,
        trader char(50) not null,
        investor char(50) not null,
        requestFrom char(50) not null,
        value char(36) not null,
        eventDate INT UNSIGNED not null,
        PRIMARY KEY (id)
    );  
    `)

    res = await client.query(`
    CREATE TABLE IF NOT EXISTS event_traderpaired_rejectexit
    (
        id char(36) not null,
        blockNumber INT UNSIGNED not null, 
        investmentId char(20) not null, 
        wallet char(50) not null,
        trader char(50) not null,
        rejectFrom char(50) not null,
        value char(36) not null,
        eventDate INT UNSIGNED not null,
        PRIMARY KEY (id)
    );  
    `)

    res = await client.query(`
    CREATE TABLE IF NOT EXISTS event_traderpaired_approveexit
    (
        id char(36) not null,
        blockNumber INT UNSIGNED not null, 
        investmentId char(20) not null, 
        wallet char(50) not null,
        trader char(50) not null,
        investor char(50) not null,
        approveFrom char(50) not null,
        allocationInvested char(36) not null,
        allocationTotal char(36) not null,
        eventDate INT UNSIGNED not null,
        PRIMARY KEY (id)
    );  
    `)

    res = await client.query(`
    CREATE TABLE IF NOT EXISTS event_multisigfundwallet_disbursementcreated
    (
        id char(36) not null,
        blockNumber INT UNSIGNED not null, 
        wallet char(50) not null,
        trader char(50) not null,
        initiator char(50) not null,
        investmentId char(20) not null,
        disbursementId char(20) not null,
        value char(36) not null,
        amount char(36) not null,
        eventDate INT UNSIGNED not null,
        PRIMARY KEY (id)
    );  
    `)

    res = await client.query(`
    CREATE TABLE IF NOT EXISTS investments
    (
        id char(20) not null,
        investBlockNumber INT UNSIGNED not null, 
        stopBlockNumber INT UNSIGNED not null, 
        requestBlockNumber INT UNSIGNED not null, 
        rejectBlockNumber INT UNSIGNED not null, 
        approveBlockNumber INT UNSIGNED not null, 
        disbursementId BIGINT UNSIGNED not null,
        wallet char(50) not null,
        trader char(50) not null,
        investor char(50) not null,
        token char(50) not null,
        amount char(36) not null,
        value char(36) not null,
        grossValue char(36) not null,
        nettValue char(36) not null,
        investorProfitPercent SMALLINT UNSIGNED not null,
        investmentType SMALLINT UNSIGNED not null,
        state SMALLINT UNSIGNED not null,
        traderLimit char(36) not null,
        startDate INT UNSIGNED not null,
        endDate INT UNSIGNED not null,
        PRIMARY KEY (id)
    );  
    `)

    res = await client.query(`
    CREATE TABLE IF NOT EXISTS trades
    (
        id char(36) not null,
        trader char(50) not null,
        start INT UNSIGNED not null,
        end INT UNSIGNED not null,
        asset char(10) not null,
        profit char(36) not null,
        initialAmount char(36) not null,
        PRIMARY KEY (id)
    );  
    `)

    client.quit()
    return res
}